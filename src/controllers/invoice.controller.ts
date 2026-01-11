import { Request, Response } from "express";
import {
  createInvoiceFromVisit,
  getInvoicesService,
  getInvoiceByIdService,
  updateInvoiceService,
  addPaymentService,
  getInvoicePaymentsService,
  getInvoicesByPatientService,
  getInvoiceStatisticsService,
  getRevenueByPaymentMethodService,
} from "../services/invoice.service";
import { PaymentStatus } from "../models/Invoice";
import { PaymentMethod } from "../models/Payment";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../utils/pdfGenerator";
import * as auditLogService from "../services/auditLog.service";
import Invoice from "../models/Invoice";
import { RoleCode } from "../constant/role";

/**
 * Tạo hóa đơn từ visit
 * POST /api/invoices
 * Role: ADMIN, RECEPTIONIST
 */
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { visitId, examinationFee } = req.body;
    const createdBy = req.user!.userId;

    if (!visitId || !examinationFee) {
      return res.status(400).json({
        success: false,
        message: "visitId and examinationFee are required",
      });
    }

    const invoice = await createInvoiceFromVisit(
      visitId,
      createdBy,
      examinationFee
    );

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to create invoice",
    });
  }
};

/**
 * Lấy danh sách hóa đơn
 * GET /api/invoices
 * Role: ADMIN, RECEPTIONIST
 */
export const getInvoices = async (req: Request, res: Response) => {
  try {
    const {
      page,
      limit,
      patientId,
      doctorId,
      paymentStatus,
      fromDate,
      toDate,
    } = req.query;

    const filters: any = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      patientId: patientId ? parseInt(patientId as string) : undefined,
      doctorId: doctorId ? parseInt(doctorId as string) : undefined,
      paymentStatus: paymentStatus as PaymentStatus,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
    };

    // AUTHORIZATION: DOCTOR can only view invoices for their own patients
    if (req.user!.roleId === RoleCode.DOCTOR) {
      if (!req.user!.doctorId) {
        return res.status(400).json({
          success: false,
          message: "DOCTOR_NOT_SETUP",
        });
      }
      // Force filter by doctorId
      filters.doctorId = req.user!.doctorId;
    }

    const result = await getInvoicesService(filters);

    return res.json({
      success: true,
      message: "Invoices retrieved successfully",
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve invoices",
    });
  }
};

/**
 * Lấy chi tiết hóa đơn
 * GET /api/invoices/:id
 * Role: ADMIN, RECEPTIONIST, PATIENT (own only)
 */
export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);

    const invoice = await getInvoiceByIdService(invoiceId);

    // Authorization check
    const user = req.user!;

    // PATIENT can only view their own invoices
    if (user.roleId === RoleCode.PATIENT) {
      const Patient = (await import("../models/Patient")).default;
      const patient = await Patient.findOne({
        where: { userId: user.userId },
      });

      if (patient && invoice.patientId !== patient.id) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own invoices",
        });
      }
    }

    // DOCTOR can only view invoices for their own patients
    if (user.roleId === RoleCode.DOCTOR) {
      if (!user.doctorId) {
        return res.status(400).json({
          success: false,
          message: "DOCTOR_NOT_SETUP",
        });
      }

      if (invoice.doctorId !== user.doctorId) {
        return res.status(403).json({
          success: false,
          message: "FORBIDDEN: You can only view invoices for your own patients",
        });
      }
    }

    return res.json({
      success: true,
      message: "Invoice retrieved successfully",
      data: invoice,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error?.message || "Invoice not found",
    });
  }
};

/**
 * Cập nhật hóa đơn
 * PUT /api/invoices/:id
 * Role: ADMIN, RECEPTIONIST
 */
export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { discount, note } = req.body;

    // Get old data before update for audit
    const oldInvoice = await Invoice.findByPk(invoiceId);
    const oldData = oldInvoice ? {
      discount: oldInvoice.discount,
      note: oldInvoice.note,
      totalAmount: oldInvoice.totalAmount,
    } : null;

    // CRITICAL: Discount approval workflow
    if (discount !== undefined && oldInvoice) {
      const totalBeforeDiscount = oldInvoice.examinationFee + oldInvoice.medicineTotalAmount;
      const discountPercentage = totalBeforeDiscount > 0 ? (discount / totalBeforeDiscount) * 100 : 0;

      // If discount > 20%, only ADMIN can approve
      if (discountPercentage > 20) {
        const userRole = req.user!.roleId;
        if (userRole !== RoleCode.ADMIN) {
          return res.status(403).json({
            success: false,
            message: "DISCOUNT_EXCEEDS_THRESHOLD_REQUIRES_ADMIN_APPROVAL",
            details: {
              requestedDiscount: discount,
              totalBeforeDiscount,
              discountPercentage: discountPercentage.toFixed(2),
              threshold: "20%",
              requiredRole: "ADMIN",
            },
          });
        }
      }
    }

    const invoice = await updateInvoiceService(invoiceId, { discount, note });

    // CRITICAL AUDIT LOG: Log discount changes (financial impact)
    if (oldData && oldData.discount !== invoice.discount) {
      await auditLogService.logUpdate(req, "invoices", invoice.id, oldData, {
        discount: invoice.discount,
        note: invoice.note,
        totalAmount: invoice.totalAmount,
        discountChangedBy: req.user!.userId,
      }).catch(err => console.error("Failed to log invoice update audit:", err));
    }

    return res.json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to update invoice",
    });
  }
};

/**
 * Thêm payment cho hóa đơn
 * POST /api/invoices/:id/payments
 * Role: ADMIN, RECEPTIONIST
 */
export const addPayment = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { amount, paymentMethod, reference, note } = req.body;
    const createdBy = req.user!.userId;

    if (!amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "amount and paymentMethod are required",
      });
    }

    // Get old paidAmount before payment
    const oldInvoice = await Invoice.findByPk(invoiceId);
    const oldPaidAmount = oldInvoice?.paidAmount || 0;
    const oldPaymentStatus = oldInvoice?.paymentStatus;

    const invoice = await addPaymentService(invoiceId, {
      amount: parseFloat(amount),
      paymentMethod: paymentMethod as PaymentMethod,
      reference,
      note,
      createdBy,
    });

    // CRITICAL AUDIT LOG: Log payment addition (financial transaction)
    await auditLogService.logCreate(req, "payments", invoiceId, {
      invoiceId,
      amount: parseFloat(amount),
      paymentMethod,
      reference,
      createdBy,
      oldPaidAmount,
      newPaidAmount: invoice.paidAmount,
      oldPaymentStatus,
      newPaymentStatus: invoice.paymentStatus,
    }).catch(err => console.error("Failed to log payment audit:", err));

    return res.status(201).json({
      success: true,
      message: "Payment added successfully",
      data: invoice,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to add payment",
    });
  }
};

/**
 * Lấy lịch sử thanh toán của hóa đơn
 * GET /api/invoices/:id/payments
 * Role: ADMIN, RECEPTIONIST, DOCTOR (own patients only)
 */
export const getInvoicePayments = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);

    // AUTHORIZATION: Get invoice first to check ownership
    const invoice = await getInvoiceByIdService(invoiceId);

    // DOCTOR can only view payment history for their own patients
    if (req.user!.roleId === RoleCode.DOCTOR) {
      if (!req.user!.doctorId) {
        return res.status(400).json({
          success: false,
          message: "DOCTOR_NOT_SETUP",
        });
      }

      if (invoice.doctorId !== req.user!.doctorId) {
        return res.status(403).json({
          success: false,
          message: "FORBIDDEN: You can only view payment history for your own patients",
        });
      }
    }

    const payments = await getInvoicePaymentsService(invoiceId);

    return res.json({
      success: true,
      message: "Payments retrieved successfully",
      data: payments,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error?.message || "Invoice not found",
    });
  }
};

/**
 * Xuất PDF hóa đơn
 * GET /api/invoices/:id/pdf
 * Role: ALL (with proper authorization)
 */
export const exportInvoicePDF = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const invoice = await getInvoiceByIdService(invoiceId);

    // Authorization check - Patient chỉ xem được invoice của mình
    const user = (req as any).user;
    if (user.roleId === 3) {
      const patient = await (req as any).models.Patient.findOne({
        where: { userId: user.userId },
      });

      if (patient && invoice.patientId !== patient.id) {
        return res.status(403).json({
          success: false,
          message: "You can only export your own invoices",
        });
      }
    }

    // Setup response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="HoaDon-${invoice.invoiceCode}.pdf"`
    );

    // Generate PDF using new template
    const { generateInvoicePDF } = await import("../utils/generateInvoicePDF");
    const doc = await generateInvoicePDF(invoice);

    // Finalize PDF
    doc.end();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to export PDF",
    });
  }
};

/**
 * Lấy hóa đơn theo bệnh nhân
 * GET /api/invoices/patient/:patientId
 * Role: ADMIN, PATIENT (own only)
 */
export const getInvoicesByPatient = async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);

    // Authorization check - Patient chỉ xem được invoice của mình
    const user = (req as any).user;
    if (user.roleId === 3) {
      // PATIENT role
      const patient = await (req as any).models.Patient.findOne({
        where: { userId: user.userId },
      });

      if (!patient || patient.id !== patientId) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own invoices",
        });
      }
    }

    const invoices = await getInvoicesByPatientService(patientId);

    return res.json({
      success: true,
      message: "Invoices retrieved successfully",
      data: invoices,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve invoices",
    });
  }
};

/**
 * Lấy danh sách hóa đơn chưa thanh toán
 * GET /api/invoices/unpaid
 * Role: ADMIN, RECEPTIONIST
 */
export const getUnpaidInvoices = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;

    const filters: any = {
      paymentStatus: "UNPAID" as PaymentStatus,
      limit: limit ? parseInt(limit as string) : 50,
    };

    const result = await getInvoicesService(filters);

    return res.json({
      success: true,
      message: "Unpaid invoices retrieved successfully",
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve unpaid invoices",
    });
  }
};

/**
 * Thống kê doanh thu
 * GET /api/invoices/statistics
 * Role: ADMIN
 */
export const getInvoiceStatistics = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate, doctorId } = req.query;

    const filters: any = {
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      doctorId: doctorId ? parseInt(doctorId as string) : undefined,
    };

    const statistics = await getInvoiceStatisticsService(filters);

    return res.json({
      success: true,
      message: "Statistics retrieved successfully",
      data: statistics,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve statistics",
    });
  }
};

/**
 * Revenue report by payment method
 * GET /api/invoices/revenue-by-payment-method
 * Role: ADMIN
 */
export const getRevenueByPaymentMethod = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate, doctorId } = req.query;

    const filters: any = {
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      doctorId: doctorId ? parseInt(doctorId as string) : undefined,
    };

    const report = await getRevenueByPaymentMethodService(filters);

    return res.json({
      success: true,
      message: "Revenue report by payment method retrieved successfully",
      data: report,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve revenue report",
    });
  }
};

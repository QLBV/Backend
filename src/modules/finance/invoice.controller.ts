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
} from "./invoice.service";
import { PaymentStatus } from "../../models/Invoice";
import { PaymentMethod } from "../../models/Payment";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../../utils/pdfGenerator";
import * as auditLogService from "../admin/auditLog.service";
import Invoice from "../../models/Invoice";
import Patient from "../../models/Patient";
import { RoleCode } from "../../constant/role";


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
      keyword: req.query.keyword as string,
      invoiceCode: req.query.invoiceCode as string,
    };

    
    if (req.user!.roleId === RoleCode.DOCTOR) {
      if (!req.user!.doctorId) {
        return res.status(400).json({
          success: false,
          message: "DOCTOR_NOT_SETUP",
        });
      }
      
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


export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);

    const invoice = await getInvoiceByIdService(invoiceId);

    
    const user = req.user!;

    
    if (user.roleId === RoleCode.PATIENT) {
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


export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { discount, note } = req.body;

    
    const oldInvoice = await Invoice.findByPk(invoiceId);
    const oldData = oldInvoice ? {
      discount: oldInvoice.discount,
      note: oldInvoice.note,
      totalAmount: oldInvoice.totalAmount,
    } : null;

    
    if (discount !== undefined && oldInvoice) {
      const totalBeforeDiscount = oldInvoice.examinationFee + oldInvoice.medicineTotalAmount;
      const discountPercentage = totalBeforeDiscount > 0 ? (discount / totalBeforeDiscount) * 100 : 0;

      
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


export const getInvoicePayments = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);

    
    const invoice = await getInvoiceByIdService(invoiceId);

    
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


export const exportInvoicePDF = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const invoice = await getInvoiceByIdService(invoiceId);

    
    const user = (req as any).user;
    if (user.roleId === 3) {
      const patient = await Patient.findOne({
        where: { userId: user.userId },
      });

      if (patient && invoice.patientId !== patient.id) {
        return res.status(403).json({
          success: false,
          message: "You can only export your own invoices",
        });
      }
    }

    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="HoaDon-${invoice.invoiceCode}.pdf"`
    );

    
    const { generateInvoicePDF } = await import("../../utils/generateInvoicePDF");
    const doc = await generateInvoicePDF(invoice);

    
    doc.pipe(res);

    
    doc.end();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to export PDF",
    });
  }
};


export const getInvoicesByPatient = async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);

    
    const user = (req as any).user;
    if (user.roleId === 3) {
      
      const patient = await Patient.findOne({
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

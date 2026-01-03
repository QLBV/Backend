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
} from "../services/invoice.service";
import { PaymentStatus } from "../models/Invoice";
import { PaymentMethod } from "../models/Payment";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../utils/pdfGenerator";

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

    // Authorization check - Patient chỉ xem được invoice của mình
    const user = (req as any).user;
    if (user.roleId === 3) {
      // PATIENT role
      const patient = await (req as any).models.Patient.findOne({
        where: { userId: user.userId },
      });

      if (patient && invoice.patientId !== patient.id) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own invoices",
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

    const invoice = await updateInvoiceService(invoiceId, { discount, note });

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

    const invoice = await addPaymentService(invoiceId, {
      amount: parseFloat(amount),
      paymentMethod: paymentMethod as PaymentMethod,
      reference,
      note,
      createdBy,
    });

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
 * Role: ADMIN, RECEPTIONIST
 */
export const getInvoicePayments = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseInt(req.params.id);

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

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
  setupPDFResponse,
  addPDFHeader,
  addPDFFooter,
  formatCurrency,
  formatDate,
  formatDateTime,
  drawTable,
} from "../utils/pdfGenerator";

/**
 * Tạo hóa đơn từ visit
 * POST /api/invoices
 * Role: ADMIN, RECEPTIONIST
 */
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { visitId, examinationFee } = req.body;
    const createdBy = (req as any).user.id;

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
        where: { userId: user.id },
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
    const createdBy = (req as any).user.id;

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
        where: { userId: user.id },
      });

      if (patient && invoice.patientId !== patient.id) {
        return res.status(403).json({
          success: false,
          message: "You can only export your own invoices",
        });
      }
    }

    // Setup PDF
    const filename = `Invoice-${invoice.invoiceCode}.pdf`;
    const doc = setupPDFResponse(res, filename);

    // Header
    addPDFHeader(doc, "HÓA ĐƠN THANH TOÁN");

    // Thông tin hóa đơn
    doc.fontSize(11).font("Helvetica");
    doc.text(`Mã hóa đơn: ${invoice.invoiceCode}`, 50, doc.y, { continued: true });
    doc.text(`Ngày tạo: ${formatDate(invoice.createdAt)}`, { align: "right" });

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .text(`Trạng thái: ${invoice.paymentStatus}`, 50, doc.y, { continued: true });

    const statusColors: any = {
      PAID: "#27AE60",
      PARTIALLY_PAID: "#F39C12",
      UNPAID: "#E74C3C",
    };
    doc.fillColor(statusColors[invoice.paymentStatus] || "#000000");
    doc.text(`  ● ${invoice.paymentStatus}`, { continued: false });
    doc.fillColor("#000000");

    doc.moveDown(1.5);

    // Thông tin bệnh nhân
    doc.fontSize(12).font("Helvetica-Bold").text("THÔNG TIN BỆNH NHÂN", 50, doc.y);
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    doc.text(`Họ tên: ${(invoice as any).patient?.fullName || "N/A"}`, 50, doc.y);
    doc.text(`Mã BN: ${(invoice as any).patient?.patientCode || "N/A"}`);
    doc.text(`Điện thoại: ${(invoice as any).patient?.phoneNumber || "N/A"}`);

    doc.moveDown(1);

    // Thông tin bác sĩ
    doc.fontSize(12).font("Helvetica-Bold").text("THÔNG TIN BÁC SĨ", 50, doc.y);
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    doc.text(`Bác sĩ: ${(invoice as any).doctor?.fullName || "N/A"}`, 50, doc.y);
    doc.text(`Chuyên khoa: ${(invoice as any).doctor?.specialty || "N/A"}`);

    doc.moveDown(1.5);

    // Chi tiết hóa đơn
    doc.fontSize(12).font("Helvetica-Bold").text("CHI TIẾT HÓA ĐƠN", 50, doc.y);
    doc.moveDown(0.5);

    // Prepare table data
    const headers = ["Mô tả", "SL", "Đơn giá", "Thành tiền"];
    const rows: string[][] = [];

    // Invoice items
    if ((invoice as any).items && Array.isArray((invoice as any).items)) {
      (invoice as any).items.forEach((item: any) => {
        let description = "";
        if (item.itemType === "EXAMINATION") {
          description = item.description || "Khám bệnh";
        } else if (item.itemType === "MEDICINE") {
          description = `${item.medicineName || "Thuốc"} (${item.medicineCode || ""})`;
        }

        rows.push([
          description,
          item.quantity?.toString() || "1",
          formatCurrency(item.unitPrice || 0),
          formatCurrency(item.subtotal || 0),
        ]);
      });
    }

    // Draw table
    const tableY = drawTable(doc, headers, rows, [250, 50, 100, 100], doc.y);

    doc.y = tableY + 20;

    // Tổng kết
    const summaryX = 350;
    doc.fontSize(10).font("Helvetica");

    doc.text("Tổng tiền khám:", summaryX, doc.y, { continued: true });
    doc.text(formatCurrency(invoice.examinationFee || 0), { align: "right" });

    doc.text("Tổng tiền thuốc:", summaryX, doc.y, { continued: true });
    doc.text(formatCurrency(invoice.medicineTotalAmount || 0), { align: "right" });

    if (invoice.discount && invoice.discount > 0) {
      doc.text("Giảm giá:", summaryX, doc.y, { continued: true });
      doc.text(`-${formatCurrency(invoice.discount)}`, { align: "right" });
    }

    doc.moveDown(0.5);
    doc
      .moveTo(summaryX, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();
    doc.moveDown(0.5);

    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("TỔNG CỘNG:", summaryX, doc.y, { continued: true });
    doc.text(formatCurrency(invoice.totalAmount || 0), { align: "right" });

    doc.fontSize(10).font("Helvetica");
    doc.text("Đã thanh toán:", summaryX, doc.y, { continued: true });
    doc.text(formatCurrency(invoice.paidAmount || 0), { align: "right" });

    const remaining = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
    doc.font("Helvetica-Bold");
    doc.text("Còn lại:", summaryX, doc.y, { continued: true });
    doc.fillColor(remaining > 0 ? "#E74C3C" : "#27AE60");
    doc.text(formatCurrency(remaining), { align: "right" });
    doc.fillColor("#000000");

    // Lịch sử thanh toán (nếu có)
    if ((invoice as any).payments && (invoice as any).payments.length > 0) {
      doc.moveDown(2);
      doc.fontSize(12).font("Helvetica-Bold").text("LỊCH SỬ THANH TOÁN", 50, doc.y);
      doc.moveDown(0.5);

      const paymentHeaders = ["Ngày", "Phương thức", "Số tiền", "Mã GD"];
      const paymentRows: string[][] = [];

      (invoice as any).payments.forEach((payment: any) => {
        paymentRows.push([
          formatDateTime(payment.paymentDate),
          payment.paymentMethod || "",
          formatCurrency(payment.amount || 0),
          payment.reference || "-",
        ]);
      });

      drawTable(doc, paymentHeaders, paymentRows, [120, 100, 100, 180], doc.y);
    }

    // Note
    if (invoice.note) {
      doc.moveDown(2);
      doc.fontSize(10).font("Helvetica-Bold").text("Ghi chú:", 50, doc.y);
      doc.font("Helvetica").text(invoice.note, 50, doc.y);
    }

    // Footer
    addPDFFooter(doc, 1);

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
        where: { userId: user.id },
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

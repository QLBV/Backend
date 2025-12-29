import { Request, Response } from "express";
import {
  calculatePayrollService,
  calculatePayrollForAllService,
  getPayrollsService,
  getMyPayrollsService,
  getPayrollByIdService,
  approvePayrollService,
  payPayrollService,
  getUserPayrollHistoryService,
  getPayrollStatisticsService,
} from "../services/payroll.service";
import { PayrollStatus } from "../models/Payroll";
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
 * Tính lương tháng
 * POST /api/payrolls/calculate
 * Role: ADMIN
 */
export const calculatePayroll = async (req: Request, res: Response) => {
  try {
    const { userId, month, year, calculateAll } = req.body;
    const adminId = (req as any).user.id;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    // Nếu calculateAll = true → Tính cho tất cả nhân viên
    if (calculateAll === true) {
      const result = await calculatePayrollForAllService(month, year, adminId);

      return res.status(201).json({
        success: true,
        message: `Calculated payroll for ${result.calculated}/${result.total} employees`,
        data: result,
      });
    }

    // Nếu không → Tính cho 1 nhân viên cụ thể
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required when calculateAll is false",
      });
    }

    const payroll = await calculatePayrollService(userId, month, year, adminId);

    return res.status(201).json({
      success: true,
      message: "Payroll calculated successfully",
      data: payroll,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to calculate payroll",
    });
  }
};

/**
 * Lấy danh sách tất cả payrolls
 * GET /api/payrolls
 * Role: ADMIN
 */
export const getPayrolls = async (req: Request, res: Response) => {
  try {
    const { page, limit, month, year, userId, status } = req.query;

    const filters: any = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      month: month ? parseInt(month as string) : undefined,
      year: year ? parseInt(year as string) : undefined,
      userId: userId ? parseInt(userId as string) : undefined,
      status: status as PayrollStatus,
    };

    const result = await getPayrollsService(filters);

    return res.json({
      success: true,
      message: "Payrolls retrieved successfully",
      data: result.payrolls,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve payrolls",
    });
  }
};

/**
 * Lấy payrolls của chính mình
 * GET /api/payrolls/my
 * Role: ALL (authenticated users)
 */
export const getMyPayrolls = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const payrolls = await getMyPayrollsService(userId);

    return res.json({
      success: true,
      message: "Your payrolls retrieved successfully",
      data: payrolls,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve payrolls",
    });
  }
};

/**
 * Lấy chi tiết payroll
 * GET /api/payrolls/:id
 * Role: ADMIN, OWNER
 */
export const getPayrollById = async (req: Request, res: Response) => {
  try {
    const payrollId = parseInt(req.params.id);

    const payroll = await getPayrollByIdService(payrollId);

    // Authorization check - Non-admin chỉ xem được payroll của mình
    const user = (req as any).user;
    if (user.roleId !== 1 && payroll.userId !== user.id) {
      // Not ADMIN and not owner
      return res.status(403).json({
        success: false,
        message: "You can only view your own payroll",
      });
    }

    return res.json({
      success: true,
      message: "Payroll retrieved successfully",
      data: payroll,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error?.message || "Payroll not found",
    });
  }
};

/**
 * Duyệt lương
 * PUT /api/payrolls/:id/approve
 * Role: ADMIN
 */
export const approvePayroll = async (req: Request, res: Response) => {
  try {
    const payrollId = parseInt(req.params.id);
    const adminId = (req as any).user.id;

    const payroll = await approvePayrollService(payrollId, adminId);

    return res.json({
      success: true,
      message: "Payroll approved successfully",
      data: payroll,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to approve payroll",
    });
  }
};

/**
 * Đánh dấu đã thanh toán
 * PUT /api/payrolls/:id/pay
 * Role: ADMIN
 */
export const payPayroll = async (req: Request, res: Response) => {
  try {
    const payrollId = parseInt(req.params.id);
    const adminId = (req as any).user.id;

    const payroll = await payPayrollService(payrollId, adminId);

    return res.json({
      success: true,
      message: "Payroll marked as paid successfully",
      data: payroll,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to mark payroll as paid",
    });
  }
};

/**
 * Lấy lịch sử lương của một user
 * GET /api/payrolls/user/:userId
 * Role: ADMIN, OWNER
 */
export const getUserPayrollHistory = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    // Authorization check
    const currentUser = (req as any).user;
    if (currentUser.roleId !== 1 && currentUser.id !== userId) {
      // Not ADMIN and not owner
      return res.status(403).json({
        success: false,
        message: "You can only view your own payroll history",
      });
    }

    const payrolls = await getUserPayrollHistoryService(userId);

    return res.json({
      success: true,
      message: "Payroll history retrieved successfully",
      data: payrolls,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve payroll history",
    });
  }
};

/**
 * Thống kê lương
 * GET /api/payrolls/statistics
 * Role: ADMIN
 */
export const getPayrollStatistics = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;

    const filters: any = {
      month: month ? parseInt(month as string) : undefined,
      year: year ? parseInt(year as string) : undefined,
    };

    const statistics = await getPayrollStatisticsService(filters);

    return res.json({
      success: true,
      message: "Payroll statistics retrieved successfully",
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
 * Xuất PDF phiếu lương
 * GET /api/payrolls/:id/pdf
 * Role: ADMIN, OWNER
 */
export const exportPayrollPDF = async (req: Request, res: Response) => {
  try {
    const payrollId = parseInt(req.params.id);
    const payroll = await getPayrollByIdService(payrollId);

    // Authorization check
    const user = (req as any).user;
    if (user.roleId !== 1 && payroll.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only export your own payroll",
      });
    }

    // Setup PDF
    const filename = `Payroll-${payroll.payrollCode}.pdf`;
    const doc = setupPDFResponse(res, filename);

    // Header
    addPDFHeader(doc, "PHIẾU LƯƠNG NHÂN VIÊN");

    // Thông tin phiếu lương
    doc.fontSize(11).font("Helvetica");
    doc.text(`Mã phiếu lương: ${payroll.payrollCode}`, 50, doc.y, {
      continued: true,
    });
    doc.text(`Kỳ lương: ${payroll.month}/${payroll.year}`, { align: "right" });

    doc.moveDown(0.5);
    doc.fontSize(10).text(`Trạng thái: `, 50, doc.y, { continued: true });

    const statusColors: any = {
      DRAFT: "#95A5A6",
      APPROVED: "#F39C12",
      PAID: "#27AE60",
    };
    const statusLabels: any = {
      DRAFT: "Nháp",
      APPROVED: "Đã duyệt",
      PAID: "Đã thanh toán",
    };

    doc.fillColor(statusColors[payroll.status] || "#000000");
    doc.text(`● ${statusLabels[payroll.status] || payroll.status}`, {
      continued: false,
    });
    doc.fillColor("#000000");

    doc.moveDown(1.5);

    // Thông tin nhân viên
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("THÔNG TIN NHÂN VIÊN", 50, doc.y);
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    doc.text(
      `Họ tên: ${(payroll as any).user?.fullName || "N/A"}`,
      50,
      doc.y
    );
    doc.text(`Email: ${(payroll as any).user?.email || "N/A"}`);
    doc.text(
      `Chức vụ: ${(payroll as any).user?.role?.roleName || "N/A"}`
    );
    doc.text(`Số năm kinh nghiệm: ${payroll.yearsOfService || 0} năm`);

    doc.moveDown(1.5);

    // Chi tiết lương
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("CHI TIẾT LƯƠNG", 50, doc.y);
    doc.moveDown(0.5);

    // Lương cơ bản
    const headers = ["Hạng mục", "Giá trị"];
    const rows: string[][] = [
      ["Lương cơ sở", formatCurrency(payroll.baseSalary || 0)],
      [
        `Hệ số chức vụ (${payroll.roleCoefficient})`,
        formatCurrency(payroll.roleSalary || 0),
      ],
    ];

    // Phụ cấp kinh nghiệm
    if (payroll.experienceBonus && payroll.experienceBonus > 0) {
      rows.push([
        `Phụ cấp kinh nghiệm (${payroll.yearsOfService} năm)`,
        formatCurrency(payroll.experienceBonus),
      ]);
    }

    // Hoa hồng
    if (payroll.commission && payroll.commission > 0) {
      rows.push([
        `Hoa hồng (${payroll.commissionRate || 0}% × ${formatCurrency(
          payroll.totalInvoices || 0
        )})`,
        formatCurrency(payroll.commission),
      ]);
    }

    // Lương gốc
    rows.push([
      "TỔNG LƯƠNG GỐC",
      formatCurrency(payroll.grossSalary || 0),
    ]);

    // Phạt nghỉ
    if (payroll.penaltyAmount && payroll.penaltyAmount > 0) {
      rows.push([
        `Trừ phạt nghỉ (${payroll.penaltyDaysOff} ngày × 200,000 VNĐ)`,
        `-${formatCurrency(payroll.penaltyAmount)}`,
      ]);
    }

    // Lương thực nhận
    rows.push([
      "LƯƠNG THỰC NHẬN",
      formatCurrency(payroll.netSalary || 0),
    ]);

    // Draw table
    const tableY = drawTable(doc, headers, rows, [350, 150], doc.y);

    doc.y = tableY + 20;

    // Thông tin chấm công
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("THÔNG TIN CHẤM CÔNG", 50, doc.y);
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    doc.text(`Số ngày nghỉ: ${payroll.daysOff || 0} ngày`, 50, doc.y);
    doc.text(`Số ngày được phép nghỉ: ${payroll.allowedDaysOff || 2} ngày`);

    if (payroll.penaltyDaysOff && payroll.penaltyDaysOff > 0) {
      doc.fillColor("#E74C3C");
      doc.text(
        `Số ngày nghỉ vượt quá phép: ${payroll.penaltyDaysOff} ngày`,
        50,
        doc.y
      );
      doc.fillColor("#000000");
    }

    doc.moveDown(2);

    // Phần tổng kết
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#27AE60")
      .text(
        `TỔNG LƯƠNG: ${formatCurrency(payroll.netSalary || 0)}`,
        50,
        doc.y,
        {
          align: "center",
        }
      );
    doc.fillColor("#000000");

    doc.moveDown(2);

    // Phần phê duyệt
    if (payroll.status !== "DRAFT") {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("THÔNG TIN PHÊ DUYỆT", 50, doc.y);
      doc.moveDown(0.5);

      doc.fontSize(10).font("Helvetica");

      if (payroll.approvedAt) {
        doc.text(
          `Người duyệt: ${(payroll as any).approver?.fullName || "N/A"}`,
          50,
          doc.y
        );
        doc.text(`Ngày duyệt: ${formatDateTime(payroll.approvedAt)}`);
      }

      if (payroll.paidAt) {
        doc.text(`Ngày thanh toán: ${formatDateTime(payroll.paidAt)}`);
      }
    }

    doc.moveDown(3);

    // Chữ ký
    const signatureY = doc.y;
    doc.fontSize(10).font("Helvetica");

    doc.text("Nhân viên", 100, signatureY, { align: "center", width: 150 });
    doc.text("Người phê duyệt", 350, signatureY, {
      align: "center",
      width: 150,
    });

    doc.moveDown(3);

    doc
      .fontSize(9)
      .font("Helvetica-Oblique")
      .text("(Ký và ghi rõ họ tên)", 100, doc.y, {
        align: "center",
        width: 150,
      });

    doc.text("(Ký và ghi rõ họ tên)", 350, doc.y - 10, {
      align: "center",
      width: 150,
    });

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

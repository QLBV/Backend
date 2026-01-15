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
} from "./payroll.service";
import { PayrollStatus } from "../../models/Payroll";
import {
  setupPDFResponse,
  addPDFHeader,
  addPDFFooter,
  formatCurrency,
  formatDate,
  formatDateTime,
  drawTable,
} from "../../utils/pdfGenerator";
import { setupExcelResponse, formatCurrencyExcel } from "../../utils/excelGenerator";


export const calculatePayroll = async (req: Request, res: Response) => {
  try {
    const { userId, month, year, calculateAll } = req.body;
    const adminId = req.user!.userId;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    
    if (calculateAll === true) {
      const result = await calculatePayrollForAllService(month, year, adminId);

      return res.status(201).json({
        success: true,
        message: `Calculated payroll for ${result.calculated}/${result.total} employees`,
        data: result,
      });
    }

    
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


export const getMyPayrolls = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

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


export const getPayrollById = async (req: Request, res: Response) => {
  try {
    const payrollId = parseInt(req.params.id);

    const payroll = await getPayrollByIdService(payrollId);

    
    const user = (req as any).user;
    if (user.roleId !== 1 && payroll.userId !== user.userId) {
      
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


export const approvePayroll = async (req: Request, res: Response) => {
  try {
    const payrollId = parseInt(req.params.id);
    const adminId = req.user!.userId;

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


export const payPayroll = async (req: Request, res: Response) => {
  try {
    const payrollId = parseInt(req.params.id);
    const adminId = req.user!.userId;

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


export const getUserPayrollHistory = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    
    const currentUser = (req as any).user;
    if (currentUser.roleId !== 1 && currentUser.id !== userId) {
      
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


export const getDoctorPayrolls = async (req: Request, res: Response) => {
  try {
    const Doctor = (await import("../../models/Doctor")).default;
    const doctorId = parseInt(req.params.doctorId);

    
    const doctor = await Doctor.findByPk(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const payrolls = await getUserPayrollHistoryService(doctor.userId);

    return res.json({
      success: true,
      message: "Doctor payrolls retrieved successfully",
      data: payrolls,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve doctor payrolls",
    });
  }
};


export const getPayrollsByPeriod = async (req: Request, res: Response) => {
  try {
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Both month and year are required",
      });
    }

    const result = await getPayrollsService({
      month,
      year,
    });

    return res.json({
      success: true,
      message: "Payrolls for period retrieved successfully",
      data: result.payrolls,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve payrolls by period",
    });
  }
};


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


export const exportPayrollPDF = async (req: Request, res: Response) => {
  try {
    const payrollId = parseInt(req.params.id);
    const payroll = await getPayrollByIdService(payrollId);

    
    const user = (req as any).user;
    if (user.roleId !== 1 && payroll.userId !== user.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only export your own payroll",
      });
    }

    
    const filename = `Payroll-${payroll.payrollCode}.pdf`;
    const { doc, fonts } = setupPDFResponse(res, filename);
    const regularFont = fonts?.regular ?? "Helvetica";
    const boldFont = fonts?.bold ?? "Helvetica-Bold";
    doc.font(regularFont);

    
    addPDFHeader(doc, "PHIẾU LƯƠNG NHÂN VIÊN", fonts);

    doc.fontSize(11).font(regularFont);
    doc.text(`Mã phiếu lương: ${payroll.payrollCode}`, 50, doc.y, {
      continued: true,
    });
    doc.text(`Ký lương: ${payroll.month}/${payroll.year}`, {
      align: "right",
    });

    doc.moveDown(0.5);
    doc.fontSize(10).font(regularFont).text(`Trạng thái: `, 50, doc.y, { continued: true });

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

    
    doc
      .fontSize(12)
      .font(boldFont)
      .text("THÔNG TIN NHÂN VIÊN", 50, doc.y);
    doc.moveDown(0.5);

    doc.fontSize(10).font(regularFont);
    doc.text(`Họ tên: ${(payroll as any).user?.fullName || "N/A"}`, 50, doc.y);
    doc.text(`Email: ${(payroll as any).user?.email || "N/A"}`);
    doc.text(`Chức vụ: ${(payroll as any).user?.role?.roleName || "N/A"}`);
    doc.text(`Số năm kinh nghiệm: ${payroll.yearsOfService || 0} năm`);

    doc.moveDown(1.5);

    doc.fontSize(12).font(boldFont).text("CHI TIẾT LƯƠNG", 50, doc.y);
    doc.moveDown(0.5);

    
    const headers = ["Hạng mục", "Giá trị"];
    const rows: string[][] = [
      ["Lương cơ bản", formatCurrency(payroll.baseSalary || 0)],
      [
        `Hệ số chức vụ (${payroll.roleCoefficient})`,
        formatCurrency(payroll.roleSalary || 0),
      ],
    ];

    
    if (payroll.experienceBonus && payroll.experienceBonus > 0) {
      rows.push([
        `Phụ cấp kinh nghiệm (${payroll.yearsOfService} năm)`,
        formatCurrency(payroll.experienceBonus),
      ]);
    }

    
    if (payroll.commission && payroll.commission > 0) {
      rows.push([
        `Hoa hồng (${payroll.commissionRate || 0}% × ${formatCurrency(
          payroll.totalInvoices || 0
        )})`,
        formatCurrency(payroll.commission),
      ]);
    }

    
    rows.push(["TỔNG LƯƠNG GỐC", formatCurrency(payroll.grossSalary || 0)]);

    
    if (payroll.penaltyAmount && payroll.penaltyAmount > 0) {
      rows.push([
        `Trừ phạt nghỉ (${payroll.penaltyDaysOff} ngày × 200,000 VNĐ)`,
        `-${formatCurrency(payroll.penaltyAmount)}`,
      ]);
    }

    
    rows.push(["LƯƠNG THỰC NHẬN", formatCurrency(payroll.netSalary || 0)]);

    
    const tableY = drawTable(doc, headers, rows, [350, 150], doc.y, fonts);

    doc.y = tableY + 20;

    
    doc
      .fontSize(12)
      .font(boldFont)
      .text("THÔNG TIN CHẤM CÔNG", 50, doc.y);
    doc.moveDown(0.5);

    doc.fontSize(10).font(regularFont);
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

    
    doc
      .fontSize(14)
      .font(boldFont)
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

    
    if (payroll.status !== "DRAFT") {
      doc
        .fontSize(12)
        .font(boldFont)
        .text("THÔNG TIN PHÊ DUYỆT", 50, doc.y);
      doc.moveDown(0.5);

      doc.fontSize(10).font(regularFont);

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

    
    const signatureY = doc.y;
    doc.fontSize(10).font(regularFont);

    doc.text("Nhân viên", 100, signatureY, { align: "center", width: 150 });
    doc.text("Người phê duyệt", 350, signatureY, {
      align: "center",
      width: 150,
    });

    doc.moveDown(3);

    doc
      .fontSize(9)
      .font(regularFont)
      .text("(Ký và ghi rõ họ tên)", 100, doc.y, {
        align: "center",
        width: 150,
      });

    doc.text("(Ký và ghi rõ họ tên)", 350, doc.y - 10, {
      align: "center",
      width: 150,
    });

    
    addPDFFooter(doc, 1, fonts);

    
    doc.end();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to export PDF",
    });
  }
};

export const exportPayrollsExcel = async (req: Request, res: Response) => {
  try {
    const { month, year, status, userId } = req.query;

    const filters: any = {
      month: month ? parseInt(month as string) : undefined,
      year: year ? parseInt(year as string) : undefined,
      status: status as PayrollStatus,
      userId: userId ? parseInt(userId as string) : undefined,
      limit: 1000, 
    };

    const result = await getPayrollsService(filters);
    const payrolls = result.payrolls;

    const workbook = setupExcelResponse(res, `BangThanhToanLuong-${month}-${year}.xlsx`);
    const sheet = workbook.addWorksheet("Danh sách lương");
    
    
    const roleMap: any = { 
      DOCTOR: "Bác sĩ", 
      RECEPTIONIST: "Lễ tân", 
      ADMIN: "Quản trị viên"
    };

    
    sheet.mergeCells('A1:C1');
    sheet.getCell('A1').value = "HỆ THỐNG QUẢN LÝ PHÒNG KHÁM";
    sheet.getCell('A1').font = { bold: true };
    
    sheet.mergeCells('J1:N1');
    sheet.getCell('J1').value = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
    sheet.getCell('J1').font = { bold: true };
    sheet.getCell('J1').alignment = { horizontal: 'center' };
    
    sheet.mergeCells('J2:N2');
    sheet.getCell('J2').value = "Độc lập - Tự do - Hạnh phúc";
    sheet.getCell('J2').font = { bold: true };
    sheet.getCell('J2').alignment = { horizontal: 'center' };

    sheet.mergeCells('A4:N4');
    sheet.getCell('A4').value = `BẢNG THANH TOÁN TIỀN LƯƠNG THÁNG ${month}/${year}`;
    sheet.getCell('A4').font = { bold: true, size: 14 };
    sheet.getCell('A4').alignment = { horizontal: 'center' };

    
    sheet.getRow(6).values = ["Mã NV", "Họ tên", "Chức vụ", "Tháng/Năm", "Lương CB", "Hệ số", "Lương Hệ số", "Thâm niên (năm)", "Thưởng thâm niên", "Hoa hồng", "Tổng thu nhập", "Khấu trừ/Phạt", "Thực nhận", "Trạng thái"];
    sheet.columns = [
      { key: "code", width: 12 },
      { key: "name", width: 25 },
      { key: "role", width: 15 },
      { key: "period", width: 15 },
      { key: "base", width: 15 },
      { key: "coeff", width: 10 },
      { key: "roleSalary", width: 15 },
      { key: "exp", width: 12 },
      { key: "expBonus", width: 18 },
      { key: "commission", width: 15 },
      { key: "gross", width: 18 },
      { key: "penalty", width: 15 },
      { key: "net", width: 18 },
      { key: "status", width: 15 },
    ];

    sheet.getRow(6).font = { bold: true };
    sheet.getRow(6).alignment = { vertical: 'middle', horizontal: 'center' };

    payrolls.forEach((p: any) => {
      
      let roleName = "Nhân viên";
      const rawRole = p.user?.role?.name || "";
      if (roleMap[rawRole.toUpperCase()]) {
        roleName = roleMap[rawRole.toUpperCase()];
      }

      const statusMap: any = { DRAFT: "Nháp", APPROVED: "Đã duyệt", PAID: "Đã trả" };
      
      
      if (!p.user || rawRole.toUpperCase() === "PATIENT") return;

      sheet.addRow({
        code: p.user?.employee?.employeeCode || p.user?.username || (p.userId ? `ID:${p.userId}` : "N/A"),
        name: p.user?.fullName || p.user?.employee?.fullName || "Tài khoản không tồn tại",
        role: roleName,
        period: `${p.month}/${p.year}`,
        base: formatCurrencyExcel(Number(p.baseSalary)),
        coeff: p.roleCoefficient,
        roleSalary: formatCurrencyExcel(Number(p.roleSalary)),
        exp: p.yearsOfService,
        expBonus: formatCurrencyExcel(Number(p.experienceBonus)),
        commission: formatCurrencyExcel(Number(p.commission)),
        gross: formatCurrencyExcel(Number(p.grossSalary)),
        penalty: formatCurrencyExcel(Number(p.penaltyAmount)),
        net: formatCurrencyExcel(Number(p.netSalary)),
        status: statusMap[p.status] || p.status,
      });
    });

    
    sheet.addRow({});
    sheet.addRow({});
    const now = new Date();
    const dateStr = `TP. Hồ Chí Minh, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
    
    
    const dateRow = sheet.addRow([]);
    dateRow.getCell(12).value = dateStr;
    dateRow.getCell(12).font = { italic: true };
    dateRow.alignment = { horizontal: 'center' };
    dateRow.getCell(12).alignment = { horizontal: 'center' };
    
    const signLabelRow = sheet.addRow([]);
    signLabelRow.getCell(12).value = "Người lập biểu";
    signLabelRow.getCell(12).font = { bold: true };
    signLabelRow.getCell(12).alignment = { horizontal: 'center' };
    
    const signNoteRow = sheet.addRow([]);
    signNoteRow.getCell(12).value = "(Ký và ghi rõ họ tên)";
    signNoteRow.getCell(12).font = { size: 10 };
    signNoteRow.getCell(12).alignment = { horizontal: 'center' };

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to export Excel",
    });
  }
};


export const exportPayrollsPDF = async (req: Request, res: Response) => {
  try {
    const { month, year, status, userId } = req.query;

    const filters: any = {
      month: month ? parseInt(month as string) : undefined,
      year: year ? parseInt(year as string) : undefined,
      status: status as PayrollStatus,
      userId: userId ? parseInt(userId as string) : undefined,
      limit: 1000,
    };

    const result = await getPayrollsService(filters);
    const payrolls = result.payrolls;

    const filename = `BangThanhToanLuong-${month}-${year}.pdf`;
    const { doc, fonts } = setupPDFResponse(res, filename);
    const regularFont = fonts?.regular ?? "Helvetica";
    const boldFont = fonts?.bold ?? "Helvetica-Bold";

    addPDFHeader(doc, `BẢNG THANH TOÁN TIỀN LƯƠNG THÁNG ${month}/${year}`, fonts);

    const statusMap: any = { DRAFT: "Nháp", APPROVED: "Đã duyệt", PAID: "Đã trả" };
    const roleMap: any = { 
        DOCTOR: "Bác sĩ", 
        RECEPTIONIST: "Lễ tân", 
        ADMIN: "Quản trị viên",
        PATIENT: "Bệnh nhân"
    };

    const rows = payrolls
      .filter((p: any) => p.user && p.user.role?.name?.toUpperCase() !== "PATIENT") 
      .map((p: any) => {
        let roleName = "Nhân viên";
        const rawRole = p.user?.role?.name || "";
        if (roleMap[rawRole.toUpperCase()]) {
            roleName = roleMap[rawRole.toUpperCase()];
        }

        return [
          p.user?.employee?.employeeCode || p.user?.username || (p.userId ? `ID:${p.userId}` : "N/A"),
          p.user?.fullName || "N/A",
          roleName,
          formatCurrency(Number(p.netSalary)),
          statusMap[p.status] || p.status,
        ];
      });

    
    const pdfHeaders = ["Mã NV", "Họ tên", "Chức vụ", "Thực nhận", "Trạng thái"];
    const pdfColumnWidths = [60, 120, 90, 110, 80];

    drawTable(doc, pdfHeaders, rows, pdfColumnWidths, doc.y, fonts);

    
    doc.moveDown(2);
    const now = new Date();
    const dateStr = `TP. Hồ Chí Minh, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
    
    doc.fontSize(10).font(regularFont);
    doc.text(dateStr, 330, doc.y, { align: "center", width: 200 });
    
    doc.moveDown(0.3);
    doc.fontSize(11).font(boldFont);
    doc.text("Người lập biểu", 330, doc.y, { align: "center", width: 200 });
    
    doc.moveDown(0.2);
    doc.fontSize(9).font(regularFont);
    doc.text("(Ký và ghi rõ họ tên)", 330, doc.y, { align: "center", width: 200 });

    addPDFFooter(doc, 1, fonts);
    doc.end();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to export PDF",
    });
  }
};

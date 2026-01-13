import { Response } from "express";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import PDFKit from "pdfkit";
import {
  getRevenueReportService,
  getExpenseReportService,
  getProfitReportService,
  getTopMedicinesReportService, 
  getPatientsByGenderReportService,
  getAppointmentReportService,
  getPatientStatisticsService,
} from "./report.service";
import { formatCurrency, formatDate } from "../utils/pdfGenerator";
import { createVietnamesePDF, setFont } from "../utils/pdfFontHelper";

const CLIEN_INFO = {
  name: "HỆ THỐNG PHÒNG KHÁM TƯ HEALTHCARE",
  address: "123 Đường ABC, Quận X, TP. Hồ Chí Minh",
  phone: "Hotline: 1900 1234 | Website: Healos.vn",
  email: "support@healos.vn"
};

const COLORS = {
  primary: "#1e40af",    // Blue 800
  secondary: "#3b82f6",  // Blue 500
  textMain: "#0f172a",   // Slate 900
  textLight: "#64748b",  // Slate 500
  divider: "#e2e8f0",    // Slate 200
  bgSoft: "#f8fafc",     // Slate 50
  accent1: "#ef4444",    // Red 500 (Expense)
  accent2: "#10b981"     // Emerald 500 (Profit)
};

const drawHeader = (doc: PDFKit.PDFDocument, fonts: any) => {
  // Logo placeholder / Clinic Name
  setFont(doc, fonts, true);
  doc.fontSize(16).fillColor(COLORS.primary).text(CLIEN_INFO.name, 50, 45);
  
  setFont(doc, fonts, false);
  doc.fontSize(9).fillColor(COLORS.textLight);
  doc.text(CLIEN_INFO.address);
  doc.text(CLIEN_INFO.phone);
  doc.text(CLIEN_INFO.email);
  
  // Decorative line
  doc.moveTo(50, 105).lineTo(545, 105).strokeColor(COLORS.divider).lineWidth(1).stroke();
  doc.moveDown(2);
};

const drawFooter = (doc: PDFKit.PDFDocument, fonts: any) => {
  const totalPages = (doc as any)._pageBuffer.length;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc.moveTo(50, 780).lineTo(545, 780).strokeColor(COLORS.divider).lineWidth(0.5).stroke();
    setFont(doc, fonts, false);
    doc.fontSize(8).fillColor(COLORS.textLight);
    doc.text(`Trang ${i + 1} / ${totalPages}`, 50, 790, { align: "center" });
    doc.text(`Báo cáo được trích xuất từ hệ thống phòng khám Healthcare - ${formatDate(new Date())}`, 50, 805, { align: "center" });
  }
};

const drawSummaryCard = (doc: PDFKit.PDFDocument, fonts: any, label: string, value: string, x: number, y: number, w: number, accentColor: string = COLORS.secondary) => {
  doc.roundedRect(x, y, w, 50, 8).fillColor(COLORS.bgSoft).fill();
  doc.lineWidth(1).strokeColor(COLORS.divider).roundedRect(x, y, w, 50, 8).stroke();
  
  // Little color bar
  doc.rect(x + 10, y + 15, 3, 20).fillColor(accentColor).fill();
  
  setFont(doc, fonts, false);
  doc.fontSize(8).fillColor(COLORS.textLight).text(label.toUpperCase(), x + 20, y + 12);
  setFont(doc, fonts, true);
  doc.fontSize(11).fillColor(COLORS.textMain).text(value, x + 20, y + 25);
};

const createReportDoc = (
  res: Response,
  filename: string
): {
  doc: PDFKit.PDFDocument;
  fonts: any;
} => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const { doc, fonts } = createVietnamesePDF({ margin: 50, size: "A4" });
  doc.pipe(res);
  return { doc, fonts };
};

/**
 * Generate Revenue Report PDF
 */
export const generateRevenueReportPDF = async (
  res: Response,
  filters: { year: number; month?: number }
) => {
  const reportData = await getRevenueReportService(filters);
  const { year, month } = filters;
  const filename = month ? `Revenue_Report_${year}_${month}.pdf` : `Revenue_Report_${year}.pdf`;

  const { doc, fonts } = createReportDoc(res, filename);
  drawHeader(doc, fonts);

  // Title
  setFont(doc, fonts, true);
  doc.fontSize(22).fillColor(COLORS.textMain).text("BÁO CÁO DOANH THU", 50, doc.y, { align: "center", width: 495 });
  setFont(doc, fonts, false);
  doc.fontSize(12).fillColor(COLORS.textLight).text(month ? `Chu kỳ: Tháng ${month} / ${year}` : `Chu kỳ: Năm ${year}`, 50, doc.y, { align: "center", width: 495 });
  doc.moveDown(2);

  // Summary Cards
  const startY = doc.y;
  drawSummaryCard(doc, fonts, "Tổng doanh thu", formatCurrency(reportData.summary.totalRevenue), 50, startY, 155);
  drawSummaryCard(doc, fonts, "Đã thực thu", formatCurrency(reportData.summary.collectedRevenue), 220, startY, 155, COLORS.accent2);
  drawSummaryCard(doc, fonts, "Số hóa đơn", reportData.summary.totalInvoices.toString(), 390, startY, 155);
  
  doc.y = startY + 70;

  // Chart
  if (reportData.overTime.length > 0) {
    setFont(doc, fonts, true);
    doc.fontSize(14).fillColor(COLORS.primary).text("BIỂU ĐỒ BIẾN ĐỘNG DOANH THU", 50, doc.y, { align: "center", width: 495 });
    doc.moveDown(0.5);

    const chartCanvas = new ChartJSNodeCanvas({ width: 500, height: 250, backgroundColour: 'white' });
    const configuration = {
      type: "line" as const,
      data: {
        labels: reportData.overTime.map((item: any) => month ? item.period.split('-').pop() : `T${item.period.split('-').pop()}`),
        datasets: [{
          label: "Doanh thu (VNĐ)",
          data: reportData.overTime.map((item: any) => item.revenue),
          borderColor: COLORS.primary,
          backgroundColor: 'rgba(30, 64, 175, 0.1)',
          fill: true,
          pointBackgroundColor: COLORS.primary,
          tension: 0.4,
        }],
      },
      options: { 
        plugins: { 
          legend: { display: false },
          title: { display: true, text: month ? 'Dữ liệu theo ngày' : 'Dữ liệu theo tháng' }
        },
        scales: { y: { ticks: { callback: (v: any) => formatCurrency(v).replace('₫', '') } } }
      },
    };

    const chartBuffer = await chartCanvas.renderToBuffer(configuration);
    doc.image(chartBuffer, 50, doc.y, { width: 495 });
    doc.y += 250 + 20; // 250px height (ratio 0.5) + margin
  }

  // Table
  setFont(doc, fonts, true);
  doc.fontSize(14).fillColor(COLORS.primary).text("CHI TIẾT BẢNG SỐ LIỆU", 50, doc.y, { align: "center", width: 495 });
  doc.moveDown(0.5);
  
  // Table Header
  const tableY = doc.y;
  doc.rect(50, tableY, 495, 25).fillColor(COLORS.bgSoft).fill();
  doc.fontSize(10).fillColor(COLORS.textMain);
  doc.text("THỜI GIAN", 65, tableY + 8);
  doc.text("DOANH THU (VNĐ)", 350, tableY + 8, { align: "right", width: 180 });

  let currentY = tableY + 25;
  setFont(doc, fonts, false);
  reportData.overTime.forEach((item: any, idx: number) => {
    if (currentY > 700) { doc.addPage(); drawHeader(doc, fonts); currentY = 120; }
    
    if (idx % 2 === 0) doc.rect(50, currentY, 495, 22).fillColor("#fbfcfd").fill();
    doc.fontSize(9).fillColor(COLORS.textMain);
    doc.text(item.period, 65, currentY + 6);
    doc.text(formatCurrency(item.revenue), 350, currentY + 6, { align: "right", width: 180 });
    currentY += 22;
  });

  drawFooter(doc, fonts);
  doc.end();
};

/**
 * Generate Expense Report PDF
 */
export const generateExpenseReportPDF = async (
  res: Response,
  filters: { year: number; month?: number }
) => {
  const reportData = await getExpenseReportService(filters);
  const { year, month } = filters;
  const filename = month ? `Expense_Report_${year}_${month}.pdf` : `Expense_Report_${year}.pdf`;

  const { doc, fonts } = createReportDoc(res, filename);
  drawHeader(doc, fonts);

  setFont(doc, fonts, true);
  doc.fontSize(22).fillColor(COLORS.textMain).text("BÁO CÁO CHI PHÍ", 50, doc.y, { align: "center", width: 495 });
  setFont(doc, fonts, false);
  doc.fontSize(12).fillColor(COLORS.textLight).text(month ? `Chu kỳ: Tháng ${month} / ${year}` : `Chu kỳ: Năm ${year}`, 50, doc.y, { align: "center", width: 495 });
  doc.moveDown(2);

  const startY = doc.y;
  drawSummaryCard(doc, fonts, "Tổng chi phí", formatCurrency(reportData.summary.totalExpense), 50, startY, 155, COLORS.accent1);
  drawSummaryCard(doc, fonts, "Quỹ lương", formatCurrency(reportData.summary.salaryExpense), 220, startY, 155);
  drawSummaryCard(doc, fonts, "Chi thuốc/VT", formatCurrency(reportData.summary.medicineExpense), 390, startY, 155);
  
  doc.y = startY + 80;

  // Pie chart
  setFont(doc, fonts, true);
  doc.fontSize(14).fillColor(COLORS.primary).text("CƠ CẤU CHI PHÍ", 50, doc.y, { align: "center", width: 495 });
  doc.moveDown(0.5);

  const chartCanvas = new ChartJSNodeCanvas({ width: 400, height: 250, backgroundColour: 'white' });
  const configuration = {
    type: "pie" as const,
    data: {
      labels: ["Thuốc & Vật tư", "Tiền lương nhân sự"],
      datasets: [{
        data: [reportData.summary.medicineExpense, reportData.summary.salaryExpense],
        backgroundColor: [COLORS.accent2, COLORS.secondary],
      }],
    },
    options: { plugins: { legend: { position: 'right' as const } } },
  };

  const chartBuffer = await chartCanvas.renderToBuffer(configuration);
  doc.image(chartBuffer, 100, doc.y, { width: 350 });
  doc.y += 220 + 20; // ~218px height (ratio 0.625) + margin

  // Table Salary
  setFont(doc, fonts, true);
  doc.fontSize(14).fillColor(COLORS.primary).text("CHI TIẾT QUỸ LƯƠNG THEO VỊ TRÍ", 50, doc.y, { align: "center", width: 495 });
  doc.moveDown(1.5);
  
  const tableY = doc.y;
  doc.rect(50, tableY, 495, 25).fillColor(COLORS.bgSoft).fill();
  doc.fontSize(10).text("VỊ TRÍ", 65, tableY + 8);
  doc.text("SỐ NV", 180, tableY + 8);
  doc.text("TỔNG LƯƠNG", 300, tableY + 8, { align: "right", width: 100 });
  doc.text("TRUNG BÌNH", 430, tableY + 8, { align: "right", width: 100 });

  let currentY = tableY + 25;
  setFont(doc, fonts, false);
  reportData.salaryByRole.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(50, currentY, 495, 22).fillColor("#fbfcfd").fill();
    doc.fontSize(9).fillColor(COLORS.textMain);
    doc.text(item.role, 65, currentY + 6);
    doc.text(item.count.toString(), 180, currentY + 6);
    doc.text(formatCurrency(item.totalSalary).replace('₫', ''), 300, currentY + 6, { align: "right", width: 100 });
    doc.text(formatCurrency(item.totalSalary / (item.count || 1)).replace('₫', ''), 430, currentY + 6, { align: "right", width: 100 });
    currentY += 22;
  });

  drawFooter(doc, fonts);
  doc.end();
};

/**
 * Generate Profit Report PDF
 */
export const generateProfitReportPDF = async (
  res: Response,
  filters: { year: number; month?: number }
) => {
  const reportData = await getProfitReportService(filters);
  const { year, month } = filters;
  const filename = month ? `Profit_Report_${year}_${month}.pdf` : `Profit_Report_${year}.pdf`;

  const { doc, fonts } = createReportDoc(res, filename);
  drawHeader(doc, fonts);

  setFont(doc, fonts, true);
  doc.fontSize(22).fillColor(COLORS.textMain).text("BÁO CÁO LỢI NHUẬN", 50, doc.y, { align: "center", width: 495 });
  setFont(doc, fonts, false);
  doc.fontSize(12).fillColor(COLORS.textLight).text(month ? `Chu kỳ: Tháng ${month} / ${year}` : `Chu kỳ: Năm ${year}`, 50, doc.y, { align: "center", width: 495 });
  doc.moveDown(2);

  const startY = doc.y;
  drawSummaryCard(doc, fonts, "Doanh thu", formatCurrency(reportData.summary.totalRevenue), 50, startY, 155);
  drawSummaryCard(doc, fonts, "Tổng chi phí", formatCurrency(reportData.summary.totalExpense), 220, startY, 155, COLORS.accent1);
  drawSummaryCard(doc, fonts, "Lợi nhuận ròng", formatCurrency(reportData.summary.totalProfit), 390, startY, 155, COLORS.accent2);
  
  doc.y = startY + 80;

  // Comparison chart
  if (reportData.overTime.length > 0) {
    setFont(doc, fonts, true);
    doc.fontSize(14).fillColor(COLORS.primary).text("TƯƠNG QUAN THU - CHI", 50, doc.y, { align: "center", width: 495 });
    doc.moveDown(0.5);

    const chartCanvas = new ChartJSNodeCanvas({ width: 500, height: 300, backgroundColour: 'white' });
    const configuration = {
      type: "bar" as const,
      data: {
        labels: reportData.overTime.map((item: any) => month ? item.period.split('-').pop() : `T${item.period.split('-').pop()}`),
        datasets: [
          { label: "Doanh thu", data: reportData.overTime.map((item: any) => item.revenue), backgroundColor: COLORS.secondary },
          { label: "Chi phí", data: reportData.overTime.map((item: any) => item.expense), backgroundColor: COLORS.accent1 },
          { label: "Lợi nhuận", data: reportData.overTime.map((item: any) => item.profit), backgroundColor: COLORS.accent2 }
        ],
      },
      options: { scales: { y: { ticks: { callback: (v: any) => formatCurrency(v).replace('₫', '') } } } }
    };

    const chartBuffer = await chartCanvas.renderToBuffer(configuration);
    doc.image(chartBuffer, 50, doc.y, { width: 495 });
    doc.y += 300 + 20; // ~297px height (ratio 0.6) + margin
  }

  drawFooter(doc, fonts);
  doc.end();
};

/**
 * Generate Top Medicines Report PDF
 */
export const generateTopMedicinesReportPDF = async (
  res: Response,
  filters: { year: number; month?: number; limit?: number }
) => {
  const reportData = await getTopMedicinesReportService(filters);
  const { year, month, limit = 10 } = filters;
  const filename = month ? `Top_Medicines_${year}_${month}.pdf` : `Top_Medicines_${year}.pdf`;

  const { doc, fonts } = createReportDoc(res, filename);
  drawHeader(doc, fonts);

  setFont(doc, fonts, true);
  doc.fontSize(20).text(`TOP ${limit} THUỐC SỬ DỤNG NHIỀU NHẤT`, { align: "center" });
  doc.moveDown(1.5);

  const tableY = doc.y;
  doc.rect(50, tableY, 495, 25).fillColor(COLORS.primary).fill();
  doc.fontSize(10).fillColor("#ffffff");
  doc.text("STT", 60, tableY + 8);
  doc.text("TÊN THUỐC", 100, tableY + 8);
  doc.text("SỐ LƯỢNG", 300, tableY + 8, { align: "right", width: 80 });
  doc.text("SỐ ĐƠN", 400, tableY + 8, { align: "right", width: 60 });
  doc.text("DOANH THU", 480, tableY + 8, { align: "right", width: 60 });

  let currentY = tableY + 25;
  setFont(doc, fonts, false);
  doc.fillColor(COLORS.textMain);
  reportData.topMedicines.forEach((med: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(50, currentY, 495, 22).fillColor(COLORS.bgSoft).fill();
    doc.fillColor(COLORS.textMain).fontSize(9);
    doc.text((idx + 1).toString(), 60, currentY + 6);
    doc.text(med.medicine.name, 100, currentY + 6);
    doc.text(med.totalQuantity.toString(), 300, currentY + 6, { align: "right", width: 80 });
    doc.text(med.prescriptionCount.toString(), 400, currentY + 6, { align: "right", width: 60 });
    doc.text(formatCurrency(med.estimatedRevenue).replace('₫',''), 480, currentY + 6, { align: "right", width: 60 });
    currentY += 22;
  });

  drawFooter(doc, fonts);
  doc.end();
};

/**
 * Generate Patients by Gender Report PDF
 */
export const generatePatientsByGenderReportPDF = async (res: Response) => {
  const reportData = await getPatientsByGenderReportService();
  const filename = `Patients_By_Gender_Report.pdf`;

  const { doc, fonts } = createReportDoc(res, filename);
  drawHeader(doc, fonts);

  setFont(doc, fonts, true);
  doc.fontSize(20).text("BÁO CÁO PHÂN TÍCH BỆNH NHÂN", { align: "center" });
  doc.moveDown(2);

  const startY = doc.y;
  drawSummaryCard(doc, fonts, "Tổng số bệnh nhân", reportData.total.toString(), 200, startY, 200, COLORS.primary);
  
  doc.y = startY + 80;
  
  const chartCanvas = new ChartJSNodeCanvas({ width: 400, height: 300, backgroundColour: 'white' });
  const configuration = {
    type: "pie" as const,
    data: {
      labels: reportData.byGender.map((g: any) => g.gender),
      datasets: [{
        data: reportData.byGender.map((g: any) => g.count),
        backgroundColor: [COLORS.secondary, COLORS.accent1, '#facc15'],
      }],
    },
  };

  const chartBuffer = await chartCanvas.renderToBuffer(configuration);
  doc.image(chartBuffer, 100, doc.y, { width: 350 });
  doc.y += 265 + 20; // ~262px height (ratio 0.75) + margin

  drawFooter(doc, fonts);
  doc.end();
};

/**
 * Generate Appointment Report PDF
 */
export const generateAppointmentReportPDF = async (
  res: Response,
  filters: { year: number; month?: number }
) => {
  const reportData = await getAppointmentReportService(filters);
  const { year, month } = filters;
  const filename = month ? `Appointment_Report_${year}_${month}.pdf` : `Appointment_Report_${year}.pdf`;

  const { doc, fonts } = createReportDoc(res, filename);
  drawHeader(doc, fonts);

  // Title
  setFont(doc, fonts, true);
  doc.fontSize(22).fillColor(COLORS.textMain).text("BÁO CÁO THỐNG KÊ LỊCH HẸN", 50, doc.y, { align: "center", width: 495 });
  setFont(doc, fonts, false);
  doc.fontSize(12).fillColor(COLORS.textLight).text(month ? `Chu kỳ: Tháng ${month} / ${year}` : `Chu kỳ: Năm ${year}`, 50, doc.y, { align: "center", width: 495 });
  doc.moveDown(2);

  // Summary Cards
  const startY = doc.y;
  drawSummaryCard(doc, fonts, "Tổng lịch hẹn", reportData.summary.totalAppointments.toString(), 50, startY, 155);
  drawSummaryCard(doc, fonts, "Hoàn thành", reportData.summary.completedAppointments.toString(), 220, startY, 155, COLORS.accent2);
  drawSummaryCard(doc, fonts, "Tỷ lệ hoàn thành", `${reportData.summary.completionRate.toFixed(1)}%`, 390, startY, 155);
  
  doc.y = startY + 70;

  // Trend Chart
  if (reportData.overTime.length > 0) {
    setFont(doc, fonts, true);
    doc.fontSize(14).fillColor(COLORS.primary).text("XU HƯỚNG LỊCH HẸN", 50, doc.y, { align: "center", width: 495 });
    doc.moveDown(0.5);

    const chartCanvas = new ChartJSNodeCanvas({ width: 500, height: 250, backgroundColour: 'white' });
    const configuration = {
      type: "bar" as const,
      data: {
        labels: reportData.overTime.map((item: any) => month ? item.period.split('-').pop() : `T${item.period.split('-').pop()}`),
        datasets: [
          {
            label: "Tổng số",
            data: reportData.overTime.map((item: any) => item.total),
            backgroundColor: COLORS.secondary,
          },
          {
            label: "Hoàn thành",
            data: reportData.overTime.map((item: any) => item.completed),
            backgroundColor: COLORS.accent2,
          }
        ],
      },
      options: { 
        plugins: { 
          legend: { position: 'bottom' as const },
        }
      },
    };

    const chartBuffer = await chartCanvas.renderToBuffer(configuration);
    doc.image(chartBuffer, 50, doc.y, { width: 495 });
    doc.y += 250 + 20;
  }

  // Doctor Table
  setFont(doc, fonts, true);
  doc.fontSize(14).fillColor(COLORS.primary).text("THỐNG KÊ THEO BÁC SĨ", 50, doc.y, { align: "center", width: 495 });
  doc.moveDown(0.5);
  
  const tableY = doc.y;
  doc.rect(50, tableY, 495, 25).fillColor(COLORS.bgSoft).fill();
  doc.fontSize(10).fillColor(COLORS.textMain);
  doc.text("TÊN BÁC SĨ", 65, tableY + 8);
  doc.text("SỐ LỊCH HẸN", 350, tableY + 8, { align: "right", width: 100 });
  doc.text("TỶ LỆ (%)", 460, tableY + 8, { align: "right", width: 70 });

  let currentY = tableY + 25;
  setFont(doc, fonts, false);
  reportData.byDoctor.forEach((item: any, idx: number) => {
    if (currentY > 700) { doc.addPage(); drawHeader(doc, fonts); currentY = 120; }
    
    if (idx % 2 === 0) doc.rect(50, currentY, 495, 22).fillColor("#fbfcfd").fill();
    doc.fontSize(9).fillColor(COLORS.textMain);
    doc.text(item.doctorName, 65, currentY + 6);
    doc.text(item.count.toString(), 350, currentY + 6, { align: "right", width: 100 });
    doc.text(`${item.percentage.toFixed(1)}%`, 460, currentY + 6, { align: "right", width: 70 });
    currentY += 22;
  });

  drawFooter(doc, fonts);
  doc.end();
};

/**
 * Generate Patient Statistics Report PDF
 */
export const generatePatientStatisticsPDF = async (
  res: Response,
  filters: { year: number; month?: number }
) => {
  const { year, month } = filters;
  const reportData = await getPatientStatisticsService(year, month);
  const filename = month ? `Patient_Statistics_${year}_${month}.pdf` : `Patient_Statistics_${year}.pdf`;

  const { doc, fonts } = createReportDoc(res, filename);
  drawHeader(doc, fonts);

  // Title
  setFont(doc, fonts, true);
  doc.fontSize(22).fillColor(COLORS.textMain).text("BÁO CÁO THỐNG KÊ BỆNH NHÂN", 50, doc.y, { align: "center", width: 495 });
  setFont(doc, fonts, false);
  doc.fontSize(12).fillColor(COLORS.textLight).text(month ? `Chu kỳ: Tháng ${month} / ${year}` : `Chu kỳ: Năm ${year}`, 50, doc.y, { align: "center", width: 495 });
  doc.moveDown(2);

  // Summary Cards
  const startY = doc.y;
  drawSummaryCard(doc, fonts, "Tổng bệnh nhân", reportData.totalPatients.toString(), 50, startY, 115);
  drawSummaryCard(doc, fonts, "Mới (trong kỳ)", reportData.newPatients.toString(), 175, startY, 115, COLORS.accent2);
  drawSummaryCard(doc, fonts, "Đang hoạt động", reportData.activePatients.toString(), 300, startY, 115, COLORS.secondary);
  drawSummaryCard(doc, fonts, "Vắng mặt", reportData.inactivePatients.toString(), 425, startY, 115, COLORS.accent1);
  
  doc.y = startY + 70;

  // Gender & Age Charts (Side by side)
  setFont(doc, fonts, true);
  doc.fontSize(14).fillColor(COLORS.primary).text("PHÂN TÍCH NHÂN KHẨU HỌC", 50, doc.y, { align: "center", width: 495 });
  doc.moveDown(0.5);

  const chartY = doc.y;
  const chartCanvas = new ChartJSNodeCanvas({ width: 300, height: 250, backgroundColour: 'white' });
  
  // Gender Pie Chart
  const genderConfig = {
    type: "pie" as const,
    data: {
      labels: reportData.patientsByGender.map((g: any) => {
        const labels: any = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác", UNKNOWN: "Không xác định" };
        return labels[g.gender] || g.gender;
      }),
      datasets: [{
        data: reportData.patientsByGender.map((g: any) => g.count),
        backgroundColor: [COLORS.secondary, "#ec4899", "#94a3b8"],
      }],
    },
    options: { plugins: { legend: { position: 'bottom' as const } } },
  };
  const genderBuffer = await chartCanvas.renderToBuffer(genderConfig);
  doc.image(genderBuffer, 50, chartY, { width: 230 });

  // Age Bar Chart
  const ageConfig = {
    type: "bar" as const,
    data: {
      labels: reportData.patientsByAge.map((a: any) => a.ageRange),
      datasets: [{
        label: "Số lượng",
        data: reportData.patientsByAge.map((a: any) => a.count),
        backgroundColor: COLORS.primary,
      }],
    },
    options: { plugins: { legend: { display: false } } },
  };
  const ageBuffer = await chartCanvas.renderToBuffer(ageConfig);
  doc.image(ageBuffer, 300, chartY, { width: 230 });

  doc.y = chartY + 200;

  // Top Patients Table
  doc.addPage();
  drawHeader(doc, fonts);
  
  setFont(doc, fonts, true);
  doc.fontSize(14).fillColor(COLORS.primary).text("BỆNH NHÂN TIN CẬY (LƯỢT KHÁM NHIỀU NHẤT)", 50, doc.y, { align: "center", width: 495 });
  doc.moveDown(0.5);
  
  const tableY = doc.y;
  doc.rect(50, tableY, 495, 25).fillColor(COLORS.bgSoft).fill();
  doc.fontSize(10).fillColor(COLORS.textMain);
  doc.text("TÊN BỆNH NHÂN", 65, tableY + 8);
  doc.text("SỐ LƯỢT KHÁM", 400, tableY + 8, { align: "right", width: 130 });

  let currentY = tableY + 25;
  setFont(doc, fonts, false);
  reportData.topVisitingPatients.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(50, currentY, 495, 22).fillColor("#fbfcfd").fill();
    doc.fontSize(9).fillColor(COLORS.textMain);
    doc.text(item.patientName, 65, currentY + 6);
    doc.text(item.visitCount.toString(), 400, currentY + 6, { align: "right", width: 130 });
    currentY += 22;
  });

  drawFooter(doc, fonts);
  doc.end();
};

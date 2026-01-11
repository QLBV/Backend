import { Response } from "express";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import PDFKit from "pdfkit";
import {
  getRevenueReportService,
  getExpenseReportService,
  getProfitReportService,
  getTopMedicinesReportService,
  getPatientsByGenderReportService,
} from "./report.service";
import { formatCurrency, formatDate } from "../utils/pdfGenerator";
import { createVietnamesePDF, setFont } from "../utils/pdfFontHelper";

const createReportDoc = (
  res: Response,
  filename: string
): {
  doc: PDFKit.PDFDocument;
  useRegular: () => void;
  useBold: () => void;
} => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const { doc, fonts } = createVietnamesePDF({ margin: 50, size: "A4" });
  doc.pipe(res);

  const useRegular = () => setFont(doc, fonts, false);
  const useBold = () => setFont(doc, fonts, true);

  return { doc, useRegular, useBold };
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

  // Setup PDF response
  const filename = month
    ? `Revenue_Report_${year}_${month}.pdf`
    : `Revenue_Report_${year}.pdf`;

  const { doc, useRegular, useBold } = createReportDoc(res, filename);

  // Title
  useBold();
  doc.fontSize(20).text("BÁO CÁO DOANH THU", { align: "center" });
  doc.moveDown(0.5);

  const period = month ? `Tháng ${month}/${year}` : `Năm ${year}`;
  useRegular();
  doc.fontSize(12).text(period, { align: "center" });
  doc.moveDown(2);

  // Summary
  useBold();
  doc.fontSize(14).text("TỔNG QUAN");
  doc.moveDown(0.5);

  useRegular();
  doc.fontSize(11);
  doc.text(`Tổng doanh thu: ${formatCurrency(reportData.summary.totalRevenue)}`);
  doc.text(`Đã thu: ${formatCurrency(reportData.summary.collectedRevenue)}`);
  doc.text(`Chưa thu: ${formatCurrency(reportData.summary.uncollectedRevenue)}`);
  doc.text(`Số hóa đơn: ${reportData.summary.totalInvoices}`);
  doc.text(`Giá trị TB/hóa đơn: ${formatCurrency(reportData.summary.averageInvoiceValue)}`);
  doc.moveDown(2);

  // Revenue by status
  useBold();
  doc.fontSize(14).text("DOANH THU THEO TRẠNG THÁI");
  doc.moveDown(0.5);

  useRegular();
  doc.fontSize(10);
  reportData.byStatus.forEach((status: any) => {
    doc.text(
      `${status.paymentStatus}: ${formatCurrency(status.totalAmount)} (${status.count} hóa đơn)`
    );
  });
  doc.moveDown(2);

  // Revenue chart
  if (reportData.overTime.length > 0) {
    useBold();
    doc.fontSize(14).text("BIỂU ĐỒ DOANH THU");
    doc.moveDown(0.5);

    // Generate chart
    const chartCanvas = new ChartJSNodeCanvas({ width: 500, height: 300 });
    const configuration = {
      type: "line" as const,
      data: {
        labels: reportData.overTime.map((item: any) => item.period),
        datasets: [
          {
            label: "Doanh thu (VNĐ)",
            data: reportData.overTime.map((item: any) => item.revenue),
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top" as const,
          },
          title: {
            display: true,
            text: "Doanh thu theo thời gian",
          },
        },
      },
    };

    const chartBuffer = await chartCanvas.renderToBuffer(configuration);
    doc.image(chartBuffer, 50, doc.y, { width: 500 });
    doc.moveDown(10);
  }

  // Footer
  useRegular();
  doc.fontSize(9);
  doc.text(`Báo cáo được tạo lúc: ${formatDate(new Date())}`, 50, doc.page.height - 50, {
    align: "center",
  });

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

  const filename = month
    ? `Expense_Report_${year}_${month}.pdf`
    : `Expense_Report_${year}.pdf`;

  const { doc, useRegular, useBold } = createReportDoc(res, filename);

  // Title
  useBold();
  doc.fontSize(20).text("BÁO CÁO CHI PHÍ", { align: "center" });
  doc.moveDown(0.5);

  const period = month ? `Tháng ${month}/${year}` : `Năm ${year}`;
  useRegular();
  doc.fontSize(12).text(period, { align: "center" });
  doc.moveDown(2);

  // Summary
  useBold();
  doc.fontSize(14).text("TỔNG QUAN");
  doc.moveDown(0.5);

  useRegular();
  doc.fontSize(11);
  doc.text(`Tổng chi phí: ${formatCurrency(reportData.summary.totalExpense)}`);
  doc.text(`Chi phí thuốc: ${formatCurrency(reportData.summary.medicineExpense)} (${reportData.summary.medicinePercentage.toFixed(1)}%)`);
  doc.text(`Chi phí lương: ${formatCurrency(reportData.summary.salaryExpense)} (${reportData.summary.salaryPercentage.toFixed(1)}%)`);
  doc.moveDown(2);

  // Pie chart for expense breakdown
  const chartCanvas = new ChartJSNodeCanvas({ width: 400, height: 400 });
  const configuration = {
    type: "pie" as const,
    data: {
      labels: ["Chi phí thuốc", "Chi phí lương"],
      datasets: [
        {
          data: [reportData.summary.medicineExpense, reportData.summary.salaryExpense],
          backgroundColor: ["rgba(255, 99, 132, 0.8)", "rgba(54, 162, 235, 0.8)"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom" as const,
        },
        title: {
          display: true,
          text: "Cơ cấu chi phí",
        },
      },
    },
  };

  const chartBuffer = await chartCanvas.renderToBuffer(configuration);
  doc.image(chartBuffer, 100, doc.y, { width: 400 });
  doc.moveDown(15);

  // Footer
  useRegular();
  doc.fontSize(9);
  doc.text(`Báo cáo được tạo lúc: ${formatDate(new Date())}`, 50, doc.page.height - 50, {
    align: "center",
  });

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

  const filename = month
    ? `Profit_Report_${year}_${month}.pdf`
    : `Profit_Report_${year}.pdf`;

  const { doc, useRegular, useBold } = createReportDoc(res, filename);

  // Title
  useBold();
  doc.fontSize(20).text("BÁO CÁO LỢI NHUẬN", { align: "center" });
  doc.moveDown(0.5);

  const period = month ? `Tháng ${month}/${year}` : `Năm ${year}`;
  useRegular();
  doc.fontSize(12).text(period, { align: "center" });
  doc.moveDown(2);

  // Summary
  useBold();
  doc.fontSize(14).text("TỔNG QUAN");
  doc.moveDown(0.5);

  useRegular();
  doc.fontSize(11);
  doc.text(`Doanh thu: ${formatCurrency(reportData.summary.totalRevenue)}`);
  doc.text(`Chi phí: ${formatCurrency(reportData.summary.totalExpense)}`);
  doc.text(`Lợi nhuận: ${formatCurrency(reportData.summary.totalProfit)}`);
  doc.text(`Tỷ suất lợi nhuận: ${reportData.summary.profitMargin}%`);
  doc.moveDown(2);

  // Bar chart for profit comparison
  const chartCanvas = new ChartJSNodeCanvas({ width: 500, height: 300 });
  const configuration = {
    type: "bar" as const,
    data: {
      labels: ["Doanh thu", "Chi phí", "Lợi nhuận"],
      datasets: [
        {
          label: "VNĐ",
          data: [
            reportData.summary.totalRevenue,
            reportData.summary.totalExpense,
            reportData.summary.totalProfit,
          ],
          backgroundColor: [
            "rgba(75, 192, 192, 0.8)",
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: "Phân tích lợi nhuận",
        },
      },
    },
  };

  const chartBuffer = await chartCanvas.renderToBuffer(configuration);
  doc.image(chartBuffer, 50, doc.y, { width: 500 });
  doc.moveDown(10);

  // Footer
  useRegular();
  doc.fontSize(9);
  doc.text(`Báo cáo được tạo lúc: ${formatDate(new Date())}`, 50, doc.page.height - 50, {
    align: "center",
  });

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

  const filename = month
    ? `Top_Medicines_${year}_${month}.pdf`
    : `Top_Medicines_${year}.pdf`;

  const { doc, useRegular, useBold } = createReportDoc(res, filename);

  // Title
  useBold();
  doc.fontSize(20).text(`TOP ${limit} THUỐC DÙNG NHIỀU NHẤT`, { align: "center" });
  doc.moveDown(0.5);

  const period = month ? `Tháng ${month}/${year}` : `Năm ${year}`;
  useRegular();
  doc.fontSize(12).text(period, { align: "center" });
  doc.moveDown(2);

  // Table
  useBold();
  doc.fontSize(11);
  doc.text("STT   Tên thuốc                    Số lượng    Số đơn    Doanh thu ước tính");
  doc.moveDown(0.3);
  doc.strokeColor("#000000").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.3);

  useRegular();
  doc.fontSize(10);
  reportData.topMedicines.forEach((med: any, index: number) => {
    const row = `${(index + 1).toString().padEnd(6)}${med.medicine.name.substring(0, 25).padEnd(28)}${med.totalQuantity.toString().padEnd(12)}${med.prescriptionCount.toString().padEnd(10)}${formatCurrency(med.estimatedRevenue)}`;
    doc.text(row);
  });

  doc.moveDown(2);

  // Bar chart
  if (reportData.topMedicines.length > 0) {
    const chartCanvas = new ChartJSNodeCanvas({ width: 500, height: 300 });
    const configuration = {
      type: "bar" as const,
      data: {
        labels: reportData.topMedicines.map((m: any) => m.medicine.name.substring(0, 15)),
        datasets: [
          {
            label: "Số lượng kê đơn",
            data: reportData.topMedicines.map((m: any) => m.totalQuantity),
            backgroundColor: "rgba(54, 162, 235, 0.8)",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Số lượng kê đơn theo thuốc",
          },
        },
      },
    };

    const chartBuffer = await chartCanvas.renderToBuffer(configuration);
    doc.image(chartBuffer, 50, doc.y, { width: 500 });
  }

  // Footer
  useRegular();
  doc.fontSize(9);
  doc.text(`Báo cáo được tạo lúc: ${formatDate(new Date())}`, 50, doc.page.height - 50, {
    align: "center",
  });

  doc.end();
};

/**
 * Generate Patients by Gender Report PDF
 */
export const generatePatientsByGenderReportPDF = async (res: Response) => {
  const reportData = await getPatientsByGenderReportService();

  const filename = `Patients_By_Gender_Report.pdf`;

  const { doc, useRegular, useBold } = createReportDoc(res, filename);

  // Title
  useBold();
  doc.fontSize(20).text("BÁO CÁO BỆNH NHÂN THEO GIỚI TÍNH", { align: "center" });
  doc.moveDown(2);

  // Summary
  useBold();
  doc.fontSize(14).text("TỔNG QUAN");
  doc.moveDown(0.5);

  useRegular();
  doc.fontSize(11);
  doc.text(`Tổng số bệnh nhân: ${reportData.total}`);
  doc.moveDown(1);

  reportData.byGender.forEach((item: any) => {
    doc.text(`${item.gender}: ${item.count} (${item.percentage.toFixed(1)}%) - Tuổi TB: ${item.averageAge || "N/A"}`);
  });
  doc.moveDown(2);

  // Pie chart
  const chartCanvas = new ChartJSNodeCanvas({ width: 400, height: 400 });
  const configuration = {
    type: "pie" as const,
    data: {
      labels: reportData.byGender.map((g: any) => g.gender),
      datasets: [
        {
          data: reportData.byGender.map((g: any) => g.count),
          backgroundColor: [
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 99, 132, 0.8)",
            "rgba(255, 206, 86, 0.8)",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom" as const,
        },
        title: {
          display: true,
          text: "Phân bố theo giới tính",
        },
      },
    },
  };

  const chartBuffer = await chartCanvas.renderToBuffer(configuration);
  doc.image(chartBuffer, 100, doc.y, { width: 400 });

  // Footer
  useRegular();
  doc.fontSize(9);
  doc.text(`Báo cáo được tạo lúc: ${formatDate(new Date())}`, 50, doc.page.height - 50, {
    align: "center",
  });

  doc.end();
};

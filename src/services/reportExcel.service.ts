import { Response } from "express";
import { setupExcelResponse } from "../utils/excelGenerator";
import { getRevenueReportService, getExpenseReportService, getProfitReportService } from "./report.service";

/**
 * Generate Revenue Report Excel
 */
export const generateRevenueReportExcel = async (
  res: Response,
  filters: { year: number; month?: number }
) => {
  const reportData = await getRevenueReportService(filters);
  const { year, month } = filters;

  const filename = month
    ? `Revenue_Report_${year}_${month}.xlsx`
    : `Revenue_Report_${year}.xlsx`;

  const workbook = setupExcelResponse(res, filename);
  const sheet = workbook.addWorksheet('Revenue Report');

  // Title
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'BÁO CÁO DOANH THU';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:D2');
  const periodCell = sheet.getCell('A2');
  periodCell.value = month ? `Tháng ${month}/${year}` : `Năm ${year}`;
  periodCell.alignment = { horizontal: 'center' };

  sheet.addRow([]);

  // Summary Table
  sheet.addRow(['TỔNG QUAN']).font = { bold: true };
  sheet.addRow(['Chỉ số', 'Giá trị']);
  sheet.addRow(['Tổng doanh thu', reportData.summary.totalRevenue]);
  sheet.addRow(['Đã thực thu', reportData.summary.collectedRevenue]);
  sheet.addRow(['Còn nợ', reportData.summary.uncollectedRevenue]);
  sheet.addRow(['Số hóa đơn', reportData.summary.totalInvoices]);
  sheet.addRow(['Trung bình hóa đơn', reportData.summary.averageInvoiceValue]);

  // Format currency for summary
  const summaryRows = [6, 7, 8, 10];
  summaryRows.forEach(rowIdx => {
    sheet.getRow(rowIdx).getCell(2).numFmt = '#,##0 "₫"';
  });

  sheet.addRow([]);

  // Detailed Data Table
  sheet.addRow(['CHI TIẾT THEO THỜI GIAN']).font = { bold: true };
  const headerRow = sheet.addRow(['Thời gian', 'Doanh thu (VNĐ)']);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  reportData.overTime.forEach((item: any) => {
    const row = sheet.addRow([item.period, item.revenue]);
    row.getCell(2).numFmt = '#,##0 "₫"';
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Adjust column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 20;

  await workbook.xlsx.write(res);
  res.end();
};

/**
 * Generate Expense Report Excel
 */
export const generateExpenseReportExcel = async (
  res: Response,
  filters: { year: number; month?: number }
) => {
  const reportData = await getExpenseReportService(filters);
  const { year, month } = filters;

  const filename = month
    ? `Expense_Report_${year}_${month}.xlsx`
    : `Expense_Report_${year}.xlsx`;

  const workbook = setupExcelResponse(res, filename);
  const sheet = workbook.addWorksheet('Expense Report');

  // Title
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'BÁO CÁO CHI PHÍ';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:D2');
  const periodCell = sheet.getCell('A2');
  periodCell.value = month ? `Tháng ${month}/${year}` : `Năm ${year}`;
  periodCell.alignment = { horizontal: 'center' };

  sheet.addRow([]);

  // Summary Table
  sheet.addRow(['TỔNG QUAN']).font = { bold: true };
  sheet.addRow(['Chỉ số', 'Giá trị']);
  sheet.addRow(['Tổng chi phí', reportData.summary.totalExpense]);
  sheet.addRow(['Chi phí thuốc', reportData.summary.medicineExpense]);
  sheet.addRow(['Chi phí lương', reportData.summary.salaryExpense]);

  // Format currency for summary
  [6, 7, 8].forEach(rowIdx => {
    sheet.getRow(rowIdx).getCell(2).numFmt = '#,##0 "₫"';
  });

  sheet.addRow([]);

  // Detailed Salary by Role
  sheet.addRow(['CHI TIẾT LƯƠNG THEO VAI TRÒ']).font = { bold: true };
  const headerRow = sheet.addRow(['Vai trò', 'Số nhân viên', 'Tổng lương', 'Lương trung bình']);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  reportData.salaryByRole.forEach((item: any) => {
    const avgSalary = item.count > 0 ? item.totalSalary / item.count : 0;
    const row = sheet.addRow([item.role, item.count, item.totalSalary, avgSalary]);
    row.getCell(3).numFmt = '#,##0 "₫"';
    row.getCell(4).numFmt = '#,##0 "₫"';
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });
  });

  // Adjust column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 15;
  sheet.getColumn(3).width = 20;
  sheet.getColumn(4).width = 20;

  await workbook.xlsx.write(res);
  res.end();
};

/**
 * Generate Profit Report Excel
 */
export const generateProfitReportExcel = async (
  res: Response,
  filters: { year: number; month?: number }
) => {
  const reportData = await getProfitReportService(filters);
  const { year, month } = filters;

  const filename = month
    ? `Profit_Report_${year}_${month}.xlsx`
    : `Profit_Report_${year}.xlsx`;

  const workbook = setupExcelResponse(res, filename);
  const sheet = workbook.addWorksheet('Profit Report');

  // Title
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'BÁO CÁO LỢI NHUẬN';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:D2');
  const periodCell = sheet.getCell('A2');
  periodCell.value = month ? `Tháng ${month}/${year}` : `Năm ${year}`;
  periodCell.alignment = { horizontal: 'center' };

  sheet.addRow([]);

  // Summary Table
  sheet.addRow(['TỔNG QUAN']).font = { bold: true };
  sheet.addRow(['Chỉ số', 'Giá trị']);
  sheet.addRow(['Tổng doanh thu', reportData.summary.totalRevenue]);
  sheet.addRow(['Tổng chi phí', reportData.summary.totalExpense]);
  sheet.addRow(['Lợi nhuận', reportData.summary.totalProfit]);
  sheet.addRow(['Tỷ suất lợi nhuận', `${reportData.summary.profitMargin}%`]);

  // Format currency for summary
  [6, 7, 8].forEach(rowIdx => {
    sheet.getRow(rowIdx).getCell(2).numFmt = '#,##0 "₫"';
  });

  sheet.addRow([]);

  // Detailed Data Table
  if (reportData.overTime && reportData.overTime.length > 0) {
    sheet.addRow(['CHI TIẾT BIẾN ĐỘNG']).font = { bold: true };
    const headerRow = sheet.addRow(['Thời gian', 'Doanh thu (VNĐ)', 'Chi phí (VNĐ)', 'Lợi nhuận (VNĐ)']);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    reportData.overTime.forEach((item: any) => {
      const row = sheet.addRow([item.period, item.revenue, item.expense, item.profit]);
      [2, 3, 4].forEach(colIdx => {
        row.getCell(colIdx).numFmt = '#,##0 "₫"';
      });
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });
    });
  }

  // Adjust column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 20;
  sheet.getColumn(3).width = 20;
  sheet.getColumn(4).width = 20;

  await workbook.xlsx.write(res);
  res.end();
};

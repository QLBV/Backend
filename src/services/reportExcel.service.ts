import { Response } from "express";
import { setupExcelResponse } from "../utils/excelGenerator";
import { getRevenueReportService, getExpenseReportService, getProfitReportService, getAppointmentReportService, getPatientStatisticsService } from "./report.service";

const CLIEN_INFO = {
  name: "PHÒNG KHÁM ĐA KHOA QUỐC TẾ QLBV",
  address: "123 Đường ABC, Quận X, TP. Hồ Chí Minh",
  phone: "Hotline: 1900 xxxx",
};

const STYLES = {
  title: { font: { bold: true, size: 20, color: { argb: 'FF1E40AF' } }, alignment: { horizontal: 'center' as const } },
  subtitle: { font: { bold: true, size: 12, color: { argb: 'FF64748B' } }, alignment: { horizontal: 'center' as const } },
  clinicName: { font: { bold: true, size: 14, color: { argb: 'FF0F172A' } } },
  clinicInfo: { font: { size: 10, color: { argb: 'FF64748B' } } },
  sectionHeader: { 
    font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }, 
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1E40AF' } },
    alignment: { vertical: 'middle' as const, horizontal: 'center' as const }
  },
  tableHeader: {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF3B82F6' } },
    alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
    border: { top: { style: 'thin' as const }, left: { style: 'thin' as const }, bottom: { style: 'thin' as const }, right: { style: 'thin' as const } }
  },
  cellNormal: {
    border: { top: { style: 'thin' as const }, left: { style: 'thin' as const }, bottom: { style: 'thin' as const }, right: { style: 'thin' as const } },
    alignment: { vertical: 'middle' as const, horizontal: 'left' as const }
  },
  cellNumber: {
    numFmt: '#,##0 "₫"',
    border: { top: { style: 'thin' as const }, left: { style: 'thin' as const }, bottom: { style: 'thin' as const }, right: { style: 'thin' as const } },
    alignment: { vertical: 'middle' as const, horizontal: 'right' as const }
  }
};

const addClinicHeader = (sheet: any) => {
  sheet.mergeCells('A1:C1');
  sheet.getCell('A1').value = CLIEN_INFO.name;
  sheet.getCell('A1').style = STYLES.clinicName;
  
  sheet.mergeCells('A2:C2');
  sheet.getCell('A2').value = CLIEN_INFO.address;
  sheet.getCell('A2').style = STYLES.clinicInfo;
  
  sheet.mergeCells('A3:C3');
  sheet.getCell('A3').value = CLIEN_INFO.phone;
  sheet.getCell('A3').style = STYLES.clinicInfo;
  
  sheet.addRow([]);
};

/**
 * Generate Revenue Report Excel
 */
export const generateRevenueReportExcel = async (
  res: Response,
  filters: { year: number; month?: number }
) => {
  const reportData = await getRevenueReportService(filters);
  const { year, month } = filters;
  const filename = month ? `Revenue_Report_${year}_${month}.xlsx` : `Revenue_Report_${year}.xlsx`;

  const workbook = setupExcelResponse(res, filename);
  const sheet = workbook.addWorksheet('Revenue Report');

  addClinicHeader(sheet);

  // Title
  sheet.mergeCells('A5:E5');
  const titleCell = sheet.getCell('A5');
  titleCell.value = 'BÁO CÁO DOANH THU';
  titleCell.style = STYLES.title;

  sheet.mergeCells('A6:E6');
  const periodCell = sheet.getCell('A6');
  periodCell.value = month ? `Tháng ${month} năm ${year}` : `Năm ${year}`;
  periodCell.style = STYLES.subtitle;

  sheet.addRow([]);
  sheet.addRow([]);

  // Summary Table
  sheet.mergeCells('A9:B9');
  const sumHeader = sheet.getCell('A9');
  sumHeader.value = 'TỔNG QUAN CHỈ SỐ';
  sumHeader.style = STYLES.sectionHeader;
  
  const summaryItems = [
    ['Tổng doanh thu (Dự kiến)', reportData.summary.totalRevenue],
    ['Đã thực thu (Tiền mặt/Chuyển khoản)', reportData.summary.collectedRevenue],
    ['Công nợ khách hàng', reportData.summary.uncollectedRevenue],
    ['Tổng số hóa đơn phát hành', reportData.summary.totalInvoices],
    ['Giá trị trung bình mỗi hóa đơn', reportData.summary.averageInvoiceValue]
  ];

  summaryItems.forEach((item, index) => {
    const row = sheet.addRow(item);
    row.getCell(1).style = STYLES.cellNormal;
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    row.getCell(2).style = STYLES.cellNumber;
    if (index === 3) row.getCell(2).numFmt = '#,##0'; // So hoa don khong phai VND
  });

  sheet.addRow([]);
  sheet.addRow([]);

  // Detailed Data Table
  sheet.mergeCells('A17:B17');
  const detailHeader = sheet.getCell('A17');
  detailHeader.value = 'CHI TIẾT DOANH THU THEO THỜI GIAN';
  detailHeader.style = STYLES.sectionHeader;

  const tableHeader = sheet.addRow(['Thời gian', 'Doanh thu (VNĐ)']);
  tableHeader.eachCell(cell => cell.style = STYLES.tableHeader);

  reportData.overTime.forEach((item: any, idx: number) => {
    const periodLabel = month ? `Ngày ${item.period.split('-').pop()}` : `Tháng ${item.period.split('-').pop()}`;
    const row = sheet.addRow([periodLabel, item.revenue]);
    row.getCell(1).style = STYLES.cellNormal;
    row.getCell(2).style = STYLES.cellNumber;
    
    // Zebra striping
    if (idx % 2 === 0) {
      row.eachCell(cell => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } });
    }
  });

  sheet.getColumn(1).width = 35;
  sheet.getColumn(2).width = 25;

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
  const filename = month ? `Expense_Report_${year}_${month}.xlsx` : `Expense_Report_${year}.xlsx`;

  const workbook = setupExcelResponse(res, filename);
  const sheet = workbook.addWorksheet('Expense Report');

  addClinicHeader(sheet);

  sheet.mergeCells('A5:D5');
  sheet.getCell('A5').value = 'BÁO CÁO CHI PHÍ';
  sheet.getCell('A5').style = STYLES.title;

  sheet.mergeCells('A6:D6');
  sheet.getCell('A6').value = month ? `Tháng ${month} năm ${year}` : `Năm ${year}`;
  sheet.getCell('A6').style = STYLES.subtitle;

  sheet.addRow([]);
  sheet.addRow([]);

  sheet.mergeCells('A9:B9');
  const sumHeader = sheet.getCell('A9');
  sumHeader.value = 'TỔNG QUAN CHI PHÍ';
  sumHeader.style = STYLES.sectionHeader;

  const summary = [
    ['Tổng chi phí vận hành', reportData.summary.totalExpense],
    ['Chi phí nhập thuốc/vật tư', reportData.summary.medicineExpense],
    ['Tổng quỹ lương nhân sự', reportData.summary.salaryExpense]
  ];

  summary.forEach(item => {
    const row = sheet.addRow(item);
    row.getCell(1).style = STYLES.cellNormal;
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    row.getCell(2).style = STYLES.cellNumber;
  });

  sheet.addRow([]);
  sheet.addRow([]);

  sheet.mergeCells('A15:D15');
  const detailHeader = sheet.getCell('A15');
  detailHeader.value = 'CHI TIẾT LƯƠNG THEO VỊ TRÍ';
  detailHeader.style = STYLES.sectionHeader;

  const tableHeader = sheet.addRow(['Vị trí/Vai trò', 'Số nhân viên', 'Tổng lương', 'Lương trung bình']);
  tableHeader.eachCell(cell => cell.style = STYLES.tableHeader);

  reportData.salaryByRole.forEach((item: any, idx: number) => {
    const avgSalary = item.count > 0 ? item.totalSalary / item.count : 0;
    const row = sheet.addRow([item.role, item.count, item.totalSalary, avgSalary]);
    row.getCell(1).style = STYLES.cellNormal;
    row.getCell(2).style = STYLES.cellNormal;
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(3).style = STYLES.cellNumber;
    row.getCell(4).style = STYLES.cellNumber;
    
    if (idx % 2 === 0) {
      row.eachCell(cell => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } });
    }
  });

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
  const filename = month ? `Profit_Report_${year}_${month}.xlsx` : `Profit_Report_${year}.xlsx`;

  const workbook = setupExcelResponse(res, filename);
  const sheet = workbook.addWorksheet('Profit Report');

  addClinicHeader(sheet);

  sheet.mergeCells('A5:D5');
  sheet.getCell('A5').value = 'BÁO CÁO LỢI NHUẬN & HIỆU QUẢ';
  sheet.getCell('A5').style = STYLES.title;

  sheet.mergeCells('A6:D6');
  sheet.getCell('A6').value = month ? `Tháng ${month} năm ${year}` : `Năm ${year}`;
  sheet.getCell('A6').style = STYLES.subtitle;

  sheet.addRow([]);
  sheet.addRow([]);

  sheet.mergeCells('A9:B9');
  sheet.getCell('A9').value = 'CHỈ SỐ TÀI CHÍNH';
  sheet.getCell('A9').style = STYLES.sectionHeader;

  const summary = [
    ['Tổng doanh thu', reportData.summary.totalRevenue],
    ['Tổng chi phí', reportData.summary.totalExpense],
    ['Lợi nhuận ròng', reportData.summary.totalProfit],
    ['Biên lợi nhuận (%)', reportData.summary.profitMargin / 100] // Format as percentage
  ];

  summary.forEach((item, index) => {
    const row = sheet.addRow(item);
    row.getCell(1).style = STYLES.cellNormal;
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    row.getCell(2).style = STYLES.cellNumber;
    if (index === 3) row.getCell(2).numFmt = '0.00%';
  });

  sheet.addRow([]);
  sheet.addRow([]);

  if (reportData.overTime && reportData.overTime.length > 0) {
    sheet.mergeCells('A16:D16');
    sheet.getCell('A16').value = 'BIẾN ĐỘNG THEO CHU KỲ';
    sheet.getCell('A16').style = STYLES.sectionHeader;

    const tableHeader = sheet.addRow(['Thời gian', 'Doanh thu', 'Chi phí', 'Lợi nhuận']);
    tableHeader.eachCell(cell => cell.style = STYLES.tableHeader);

    reportData.overTime.forEach((item: any, idx: number) => {
      const row = sheet.addRow([item.period, item.revenue, item.expense, item.profit]);
      row.getCell(1).style = STYLES.cellNormal;
      row.getCell(2).style = STYLES.cellNumber;
      row.getCell(3).style = STYLES.cellNumber;
      row.getCell(4).style = STYLES.cellNumber;
      
      if (idx % 2 === 0) {
        row.eachCell(cell => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } });
      }
    });
  }

  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 20;
  sheet.getColumn(3).width = 20;
  sheet.getColumn(4).width = 20;

  await workbook.xlsx.write(res);
  res.end();
};

/**
 * Generate Appointment Report Excel
 */
export const generateAppointmentReportExcel = async (
  res: Response,
  filters: { year: number; month?: number }
) => {
  const reportData = await getAppointmentReportService(filters);
  const { year, month } = filters;
  const filename = month ? `Appointment_Report_${year}_${month}.xlsx` : `Appointment_Report_${year}.xlsx`;

  const workbook = setupExcelResponse(res, filename);
  const sheet = workbook.addWorksheet('Appointment Report');

  addClinicHeader(sheet);

  sheet.mergeCells('A5:D5');
  sheet.getCell('A5').value = 'BÁO CÁO THỐNG KÊ LỊCH HẸN';
  sheet.getCell('A5').style = STYLES.title;

  sheet.mergeCells('A6:D6');
  sheet.getCell('A6').value = month ? `Tháng ${month} năm ${year}` : `Năm ${year}`;
  sheet.getCell('A6').style = STYLES.subtitle;

  sheet.addRow([]);
  sheet.addRow([]);

  sheet.mergeCells('A9:B9');
  sheet.getCell('A9').value = 'TỔNG QUAN LỊCH HẸN';
  sheet.getCell('A9').style = STYLES.sectionHeader;

  const summary = [
    ['Tổng số lịch hẹn', reportData.summary.totalAppointments],
    ['Lịch hẹn hoàn thành', reportData.summary.completedAppointments],
    ['Lịch hẹn bị hủy', reportData.summary.cancelledAppointments],
    ['Khách không đến (No-show)', reportData.summary.noShowAppointments],
    ['Tỷ lệ hoàn thành (%)', reportData.summary.completionRate / 100],
    ['Trung bình lịch hẹn/ngày', reportData.summary.averagePerDay]
  ];

  summary.forEach((item, index) => {
    const row = sheet.addRow(item);
    row.getCell(1).style = STYLES.cellNormal;
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    row.getCell(2).style = STYLES.cellNormal;
    row.getCell(2).alignment = { horizontal: 'right' };
    if (index === 4) row.getCell(2).numFmt = '0.0%';
    if (index === 5) row.getCell(2).numFmt = '#,##0.0';
  });

  sheet.addRow([]);
  sheet.addRow([]);

  sheet.mergeCells('A18:D18');
  sheet.getCell('A18').value = 'CHI TIẾT THEO BÁC SĨ';
  sheet.getCell('A18').style = STYLES.sectionHeader;

  const tableHeader = sheet.addRow(['Tên bác sĩ', 'Số lượng lịch hẹn', 'Tỷ lệ (%)']);
  tableHeader.eachCell(cell => cell.style = STYLES.tableHeader);

  reportData.byDoctor.forEach((item: any, idx: number) => {
    const row = sheet.addRow([item.doctorName, item.count, item.percentage / 100]);
    row.getCell(1).style = STYLES.cellNormal;
    row.getCell(2).style = STYLES.cellNormal;
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(3).style = STYLES.cellNormal;
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(3).numFmt = '0.0%';
    
    if (idx % 2 === 0) {
      row.eachCell(cell => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } });
    }
  });

  sheet.getColumn(1).width = 35;
  sheet.getColumn(2).width = 25;
  sheet.getColumn(3).width = 15;

  await workbook.xlsx.write(res);
  res.end();
};

/**
 * Generate Patient Statistics Excel
 */
export const generatePatientStatisticsExcel = async (
  res: Response,
  filters: { year: number; month?: number }
) => {
  const { year, month } = filters;
  const reportData = await getPatientStatisticsService(year, month);
  const filename = month ? `Patient_Statistics_${year}_${month}.xlsx` : `Patient_Statistics_${year}.xlsx`;

  const workbook = setupExcelResponse(res, filename);
  const sheet = workbook.addWorksheet('Patient Statistics');

  addClinicHeader(sheet);

  sheet.mergeCells('A5:D5');
  sheet.getCell('A5').value = 'BÁO CÁO THỐNG KÊ BỆNH NHÂN';
  sheet.getCell('A5').style = STYLES.title;

  sheet.mergeCells('A6:D6');
  sheet.getCell('A6').value = month ? `Tháng ${month} năm ${year}` : `Năm ${year}`;
  sheet.getCell('A6').style = STYLES.subtitle;

  sheet.addRow([]);
  sheet.addRow([]);

  sheet.mergeCells('A9:B9');
  sheet.getCell('A9').value = 'TỔNG QUAN CHỈ SỐ';
  sheet.getCell('A9').style = STYLES.sectionHeader;

  const summary = [
    ['Tổng số bệnh nhân (Toàn hệ thống)', reportData.totalPatients],
    ['Bệnh nhân mới (Trong kỳ báo cáo)', reportData.newPatients],
    ['Bệnh nhân đang hoạt động', reportData.activePatients],
    ['Bệnh nhân vắng mặt/Ngừng hoạt động', reportData.inactivePatients]
  ];

  summary.forEach(item => {
    const row = sheet.addRow(item);
    row.getCell(1).style = STYLES.cellNormal;
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    row.getCell(2).style = STYLES.cellNormal;
    row.getCell(2).alignment = { horizontal: 'right' };
    row.getCell(2).numFmt = '#,##0';
  });

  sheet.addRow([]);
  sheet.addRow([]);

  // Gender breakdown
  sheet.mergeCells('A16:D16');
  sheet.getCell('A16').value = 'PHÂN TÍCH THEO GIỚI TÍNH';
  sheet.getCell('A16').style = STYLES.sectionHeader;

  const genderHeader = sheet.addRow(['Giới tính', 'Số lượng', 'Tỷ lệ (%)']);
  genderHeader.eachCell(cell => cell.style = STYLES.tableHeader);

  reportData.patientsByGender.forEach((item: any, idx: number) => {
    const row = sheet.addRow([item.gender, item.count, item.percentage / 100]);
    row.getCell(1).style = STYLES.cellNormal;
    row.getCell(2).style = STYLES.cellNormal;
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(3).style = STYLES.cellNormal;
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(3).numFmt = '0.0%';
    
    if (idx % 2 === 0) {
      row.eachCell(cell => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } });
    }
  });

  sheet.addRow([]);
  sheet.addRow([]);

  // Age range
  sheet.mergeCells('A25:D25');
  sheet.getCell('A25').value = 'PHÂN TÍCH THEO ĐỘ TUỔI';
  sheet.getCell('A25').style = STYLES.sectionHeader;

  const ageHeader = sheet.addRow(['Nhóm tuổi', 'Số lượng bệnh nhân']);
  ageHeader.eachCell(cell => cell.style = STYLES.tableHeader);

  reportData.patientsByAge.forEach((item: any, idx: number) => {
    const row = sheet.addRow([item.ageRange, item.count]);
    row.getCell(1).style = STYLES.cellNormal;
    row.getCell(2).style = STYLES.cellNormal;
    row.getCell(2).alignment = { horizontal: 'center' };
    
    if (idx % 2 === 0) {
      row.eachCell(cell => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } });
    }
  });

  sheet.getColumn(1).width = 35;
  sheet.getColumn(2).width = 25;
  sheet.getColumn(3).width = 15;

  await workbook.xlsx.write(res);
  res.end();
};

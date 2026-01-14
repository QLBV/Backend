import ExcelJS from 'exceljs';
import { Response } from 'express';

export const setupExcelResponse = (res: Response, filename: string) => {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${filename}`
  );

  const workbook = new ExcelJS.Workbook();
  return workbook;
};

export const formatCurrencyExcel = (amount: number) => {
  return amount.toLocaleString('vi-VN');
};

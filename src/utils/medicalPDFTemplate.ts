

import PDFDocument from "pdfkit";
import { formatCurrency, formatDate, formatDateTime } from "./pdfGenerator";
import { setFont, createVietnamesePDF } from "./pdfFontHelper";


export const COLORS = {
  
  primary: "#2E86AB",      
  primaryLight: "#E3F2FD", 
  primaryDark: "#1565C0",  

  
  success: "#4CAF50",      
  warning: "#FF9800",      
  error: "#F44336",        
  info: "#2196F3",         

  
  background: "#FFFFFF",   
  lightGray: "#F5F5F5",    
  mediumGray: "#E0E0E0",   
  darkGray: "#757575",     
  text: "#212121",         
  border: "#BDBDBD",       
};


export const SPACING = {
  pageMargin: 50,
  sectionGap: 20,
  itemGap: 10,
  lineHeight: 1.5,
};

export const LAYOUT = {
  pageWidth: 595.28,  
  pageHeight: 841.89, 
  contentWidth: 495.28, 
};


export const FONTS = {
  sizes: {
    title: 22,
    heading1: 16,
    heading2: 14,
    heading3: 12,
    body: 10,
    small: 9,
    tiny: 8,
  },
};


export interface HeaderInfo {
  clinicName: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
}


export interface PatientInfo {
  fullName: string;
  patientCode: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  idNumber?: string;
}


export interface DoctorInfo {
  fullName: string;
  specialty?: string;
  doctorCode?: string;
  licenseNumber?: string;
}


export function drawMedicalHeader(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string } | null,
  info: HeaderInfo,
  documentTitle: string
): void {
  const startY = SPACING.pageMargin;

  
  setFont(doc, fonts, true);
  doc
    .fontSize(10)
    .fillColor(COLORS.primary)
    .text(info.clinicName, SPACING.pageMargin, startY, {
      width: 250,
      align: "left",
    });

  setFont(doc, fonts, false);
  doc
    .fontSize(8)
    .fillColor(COLORS.text)
    .text(info.address, SPACING.pageMargin, startY + 15, { width: 250 })
    .text(`SĐT: ${info.phone}`, SPACING.pageMargin, startY + 28, { width: 250 });

  
  setFont(doc, fonts, true);
  doc
    .fontSize(9)
    .text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", 300, startY, {
      width: 250,
      align: "center",
    })
    .text("Độc lập - Tự do - Hạnh phúc", 300, startY + 12, {
      width: 250,
      align: "center",
    });

  
  const mottoLineY = startY + 25;
  doc
    .moveTo(375, mottoLineY)
    .lineTo(475, mottoLineY)
    .lineWidth(0.5)
    .strokeColor(COLORS.text)
    .stroke();

  
  doc.y = startY + 50;
  doc
    .moveTo(SPACING.pageMargin, doc.y)
    .lineTo(LAYOUT.pageWidth - SPACING.pageMargin, doc.y)
    .lineWidth(1.5)
    .strokeColor(COLORS.primary)
    .stroke();

  doc.moveDown(2);

  
  setFont(doc, fonts, true);
  doc
    .fontSize(FONTS.sizes.title)
    .fillColor(COLORS.primary)
    .text(documentTitle.toUpperCase(), SPACING.pageMargin, doc.y, {
      width: LAYOUT.contentWidth,
      align: "center",
    });

  doc.moveDown(0.5);

  
  doc.fillColor(COLORS.text);
}


export function drawMedicalFooter(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string } | null,
  pageNumber: number,
  totalPages?: number
): void {
  const footerY = LAYOUT.pageHeight - SPACING.pageMargin + 10;

  
  doc
    .moveTo(SPACING.pageMargin, footerY)
    .lineTo(LAYOUT.pageWidth - SPACING.pageMargin, footerY)
    .lineWidth(0.5)
    .strokeColor(COLORS.border)
    .stroke();

  
  setFont(doc, fonts, false);
  doc
    .fontSize(FONTS.sizes.tiny)
    .fillColor(COLORS.darkGray);

  const pageText = totalPages
    ? `Trang ${pageNumber}/${totalPages}`
    : `Trang ${pageNumber}`;

  doc.text(
    pageText,
    SPACING.pageMargin,
    footerY + 5,
    { width: 200, align: "left" }
  );

  doc.text(
    `In lúc: ${formatDateTime(new Date())}`,
    LAYOUT.pageWidth - SPACING.pageMargin - 200,
    footerY + 5,
    { width: 200, align: "right" }
  );
}


export function drawInfoBox(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string } | null,
  title: string,
  items: { label: string; value: string }[],
  backgroundColor: string = COLORS.lightGray,
  columns: number = 2
): number {
  const startY = doc.y;
  const boxWidth = LAYOUT.contentWidth;

  
  const itemsPerColumn = Math.ceil(items.length / columns);
  const rowHeight = 25; 
  const boxHeight = 40 + itemsPerColumn * rowHeight;

  
  doc
    .rect(SPACING.pageMargin, startY, boxWidth, boxHeight)
    .fillAndStroke(backgroundColor, COLORS.border);

  
  setFont(doc, fonts, true);
  doc
    .fontSize(FONTS.sizes.heading3)
    .fillColor(COLORS.primary)
    .text(title, SPACING.pageMargin + 10, startY + 10);

  
  setFont(doc, fonts, false);
  doc.fontSize(FONTS.sizes.body).fillColor(COLORS.text);

  const columnWidth = (boxWidth - 20) / columns;

  items.forEach((item, index) => {
    const column = Math.floor(index / itemsPerColumn);
    const row = index % itemsPerColumn;

    const x = SPACING.pageMargin + 10 + column * columnWidth;
    const y = startY + 35 + row * rowHeight;

    
    setFont(doc, fonts, true);
    doc.text(`${item.label}:`, x, y, { width: 90 });

    
    setFont(doc, fonts, false);
    doc.text(`${item.value}`, x + 95, y, { 
      width: columnWidth - 100, 
      lineBreak: true 
    });
  });

  doc.y = startY + boxHeight + SPACING.sectionGap;
  doc.fillColor(COLORS.text);

  return doc.y;
}


export function drawSectionHeader(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string } | null,
  title: string,
  icon?: string
): void {
  setFont(doc, fonts, true);
  doc
    .fontSize(FONTS.sizes.heading2)
    .fillColor(COLORS.primary)
    .text((icon ? `${icon} ` : "") + title.toUpperCase(), SPACING.pageMargin, doc.y, {
      width: LAYOUT.contentWidth,
      align: "center"
    });

  doc.moveDown(0.3);

  
  doc
    .moveTo(SPACING.pageMargin, doc.y)
    .lineTo(LAYOUT.pageWidth - SPACING.pageMargin, doc.y)
    .lineWidth(1)
    .strokeColor(COLORS.primaryLight)
    .stroke();

  doc.moveDown(0.5);
  doc.fillColor(COLORS.text);
}


export interface TableColumn {
  header: string;
  width: number;
  align?: "left" | "center" | "right";
  render?: (value: any, row: any) => string;
}

export function drawProfessionalTable(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string } | null,
  columns: TableColumn[],
  data: any[],
  options?: {
    headerBgColor?: string;
    headerTextColor?: string;
    rowHeight?: number;
    alternateRows?: boolean;
  }
): number {
  const opts = {
    headerBgColor: COLORS.primary,
    headerTextColor: "#FFFFFF",
    rowHeight: 25,
    alternateRows: true,
    ...options,
  };

  const startY = doc.y;
  const startX = SPACING.pageMargin;
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  
  doc
    .rect(startX, startY, totalWidth, opts.rowHeight)
    .fill(opts.headerBgColor);

  setFont(doc, fonts, true);
  doc.fontSize(FONTS.sizes.body).fillColor(opts.headerTextColor);

  let currentX = startX;
  columns.forEach((col) => {
    doc.text(
      col.header,
      currentX + 5,
      startY + 8,
      {
        width: col.width - 10,
        align: col.align || "center",
      }
    );
    currentX += col.width;
  });

  let currentY = startY + opts.rowHeight;

  
  setFont(doc, fonts, false);
  doc.fontSize(FONTS.sizes.small).fillColor(COLORS.text);

  data.forEach((row, rowIndex) => {
    currentX = startX;

    
    if (opts.alternateRows && rowIndex % 2 === 0) {
      doc
        .rect(startX, currentY, totalWidth, opts.rowHeight)
        .fill(COLORS.lightGray);
      doc.fillColor(COLORS.text);
    }

    
    columns.forEach((col, colIndex) => {
      const value = col.render
        ? col.render(row[colIndex] || row, row)
        : (row[colIndex] || "");

      doc.text(
        String(value),
        currentX + 5,
        currentY + 8,
        {
          width: col.width - 10,
          align: col.align || "left",
          lineBreak: false,
        }
      );

      
      doc
        .rect(currentX, currentY, col.width, opts.rowHeight)
        .stroke(COLORS.border);

      currentX += col.width;
    });

    currentY += opts.rowHeight;
  });

  doc.y = currentY + SPACING.sectionGap;
  return doc.y;
}


export function drawMedicineCard(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string } | null,
  medicine: {
    index: number;
    name: string;
    quantity: number;
    unit?: string;
    dosage?: string;
    days?: number;
    instruction?: string;
    price?: number;
    totalPrice?: number;
  },
  backgroundColor?: string
): number {
  const startY = doc.y;
  const cardHeight = 85;
  const bgColor = backgroundColor || (medicine.index % 2 === 0 ? "#ffffff" : "#ffffff");

  
  doc
    .rect(SPACING.pageMargin, startY, LAYOUT.contentWidth, cardHeight)
    .fillAndStroke(bgColor, COLORS.border);

  doc.fillColor(COLORS.text);

  
  setFont(doc, fonts, true);
  doc
    .fontSize(FONTS.sizes.heading3)
    .text(
      `${medicine.index}. ${medicine.name}`,
      SPACING.pageMargin + 10,
      startY + 10
    );

  
  setFont(doc, fonts, false);
  doc.fontSize(FONTS.sizes.small);

  let detailY = startY + 28;

  doc.text(
    `Số lượng: ${medicine.quantity} ${medicine.unit || "viên"}`,
    SPACING.pageMargin + 10,
    detailY
  );

  if (medicine.dosage) {
    detailY += 15;
    doc.text(`Liều dùng: ${medicine.dosage}`, SPACING.pageMargin + 10, detailY);
  }

  if (medicine.days) {
    detailY += 15;
    doc.text(`Uống trong: ${medicine.days} ngày`, SPACING.pageMargin + 10, detailY);
  }

  if (medicine.instruction) {
    detailY += 15;
    doc.text(
      `Hướng dẫn: ${medicine.instruction}`,
      SPACING.pageMargin + 10,
      detailY,
      { width: LAYOUT.contentWidth - 20 }
    );
  }

  if (medicine.price !== undefined && medicine.totalPrice !== undefined) {
    detailY += 15;
    doc.text(
      `Đơn giá: ${formatCurrency(medicine.price)} × ${medicine.quantity} = ${formatCurrency(medicine.totalPrice)}`,
      SPACING.pageMargin + 10,
      detailY
    );
  }

  doc.y = startY + cardHeight + SPACING.itemGap;
  return doc.y;
}


export function drawTotalBox(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string } | null,
  label: string,
  amount: number,
  color: string = COLORS.error
): void {
  const boxHeight = 35;

  doc
    .rect(SPACING.pageMargin, doc.y, LAYOUT.contentWidth, boxHeight)
    .fillAndStroke(COLORS.lightGray, COLORS.border);

  setFont(doc, fonts, true);
  doc
    .fontSize(FONTS.sizes.heading2)
    .fillColor(color)
    .text(
      `${label}: ${formatCurrency(amount)}`,
      SPACING.pageMargin + 10,
      doc.y + 10
    );

  doc.fillColor(COLORS.text);
  doc.y += boxHeight + SPACING.sectionGap;
}


export function drawSignatureSection(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string } | null,
  leftTitle: string,
  rightTitle: string,
  date?: Date
): void {
  const currentY = doc.y;

  
  if (date) {
    setFont(doc, fonts, false);
    doc
      .fontSize(FONTS.sizes.body)
      .text(
        `Ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`,
        { align: "center" }
      );
    doc.moveDown(1);
  }

  
  setFont(doc, fonts, true);
  doc.fontSize(FONTS.sizes.body);

  const leftX = SPACING.pageMargin + 80;
  const rightX = LAYOUT.pageWidth - SPACING.pageMargin - 80 - 150;

  doc.text(leftTitle, leftX, doc.y, {
    width: 150,
    align: "center",
  });

  doc.text(rightTitle, rightX, doc.y - 12, {
    width: 150,
    align: "center",
  });

  doc.moveDown(3);

  
  setFont(doc, fonts, false);
  doc.fontSize(FONTS.sizes.small).fillColor(COLORS.darkGray);

  doc.text("(Ký và ghi rõ họ tên)", leftX, doc.y, {
    width: 150,
    align: "center",
  });

  doc.text("(Ký và ghi rõ họ tên)", rightX, doc.y - 12, {
    width: 150,
    align: "center",
  });

  doc.fillColor(COLORS.text);
  doc.moveDown(1);
}


export function drawNoteBox(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string } | null,
  title: string,
  notes: string[],
  icon?: string,
  color?: string
): void {
  drawSectionHeader(doc, fonts, title, icon);

  setFont(doc, fonts, false);
  doc.fontSize(FONTS.sizes.small);

  notes.forEach((note) => {
    doc.text(`• ${note}`, SPACING.pageMargin + 10, doc.y);
    doc.moveDown(0.3);
  });

  doc.moveDown(0.5);
}


export function drawMetadataBox(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string } | null,
  leftLabel: string,
  leftValue: string,
  rightLabel: string,
  rightValue: string
): void {
  const currentY = doc.y;

  setFont(doc, fonts, false);
  doc.fontSize(FONTS.sizes.body);

  
  setFont(doc, fonts, true);
  doc.text(`${leftLabel}:`, SPACING.pageMargin, currentY, { continued: true });
  setFont(doc, fonts, false);
  doc.text(` ${leftValue}`, { continued: false });

  
  setFont(doc, fonts, true);
  const rightX = LAYOUT.pageWidth - SPACING.pageMargin - 200;
  doc.text(
    `${rightLabel}:`,
    rightX,
    currentY,
    { continued: true, width: 100 }
  );
  setFont(doc, fonts, false);
  doc.text(` ${rightValue}`, { continued: false, width: 100 });

  
  doc.y = currentY + 15;
  doc.moveDown(1);
}


export function createMedicalPDF(
  title: string,
  options?: PDFKit.PDFDocumentOptions
): { doc: PDFKit.PDFDocument; fonts: { regular: string; bold: string } | null } {
  return createVietnamesePDF({
    size: "A4",
    margin: SPACING.pageMargin,
    bufferPages: true,
    info: {
      Title: title,
      Author: "Healthcare Management System",
      Subject: "Medical Document",
      ...options?.info,
    },
    ...options,
  });
}
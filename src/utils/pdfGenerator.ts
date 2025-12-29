import PDFDocument from "pdfkit";
import { Response } from "express";

/**
 * Format số tiền VNĐ
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Format ngày tháng
 */
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * Format ngày giờ đầy đủ
 */
export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Tạo PDF header với logo và thông tin công ty
 */
export const addPDFHeader = (
  doc: PDFKit.PDFDocument,
  title: string
): void => {
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("HỆ THỐNG QUẢN LÝ PHÒNG KHÁM", 50, 50, { align: "center" });

  doc
    .fontSize(10)
    .font("Helvetica")
    .text("Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM", 50, 75, {
      align: "center",
    });

  doc.text("Điện thoại: (028) 1234 5678 | Email: info@clinic.com", {
    align: "center",
  });

  doc.moveDown();
  doc
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .stroke();

  doc.moveDown();
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text(title.toUpperCase(), { align: "center" });

  doc.moveDown();
};

/**
 * Tạo PDF footer với số trang
 */
export const addPDFFooter = (doc: PDFKit.PDFDocument, pageNumber: number): void => {
  const bottomY = doc.page.height - 50;

  doc
    .fontSize(8)
    .font("Helvetica")
    .text(
      `Trang ${pageNumber} - In lúc ${formatDateTime(new Date())}`,
      50,
      bottomY,
      {
        align: "center",
        width: doc.page.width - 100,
      }
    );
};

/**
 * Vẽ bảng với borders
 */
export const drawTable = (
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  columnWidths: number[],
  startY: number
): number => {
  const startX = 50;
  const rowHeight = 25;
  let currentY = startY;

  // Header background
  doc.rect(startX, currentY, columnWidths.reduce((a, b) => a + b, 0), rowHeight).fill("#4A90E2");

  // Header text
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#FFFFFF");
  let currentX = startX;
  headers.forEach((header, i) => {
    doc.text(header, currentX + 5, currentY + 7, {
      width: columnWidths[i] - 10,
      align: "center",
    });
    currentX += columnWidths[i];
  });

  currentY += rowHeight;

  // Rows
  doc.fillColor("#000000").font("Helvetica");
  rows.forEach((row, rowIndex) => {
    currentX = startX;

    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc
        .rect(startX, currentY, columnWidths.reduce((a, b) => a + b, 0), rowHeight)
        .fill("#F5F5F5");
    }

    doc.fillColor("#000000");
    row.forEach((cell, i) => {
      doc.fontSize(9).text(cell, currentX + 5, currentY + 7, {
        width: columnWidths[i] - 10,
        align: i === 0 ? "left" : "right",
      });
      currentX += columnWidths[i];
    });

    // Draw row borders
    currentX = startX;
    columnWidths.forEach((width) => {
      doc
        .rect(currentX, currentY, width, rowHeight)
        .stroke("#CCCCCC");
      currentX += width;
    });

    currentY += rowHeight;
  });

  return currentY;
};

/**
 * Setup PDF response headers
 */
export const setupPDFResponse = (
  res: Response,
  filename: string
): PDFKit.PDFDocument => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    info: {
      Title: filename,
      Author: "Healthcare System",
    },
  });

  doc.pipe(res);
  return doc;
};

/**
 * Generate prescription PDF as buffer
 */
export const generatePrescriptionPDF = async (pdfData: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `Prescription ${pdfData.prescriptionCode}`,
        Author: "Healthcare System",
      },
    });

    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Header
    addPDFHeader(doc, "ĐƠN THUỐC");

    // Prescription info
    doc.fontSize(11).font("Helvetica");
    doc.text(`Mã đơn thuốc: ${pdfData.prescriptionCode}`, 50, doc.y, {
      continued: true,
    });
    doc.text(`Ngày kê: ${formatDate(pdfData.createdAt)}`, { align: "right" });

    doc.moveDown(1.5);

    // Patient info
    doc.fontSize(12).font("Helvetica-Bold").text("THÔNG TIN BỆNH NHÂN", 50, doc.y);
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    doc.text(`Họ tên: ${pdfData.patient.fullName}`, 50, doc.y);
    doc.text(`Mã BN: ${pdfData.patient.patientCode}`);
    if (pdfData.patient.dateOfBirth) {
      doc.text(`Ngày sinh: ${formatDate(pdfData.patient.dateOfBirth)}`);
    }
    if (pdfData.patient.phoneNumber) {
      doc.text(`Điện thoại: ${pdfData.patient.phoneNumber}`);
    }

    doc.moveDown(1);

    // Doctor info
    doc.fontSize(12).font("Helvetica-Bold").text("BÁC SĨ KÊ ĐƠN", 50, doc.y);
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    doc.text(`Bác sĩ: ${pdfData.doctor.fullName}`, 50, doc.y);
    if (pdfData.doctor.specialty) {
      doc.text(`Chuyên khoa: ${pdfData.doctor.specialty}`);
    }

    doc.moveDown(1);

    // Diagnosis
    if (pdfData.diagnosis) {
      doc.fontSize(12).font("Helvetica-Bold").text("CHẨN ĐOÁN", 50, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").text(pdfData.diagnosis, 50, doc.y);
      doc.moveDown(1);
    }

    // Medicine details
    doc.fontSize(12).font("Helvetica-Bold").text("CHI TIẾT ĐƠN THUỐC", 50, doc.y);
    doc.moveDown(0.5);

    // Medicine table
    if (pdfData.medicines && pdfData.medicines.length > 0) {
      pdfData.medicines.forEach((medicine: any, index: number) => {
        doc.fontSize(10).font("Helvetica-Bold");
        doc.text(`${index + 1}. ${medicine.medicineName}`, 50, doc.y);

        doc.fontSize(9).font("Helvetica");
        doc.text(`   Số lượng: ${medicine.quantity} ${medicine.unit || "viên"}`, 60, doc.y);

        if (medicine.dosageMorning || medicine.dosageAfternoon || medicine.dosageEvening) {
          const dosage = [];
          if (medicine.dosageMorning > 0) dosage.push(`Sáng: ${medicine.dosageMorning}`);
          if (medicine.dosageAfternoon > 0) dosage.push(`Trưa: ${medicine.dosageAfternoon}`);
          if (medicine.dosageEvening > 0) dosage.push(`Tối: ${medicine.dosageEvening}`);
          doc.text(`   Liều dùng: ${dosage.join(", ")}`, 60, doc.y);
        }

        if (medicine.instruction) {
          doc.text(`   Hướng dẫn: ${medicine.instruction}`, 60, doc.y);
        }

        doc.moveDown(0.5);
      });
    }

    doc.moveDown(1);

    // Total amount
    if (pdfData.totalAmount > 0) {
      doc.fontSize(11).font("Helvetica-Bold");
      doc.text(`TỔNG TIỀN: ${formatCurrency(pdfData.totalAmount)}`, 50, doc.y);
      doc.moveDown(1);
    }

    // Note
    if (pdfData.note) {
      doc.fontSize(10).font("Helvetica-Bold").text("Ghi chú:", 50, doc.y);
      doc.font("Helvetica").text(pdfData.note, 50, doc.y);
      doc.moveDown(1);
    }

    doc.moveDown(2);

    // Signature section
    const signatureY = doc.y;
    doc.fontSize(10).font("Helvetica");

    doc.text("Bệnh nhân/Người nhà", 80, signatureY, {
      align: "center",
      width: 150,
    });
    doc.text("Bác sĩ kê đơn", 370, signatureY, {
      align: "center",
      width: 150,
    });

    doc.moveDown(3);

    doc.fontSize(9).font("Helvetica-Oblique");
    doc.text("(Ký và ghi rõ họ tên)", 80, doc.y, {
      align: "center",
      width: 150,
    });

    doc.text("(Ký và ghi rõ họ tên)", 370, doc.y - 10, {
      align: "center",
      width: 150,
    });

    // Footer
    addPDFFooter(doc, 1);

    // Finalize
    doc.end();
  });
};
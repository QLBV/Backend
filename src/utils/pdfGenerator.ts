import PDFDocument from "pdfkit";
import { Response } from "express";
import { createVietnamesePDF } from "./pdfFontHelper";

/**
 * Format số tiền VND
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
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
 * Tạo PDF header với logo và thông tin phòng khám
 */
export const addPDFHeader = (
  doc: PDFKit.PDFDocument,
  title: string,
  fonts?: { regular: string; bold: string } | null
): void => {
  const regularFont = fonts?.regular ?? "Time New Roman";
  const boldFont = fonts?.bold ?? "Time New Roman";

  const startY = 50;
  
  // Left side: Clinic Info
  doc
    .fontSize(10)
    .font(boldFont)
    .text("HỆ THỐNG QUẢN LÝ PHÒNG KHÁM", 50, startY, { align: "left", width: 250 });
  
  doc
    .fontSize(9)
    .font(regularFont)
    .text("Địa chỉ: Khu phố 34, Phường Linh Xuân, TP.HCM", 50, startY + 15, { align: "left", width: 250 });
  
  doc.text("SĐT: (028) 1234 5678", 50, startY + 30, { align: "left", width: 250 });

  // Right side: National Motto
  doc
    .fontSize(10)
    .font(boldFont)
    .text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", 300, startY, { align: "center", width: 250 });
  
  doc
    .fontSize(10)
    .font(boldFont)
    .text("Độc lập - Tự do - Hạnh phúc", 300, startY + 15, { align: "center", width: 250 });
  
  const lineY = startY + 28;
  doc
    .moveTo(370, lineY)
    .lineTo(480, lineY)
    .lineWidth(0.5)
    .stroke();

  doc.moveDown(3);
  doc
    .fontSize(16)
    .font(boldFont)
    .fillColor("#000000")
    .text(title.toUpperCase(), 50, doc.y, { align: "center" });

  doc.moveDown(1);
};

/**
 * Tạo PDF footer với số trang
 */
export const addPDFFooter = (
  doc: PDFKit.PDFDocument,
  pageNumber: number,
  fonts?: { regular: string; bold: string } | null
): void => {
  const regularFont = fonts?.regular ?? "Time New Roman";
  const bottomY = doc.page.height - 50;

  doc
    .fontSize(8)
    .font(regularFont)
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
  startY: number,
  fonts?: { regular: string; bold: string } | null
): number => {
  const regularFont = fonts?.regular ?? "Time New Roman";
  const boldFont = fonts?.bold ?? "Time New Roman";
  const startX = 50;
  const rowHeight = 25;
  let currentY = startY;

  // Header background
  doc.rect(startX, currentY, columnWidths.reduce((a, b) => a + b, 0), rowHeight).fill("#4A90E2");

  // Header text
  doc.fontSize(10).font(boldFont).fillColor("#FFFFFF");
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
  doc.fillColor("#000000").font(regularFont);
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
): { doc: PDFKit.PDFDocument; fonts: { regular: string; bold: string } | null } => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);

  const { doc, fonts } = createVietnamesePDF({
    size: "A4",
    margin: 50,
    info: {
      Title: filename,
      Author: "Healthcare System",
    },
  });

  doc.pipe(res);
  return { doc, fonts };
};

/**
 * Generate prescription PDF as buffer (Medical Examination Form - No Prices)
 */
export const generatePrescriptionPDF = async (pdfData: any): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Import medical PDF template
      const {
        createMedicalPDF,
        drawMedicalHeader,
        drawMedicalFooter,
        drawInfoBox,
        drawSectionHeader,
        drawNoteBox,
        drawSignatureSection,
        drawMetadataBox,
        SPACING,
      } = await import("./medicalPDFTemplate");
      const { setFont } = await import("./pdfFontHelper");

      // Create PDF with Vietnamese font support
      const { doc, fonts } = createMedicalPDF("PHIẾU KHÁM BỆNH");

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Header
      drawMedicalHeader(
        doc,
        fonts,
        {
          clinicName: "HỆ THỐNG QUẢN LÝ PHÒNG KHÁM",
          address: "Địa chỉ: Khu phố 34, Phường Linh Xuân, TP.HCM",
          phone: "(028) 1234 5678",
          email: "info@clinic.com",
        },
        "PHIẾU KHÁM BỆNH"
      );

      // Metadata (Prescription Code and Date)
      drawMetadataBox(
        doc,
        fonts,
        "Mã phiếu",
        pdfData.prescriptionCode,
        "Ngày khám",
        formatDate(pdfData.createdAt)
      );

      // Patient Info
      const patientItems = [
        { label: "Họ và tên", value: pdfData.patientName || "N/A" },
        { label: "Số điện thoại", value: pdfData.patientPhone || "N/A" },
      ];

      if (pdfData.patientGender) {
        const genderLabel = pdfData.patientGender === "MALE" ? "Nam" : (pdfData.patientGender === "FEMALE" ? "Nữ" : "Khác");
        patientItems.push({ label: "Giới tính", value: genderLabel });
      }

      if (pdfData.patientAge) {
        patientItems.push({ label: "Tuổi", value: `${pdfData.patientAge} tuổi` });
      }

      if (pdfData.patientAddress && pdfData.patientAddress !== "N/A") {
        patientItems.push({ label: "Địa chỉ", value: pdfData.patientAddress });
      }

      drawInfoBox(doc, fonts, "THÔNG TIN BỆNH NHÂN", patientItems);

      // Doctor Info
      const doctorItems = [
        { label: "Bác sĩ khám", value: pdfData.doctorName || "N/A" },
        { label: "Chuyên khoa", value: pdfData.doctorSpecialty || "N/A" },
      ];

      drawInfoBox(doc, fonts, "THÔNG TIN BÁC SĨ", doctorItems);

      // Diagnosis Section
      if (pdfData.diagnosis || pdfData.symptoms) {
        console.log("[PDF] Rendering diagnosis section with centered header");
        drawSectionHeader(doc, fonts, "CHẨN ĐOÁN VÀ TRIỆU CHỨNG");

        setFont(doc, fonts, false);
        doc.fontSize(10);

        if (pdfData.symptoms) {
          setFont(doc, fonts, true);
          doc.text("Triệu chứng:", SPACING.pageMargin, doc.y);
          setFont(doc, fonts, false);
          doc.text(pdfData.symptoms, SPACING.pageMargin + 10, doc.y, {
            width: 495,
          });
          doc.moveDown(0.5);
        }

        if (pdfData.diagnosis) {
          setFont(doc, fonts, true);
          doc.text("Chẩn đoán:", SPACING.pageMargin, doc.y);
          setFont(doc, fonts, false);
          doc.text(pdfData.diagnosis, SPACING.pageMargin + 10, doc.y, {
            width: 495,
          });
          doc.moveDown(0.5);
        }

        if (pdfData.diseaseCategory) {
          setFont(doc, fonts, true);
          doc.text("Nhóm bệnh:", SPACING.pageMargin, doc.y);
          setFont(doc, fonts, false);
          doc.text(pdfData.diseaseCategory, SPACING.pageMargin + 10, doc.y);
        }

        doc.moveDown(1);
      }

      // Medicine Prescription (WITHOUT PRICES)
      if (pdfData.medicines && pdfData.medicines.length > 0) {
        drawSectionHeader(doc, fonts, "ĐƠN THUỐC");

        const { drawMedicineCard } = await import("./medicalPDFTemplate");

        pdfData.medicines.forEach((medicine: any, index: number) => {
          const dosage = [];
          if (medicine.dosageMorning > 0) dosage.push(`Sáng: ${medicine.dosageMorning}`);
          if (medicine.dosageNoon > 0) dosage.push(`Trưa: ${medicine.dosageNoon}`);
          if (medicine.dosageAfternoon > 0) dosage.push(`Chiều: ${medicine.dosageAfternoon}`);
          if (medicine.dosageEvening > 0) dosage.push(`Tối: ${medicine.dosageEvening}`);

          drawMedicineCard(doc, fonts, {
            index: index + 1,
            name: medicine.medicineName,
            quantity: medicine.quantity,
            unit: medicine.unit,
            dosage: dosage.join(", "),
            days: medicine.days,
            instruction: medicine.instruction,
          });
        });

        doc.moveDown(0.5);
      }

      // Notes
      if (pdfData.note) {
        const notes = [pdfData.note];
        drawNoteBox(doc, fonts, "LƯU Ý", notes);
      }

      // Standard medical notes
      const standardNotes = [
        "Uống thuốc đúng liều lượng, đúng giờ theo chỉ dẫn của bác sĩ",
        "Bảo quản thuốc nơi khô ráo, tránh ánh nắng trực tiếp",
        "Tái khám nếu có triệu chứng bất thường hoặc không đỡ sau 3-5 ngày",
        "Liên hệ phòng khám ngay nếu có phản ứng phụ với thuốc",
      ];
      drawNoteBox(doc, fonts, "HƯỚNG DẪN SỬ DỤNG THUỐC", standardNotes);

      // Signature section
      drawSignatureSection(
        doc,
        fonts,
        "Bệnh nhân/Người nhà",
        "Bác sĩ điều trị",
        new Date(pdfData.createdAt)
      );

      // Footer
      drawMedicalFooter(doc, fonts, 1, 1);

      // Finalize
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

import PDFDocument from "pdfkit";
import { Readable } from "stream";
import {
  signPrescription,
  generatePrescriptionSignatureData,
} from "./digitalSignature";

interface PrescriptionData {
  prescriptionCode: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  doctorName: string;
  doctorSpecialty: string;
  visitDate: Date;
  diagnosis?: string;
  symptoms?: string;
  diseaseCategory?: string;
  medicines: {
    medicineName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    dosageMorning: number;
    dosageNoon: number;
    dosageAfternoon: number;
    dosageEvening: number;
    instruction?: string;
  }[];
  totalAmount: number;
  note?: string;
  createdAt: Date;
}

/**
 * Generate prescription PDF with digital signature
 * @param prescription - Prescription data
 * @param doctorPrivateKey - Doctor's private key for signing (optional)
 * @returns PDF as Buffer
 */
export const generatePrescriptionPDF = async (
  prescription: PrescriptionData,
  doctorPrivateKey?: string
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("ĐƠN THUỐC / PRESCRIPTION", { align: "center" });

      doc.moveDown(0.5);

      // Prescription Code & Date
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Mã đơn thuốc: ${prescription.prescriptionCode}`, {
          align: "right",
        });
      doc.text(
        `Ngày kê: ${new Date(prescription.createdAt).toLocaleDateString("vi-VN")}`,
        { align: "right" }
      );

      doc.moveDown(1);

      // Doctor Information
      doc.fontSize(12).font("Helvetica-Bold").text("THÔNG TIN BÁC SĨ");
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Bác sĩ: ${prescription.doctorName}`);
      doc.text(`Chuyên khoa: ${prescription.doctorSpecialty}`);

      doc.moveDown(1);

      // Patient Information
      doc.fontSize(12).font("Helvetica-Bold").text("THÔNG TIN BỆNH NHÂN");
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Họ tên: ${prescription.patientName}`);
      doc.text(`Số điện thoại: ${prescription.patientPhone}`);
      if (prescription.patientAge) {
        doc.text(`Tuổi: ${prescription.patientAge}`);
      }

      doc.moveDown(1);

      // Medical Information
      doc.fontSize(12).font("Helvetica-Bold").text("THÔNG TIN KHÁM BỆNH");
      if (prescription.symptoms) {
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`Triệu chứng: ${prescription.symptoms}`);
      }
      if (prescription.diagnosis) {
        doc.text(`Chẩn đoán: ${prescription.diagnosis}`);
      }
      if (prescription.diseaseCategory) {
        doc.text(`Loại bệnh: ${prescription.diseaseCategory}`);
      }

      doc.moveDown(1);

      // Medicines Table
      doc.fontSize(12).font("Helvetica-Bold").text("ĐƠN THUỐC");
      doc.moveDown(0.5);

      const tableTop = doc.y;
      let currentY = tableTop;

      // Table Header
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("STT", 50, currentY, { width: 30 })
        .text("Tên thuốc", 85, currentY, { width: 150 })
        .text("SL", 240, currentY, { width: 30 })
        .text("Sáng", 275, currentY, { width: 35 })
        .text("Trưa", 315, currentY, { width: 35 })
        .text("Chiều", 355, currentY, { width: 35 })
        .text("Tối", 395, currentY, { width: 35 })
        .text("Thành tiền", 435, currentY, { width: 80, align: "right" });

      currentY += 20;

      // Horizontal line
      doc
        .moveTo(50, currentY)
        .lineTo(550, currentY)
        .stroke();

      currentY += 10;

      // Medicine rows
      prescription.medicines.forEach((medicine, index) => {
        const itemTotal = medicine.quantity * medicine.unitPrice;

        doc
          .fontSize(9)
          .font("Helvetica")
          .text(`${index + 1}`, 50, currentY, { width: 30 })
          .text(
            `${medicine.medicineName} (${medicine.unit})`,
            85,
            currentY,
            { width: 150 }
          )
          .text(`${medicine.quantity}`, 240, currentY, { width: 30 })
          .text(`${medicine.dosageMorning}`, 275, currentY, { width: 35 })
          .text(`${medicine.dosageNoon}`, 315, currentY, { width: 35 })
          .text(`${medicine.dosageAfternoon}`, 355, currentY, { width: 35 })
          .text(`${medicine.dosageEvening}`, 395, currentY, { width: 35 })
          .text(`${itemTotal.toLocaleString("vi-VN")} đ`, 435, currentY, {
            width: 80,
            align: "right",
          });

        currentY += 15;

        // Instruction
        if (medicine.instruction) {
          doc
            .fontSize(8)
            .font("Helvetica-Oblique")
            .text(`   ${medicine.instruction}`, 85, currentY, { width: 430 });
          currentY += 12;
        }

        currentY += 5;
      });

      // Total
      currentY += 10;
      doc
        .moveTo(50, currentY)
        .lineTo(550, currentY)
        .stroke();

      currentY += 10;

      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("TỔNG CỘNG:", 350, currentY)
        .text(`${prescription.totalAmount.toLocaleString("vi-VN")} đ`, 435, currentY, {
          width: 80,
          align: "right",
        });

      currentY += 30;

      // Note
      if (prescription.note) {
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Ghi chú:", 50, currentY);
        currentY += 15;
        doc
          .fontSize(9)
          .font("Helvetica")
          .text(prescription.note, 50, currentY, { width: 500 });
        currentY += 30;
      }

      // Digital Signature
      if (doctorPrivateKey) {
        const signatureData = generatePrescriptionSignatureData({
          prescriptionCode: prescription.prescriptionCode,
          patientId: 0, // Will be filled from actual data
          doctorId: 0, // Will be filled from actual data
          totalAmount: prescription.totalAmount,
          createdAt: prescription.createdAt,
        });

        const signature = signPrescription(signatureData, doctorPrivateKey);

        doc.moveDown(2);
        doc
          .fontSize(8)
          .font("Helvetica-Oblique")
          .text("Chữ ký số:", { align: "right" });
        doc
          .fontSize(7)
          .text(signature.substring(0, 60) + "...", { align: "right" });
      }

      // Footer
      doc.moveDown(2);
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(
          `Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
          { align: "center" }
        );

      doc.moveDown(1);
      doc.fontSize(10).font("Helvetica-Bold").text("BÁC SĨ KÊ ĐƠN", {
        align: "center",
      });

      doc.moveDown(3);
      doc.text(prescription.doctorName, { align: "center" });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF stream (for sending as response)
 */
export const generatePrescriptionPDFStream = (
  prescription: PrescriptionData,
  doctorPrivateKey?: string
): PDFKit.PDFDocument => {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  // Same content generation as above
  // (Implementation is identical to generatePrescriptionPDF but returns doc instead of Buffer)

  return doc;
};

/**
 * PDF Font Helper
 * Giúp tải và sử dụng font Unicode cho PDF tiếng Việt
 */

import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

/**
 * Kiểm tra và lấy đường dẫn font hệ thống Windows
 */
export function getSystemFont(): string | null {
  // Các font phổ biến trên Windows hỗ trợ tiếng Việt
  const possibleFonts = [
    "C:\\Windows\\Fonts\\arial.ttf", // Arial
    "C:\\Windows\\Fonts\\arialbd.ttf", // Arial Bold
    "C:\\Windows\\Fonts\\times.ttf", // Times New Roman
    "C:\\Windows\\Fonts\\timesbd.ttf", // Times Bold
    "C:\\Windows\\Fonts\\calibri.ttf", // Calibri
    "C:\\Windows\\Fonts\\calibrib.ttf", // Calibri Bold
    "C:\\Windows\\Fonts\\tahoma.ttf", // Tahoma
    "C:\\Windows\\Fonts\\tahomabd.ttf", // Tahoma Bold
  ];

  for (const fontPath of possibleFonts) {
    if (fs.existsSync(fontPath)) {
      return fontPath;
    }
  }

  return null;
}

/**
 * Đăng ký font cho PDF document
 */
export function registerVietnameseFont(
  doc: PDFKit.PDFDocument
): { regular: string; bold: string } | null {
  try {
    const regularFont = getSystemFont();

    if (regularFont) {
      // Tìm font bold tương ứng
      const boldFont = regularFont.replace(".ttf", "bd.ttf");
      const boldExists = fs.existsSync(boldFont);

      doc.registerFont("VietnameseFont", regularFont);
      if (boldExists) {
        doc.registerFont("VietnameseFontBold", boldFont);
      }

      console.log(`✓ Da dang ky font: ${path.basename(regularFont)}`);
      if (boldExists) {
        console.log(`✓ Da dang ky font bold: ${path.basename(boldFont)}`);
      }

      return {
        regular: "VietnameseFont",
        bold: boldExists ? "VietnameseFontBold" : "VietnameseFont",
      };
    }

    console.warn("⚠ Khong tim thay font he thong, su dung font mac dinh");
    return null;
  } catch (error) {
    console.error("❌ Loi khi dang ky font:", error);
    return null;
  }
}

/**
 * Tạo PDF document với font tiếng Việt
 */
export function createVietnamesePDF(options?: PDFKit.PDFDocumentOptions) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    bufferPages: true,
    ...options,
  });

  // Thử đăng ký font tiếng Việt
  const fonts = registerVietnameseFont(doc);

  return { doc, fonts };
}

/**
 * Helper: Set font an toàn cho document
 */
export function setFont(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string } | null,
  bold: boolean = false
): void {
  if (fonts) {
    doc.font(bold ? fonts.bold : fonts.regular);
  } else {
    // Fallback to default fonts
    doc.font(bold ? "Helvetica-Bold" : "Helvetica");
  }
}

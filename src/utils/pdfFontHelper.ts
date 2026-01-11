import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

type FontCandidate = {
  regular: string;
  bold?: string;
};

/**
 * PDF Font Helper: hỗ trợ đăng ký font Unicode cho PDF tiếng Việt.
 */
export function getSystemFont(): FontCandidate | null {
  const possibleFonts: FontCandidate[] = [
    // Windows
    { regular: "C:\\Windows\\Fonts\\arial.ttf", bold: "C:\\Windows\\Fonts\\arialbd.ttf" },
    { regular: "C:\\Windows\\Fonts\\times.ttf", bold: "C:\\Windows\\Fonts\\timesbd.ttf" },
    { regular: "C:\\Windows\\Fonts\\calibri.ttf", bold: "C:\\Windows\\Fonts\\calibrib.ttf" },
    { regular: "C:\\Windows\\Fonts\\tahoma.ttf", bold: "C:\\Windows\\Fonts\\tahomabd.ttf" },
    // Linux
    { regular: "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", bold: "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" },
    { regular: "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", bold: "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" },
    { regular: "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf", bold: "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf" },
  ];

  for (const font of possibleFonts) {
    if (fs.existsSync(font.regular)) {
      return {
        regular: font.regular,
        bold: font.bold && fs.existsSync(font.bold) ? font.bold : undefined,
      };
    }
  }

  return null;
}

/**
 * Đăng ký font tiếng Việt cho PDFKit.
 */
export function registerVietnameseFont(
  doc: PDFKit.PDFDocument
): { regular: string; bold: string } | null {
  try {
    const font = getSystemFont();

    if (font) {
      const boldPath = font.bold && fs.existsSync(font.bold) ? font.bold : font.regular;

      doc.registerFont("VietnameseFont", font.regular);
      doc.registerFont("VietnameseFontBold", boldPath);

      console.log(`Da dang ky font: ${path.basename(font.regular)}`);
      if (boldPath !== font.regular) {
        console.log(`Da dang ky font dam: ${path.basename(boldPath)}`);
      }

      return {
        regular: "VietnameseFont",
        bold: "VietnameseFontBold",
      };
    }

    console.warn("Khong tim thay font ho tro Unicode, se dung Helvetica mac dinh (co the loi dau).");
    return null;
  } catch (error) {
    console.error("Loi khi dang ky font:", error);
    return null;
  }
}

/**
 * Tạo PDF document có sẵn font tiếng Việt.
 */
export function createVietnamesePDF(options?: PDFKit.PDFDocumentOptions) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    bufferPages: true,
    ...options,
  });

  const fonts = registerVietnameseFont(doc);

  return { doc, fonts };
}

/**
 * Helper: set font an toàn cho document.
 */
export function setFont(
  doc: PDFKit.PDFDocument,
  fonts: { regular: string; bold: string } | null,
  bold: boolean = false
): void {
  if (fonts) {
    doc.font(bold ? fonts.bold : fonts.regular);
  } else {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica");
  }
}



import { formatCurrency, formatDate, formatDateTime } from "./pdfGenerator";
import PDFDocument from "pdfkit";

export async function generateInvoicePDF(invoice: any): Promise<PDFKit.PDFDocument> {
  
  const {
    createMedicalPDF,
    drawMedicalHeader,
    drawMedicalFooter,
    drawInfoBox,
    drawSectionHeader,
    drawMetadataBox,
    drawProfessionalTable,
    COLORS,
    SPACING,
  } = await import("./medicalPDFTemplate");
  const { setFont } = await import("./pdfFontHelper");

  
  type TableColumn = {
    header: string;
    width: number;
    align?: "left" | "center" | "right";
    render?: (value: any, row: any) => string;
  };

  
  const { doc, fonts } = createMedicalPDF("HÓA ĐƠN THANH TOÁN");

  
  drawMedicalHeader(
    doc,
    fonts,
    {
      clinicName: "HỆ THỐNG QUẢN LÝ PHÒNG KHÁM",
      address: "Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM",
      phone: "(028) 1234 5678",
      email: "support@healos.com",
    },
    "HÓA ĐƠN THANH TOÁN"
  );

  
  drawMetadataBox(
    doc,
    fonts,
    "Mã hóa đơn",
    invoice.invoiceCode,
    "Ngày tạo",
    formatDate(invoice.createdAt)
  );

  
  setFont(doc, fonts, true);
  doc.fontSize(11);
  const statusColors: any = {
    PAID: COLORS.success,
    PARTIALLY_PAID: COLORS.warning,
    UNPAID: COLORS.error,
  };
  const statusLabels: any = {
    PAID: "ĐÃ THANH TOÁN",
    PARTIALLY_PAID: "THANH TOÁN MỘT PHẦN",
    UNPAID: "CHƯA THANH TOÁN",
  };

  doc
    .fillColor(statusColors[invoice.paymentStatus] || COLORS.text)
    .text(
      `Trạng thái: ${statusLabels[invoice.paymentStatus] || invoice.paymentStatus}`,
      SPACING.pageMargin,
      doc.y,
      { align: "right" }
    )
    .fillColor(COLORS.text);

  doc.moveDown(1);

  
  const patientItems = [
    { 
      label: "Họ và tên", 
      value: (invoice as any).visit?.appointment?.patientName || (invoice as any).patient?.fullName || "N/A" 
    },
    { label: "Mã BN", value: (invoice as any).patient?.patientCode || "N/A" },
    {
      label: "Điện thoại",
      value: (invoice as any).visit?.appointment?.patientPhone || "N/A",
    },
    {
       label: "Ngày sinh",
       value: (invoice as any).visit?.appointment?.patientDob ? formatDate((invoice as any).visit.appointment.patientDob) : "N/A",
    },
  ];

  drawInfoBox(doc, fonts, "THÔNG TIN BỆNH NHÂN", patientItems, COLORS.lightGray, 2);

  
  const doctorItems = [
    { label: "Bác sĩ", value: (invoice as any).doctor?.fullName || "N/A" },
    { label: "Chuyên khoa", value: (invoice as any).doctor?.specialty || "N/A" },
  ];

  drawInfoBox(doc, fonts, "THÔNG TIN BÁC SĨ", doctorItems);

  
  drawSectionHeader(doc, fonts, "CHI TIẾT HÓA ĐƠN");

  
  const tableData: any[] = [];

  if ((invoice as any).items && Array.isArray((invoice as any).items)) {
    (invoice as any).items.forEach((item: any) => {
      let description = "";
      if (item.itemType === "EXAMINATION") {
        description = item.description || "Khám bệnh";
      } else if (item.itemType === "MEDICINE") {
        description = `${item.medicineName || "Thuốc"}`;
        if (item.medicineCode) {
          description += ` (${item.medicineCode})`;
        }
      }

      tableData.push({
        description,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        subtotal: item.subtotal || 0,
      });
    });
  }

  
  const columns: TableColumn[] = [
    { header: "Mô tả", width: 240, align: "left" },
    { header: "Số lượng", width: 60, align: "center" },
    { header: "Đơn giá", width: 100, align: "right" },
    { header: "Thành tiền", width: 95, align: "right" },
  ];

  const rows = tableData.map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.subtotal),
  ]);

  drawProfessionalTable(doc, fonts, columns, rows);

  
  doc.moveDown(0.5);
  const summaryStartX = 300;
  const summaryWidth = 245;

  setFont(doc, fonts, false);
  doc.fontSize(10);

  
  const items = [
    { label: "Tiền khám", value: invoice.examinationFee || 0 },
    { label: "Tiền thuốc", value: invoice.medicineTotalAmount || 0 },
  ];

  if (invoice.discount && invoice.discount > 0) {
    items.push({ label: "Giảm giá", value: -invoice.discount });
  }

  let currentY = doc.y;
  items.forEach((item) => {
    setFont(doc, fonts, false);
    doc.text(`${item.label}:`, summaryStartX, currentY, {
      width: 150,
      align: "left",
    });

    setFont(doc, fonts, false);
    doc.fillColor(item.value < 0 ? COLORS.error : COLORS.text);
    doc.text(formatCurrency(Math.abs(item.value)), summaryStartX + 155, currentY, {
      width: 90,
      align: "right",
    });
    doc.fillColor(COLORS.text);

    currentY += 15;
  });

  
  doc
    .moveTo(summaryStartX, currentY + 5)
    .lineTo(summaryStartX + summaryWidth, currentY + 5)
    .lineWidth(1)
    .strokeColor(COLORS.border)
    .stroke();

  currentY += 15;

  
  setFont(doc, fonts, true);
  doc.fontSize(12).fillColor(COLORS.primary);
  doc.text("TỔNG CỘNG:", summaryStartX, currentY, {
    width: 150,
    align: "left",
  });
  doc.text(formatCurrency(invoice.totalAmount || 0), summaryStartX + 155, currentY, {
    width: 90,
    align: "right",
  });

  currentY += 18;
  setFont(doc, fonts, false);
  doc.fontSize(10).fillColor(COLORS.success);
  doc.text("Đã thanh toán:", summaryStartX, currentY, {
    width: 150,
    align: "left",
  });
  doc.text(formatCurrency(invoice.paidAmount || 0), summaryStartX + 155, currentY, {
    width: 90,
    align: "right",
  });

  currentY += 15;
  const remaining = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
  setFont(doc, fonts, true);
  doc.fillColor(remaining > 0 ? COLORS.error : COLORS.success);
  doc.text("Còn lại:", summaryStartX, currentY, {
    width: 150,
    align: "left",
  });
  doc.text(formatCurrency(remaining), summaryStartX + 155, currentY, {
    width: 90,
    align: "right",
  });
  doc.fillColor(COLORS.text);

  doc.y = currentY + 30;

  
  if ((invoice as any).payments && (invoice as any).payments.length > 0) {
    drawSectionHeader(doc, fonts, "LỊCH SỬ THANH TOÁN");

    const paymentColumns: TableColumn[] = [
      { header: "Ngày thanh toán", width: 120, align: "left" },
      { header: "Phương thức", width: 100, align: "center" },
      { header: "Số tiền", width: 100, align: "right" },
      { header: "Mã giao dịch", width: 175, align: "left" },
    ];

    const paymentRows = (invoice as any).payments.map((payment: any) => [
      formatDateTime(payment.paymentDate),
      payment.paymentMethod || "",
      formatCurrency(payment.amount || 0),
      payment.reference || "-",
    ]);

    drawProfessionalTable(doc, fonts, paymentColumns, paymentRows);
  }

  
  if (invoice.note) {
    doc.moveDown(1);
    setFont(doc, fonts, true);
    doc.fontSize(11).text("Ghi chú:", SPACING.pageMargin, doc.y);
    setFont(doc, fonts, false);
    doc.fontSize(10).text(invoice.note, SPACING.pageMargin + 10, doc.y, {
      width: 485,
    });
  }

  
  drawMedicalFooter(doc, fonts, 1, 1);

  return doc;
}

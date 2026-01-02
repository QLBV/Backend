import { Transaction, Op } from "sequelize";
import Invoice, { PaymentStatus } from "../models/Invoice";
import InvoiceItem, { ItemType } from "../models/InvoiceItem";
import Payment, { PaymentMethod } from "../models/Payment";
import Visit from "../models/Visit";
import Prescription from "../models/Prescription";
import PrescriptionDetail from "../models/PrescriptionDetail";
import Patient from "../models/Patient";
import Doctor from "../models/Doctor";
import User from "../models/User";
import sequelize from "../config/database";
import { generateInvoiceCode } from "../utils/codeGenerator";

/**
 * Tạo hóa đơn tự động khi Visit completed
 * @param visitId - ID của visit
 * @param createdBy - ID của user tạo hóa đơn (Admin/Receptionist)
 * @param examinationFee - Phí khám bệnh (VNĐ)
 * @param transaction - Sequelize transaction (optional)
 */
export const createInvoiceFromVisit = async (
  visitId: number,
  createdBy: number,
  examinationFee: number,
  transaction?: Transaction
) => {
  const t = transaction || (await sequelize.transaction());

  try {
    // 1. Lấy thông tin visit
    const visit = await Visit.findByPk(visitId, {
      include: [
        { association: "patient" },
        { association: "doctor" },
        {
          association: "prescription",
          include: [{ association: "details" }],
        },
      ],
      transaction: t,
    });

    if (!visit) {
      throw new Error("Visit not found");
    }

    // 2. Kiểm tra visit đã có invoice chưa
    const existingInvoice = await Invoice.findOne({
      where: { visitId },
      transaction: t,
    });

    if (existingInvoice) {
      throw new Error("Invoice already exists for this visit");
    }

    // 3. Generate invoice code
    const invoiceCode = await generateInvoiceCode();

    // 4. Tạo Invoice record
    const invoice = await Invoice.create(
      {
        invoiceCode,
        visitId: visit.id,
        patientId: visit.patientId,
        doctorId: visit.doctorId,
        examinationFee,
        medicineTotalAmount: 0,
        discount: 0,
        totalAmount: examinationFee,
        paymentStatus: PaymentStatus.UNPAID,
        paidAmount: 0,
        createdBy,
      },
      { transaction: t }
    );

    // 5. Tạo InvoiceItem cho khám bệnh
    await InvoiceItem.create(
      {
        invoiceId: invoice.id,
        itemType: ItemType.EXAMINATION,
        description: `Khám bệnh`,
        quantity: 1,
        unitPrice: examinationFee,
        subtotal: examinationFee,
      },
      { transaction: t }
    );

    // 6. Nếu có prescription → Tạo InvoiceItem cho từng thuốc
    let medicineTotalAmount = 0;

    if ((visit as any).prescription && (visit as any).prescription.details) {
      const prescriptionDetails = (visit as any).prescription.details;

      for (const detail of prescriptionDetails) {
        const subtotal = detail.quantity * detail.unitPrice;

        await InvoiceItem.create(
          {
            invoiceId: invoice.id,
            itemType: ItemType.MEDICINE,
            prescriptionDetailId: detail.id,
            medicineName: detail.medicineName,
            medicineCode: detail.medicineCode,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            subtotal,
          },
          { transaction: t }
        );

        medicineTotalAmount += subtotal;
      }
    }

    // 7. Cập nhật Invoice với medicineTotalAmount và totalAmount
    invoice.medicineTotalAmount = medicineTotalAmount;
    invoice.totalAmount = examinationFee + medicineTotalAmount - invoice.discount;
    await invoice.save({ transaction: t });

    // Commit transaction nếu không được pass từ bên ngoài
    if (!transaction) {
      await t.commit();
    }

    // 8. Reload invoice với associations
    return await Invoice.findByPk(invoice.id, {
      include: [
        { association: "visit" },
        { association: "patient" },
        { association: "doctor" },
        { association: "creator" },
        { association: "items" },
        { association: "payments" },
      ],
    });
  } catch (error) {
    if (!transaction) {
      await t.rollback();
    }
    throw error;
  }
};

/**
 * Lấy danh sách hóa đơn với filters
 */
export const getInvoicesService = async (filters: {
  page?: number;
  limit?: number;
  patientId?: number;
  doctorId?: number;
  paymentStatus?: PaymentStatus;
  fromDate?: Date;
  toDate?: Date;
}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const where: any = {};

  if (filters.patientId) {
    where.patientId = filters.patientId;
  }

  if (filters.doctorId) {
    where.doctorId = filters.doctorId;
  }

  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) {
      where.createdAt[Op.gte] = filters.fromDate;
    }
    if (filters.toDate) {
      where.createdAt[Op.lte] = filters.toDate;
    }
  }

  const { count, rows } = await Invoice.findAndCountAll({
    where,
    include: [
      { association: "patient" },
      { association: "doctor" },
      { association: "creator" },
      { association: "items" },
      { association: "payments" },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return {
    invoices: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

/**
 * Lấy chi tiết hóa đơn
 */
export const getInvoiceByIdService = async (invoiceId: number) => {
  const invoice = await Invoice.findByPk(invoiceId, {
    include: [
      { association: "visit" },
      { association: "patient" },
      { association: "doctor" },
      { association: "creator" },
      {
        association: "items",
        include: [{ association: "prescriptionDetail" }],
      },
      {
        association: "payments",
        include: [{ association: "creator" }],
      },
    ],
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  return invoice;
};

/**
 * Cập nhật hóa đơn (discount, note)
 * Updated with transaction safety
 */
export const updateInvoiceService = async (
  invoiceId: number,
  updates: {
    discount?: number;
    note?: string;
  }
) => {
  const t = await sequelize.transaction();

  try {
    const invoice = await Invoice.findByPk(invoiceId, {
      transaction: t,
      lock: t.LOCK.UPDATE, // Pessimistic lock
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Chỉ cho phép update nếu chưa thanh toán đủ
    if (invoice.paymentStatus === PaymentStatus.PAID) {
      throw new Error("Cannot update paid invoice");
    }

    if (updates.discount !== undefined) {
      // Validate discount
      if (updates.discount < 0) {
        throw new Error("Discount cannot be negative");
      }

      const totalBeforeDiscount =
        invoice.examinationFee + invoice.medicineTotalAmount;

      if (updates.discount > totalBeforeDiscount) {
        throw new Error("Discount cannot exceed total amount");
      }

      invoice.discount = updates.discount;
      // Recalculate totalAmount
      invoice.totalAmount = totalBeforeDiscount - invoice.discount;

      // Validate paidAmount doesn't exceed new totalAmount
      if (invoice.paidAmount > invoice.totalAmount) {
        throw new Error(
          "Cannot set discount: Paid amount exceeds new total amount"
        );
      }
    }

    if (updates.note !== undefined) {
      invoice.note = updates.note;
    }

    await invoice.save({ transaction: t });

    await t.commit();

    return await getInvoiceByIdService(invoiceId);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Thêm payment cho hóa đơn
 */
export const addPaymentService = async (
  invoiceId: number,
  paymentData: {
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    note?: string;
    createdBy: number;
  }
) => {
  const t = await sequelize.transaction();

  try {
    const invoice = await Invoice.findByPk(invoiceId, {
      transaction: t,
      lock: true, // Pessimistic lock
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Kiểm tra số tiền thanh toán
    const remainingAmount = invoice.totalAmount - invoice.paidAmount;

    if (paymentData.amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    if (paymentData.amount > remainingAmount) {
      throw new Error(
        `Payment amount exceeds remaining balance (${remainingAmount} VNĐ)`
      );
    }

    // Tạo Payment record
    const payment = await Payment.create(
      {
        invoiceId: invoice.id,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: new Date(),
        reference: paymentData.reference,
        note: paymentData.note,
        createdBy: paymentData.createdBy,
      },
      { transaction: t }
    );

    // Cập nhật Invoice.paidAmount
    invoice.paidAmount += paymentData.amount;

    // Cập nhật Invoice.paymentStatus
    if (invoice.paidAmount === 0) {
      invoice.paymentStatus = PaymentStatus.UNPAID;
    } else if (invoice.paidAmount < invoice.totalAmount) {
      invoice.paymentStatus = PaymentStatus.PARTIALLY_PAID;
    } else {
      invoice.paymentStatus = PaymentStatus.PAID;
    }

    await invoice.save({ transaction: t });

    await t.commit();

    // Return updated invoice
    return await getInvoiceByIdService(invoiceId);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Lấy lịch sử thanh toán của hóa đơn
 */
export const getInvoicePaymentsService = async (invoiceId: number) => {
  const invoice = await Invoice.findByPk(invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const payments = await Payment.findAll({
    where: { invoiceId },
    include: [{ association: "creator" }],
    order: [["paymentDate", "DESC"]],
  });

  return payments;
};

/**
 * Lấy hóa đơn theo bệnh nhân
 */
export const getInvoicesByPatientService = async (patientId: number) => {
  return await Invoice.findAll({
    where: { patientId },
    include: [
      { association: "visit" },
      { association: "doctor" },
      { association: "items" },
      { association: "payments" },
    ],
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Thống kê doanh thu
 */
export const getInvoiceStatisticsService = async (filters: {
  fromDate?: Date;
  toDate?: Date;
  doctorId?: number;
}) => {
  const where: any = {};

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) {
      where.createdAt[Op.gte] = filters.fromDate;
    }
    if (filters.toDate) {
      where.createdAt[Op.lte] = filters.toDate;
    }
  }

  if (filters.doctorId) {
    where.doctorId = filters.doctorId;
  }

  const invoices = await Invoice.findAll({
    where,
    attributes: [
      "paymentStatus",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      [sequelize.fn("SUM", sequelize.col("totalAmount")), "totalAmount"],
      [sequelize.fn("SUM", sequelize.col("paidAmount")), "paidAmount"],
    ],
    group: ["paymentStatus"],
    raw: true,
  });

  return invoices;
};

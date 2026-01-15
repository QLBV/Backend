import { Transaction, Op } from "sequelize";
import Invoice, { PaymentStatus } from "../models/Invoice";
import InvoiceItem, { ItemType } from "../models/InvoiceItem";
import Payment, { PaymentMethod } from "../models/Payment";
import Refund, { RefundStatus } from "../models/Refund";
import Visit from "../models/Visit";
import PrescriptionDetail from "../models/PrescriptionDetail";
import Patient from "../models/Patient";
import Doctor from "../models/Doctor";
import User from "../models/User";
import Appointment from "../models/Appointment";
import Shift from "../models/Shift";
import Specialty from "../models/Specialty";
import sequelize from "../config/database";
import { generateInvoiceCode } from "../utils/codeGenerator";
import { VisitStateMachine, AppointmentStateMachine } from "../utils/stateMachine";
import { AppointmentStatus } from "../constant/appointment";

export const invoiceAssociations = [
  {
    model: Visit,
    as: "visit",
    attributes: [
      "id",
      "appointmentId",
      "patientId",
      "doctorId",
      "checkInTime",
      "checkOutTime",
      "diagnosis",
      "symptoms",
      "status",
      "note",
      "createdAt",
    ],
    include: [
      {
        model: Patient,
        as: "patient",
        attributes: [
          "id",
          "patientCode",
          "fullName",
          "gender",
          "dateOfBirth",
          "avatar",
        ],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "fullName", "email", "avatar"],
          },
        ],
      },
      {
        model: Doctor,
        as: "doctor",
        attributes: ["id", "doctorCode", "specialtyId"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "fullName", "email", "avatar"],
          },
          {
            model: Specialty,
            as: "specialty",
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: Appointment,
        as: "appointment",
        attributes: [
          "id",
          "date",
          "slotNumber",
          "status",
          "patientName",
          "patientPhone",
          "patientDob",
          "patientGender",
        ],
        include: [
          {
            model: Shift,
            as: "shift",
            attributes: ["id", "name", "startTime", "endTime"],
          },
        ],
      },
    ],
  },
  {
    model: Patient,
    as: "patient",
    attributes: [
      "id",
      "patientCode",
      "fullName",
      "gender",
      "dateOfBirth",
      "avatar",
    ],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "email", "avatar"],
      },
    ],
  },
  {
    model: Doctor,
    as: "doctor",
    attributes: ["id", "doctorCode", "specialtyId"],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "email", "avatar"],
      },
      {
        model: Specialty,
        as: "specialty",
        attributes: ["id", "name"],
      },
    ],
  },
  { model: User, as: "creator", attributes: ["id", "fullName", "email"] },
  {
    model: InvoiceItem,
    as: "items",
    include: [
      {
        model: PrescriptionDetail,
        as: "prescriptionDetail",
      },
    ],
  },
  {
    model: Payment,
    as: "payments",
    include: [
      { model: User, as: "creator", attributes: ["id", "fullName", "email"] },
    ],
  },
];

export const formatInvoice = (invoice: any) => {
  if (!invoice) return invoice;
  const data = invoice.toJSON ? invoice.toJSON() : invoice;

  const attachUserName = (doctor: any) => {
    if (doctor && doctor.user) {
      doctor.fullName = doctor.fullName || doctor.user.fullName;
      doctor.email = doctor.email || doctor.user.email;
      doctor.avatar = doctor.avatar || doctor.user.avatar;
    }
  };

  const attachPatientUser = (patient: any) => {
    if (patient && patient.user) {
      patient.fullName = patient.fullName || patient.user.fullName;
      patient.email = patient.email || patient.user.email;
      patient.avatar = patient.avatar || patient.user.avatar;
    }
  };

  attachUserName(data.doctor);
  attachPatientUser(data.patient);

  if (data.visit) {
    data.visit.visitDate =
      data.visit.visitDate || data.visit.checkInTime || data.visit.createdAt;
    data.visit.diagnosis = data.visit.diagnosis; // Ensure diagnosis is preserved
    data.visit.symptoms = data.visit.symptoms; // Ensure symptoms are preserved
    attachUserName(data.visit.doctor);
    attachPatientUser(data.visit.patient);
  }

  return data;
};

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
    const hydrated = await Invoice.findByPk(invoice.id, {
      include: invoiceAssociations,
    });

    return formatInvoice(hydrated);
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
    include: invoiceAssociations,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  return {
    invoices: rows.map((row) => formatInvoice(row)),
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
    include: invoiceAssociations,
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // SELF-HEALING: Check and fix data consistency
  if (invoice.payments) {
    const calculatedPaid = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    // Use a small epsilon for float comparison
    if (Math.abs(Number(invoice.paidAmount) - calculatedPaid) > 0.1) {
       console.warn(`[Auto-Fix] Invoice ${invoiceId}: Fixing paidAmount mismatch. stored=${invoice.paidAmount}, calculated=${calculatedPaid}`);
       
       invoice.paidAmount = calculatedPaid;
       
       // Re-evaluate payment status
       if (invoice.paidAmount <= 0) {
         invoice.paymentStatus = PaymentStatus.UNPAID;
       } else if (invoice.paidAmount < Number(invoice.totalAmount)) {
         invoice.paymentStatus = PaymentStatus.PARTIALLY_PAID;
       } else {
         invoice.paymentStatus = PaymentStatus.PAID;
       }

       await invoice.save();
    }
  }

  return formatInvoice(invoice);
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
    // Ensure we treating values as numbers to avoid string concatenation
    const currentPaid = Number(invoice.paidAmount);
    const newPayment = Number(paymentData.amount);
    invoice.paidAmount = currentPaid + newPayment;

    // Cập nhật Invoice.paymentStatus
    if (invoice.paidAmount === 0) {
      invoice.paymentStatus = PaymentStatus.UNPAID;
    } else if (invoice.paidAmount < invoice.totalAmount) {
      invoice.paymentStatus = PaymentStatus.PARTIALLY_PAID;
    } else {
      invoice.paymentStatus = PaymentStatus.PAID;
    }

    await invoice.save({ transaction: t });

    // When invoice is fully paid, close visit/appointment lifecycle
    if (invoice.paymentStatus === PaymentStatus.PAID) {
      const visit = await Visit.findByPk(invoice.visitId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (visit) {
        if (visit.status !== "COMPLETED") {
          // STATE MACHINE: Validate visit transition to COMPLETED
          VisitStateMachine.validateTransition(visit.status, "COMPLETED");

          visit.status = "COMPLETED";
          visit.checkOutTime = visit.checkOutTime ?? new Date();
          await visit.save({ transaction: t });
        }

        const appointment = await Appointment.findByPk(visit.appointmentId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (appointment && appointment.status !== "COMPLETED") {
          // STATE MACHINE: Validate appointment transition to COMPLETED
          AppointmentStateMachine.validateTransition(
            appointment.status as AppointmentStatus,
            AppointmentStatus.COMPLETED
          );

          appointment.status = AppointmentStatus.COMPLETED;
          await appointment.save({ transaction: t });
        }
      }
    }

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
  const invoices = await Invoice.findAll({
    where: { patientId },
    include: invoiceAssociations,
    order: [["createdAt", "DESC"]],
  });

  return invoices.map((item) => formatInvoice(item));
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

  /*
   * Switch to in-memory calculation to ensure accuracy and avoid DB grouping nuances.
   * Fetch minimal attributes for all matching invoices.
   */
  const invoices = await Invoice.findAll({
    where,
    attributes: ['id', 'paymentStatus', 'totalAmount', 'paidAmount'],
    raw: true,
  });

  const stats = {
    totalRevenue: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    partiallyPaidInvoices: 0,
    averageInvoiceAmount: 0,
  };

  let totalInvoiceAmount = 0;

  invoices.forEach((item: any) => {
    const itemTotalAmount = parseFloat(item.totalAmount || 0);
    const itemPaidAmount = parseFloat(item.paidAmount || 0);
    const paymentStatus = item.paymentStatus;

    stats.totalInvoices++;
    totalInvoiceAmount += itemTotalAmount;
    stats.totalRevenue += itemPaidAmount;

    if (paymentStatus === PaymentStatus.PAID) {
      stats.paidInvoices++;
    } else if (paymentStatus === PaymentStatus.UNPAID) {
      stats.unpaidInvoices++;
    } else if (paymentStatus === PaymentStatus.PARTIALLY_PAID) {
      stats.partiallyPaidInvoices++;
    }
  });

  stats.averageInvoiceAmount = stats.totalInvoices > 0
    ? totalInvoiceAmount / stats.totalInvoices
    : 0;

  return stats;
};

/**
 * Process approved refund - decrease invoice paidAmount
 * CRITICAL: Only call this when Refund.status = APPROVED or COMPLETED
 */
export const processRefundService = async (
  refundId: number,
  approvedBy: number
) => {
  const t = await sequelize.transaction();

  try {
    // 1. Get refund with lock
    const refund = await Refund.findByPk(refundId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!refund) {
      throw new Error("REFUND_NOT_FOUND");
    }

    // 2. Validate refund status
    if (refund.status === RefundStatus.COMPLETED) {
      throw new Error("REFUND_ALREADY_COMPLETED");
    }

    if (refund.status === RefundStatus.REJECTED) {
      throw new Error("CANNOT_PROCESS_REJECTED_REFUND");
    }

    if (refund.status !== RefundStatus.APPROVED) {
      throw new Error("REFUND_NOT_APPROVED");
    }

    // 3. Get invoice with lock
    const invoice = await Invoice.findByPk(refund.invoiceId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!invoice) {
      throw new Error("INVOICE_NOT_FOUND");
    }

    // 4. Validate refund amount
    if (refund.amount > invoice.paidAmount) {
      throw new Error("REFUND_AMOUNT_EXCEEDS_PAID_AMOUNT");
    }

    // 5. CRITICAL: Decrease paidAmount
    const oldPaidAmount = invoice.paidAmount;
    const oldPaymentStatus = invoice.paymentStatus;

    invoice.paidAmount -= refund.amount;

    // 6. Recalculate payment status
    if (invoice.paidAmount === 0) {
      invoice.paymentStatus = PaymentStatus.UNPAID;
    } else if (invoice.paidAmount < invoice.totalAmount) {
      invoice.paymentStatus = PaymentStatus.PARTIALLY_PAID;
    } else {
      invoice.paymentStatus = PaymentStatus.PAID;
    }

    await invoice.save({ transaction: t });

    // 7. Create negative payment record for audit trail
    await Payment.create(
      {
        invoiceId: invoice.id,
        amount: -refund.amount, // Negative amount
        paymentMethod: PaymentMethod.CASH, // Refund method
        paymentDate: new Date(),
        reference: `REFUND_${refund.id}`,
        note: `Refund: ${refund.reason}`,
        createdBy: approvedBy,
      },
      { transaction: t }
    );

    // 8. Mark refund as COMPLETED
    refund.status = RefundStatus.COMPLETED;
    refund.completedDate = new Date();
    await refund.save({ transaction: t });

    await t.commit();

    return {
      refund,
      invoice,
      oldPaidAmount,
      newPaidAmount: invoice.paidAmount,
      oldPaymentStatus,
      newPaymentStatus: invoice.paymentStatus,
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Get revenue report grouped by payment method
 * For financial reconciliation and cash flow analysis
 */
export const getRevenueByPaymentMethodService = async (filters: {
  fromDate?: Date;
  toDate?: Date;
  doctorId?: number;
}) => {
  const invoiceWhere: any = {};
  const paymentWhere: any = {};

  // Date filter for invoices
  if (filters.fromDate || filters.toDate) {
    invoiceWhere.createdAt = {};
    if (filters.fromDate) {
      invoiceWhere.createdAt[Op.gte] = filters.fromDate;
    }
    if (filters.toDate) {
      invoiceWhere.createdAt[Op.lte] = filters.toDate;
    }
  }

  // Doctor filter
  if (filters.doctorId) {
    invoiceWhere.doctorId = filters.doctorId;
  }

  // Date filter for payments
  if (filters.fromDate || filters.toDate) {
    paymentWhere.paymentDate = {};
    if (filters.fromDate) {
      paymentWhere.paymentDate[Op.gte] = filters.fromDate;
    }
    if (filters.toDate) {
      paymentWhere.paymentDate[Op.lte] = filters.toDate;
    }
  }

  // Get payments grouped by method
  const paymentsByMethod = await Payment.findAll({
    where: paymentWhere,
    include: [
      {
        model: Invoice,
        as: "invoice",
        where: invoiceWhere,
        attributes: [],
      },
    ],
    attributes: [
      "paymentMethod",
      [sequelize.fn("COUNT", sequelize.col("Payment.id")), "transactionCount"],
      [sequelize.fn("SUM", sequelize.col("Payment.amount")), "totalAmount"],
      [sequelize.fn("AVG", sequelize.col("Payment.amount")), "averageAmount"],
      [sequelize.fn("MIN", sequelize.col("Payment.amount")), "minAmount"],
      [sequelize.fn("MAX", sequelize.col("Payment.amount")), "maxAmount"],
    ],
    group: ["paymentMethod"],
    raw: true,
  });

  // Calculate grand total
  const grandTotal = paymentsByMethod.reduce(
    (sum: number, item: any) => sum + parseFloat(item.totalAmount || 0),
    0
  );

  // Add percentage to each method
  const paymentSummary = paymentsByMethod.map((item: any) => ({
    paymentMethod: item.paymentMethod,
    transactionCount: parseInt(item.transactionCount),
    totalAmount: parseFloat(item.totalAmount || 0),
    averageAmount: parseFloat(item.averageAmount || 0),
    minAmount: parseFloat(item.minAmount || 0),
    maxAmount: parseFloat(item.maxAmount || 0),
    percentage: grandTotal > 0 ? (parseFloat(item.totalAmount || 0) / grandTotal) * 100 : 0,
  }));

  return {
    summary: paymentSummary,
    grandTotal,
    filters: {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      doctorId: filters.doctorId,
    },
  };
};

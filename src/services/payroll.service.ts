import { Transaction, Op, fn, col } from "sequelize";
import Payroll, { PayrollStatus } from "../models/Payroll";
import Attendance, { AttendanceStatus } from "../models/Attendance";
import Invoice, { PaymentStatus } from "../models/Invoice";
import User from "../models/User";
import Role from "../models/Role";
import sequelize from "../config/database";
import { generatePayrollCode } from "../utils/codeGenerator";
import { RoleCode } from "../constant/role";

/**
 * Hệ số lương theo role
 */
const ROLE_COEFFICIENTS: { [key: number]: number } = {
  [RoleCode.RECEPTIONIST]: 2.0, // Lễ tân
  [RoleCode.ADMIN]: 3.0, // Admin
  [RoleCode.DOCTOR]: 5.0, // Bác sĩ
  [RoleCode.PATIENT]: 0, // Patient không có lương
};

/**
 * Constants
 */
const BASE_SALARY = 2500000; // 2.5 triệu
const EXPERIENCE_BONUS_PER_YEAR = 200000; // 200k/năm
const ALLOWED_DAYS_OFF_PER_MONTH = 2; // 2 ngày/tháng
const PENALTY_PER_DAY = 200000; // 200k/ngày
const COMMISSION_RATE = 0.05; // 5% cho bác sĩ

/**
 * Tính số năm kinh nghiệm dựa trên ngày tạo user
 */
const calculateYearsOfService = (createdAt: Date): number => {
  const now = new Date();
  const years = now.getFullYear() - createdAt.getFullYear();
  return Math.max(0, years);
};

/**
 * Tính lương cho một nhân viên trong tháng
 */
export const calculatePayrollService = async (
  userId: number,
  month: number,
  year: number,
  adminId: number
) => {
  const t = await sequelize.transaction();

  try {
    // Validate month & year
    if (month < 1 || month > 12) {
      throw new Error("Invalid month. Must be between 1-12");
    }

    if (year < 2000 || year > 2100) {
      throw new Error("Invalid year");
    }

    // 1. Kiểm tra xem đã tồn tại payroll cho tháng này chưa
    const existingPayroll = await Payroll.findOne({
      where: { userId, month, year },
      transaction: t,
    });

    if (existingPayroll) {
      throw new Error(`Payroll already exists for user ${userId} in ${month}/${year}`);
    }

    // 2. Lấy thông tin user với role
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: "role" }],
      transaction: t,
    });

    if (!user) {
      throw new Error("User not found");
    }

    // 3. Lấy hệ số role
    const roleCoefficient = ROLE_COEFFICIENTS[user.roleId] || 0;

    if (roleCoefficient === 0) {
      throw new Error("This user role is not eligible for payroll");
    }

    // 4. Tính số năm kinh nghiệm
    const yearsOfService = calculateYearsOfService(user.createdAt!);
    const experienceBonus = yearsOfService * EXPERIENCE_BONUS_PER_YEAR;

    // 5. Tính lương cơ bản theo role
    const roleSalary = BASE_SALARY * roleCoefficient;

    // 6. Tính hoa hồng (chỉ cho DOCTOR)
    let totalInvoices = 0;
    let commission = 0;

    if (user.roleId === RoleCode.DOCTOR) {
      // Tìm doctor ID từ userId
      const doctor = await sequelize.models.Doctor.findOne({
        where: { userId },
        transaction: t,
      });

      if (doctor) {
        // Tính tổng hóa đơn đã thanh toán trong tháng
        const startDate = new Date(year, month - 1, 1); // First day of month
        const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

        const result = await Invoice.findOne({
          where: {
            doctorId: (doctor as any).id,
            paymentStatus: PaymentStatus.PAID,
            createdAt: {
              [Op.gte]: startDate,
              [Op.lte]: endDate,
            },
          },
          attributes: [[fn("SUM", col("totalAmount")), "total"]],
          transaction: t,
          raw: true,
        });

        totalInvoices = parseFloat((result as any)?.total || "0");
        commission = totalInvoices * COMMISSION_RATE;
      }
    }

    // 7. Tính số ngày nghỉ và phạt
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const daysOffCount = await Attendance.count({
      where: {
        userId,
        date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
        status: {
          [Op.in]: [AttendanceStatus.ABSENT, AttendanceStatus.LEAVE],
        },
      },
      transaction: t,
    });

    const penaltyDaysOff = Math.max(0, daysOffCount - ALLOWED_DAYS_OFF_PER_MONTH);
    const penaltyAmount = penaltyDaysOff * PENALTY_PER_DAY;

    // 8. Tính tổng lương
    const grossSalary = roleSalary + experienceBonus + commission;
    const netSalary = grossSalary - penaltyAmount;

    // 9. Generate payroll code
    const payrollCode = await generatePayrollCode(year, month);

    // 10. Tạo Payroll record
    const payroll = await Payroll.create(
      {
        payrollCode,
        userId,
        month,
        year,
        baseSalary: BASE_SALARY,
        roleCoefficient,
        roleSalary,
        yearsOfService,
        experienceBonus,
        totalInvoices,
        commissionRate: user.roleId === RoleCode.DOCTOR ? COMMISSION_RATE : 0,
        commission,
        daysOff: daysOffCount,
        allowedDaysOff: ALLOWED_DAYS_OFF_PER_MONTH,
        penaltyDaysOff,
        penaltyAmount,
        grossSalary,
        netSalary,
        status: PayrollStatus.DRAFT,
      },
      { transaction: t }
    );

    await t.commit();

    // Reload with associations
    return await Payroll.findByPk(payroll.id, {
      include: [
        { association: "user", include: [{ model: Role, as: "role" }] },
      ],
    });
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Tính lương cho tất cả nhân viên trong tháng
 */
export const calculatePayrollForAllService = async (
  month: number,
  year: number,
  adminId: number
) => {
  // Lấy danh sách tất cả users có role ADMIN, RECEPTIONIST, DOCTOR
  const eligibleUsers = await User.findAll({
    where: {
      roleId: {
        [Op.in]: [RoleCode.ADMIN, RoleCode.RECEPTIONIST, RoleCode.DOCTOR],
      },
      isActive: true,
    },
  });

  const results = [];
  const errors = [];

  for (const user of eligibleUsers) {
    try {
      const payroll = await calculatePayrollService(user.id, month, year, adminId);
      results.push(payroll);
    } catch (error: any) {
      errors.push({
        userId: user.id,
        email: user.email,
        error: error.message,
      });
    }
  }

  return {
    success: results,
    errors,
    total: eligibleUsers.length,
    calculated: results.length,
    failed: errors.length,
  };
};

/**
 * Lấy danh sách payrolls (Admin only)
 */
export const getPayrollsService = async (filters: {
  page?: number;
  limit?: number;
  month?: number;
  year?: number;
  userId?: number;
  status?: PayrollStatus;
}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const where: any = {};

  if (filters.month) {
    where.month = filters.month;
  }

  if (filters.year) {
    where.year = filters.year;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const { count, rows } = await Payroll.findAndCountAll({
    where,
    include: [
      { association: "user", include: [{ model: Role, as: "role" }] },
      { association: "approver" },
    ],
    order: [
      ["year", "DESC"],
      ["month", "DESC"],
      ["createdAt", "DESC"],
    ],
    limit,
    offset,
  });

  return {
    payrolls: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

/**
 * Lấy payrolls của chính mình
 */
export const getMyPayrollsService = async (userId: number) => {
  return await Payroll.findAll({
    where: { userId },
    include: [
      { association: "user", include: [{ model: Role, as: "role" }] },
      { association: "approver" },
    ],
    order: [
      ["year", "DESC"],
      ["month", "DESC"],
    ],
  });
};

/**
 * Lấy chi tiết payroll
 */
export const getPayrollByIdService = async (payrollId: number) => {
  const payroll = await Payroll.findByPk(payrollId, {
    include: [
      { association: "user", include: [{ model: Role, as: "role" }] },
      { association: "approver" },
    ],
  });

  if (!payroll) {
    throw new Error("Payroll not found");
  }

  return payroll;
};

/**
 * Duyệt lương (Admin only)
 */
export const approvePayrollService = async (
  payrollId: number,
  adminId: number
) => {
  const t = await sequelize.transaction();

  try {
    const payroll = await Payroll.findByPk(payrollId, {
      transaction: t,
      lock: true,
    });

    if (!payroll) {
      throw new Error("Payroll not found");
    }

    if (payroll.status !== PayrollStatus.DRAFT) {
      throw new Error(
        `Cannot approve payroll with status ${payroll.status}. Must be DRAFT`
      );
    }

    payroll.status = PayrollStatus.APPROVED;
    payroll.approvedBy = adminId;
    payroll.approvedAt = new Date();

    await payroll.save({ transaction: t });

    await t.commit();

    return await getPayrollByIdService(payrollId);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Đánh dấu đã thanh toán (Admin only)
 */
export const payPayrollService = async (payrollId: number, adminId: number) => {
  const t = await sequelize.transaction();

  try {
    const payroll = await Payroll.findByPk(payrollId, {
      transaction: t,
      lock: true,
    });

    if (!payroll) {
      throw new Error("Payroll not found");
    }

    if (payroll.status !== PayrollStatus.APPROVED) {
      throw new Error(
        `Cannot pay payroll with status ${payroll.status}. Must be APPROVED`
      );
    }

    payroll.status = PayrollStatus.PAID;
    payroll.paidAt = new Date();

    await payroll.save({ transaction: t });

    await t.commit();

    return await getPayrollByIdService(payrollId);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Lấy lịch sử lương của một user
 */
export const getUserPayrollHistoryService = async (userId: number) => {
  return await Payroll.findAll({
    where: { userId },
    include: [
      { association: "user", include: [{ model: Role, as: "role" }] },
      { association: "approver" },
    ],
    order: [
      ["year", "DESC"],
      ["month", "DESC"],
    ],
  });
};

/**
 * Thống kê lương
 */
export const getPayrollStatisticsService = async (filters: {
  month?: number;
  year?: number;
}) => {
  const where: any = {};

  if (filters.month) {
    where.month = filters.month;
  }

  if (filters.year) {
    where.year = filters.year;
  }

  const payrolls = await Payroll.findAll({
    where,
    attributes: [
      "status",
      [fn("COUNT", col("id")), "count"],
      [fn("SUM", col("grossSalary")), "totalGross"],
      [fn("SUM", col("netSalary")), "totalNet"],
      [fn("SUM", col("commission")), "totalCommission"],
      [fn("SUM", col("penaltyAmount")), "totalPenalty"],
    ],
    group: ["status"],
    raw: true,
  });

  return payrolls;
};

import { Transaction, Op, fn, col } from "sequelize";
import Payroll, { PayrollStatus } from "../models/Payroll";
import Attendance, { AttendanceStatus } from "../models/Attendance";
import Invoice, { PaymentStatus } from "../models/Invoice";
import User from "../models/User";
import Role from "../models/Role";
import Employee from "../models/Employee";
import sequelize from "../config/database";
import { generatePayrollCode } from "../utils/codeGenerator";
import { RoleCode } from "../constant/role";
import { createNotification } from "./notification.service";
import { NotificationType } from "../models/Notification";

/**
 * =================================================================================================
 * PAYROLL BUSINESS RULES (QUY TẮC TÍNH LƯƠNG)
 * Verified against System Requirements:
 * 
 * 1. BASE SALARY (Lương cơ sở): FIXED at 2,500,000 VNĐ.
 * 
 * 2. COEFFICIENTS (Hệ số):
 *    - RECEPTIONIST (Lễ tân): Initial = 2.0, Increase = 0.2/year.
 *    - DOCTOR (Bác sĩ): Initial = 5.0, Increase = 0.4/year.
 *    - Formula: Current Coeff = Initial + (YearsOfService * Increase).
 * 
 * 3. SALARY FORMULAS (Công thức lương):
 *    - RECEPTIONIST: Salary = Base Salary * Current Coefficient.
 *    - DOCTOR: Salary = (Base Salary * Current Coefficient) + Commission.
 * 
 * 4. COMMISSION (Hoa hồng - Doctor only):
 *    - 5% of total value of PAID invoices handled by the doctor in the month.
 * 
 * 5. LEAVE & PENALTY (Nghỉ phép & Phạt):
 *    - Limits: Receptionist (10 days/year), Doctor (15 days/year).
 *    - Penalty: 200,000 VNĐ per day exceeding the annual limit.
 *    - Logic: Check total days off in current year. If > Limit, subtract penalty.
 * 
 * =================================================================================================
 */

/**
 * Constants & Configs
 */
const BASE_SALARY = 2500000; // 2.5 triệu VNĐ

interface RoleConfig {
  initialCoefficient: number;
  experienceIncrease: number; // Hệ số tăng thêm mỗi năm
  maxLeaveDaysPerYear: number; // Số ngày nghỉ tối đa/năm
}

const ROLE_CONFIGS: { [key: number]: RoleConfig } = {
  [RoleCode.RECEPTIONIST]: {
    initialCoefficient: 2.0,
    experienceIncrease: 0.2,
    maxLeaveDaysPerYear: 10,
  },
  [RoleCode.DOCTOR]: {
    initialCoefficient: 5.0,
    experienceIncrease: 0.4,
    maxLeaveDaysPerYear: 15,
  },
  // Default values for other roles if needed
  [RoleCode.ADMIN]: {
    initialCoefficient: 3.0,
    experienceIncrease: 0.0,
    maxLeaveDaysPerYear: 12, // Default
  }
};

const PENALTY_PER_DAY = 200000; // 200k/ngày quá hạn
const COMMISSION_RATE = 0.05; // 5% cho bác sĩ

/**
 * Tính số năm kinh nghiệm (Theo ngày vào làm)
 * Tính chính xác theo ngày tháng.
 * Ví dụ: Vào làm 15/02/2023.
 * - Tính lương tháng 1/2025 (Chốt 31/01/2025): Chưa đủ 2 năm (1 năm 11 tháng) -> 1 năm.
 * - Tính lương tháng 2/2025 (Chốt 28/02/2025): Đã đủ 2 năm -> 2 năm.
 */
const calculateYearsOfService = (startDate: Date | string, targetDate: Date): number => {
  const start = new Date(startDate);
  const now = targetDate;
  
  let years = now.getFullYear() - start.getFullYear();
  const m = now.getMonth() - start.getMonth();
  
  // Nếu chưa đến tháng sinh nhật làm việc hoặc cùng tháng nhưng chưa đến ngày
  if (m < 0 || (m === 0 && now.getDate() < start.getDate())) {
    years--;
  }

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
    if (month < 1 || month > 12) throw new Error("Invalid month. Must be between 1-12");
    if (year < 2000 || year > 2100) throw new Error("Invalid year");

    // Ngày chốt tính lương (Cuối tháng)
    const payrollEndDate = new Date(year, month, 0); 

    // 1. Kiểm tra xem đã tồn tại payroll cho tháng này chưa
    // 1. Kiểm tra xem đã tồn tại payroll cho tháng này chưa
    const existingPayroll = await Payroll.findOne({
      where: { userId, month, year },
      transaction: t,
    });

    if (existingPayroll) {
      if (existingPayroll.status !== PayrollStatus.PAID) {
        // Cho phép tính toán lại nếu chưa thanh toán (Nháp hoặc Đã duyệt)
        await existingPayroll.destroy({ transaction: t });
      } else {
        throw new Error(`Payroll already exists for user ${userId} in ${month}/${year} and is already PAID`);
      }
    }

    // 2. Lấy thông tin user và employee
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: "role" }],
      transaction: t,
    });

    if (!user) throw new Error("User not found");

    const employee = await Employee.findOne({
      where: { userId: user.id },
      transaction: t,
    });

    // Config cho role hiện tại (Nếu không có config thì lấy mặc định hoặc return)
    const config = ROLE_CONFIGS[user.roleId];
    
    // EXCLUDE ADMIN AND PATIENT from payroll
    if (user.roleId === RoleCode.PATIENT || user.roleId === RoleCode.ADMIN) {
       throw new Error(`Role ${user.roleId === RoleCode.ADMIN ? 'Administrator' : 'Patient'} is not eligible for payroll`);
    }

    if (!config) {
        // Fallback or error? Assuming basic config for others or error.
       // Let's use a safe fallback or throw.
       if (![RoleCode.RECEPTIONIST, RoleCode.DOCTOR].includes(user.roleId)) {
          throw new Error("This user role is not eligible for payroll");
       }
    }

    // 3. Tính thâm niên (Năm kinh nghiệm)
    // TÍNH TẠI THỜI ĐIỂM CUỐI THÁNG LƯƠNG (để đảm bảo tính đúng mốc thâm niên của tháng đó)
    const startDateForExp = employee?.joiningDate || user.createdAt!;
    const yearsOfService = calculateYearsOfService(startDateForExp, payrollEndDate);

    // 4. Tính Hệ số hiện tại
    // HeSo = KhoiDiem + (NamKinhNghiem * HeSoTangThem)
    const currentCoefficient = config.initialCoefficient + (yearsOfService * config.experienceIncrease);

    // 5. Tính lương cơ bản
    // Lương = 2,500,000 * Hệ số
    const roleSalary = BASE_SALARY * currentCoefficient; 
    
    // Calculate experience bonus value for reference/breakdown
    // Note: For RECEPTIONIST, the User request strictly specifies "Base * Coefficient", 
    // implying no separate "bonus" columns should confuse the total.
    // We already do Gross = RoleSalary (which includes exp) + Commission.
    // We will keep experienceBonusAmount as metadata for others, but for Receptionist 
    // we can explicitly set it to 0 or leave it as derived metadata.
    // Since the frontend shows "Included", keeping it as metadata is fine, 
    // but clearly commenting `grossSalary` calculation below is key.
    
    // We will keep this calculated for detailed breakdown if needed, 
    // but ensure it is NOT added to grossSalary (it is already in roleSalary via coefficient).
    const experienceBonusAmount = (yearsOfService * config.experienceIncrease) * BASE_SALARY;

    // 6. Tính hoa hồng (Chỉ cho DOCTOR)
    let totalInvoices = 0;
    let commission = 0;

    if (user.roleId === RoleCode.DOCTOR) {
      // Tìm doctor info
      const doctor = await sequelize.models.Doctor.findOne({
        where: { userId },
        transaction: t,
      });

      if (doctor) {
        // Tính tổng hóa đơn đã thanh toán trong tháng
        const startOfMonth = new Date(year, month - 1, 1); 
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        const result = await Invoice.findOne({
          where: {
            doctorId: (doctor as any).id,
            paymentStatus: PaymentStatus.PAID,
            updatedAt: { // Use updatedAt (payment time) or createdAt? Usually payment time. 
              [Op.gte]: startOfMonth,
              [Op.lte]: endOfMonth,
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

    // 7. Tính ngày nghỉ và phạt (Theo năm)
    const startOfYear = new Date(year, 0, 1); // Jan 1st
    const endOfCalculationMonth = new Date(year, month, 0, 23, 59, 59); // End of current payroll month

    // Tổng số ngày nghỉ từ đầu năm đến hết tháng này
    const totalDaysOffThisYear = await Attendance.count({
      where: {
        userId,
        date: {
          [Op.gte]: startOfYear,
          [Op.lte]: endOfCalculationMonth,
        },
        status: {
          [Op.in]: [AttendanceStatus.ABSENT, AttendanceStatus.LEAVE],
        },
      },
      transaction: t,
    });

    // Số ngày nghỉ trong tháng này (để lưu vào record payroll)
    const startOfMonth = new Date(year, month - 1, 1);
    const daysOffThisMonth = await Attendance.count({
      where: {
        userId,
        date: {
          [Op.gte]: startOfMonth,
          [Op.lte]: endOfCalculationMonth,
        },
        status: {
          [Op.in]: [AttendanceStatus.ABSENT, AttendanceStatus.LEAVE],
        },
      },
      transaction: t,
    });

    // Tính số ngày bị phạt trong tháng này
    // Logic: 
    // 1. Số ngày được phép còn lại TRƯỚC tháng này = Max(Allowed - (TotalYear - ThisMonth), 0)
    // 2. Số ngày quá hạn trong tháng này = ThisMonth - RemainingAllowed
    // Hoặc đơn giản: 
    // ExcessDaysTotal = Max(0, TotalYear - Allowed)
    // ExcessDaysBefore = Max(0, (TotalYear - ThisMonth) - Allowed)
    // PenaltyDaysCurrentMonth = ExcessDaysTotal - ExcessDaysBefore
    
    const daysOffBeforeThisMonth = totalDaysOffThisYear - daysOffThisMonth;
    const excessDaysTotal = Math.max(0, totalDaysOffThisYear - config.maxLeaveDaysPerYear);
    const excessDaysBefore = Math.max(0, daysOffBeforeThisMonth - config.maxLeaveDaysPerYear);
    const penaltyDaysOff = excessDaysTotal - excessDaysBefore;

    const penaltyAmount = penaltyDaysOff * PENALTY_PER_DAY;

    // 8. Tổng lương
    // Lương = (Lương cơ sở * Hệ số) + Hoa hồng - Phạt
    // Note: User formula for doctor: Base * Coeff + Commission. 
    // User formula for receptionist: Base * Coeff.
    // Penalty is applied for both if excess leave.
    const grossSalary = roleSalary + commission;
    const netSalary = grossSalary - penaltyAmount;

    // 9. Generate Code
    const payrollCode = await generatePayrollCode(year, month);

    // 10. Create Record
    const payroll = await Payroll.create(
      {
        payrollCode,
        userId,
        month,
        year,
        baseSalary: BASE_SALARY,
        roleCoefficient: currentCoefficient,
        roleSalary,
        yearsOfService,
        experienceBonus: experienceBonusAmount, // Saving for detailed breakdown
        totalInvoices,
        commissionRate: user.roleId === RoleCode.DOCTOR ? COMMISSION_RATE : 0,
        commission,
        daysOff: daysOffThisMonth,
        allowedDaysOff: config.maxLeaveDaysPerYear, // Lưu giới hạn năm để tham khảo
        penaltyDaysOff,
        penaltyAmount,
        grossSalary,
        netSalary,
        status: PayrollStatus.DRAFT,
      },
      { transaction: t }
    );

    await t.commit();

    return await Payroll.findByPk(payroll.id, {
      include: [
        { association: "user", include: [{ model: Role, as: "role" }, { model: Employee, as: "employee" }] },
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
        [Op.in]: [RoleCode.RECEPTIONIST, RoleCode.DOCTOR],
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
      { association: "user", include: [{ model: Role, as: "role" }, { model: Employee, as: "employee" }] },
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
      { association: "user", include: [{ model: Role, as: "role" }, { model: Employee, as: "employee" }] },
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
      { association: "user", include: [{ model: Role, as: "role" }, { model: Employee, as: "employee" }] },
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

    // Gửi thông báo cho nhân viên
    try {
      await createNotification({
        userId: payroll.userId,
        type: NotificationType.SYSTEM,
        title: "Bảng lương đã được phê duyệt",
        message: `Bảng lương tháng ${payroll.month}/${payroll.year} của bạn đã được phê duyệt. Thực nhận: ${Number(payroll.netSalary).toLocaleString("vi-VN")} VNĐ.`,
      });
    } catch (notifError) {
      console.error("Failed to send payroll notification:", notifError);
    }

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
      { association: "user", include: [{ model: Role, as: "role" }, { model: Employee, as: "employee" }] },
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

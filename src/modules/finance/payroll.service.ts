import { Transaction, Op, fn, col } from "sequelize";
import Payroll, { PayrollStatus } from "../../models/Payroll";
import Attendance, { AttendanceStatus } from "../../models/Attendance";
import Invoice, { PaymentStatus } from "../../models/Invoice";
import User from "../../models/User";
import Role from "../../models/Role";
import Employee from "../../models/Employee";
import sequelize from "../../config/database";
import { generatePayrollCode } from "../../utils/codeGenerator";
import { RoleCode } from "../../constant/role";
import { createNotification } from "../notification/notification.service";
import { NotificationType } from "../../models/Notification";




const BASE_SALARY = 2500000; 

interface RoleConfig {
  initialCoefficient: number;
  experienceIncrease: number; 
  maxLeaveDaysPerYear: number; 
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
  
  [RoleCode.ADMIN]: {
    initialCoefficient: 3.0,
    experienceIncrease: 0.0,
    maxLeaveDaysPerYear: 12, 
  }
};

const PENALTY_PER_DAY = 200000; 
const COMMISSION_RATE = 0.05; 


const calculateYearsOfService = (startDate: Date | string, targetDate: Date): number => {
  const start = new Date(startDate);
  const now = targetDate;
  
  let years = now.getFullYear() - start.getFullYear();
  const m = now.getMonth() - start.getMonth();
  
  
  if (m < 0 || (m === 0 && now.getDate() < start.getDate())) {
    years--;
  }

  return Math.max(0, years);
};


export const calculatePayrollService = async (
  userId: number,
  month: number,
  year: number,
  adminId: number
) => {
  const t = await sequelize.transaction();

  try {
    
    if (month < 1 || month > 12) throw new Error("Invalid month. Must be between 1-12");
    if (year < 2000 || year > 2100) throw new Error("Invalid year");

    
    const payrollEndDate = new Date(year, month, 0); 

    
    
    const existingPayroll = await Payroll.findOne({
      where: { userId, month, year },
      transaction: t,
    });

    if (existingPayroll) {
      if (existingPayroll.status !== PayrollStatus.PAID) {
        
        await existingPayroll.destroy({ transaction: t });
      } else {
        throw new Error(`Payroll already exists for user ${userId} in ${month}/${year} and is already PAID`);
      }
    }

    
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: "role" }],
      transaction: t,
    });

    if (!user) throw new Error("User not found");

    const employee = await Employee.findOne({
      where: { userId: user.id },
      transaction: t,
    });

    
    const config = ROLE_CONFIGS[user.roleId];
    
    
    if (user.roleId === RoleCode.PATIENT || user.roleId === RoleCode.ADMIN) {
       throw new Error(`Role ${user.roleId === RoleCode.ADMIN ? 'Administrator' : 'Patient'} is not eligible for payroll`);
    }

    if (!config) {
        
       
       if (![RoleCode.RECEPTIONIST, RoleCode.DOCTOR].includes(user.roleId)) {
          throw new Error("This user role is not eligible for payroll");
       }
    }

    
    
    const startDateForExp = employee?.joiningDate || user.createdAt!;
    const yearsOfService = calculateYearsOfService(startDateForExp, payrollEndDate);

    
    
    const currentCoefficient = config.initialCoefficient + (yearsOfService * config.experienceIncrease);

    
    
    const roleSalary = BASE_SALARY * currentCoefficient; 
    
    
    
    
    
    
    
    
    
    
    
    
    const experienceBonusAmount = (yearsOfService * config.experienceIncrease) * BASE_SALARY;

    
    let totalInvoices = 0;
    let commission = 0;

    if (user.roleId === RoleCode.DOCTOR) {
      
      const doctor = await sequelize.models.Doctor.findOne({
        where: { userId },
        transaction: t,
      });

      if (doctor) {
        
        const startOfMonth = new Date(year, month - 1, 1); 
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        const result = await Invoice.findOne({
          where: {
            doctorId: (doctor as any).id,
            paymentStatus: PaymentStatus.PAID,
            updatedAt: { 
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

    
    const startOfYear = new Date(year, 0, 1); 
    const endOfCalculationMonth = new Date(year, month, 0, 23, 59, 59); 

    
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

    
    
    
    
    
    
    
    
    
    const daysOffBeforeThisMonth = totalDaysOffThisYear - daysOffThisMonth;
    const excessDaysTotal = Math.max(0, totalDaysOffThisYear - config.maxLeaveDaysPerYear);
    const excessDaysBefore = Math.max(0, daysOffBeforeThisMonth - config.maxLeaveDaysPerYear);
    const penaltyDaysOff = excessDaysTotal - excessDaysBefore;

    const penaltyAmount = penaltyDaysOff * PENALTY_PER_DAY;

    
    
    
    
    
    const grossSalary = roleSalary + commission;
    const netSalary = grossSalary - penaltyAmount;

    
    const payrollCode = await generatePayrollCode(year, month);

    
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
        experienceBonus: experienceBonusAmount, 
        totalInvoices,
        commissionRate: user.roleId === RoleCode.DOCTOR ? COMMISSION_RATE : 0,
        commission,
        daysOff: daysOffThisMonth,
        allowedDaysOff: config.maxLeaveDaysPerYear, 
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


export const calculatePayrollForAllService = async (
  month: number,
  year: number,
  adminId: number
) => {
  
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

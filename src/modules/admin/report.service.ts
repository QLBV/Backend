import { Op, fn, col, literal } from "sequelize";
import Invoice from "../../models/Invoice";
import InvoiceItem from "../../models/InvoiceItem";
import Payroll from "../../models/Payroll";
import Medicine from "../../models/Medicine";
import Patient from "../../models/Patient";
import PrescriptionDetail from "../../models/PrescriptionDetail";
import Appointment from "../../models/Appointment";
import Visit from "../../models/Visit";
import User from "../../models/User";
import Role from "../../models/Role";
import Doctor from "../../models/Doctor";

interface RevenueReportFilters {
  year: number;
  month?: number;
}

interface ExpenseReportFilters {
  year: number;
  month?: number;
}

export const getRevenueReportService = async (filters: RevenueReportFilters) => {
  const { year, month } = filters;

  let startDate: Date;
  let endDate: Date;

  if (month) {
    
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 1);
  } else {
    
    startDate = new Date(year, 0, 1);
    endDate = new Date(year + 1, 0, 1);
  }

  
  const totalRevenue = await Invoice.sum("totalAmount", {
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
      paymentStatus: "PAID",
    },
  });

  
  const collectedRevenue = await Invoice.sum("paidAmount", {
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
  });

  
  const uncollectedRevenue = (totalRevenue || 0) - (collectedRevenue || 0);

  
  const totalInvoices = await Invoice.count({
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
  });

  
  const revenueByStatus = await Invoice.findAll({
    attributes: [
      "paymentStatus",
      [fn("COUNT", col("Invoice.id")), "count"],
      [fn("SUM", col("Invoice.totalAmount")), "totalAmount"],
      [fn("SUM", col("Invoice.paidAmount")), "paidAmount"],
    ],
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
    group: ["paymentStatus"],
    raw: true,
  });

  
  let revenueOverTime: any[] = [];

  if (month) {
    
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(year, month - 1, day);
      const dayEnd = new Date(year, month - 1, day + 1);

      const revenue = await Invoice.sum("totalAmount", {
        where: {
          createdAt: {
            [Op.gte]: dayStart,
            [Op.lt]: dayEnd,
          },
          paymentStatus: "PAID",
        },
      });

      revenueOverTime.push({
        period: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        revenue: revenue || 0,
      });
    }
  } else {
    
    for (let m = 1; m <= 12; m++) {
      const monthStart = new Date(year, m - 1, 1);
      const monthEnd = new Date(year, m, 1);

      const revenue = await Invoice.sum("totalAmount", {
        where: {
          createdAt: {
            [Op.gte]: monthStart,
            [Op.lt]: monthEnd,
          },
          paymentStatus: "PAID",
        },
      });

      revenueOverTime.push({
        period: `${year}-${String(m).padStart(2, "0")}`,
        revenue: revenue || 0,
      });
    }
  }

  return {
    summary: {
      totalRevenue: totalRevenue || 0,
      collectedRevenue: collectedRevenue || 0,
      uncollectedRevenue,
      totalInvoices,
      averageInvoiceValue: totalInvoices > 0 ? (totalRevenue || 0) / totalInvoices : 0,
    },
    byStatus: revenueByStatus,
    overTime: revenueOverTime,
  };
};


export const getExpenseReportService = async (filters: ExpenseReportFilters) => {
  const { year, month } = filters;

  let startDate: Date;
  let endDate: Date;

  if (month) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 1);
  } else {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year + 1, 0, 1);
  }

  
  const medicineExpense = await InvoiceItem.sum("subtotal", {
    where: {
      itemType: "MEDICINE",
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
  });

  
  const salaryExpense = await Payroll.sum("netSalary", {
    where: {
      year: year,
      ...(month && { month }),
      status: {
        [Op.in]: ["APPROVED", "PAID"],
      },
    },
  });

  
  const totalExpense = (medicineExpense || 0) + (salaryExpense || 0);

  
  const expenseOverTime: any[] = [];

  if (month) {
    
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(year, month - 1, day);
      const dayEnd = new Date(year, month - 1, day + 1);

      const medicineExp = await InvoiceItem.sum("subtotal", {
        where: {
          itemType: "MEDICINE",
          createdAt: {
            [Op.gte]: dayStart,
            [Op.lt]: dayEnd,
          },
        },
      });

      
      
      let salaryExp = 0;
      if (day === daysInMonth) {
        salaryExp = salaryExpense || 0;
      }

      expenseOverTime.push({
        period: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        medicineExpense: medicineExp || 0,
        salaryExpense: salaryExp,
        totalExpense: (medicineExp || 0) + salaryExp,
      });
    }
  } else {
    
    for (let m = 1; m <= 12; m++) {
      const monthStart = new Date(year, m - 1, 1);
      const monthEnd = new Date(year, m, 1);

      const medicineExp = await InvoiceItem.sum("subtotal", {
        where: {
          itemType: "MEDICINE",
          createdAt: {
            [Op.gte]: monthStart,
            [Op.lt]: monthEnd,
          },
        },
      });

      const salaryExp = await Payroll.sum("netSalary", {
        where: {
          year: year,
          month: m,
          status: {
            [Op.in]: ["APPROVED", "PAID"],
          },
        },
      });

      expenseOverTime.push({
        period: `${year}-${String(m).padStart(2, "0")}`,
        medicineExpense: medicineExp || 0,
        salaryExpense: salaryExp || 0,
        totalExpense: (medicineExp || 0) + (salaryExp || 0),
      });
    }
  }

  
  const salaryExpenseByRole = await Payroll.findAll({
    attributes: [
      [col("user.role.name"), "roleName"],
      [fn("SUM", col("Payroll.netSalary")), "totalSalary"],
      [fn("COUNT", col("Payroll.id")), "count"],
    ],
    where: {
      year,
      ...(month && { month }),
      status: {
        [Op.in]: ["APPROVED", "PAID"],
      },
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: [], 
        include: [
          {
            model: Role,
            as: "role",
            attributes: [], 
          },
        ],
      },
    ],
    group: ["user.role.name"],
    subQuery: false,
    raw: true,
  });

  return {
    summary: {
      totalExpense,
      medicineExpense: medicineExpense || 0,
      salaryExpense: salaryExpense || 0,
      medicinePercentage: totalExpense > 0 ? ((medicineExpense || 0) / totalExpense) * 100 : 0,
      salaryPercentage: totalExpense > 0 ? ((salaryExpense || 0) / totalExpense) * 100 : 0,
    },
    overTime: expenseOverTime,
    expenseTrends: expenseOverTime.map(item => ({
      period: item.period,
      medicineExpense: item.medicineExpense,
      salaryExpense: item.salaryExpense,
      totalExpense: item.totalExpense
    })),
    salaryByRole: salaryExpenseByRole.map((item: any) => {
      return {
        role: item.roleName || "Unknown",
        totalSalary: parseFloat(item.totalSalary) || 0,
        count: parseInt(item.count) || 0,
      };
    }),
  };
};


export const getTopMedicinesReportService = async (filters: { year: number; month?: number; limit?: number }) => {
  const { year, month, limit = 10 } = filters;

  let startDate: Date;
  let endDate: Date;

  if (month) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 1);
  } else {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year + 1, 0, 1);
  }

  
  const topMedicines = await PrescriptionDetail.findAll({
    attributes: [
      "medicineId",
      [fn("SUM", col("PrescriptionDetail.quantity")), "totalQuantity"],
      [fn("COUNT", col("PrescriptionDetail.id")), "prescriptionCount"],
    ],
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
    include: [
      {
        model: Medicine,
        as: "Medicine",
        attributes: ["name", "medicineCode", "unit", "salePrice"],
      },
    ],
    group: [
      "medicineId",
      "Medicine.id",
      "Medicine.name",
      "Medicine.medicineCode",
      "Medicine.unit",
      "Medicine.salePrice",
    ],
    order: [[literal("totalQuantity"), "DESC"]],
    limit,
    subQuery: false,
    raw: true,
    nest: true
  });

  return {
    topMedicines: topMedicines.map((item: any) => ({
      medicine: {
        id: item.medicineId,
        name: item.Medicine?.name,
        code: item.Medicine?.medicineCode,
        unit: item.Medicine?.unit,
        unitPrice: item.Medicine?.salePrice,
      },
      totalQuantity: parseFloat(item.totalQuantity) || 0,
      prescriptionCount: parseInt(item.prescriptionCount) || 0,
      estimatedRevenue:
        (parseFloat(item.totalQuantity) || 0) * (item.Medicine?.salePrice || 0),
    })),
  };
};


export const getMedicineAlertsReportService = async (filters: { daysUntilExpiry?: number; minStock?: number }) => {
  const { daysUntilExpiry = 30, minStock = 10 } = filters;

  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

  
  const expiringMedicines = await Medicine.findAll({
    where: {
      expiryDate: {
        [Op.gte]: today,
        [Op.lte]: expiryDate,
      },
    },
    order: [["expiryDate", "ASC"]],
  });

  
  const lowStockMedicines = await Medicine.findAll({
    where: {
      quantity: {
        [Op.lte]: minStock,
      },
      expiryDate: {
        [Op.gte]: today, 
      },
    },
    order: [["quantity", "ASC"]],
  });

  
  const expiredMedicines = await Medicine.findAll({
    where: {
      expiryDate: {
        [Op.lt]: today,
      },
    },
    order: [["expiryDate", "DESC"]],
  });

  
  const urgentCount = lowStockMedicines.length + 
    expiringMedicines.filter(med => {
      const daysLeft = Math.floor((new Date(med.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7;
    }).length;

  return {
    lowStockMedicines: lowStockMedicines.map((med) => ({
      id: med.id,
      medicineCode: med.medicineCode,
      medicineName: med.name,
      currentQuantity: med.quantity,
      minStockLevel: 10, 
      alertType: 'low-stock' as const,
    })),
    expiringMedicines: expiringMedicines.map((med) => ({
      id: med.id,
      medicineCode: med.medicineCode,
      medicineName: med.name,
      currentQuantity: med.quantity,
      minStockLevel: 10,
      expiryDate: med.expiryDate,
      daysUntilExpiry: Math.floor(
        (new Date(med.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      ),
      alertType: 'expiring' as const,
    })),
    expiredMedicines: expiredMedicines.map((med) => ({
      id: med.id,
      medicineCode: med.medicineCode,
      medicineName: med.name,
      currentQuantity: med.quantity,
      minStockLevel: 10,
      expiryDate: med.expiryDate,
      alertType: 'expired' as const,
    })),
    summary: {
      totalLowStock: lowStockMedicines.length,
      totalExpiring: expiringMedicines.length,
      totalExpired: expiredMedicines.length,
      urgentCount,
    },
  };
};


export const getPatientsByGenderReportService = async () => {
  
  const genderStats = await Patient.findAll({
    attributes: [
      "gender",
      [fn("COUNT", col("Patient.id")), "count"],
    ],
    group: ["gender"],
    raw: true,
  });

  const total = genderStats.reduce((sum: number, item: any) => sum + parseInt(item.count), 0);

  
  const ageStats: any = await Patient.findAll({
    attributes: [
      "gender",
      [fn("AVG", literal("YEAR(CURDATE()) - YEAR(dateOfBirth)")), "avgAge"],
    ],
    group: ["gender"],
    raw: true,
  });

  return {
    total,
    byGender: genderStats.map((item: any) => {
      const ageData = ageStats.find((age: any) => age.gender === item.gender);
      return {
        gender: item.gender || "UNKNOWN",
        count: parseInt(item.count),
        percentage: total > 0 ? (parseInt(item.count) / total) * 100 : 0,
        averageAge: ageData && ageData.avgAge ? Math.round(parseFloat(ageData.avgAge)) : null,
      };
    }),
  };
};


export const getProfitReportService = async (filters: { year: number; month?: number }) => {
  const revenueData = await getRevenueReportService(filters);
  const expenseData = await getExpenseReportService(filters);

  const profit = revenueData.summary.totalRevenue - expenseData.summary.totalExpense;
  const profitMargin =
    revenueData.summary.totalRevenue > 0
      ? (profit / revenueData.summary.totalRevenue) * 100
      : 0;

  
  const profitOverTime = revenueData.overTime.map((rev: any) => {
    const exp = expenseData.overTime.find((e: any) => e.period === rev.period);
    const expense = exp ? exp.totalExpense : 0;
    return {
      period: rev.period,
      revenue: rev.revenue,
      expense: expense,
      profit: rev.revenue - expense,
    };
  });

  return {
    summary: {
      totalRevenue: revenueData.summary.totalRevenue,
      totalExpense: expenseData.summary.totalExpense,
      totalProfit: profit,
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      
      revenueChange: 0,
      expenseChange: 0,
      profitChange: 0,
    },
    overTime: profitOverTime,
    breakdown: {
      revenue: revenueData.summary,
      expense: expenseData.summary,
    },
  };
};



export const getAppointmentReportService = async (filters: { year: number; month?: number }) => {
  const { year, month } = filters;

  const where: any = {
    date: month 
      ? { [Op.between]: [new Date(year, month - 1, 1), new Date(year, month, 0)] }
      : { [Op.between]: [new Date(year, 0, 1), new Date(year, 11, 31)] }
  };

  
  const totalAppointments = await Appointment.count({ where });

  
  const appointmentsByStatus = await Appointment.findAll({
    attributes: [
      "status",
      [fn("COUNT", col("id")), "count"],
    ],
    where,
    group: ["status"],
    raw: true,
  });

  
  const appointmentsByDoctor = await Appointment.findAll({
    attributes: [
      [col("doctor.user.fullName"), "doctorName"],
      [fn("COUNT", col("Appointment.id")), "count"],
    ],
    include: [
      {
        model: Doctor,
        as: "doctor",
        attributes: [],
        include: [
          {
            model: User,
            as: "user",
            attributes: [],
          }
        ]
      }
    ],
    where,
    group: ["doctor.user.fullName"],
    raw: true,
  });

  
  const overTimeRaw = await Appointment.findAll({
    attributes: [
      month 
        ? [fn("DATE_FORMAT", col("date"), "%Y-%m-%d"), "period"]
        : [fn("DATE_FORMAT", col("date"), "%Y-%m"), "period"],
      [fn("COUNT", col("id")), "total"],
      [fn("SUM", literal("CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END")), "completed"],
      [fn("SUM", literal("CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END")), "cancelled"],
      [fn("SUM", literal("CASE WHEN status = 'NO_SHOW' THEN 1 ELSE 0 END")), "noShow"],
    ],
    where,
    group: ["period"],
    order: [[col("period"), "ASC"]],
    raw: true,
  });

  
  const allPeriods: any[] = [];
  if (month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = d.toString().padStart(2, '0');
      const monthStr = month.toString().padStart(2, '0');
      allPeriods.push(`${year}-${monthStr}-${dayStr}`);
    }
  } else {
    for (let m = 1; m <= 12; m++) {
      const monthStr = m.toString().padStart(2, '0');
      allPeriods.push(`${year}-${monthStr}`);
    }
  }

  
  const overTime = allPeriods.map(p => {
    const found: any = overTimeRaw.find((item: any) => item.period === p);
    return {
      period: p,
      total: found ? parseInt(found.total) : 0,
      completed: found ? parseInt(found.completed) : 0,
      cancelled: found ? parseInt(found.cancelled) : 0,
      noShow: found ? parseInt(found.noShow) : 0,
    };
  });

  
  const completedCount = await Appointment.count({
    where: { ...where, status: "COMPLETED" },
  });

  const cancelledCount = await Appointment.count({
    where: { ...where, status: "CANCELLED" },
  });

  const noShowCount = await Appointment.count({
    where: { ...where, status: "NO_SHOW" },
  });

  
  const daysInPeriod = month 
    ? new Date(year, month, 0).getDate() 
    : (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365);
  
  const averagePerDay = totalAppointments / daysInPeriod;

  return {
    summary: {
      totalAppointments,
      completedAppointments: completedCount,
      cancelledAppointments: cancelledCount,
      noShowAppointments: noShowCount,
      averagePerDay,
      completionRate: totalAppointments > 0 ? (completedCount / totalAppointments) * 100 : 0,
    },
    overTime,
    byStatus: appointmentsByStatus.map((item: any) => ({
      status: item.status,
      count: parseInt(item.count),
      percentage: totalAppointments > 0 ? (parseInt(item.count) / totalAppointments) * 100 : 0,
    })),
    byDoctor: appointmentsByDoctor.map((item: any) => ({
      doctorName: item.doctorName || "Bác sĩ ẩn danh",
      count: parseInt(item.count),
      percentage: totalAppointments > 0 ? (parseInt(item.count) / totalAppointments) * 100 : 0,
    })),
  };
};


export const getPatientStatisticsService = async (year: number, month?: number) => {
  const userWhere: any = {};

  if (year) {
    if (month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      userWhere.createdAt = { [Op.between]: [startDate, endDate] };
    } else {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      userWhere.createdAt = { [Op.between]: [startDate, endDate] };
    }
  }

  
  const totalPatients = await Patient.count();
  
  const activePatients = await Patient.count({
    include: [{ model: User, as: "user", where: { isActive: true }, attributes: [] }]
  });

  const inactivePatients = totalPatients - activePatients;

  
  const newPatients = await Patient.count({
    include: [{ model: User, as: "user", where: userWhere, attributes: [] }]
  });

  
  const genderStats = await Patient.findAll({
    attributes: [
      "gender",
      [fn("COUNT", col("Patient.id")), "count"],
    ],
    group: ["gender"],
    raw: true,
  });

  
  const ageGroups = [
    { name: "0-18", min: 0, max: 18 },
    { name: "19-30", min: 19, max: 30 },
    { name: "31-45", min: 31, max: 45 },
    { name: "46-60", min: 46, max: 60 },
    { name: "61+", min: 61, max: 150 },
  ];

  const currentYear = new Date().getFullYear();
  const ageStats = await Promise.all(
    ageGroups.map(async (group) => {
      const maxBirthYear = currentYear - group.min;
      const minBirthYear = currentYear - group.max;

      const count = await Patient.count({
        where: {
          dateOfBirth: {
            [Op.gte]: new Date(minBirthYear, 0, 1),
            [Op.lte]: new Date(maxBirthYear, 11, 31),
          },
        },
      });

      return {
        ageRange: group.name,
        count,
      };
    })
  );

  
  const overTimeRaw = await Patient.findAll({
    attributes: [
      month 
        ? [fn("DATE_FORMAT", col("user.createdAt"), "%Y-%m-%d"), "period"]
        : [fn("DATE_FORMAT", col("user.createdAt"), "%Y-%m"), "period"],
      [fn("COUNT", col("Patient.id")), "count"],
    ],
    include: [{
      model: User,
      as: "user",
      attributes: [],
      where: userWhere
    }],
    group: ["period"],
    raw: true,
  });

  
  const patientsOverTime: any[] = [];
  if (year) {
    if (month) {
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const p = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        const found: any = overTimeRaw.find((item: any) => item.period === p);
        patientsOverTime.push({
          period: p,
          newPatients: found ? parseInt(found.count) : 0,
          totalPatients: totalPatients, 
        });
      }
    } else {
      for (let m = 1; m <= 12; m++) {
        const p = `${year}-${m.toString().padStart(2, '0')}`;
        const found: any = overTimeRaw.find((item: any) => item.period === p);
        patientsOverTime.push({
          period: p,
          newPatients: found ? parseInt(found.count) : 0,
          totalPatients: totalPatients,
        });
      }
    }
  }

  
  const topPatientsByVisits = await Visit.findAll({
    attributes: [
      "patientId",
      [fn("COUNT", col("Visit.id")), "visitCount"],
    ],
    group: ["patientId", "patient.id", "patient.user.id"],
    include: [
      {
        model: Patient,
        as: "patient",
        attributes: ["id"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName"],
          },
        ],
      },
    ],
    order: [[literal("visitCount"), "DESC"]],
    limit: 10,
    subQuery: false,
    raw: true,
    nest: true
  });

  return {
    totalPatients,
    newPatients,
    activePatients,
    inactivePatients,
    patientsByAge: ageStats,
    patientsByGender: genderStats.map((item: any) => ({
      gender: item.gender || "UNKNOWN",
      count: parseInt(item.count),
      percentage: totalPatients > 0 ? (parseInt(item.count) / totalPatients) * 100 : 0,
    })),
    patientsOverTime,
    topVisitingPatients: topPatientsByVisits.map((item: any) => ({
      patientName: item.patient?.user?.fullName || "Ẩn danh",
      visitCount: parseInt(item.visitCount) || 0,
    })),
  };
};

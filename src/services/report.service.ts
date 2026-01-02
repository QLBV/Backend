import { Op, fn, col, literal } from "sequelize";
import Invoice from "../models/Invoice";
import InvoiceItem from "../models/InvoiceItem";
import Payroll from "../models/Payroll";
import Medicine from "../models/Medicine";
import Patient from "../models/Patient";
import PrescriptionDetail from "../models/PrescriptionDetail";
import Appointment from "../models/Appointment";
import Visit from "../models/Visit";

interface RevenueReportFilters {
  year: number;
  month?: number;
}

interface ExpenseReportFilters {
  year: number;
  month?: number;
}

/**
 * Báo cáo doanh thu theo tháng/năm
 * GET /api/reports/revenue
 */
export const getRevenueReportService = async (filters: RevenueReportFilters) => {
  const { year, month } = filters;

  let startDate: Date;
  let endDate: Date;

  if (month) {
    // Báo cáo theo tháng cụ thể
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 1);
  } else {
    // Báo cáo theo năm
    startDate = new Date(year, 0, 1);
    endDate = new Date(year + 1, 0, 1);
  }

  // Tổng doanh thu
  const totalRevenue = await Invoice.sum("totalAmount", {
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
      paymentStatus: "PAID",
    },
  });

  // Doanh thu đã thu
  const collectedRevenue = await Invoice.sum("paidAmount", {
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
  });

  // Doanh thu chưa thu
  const uncollectedRevenue = (totalRevenue || 0) - (collectedRevenue || 0);

  // Số lượng hóa đơn
  const totalInvoices = await Invoice.count({
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
  });

  // Doanh thu theo trạng thái thanh toán
  const revenueByStatus = await Invoice.findAll({
    attributes: [
      "paymentStatus",
      [fn("COUNT", col("id")), "count"],
      [fn("SUM", col("totalAmount")), "totalAmount"],
      [fn("SUM", col("paidAmount")), "paidAmount"],
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

  // Doanh thu theo ngày/tháng
  let revenueOverTime: any[] = [];

  if (month) {
    // Theo ngày trong tháng
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
    // Theo tháng trong năm
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

/**
 * Báo cáo chi phí (thuốc + lương)
 * GET /api/reports/expense
 */
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

  // Chi phí thuốc (từ invoice items)
  const medicineExpense = await InvoiceItem.sum("subtotal", {
    where: {
      itemType: "MEDICINE",
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
  });

  // Chi phí lương (payroll)
  const salaryExpense = await Payroll.sum("netSalary", {
    where: {
      year: year,
      ...(month && { month }),
      status: {
        [Op.in]: ["APPROVED", "PAID"],
      },
    },
  });

  // Tổng chi phí
  const totalExpense = (medicineExpense || 0) + (salaryExpense || 0);

  // Chi tiết chi phí thuốc theo tháng
  const medicineExpenseByMonth: any[] = [];

  if (!month) {
    // Nếu báo cáo năm, group by tháng
    for (let m = 1; m <= 12; m++) {
      const monthStart = new Date(year, m - 1, 1);
      const monthEnd = new Date(year, m, 1);

      const expense = await InvoiceItem.sum("subtotal", {
        where: {
          itemType: "MEDICINE",
          createdAt: {
            [Op.gte]: monthStart,
            [Op.lt]: monthEnd,
          },
        },
      });

      medicineExpenseByMonth.push({
        month: m,
        expense: expense || 0,
      });
    }
  }

  // Chi tiết chi phí lương
  const salaryExpenseByRole = await Payroll.findAll({
    attributes: [
      [fn("SUM", col("netSalary")), "totalSalary"],
      [fn("COUNT", col("id")), "count"],
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
        model: require("../models/User").default,
        as: "user",
        attributes: [],
        include: [
          {
            model: require("../models/Role").default,
            as: "role",
            attributes: ["roleName"],
          },
        ],
      },
    ],
    group: ["user.roleId", "user->role.id", "user->role.roleName"],
    raw: false,
  });

  return {
    summary: {
      totalExpense,
      medicineExpense: medicineExpense || 0,
      salaryExpense: salaryExpense || 0,
      medicinePercentage: totalExpense > 0 ? ((medicineExpense || 0) / totalExpense) * 100 : 0,
      salaryPercentage: totalExpense > 0 ? ((salaryExpense || 0) / totalExpense) * 100 : 0,
    },
    medicineByMonth: medicineExpenseByMonth,
    salaryByRole: salaryExpenseByRole.map((item: any) => ({
      role: item.user?.role?.roleName || "Unknown",
      totalSalary: parseFloat(item.getDataValue("totalSalary")) || 0,
      count: parseInt(item.getDataValue("count")),
    })),
  };
};

/**
 * Báo cáo thuốc dùng nhiều nhất
 * GET /api/reports/top-medicines
 */
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

  // Top thuốc được kê đơn nhiều nhất
  const topMedicines = await PrescriptionDetail.findAll({
    attributes: [
      "medicineId",
      [fn("SUM", col("quantity")), "totalQuantity"],
      [fn("COUNT", col("id")), "prescriptionCount"],
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
        as: "medicine",
        attributes: ["name", "medicineCode", "unit", "salePrice"],
      },
    ],
    group: [
      "medicineId",
      "medicine.id",
      "medicine.name",
      "medicine.medicineCode",
      "medicine.unit",
      "medicine.salePrice",
    ],
    order: [[literal("totalQuantity"), "DESC"]],
    limit,
    raw: false,
  });

  return {
    topMedicines: topMedicines.map((item: any) => ({
      medicine: {
        id: item.medicineId,
        name: item.medicine?.name,
        code: item.medicine?.medicineCode,
        unit: item.medicine?.unit,
        unitPrice: item.medicine?.salePrice,
      },
      totalQuantity: parseFloat(item.getDataValue("totalQuantity")),
      prescriptionCount: parseInt(item.getDataValue("prescriptionCount")),
      estimatedRevenue:
        parseFloat(item.getDataValue("totalQuantity")) * (item.medicine?.salePrice || 0),
    })),
  };
};

/**
 * Báo cáo thuốc sắp hết hạn / sắp hết tồn kho
 * GET /api/reports/medicine-alerts
 */
export const getMedicineAlertsReportService = async (filters: { daysUntilExpiry?: number; minStock?: number }) => {
  const { daysUntilExpiry = 30, minStock = 10 } = filters;

  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

  // Thuốc sắp hết hạn
  const expiringMedicines = await Medicine.findAll({
    where: {
      expiryDate: {
        [Op.gte]: today,
        [Op.lte]: expiryDate,
      },
    },
    order: [["expiryDate", "ASC"]],
  });

  // Thuốc sắp hết tồn kho
  const lowStockMedicines = await Medicine.findAll({
    where: {
      quantity: {
        [Op.lte]: minStock,
      },
      expiryDate: {
        [Op.gte]: today, // Chỉ lấy thuốc chưa hết hạn
      },
    },
    order: [["quantity", "ASC"]],
  });

  // Thuốc đã hết hạn
  const expiredMedicines = await Medicine.findAll({
    where: {
      expiryDate: {
        [Op.lt]: today,
      },
    },
    order: [["expiryDate", "DESC"]],
  });

  return {
    expiring: {
      count: expiringMedicines.length,
      medicines: expiringMedicines.map((med) => ({
        id: med.id,
        name: med.name,
        code: med.medicineCode,
        stock: med.quantity,
        unit: med.unit,
        expiryDate: med.expiryDate,
        daysUntilExpiry: Math.floor(
          (new Date(med.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
    },
    lowStock: {
      count: lowStockMedicines.length,
      medicines: lowStockMedicines.map((med) => ({
        id: med.id,
        name: med.name,
        code: med.medicineCode,
        stock: med.quantity,
        unit: med.unit,
        unitPrice: med.salePrice,
      })),
    },
    expired: {
      count: expiredMedicines.length,
      totalValue: expiredMedicines.reduce((sum, med) => sum + med.quantity * med.salePrice, 0),
      medicines: expiredMedicines.map((med) => ({
        id: med.id,
        name: med.name,
        code: med.medicineCode,
        stock: med.quantity,
        unit: med.unit,
        expiryDate: med.expiryDate,
        value: med.quantity * med.salePrice,
      })),
    },
  };
};

/**
 * Báo cáo bệnh nhân theo giới tính
 * GET /api/reports/patients-by-gender
 */
export const getPatientsByGenderReportService = async () => {
  // Đếm theo giới tính
  const genderStats = await Patient.findAll({
    attributes: [
      "gender",
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["gender"],
    raw: true,
  });

  const total = genderStats.reduce((sum: number, item: any) => sum + parseInt(item.count), 0);

  // Độ tuổi trung bình theo giới tính
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

/**
 * Báo cáo tổng hợp profit (doanh thu - chi phí)
 * GET /api/reports/profit
 */
export const getProfitReportService = async (filters: { year: number; month?: number }) => {
  const revenueData = await getRevenueReportService(filters);
  const expenseData = await getExpenseReportService(filters);

  const profit = revenueData.summary.totalRevenue - expenseData.summary.totalExpense;
  const profitMargin =
    revenueData.summary.totalRevenue > 0
      ? (profit / revenueData.summary.totalRevenue) * 100
      : 0;

  return {
    summary: {
      revenue: revenueData.summary.totalRevenue,
      expense: expenseData.summary.totalExpense,
      profit,
      profitMargin: parseFloat(profitMargin.toFixed(2)),
    },
    breakdown: {
      revenue: revenueData.summary,
      expense: expenseData.summary,
    },
  };
};

/**
 * Báo cáo lịch hẹn
 * GET /api/reports/appointments
 */
export const getAppointmentReportService = async (filters: { year: number; month?: number }) => {
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

  // Tổng số lịch hẹn
  const totalAppointments = await Appointment.count({
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
  });

  // Lịch hẹn theo trạng thái
  const appointmentsByStatus = await Appointment.findAll({
    attributes: [
      "status",
      [fn("COUNT", col("id")), "count"],
    ],
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
    group: ["status"],
    raw: true,
  });

  // Lịch hẹn theo ca
  const appointmentsByShift = await Appointment.findAll({
    attributes: [
      "shiftId",
      [fn("COUNT", col("id")), "count"],
    ],
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
    },
    include: [
      {
        model: require("../models/Shift").default,
        as: "shift",
        attributes: ["name", "startTime", "endTime"],
      },
    ],
    group: ["shiftId", "shift.id", "shift.name", "shift.startTime", "shift.endTime"],
    raw: false,
  });

  // Tỷ lệ hoàn thành
  const completedCount = await Appointment.count({
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
      status: "COMPLETED",
    },
  });

  const cancelledCount = await Appointment.count({
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
      status: "CANCELLED",
    },
  });

  const noShowCount = await Appointment.count({
    where: {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
      status: "NO_SHOW",
    },
  });

  return {
    summary: {
      total: totalAppointments,
      completed: completedCount,
      cancelled: cancelledCount,
      noShow: noShowCount,
      completionRate: totalAppointments > 0 ? (completedCount / totalAppointments) * 100 : 0,
      cancellationRate: totalAppointments > 0 ? (cancelledCount / totalAppointments) * 100 : 0,
      noShowRate: totalAppointments > 0 ? (noShowCount / totalAppointments) * 100 : 0,
    },
    byStatus: appointmentsByStatus.map((item: any) => ({
      status: item.status,
      count: parseInt(item.count),
      percentage: totalAppointments > 0 ? (parseInt(item.count) / totalAppointments) * 100 : 0,
    })),
    byShift: appointmentsByShift.map((item: any) => ({
      shiftId: item.shiftId,
      shiftName: item.shift?.name || "Unknown",
      shiftTime: item.shift ? `${item.shift.startTime} - ${item.shift.endTime}` : "N/A",
      count: parseInt(item.getDataValue("count")),
    })),
  };
};

/**
 * Báo cáo thống kê bệnh nhân
 * GET /api/reports/patient-statistics
 */
export const getPatientStatisticsService = async () => {
  // Tổng số bệnh nhân
  const totalPatients = await Patient.count();

  // Thống kê theo giới tính
  const genderStats = await Patient.findAll({
    attributes: [
      "gender",
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["gender"],
    raw: true,
  });

  // Thống kê theo độ tuổi
  const ageGroups = [
    { name: "0-18", min: 0, max: 18 },
    { name: "19-30", min: 19, max: 30 },
    { name: "31-45", min: 31, max: 45 },
    { name: "46-60", min: 46, max: 60 },
    { name: "61+", min: 61, max: 150 },
  ];

  const ageStats = await Promise.all(
    ageGroups.map(async (group) => {
      const currentYear = new Date().getFullYear();
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
        ageGroup: group.name,
        count,
        percentage: totalPatients > 0 ? (count / totalPatients) * 100 : 0,
      };
    })
  );

  // Bệnh nhân mới trong 30 ngày qua
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newPatientsLast30Days = await Patient.count({
    include: [
      {
        model: require("../models/User").default,
        as: "user",
        attributes: [],
        where: {
          createdAt: {
            [Op.gte]: thirtyDaysAgo,
          },
        },
      },
    ],
  });

  // Top bệnh nhân có nhiều lượt khám nhất
  const topPatientsByVisits = await Visit.findAll({
    attributes: [
      "patientId",
      [fn("COUNT", col("id")), "visitCount"],
    ],
    group: ["patientId"],
    include: [
      {
        model: Patient,
        as: "patient",
        attributes: ["id"],
        include: [
          {
            model: require("../models/User").default,
            as: "user",
            attributes: ["fullName", "email"],
          },
        ],
      },
    ],
    order: [[literal("visitCount"), "DESC"]],
    limit: 10,
    raw: false,
  });

  return {
    summary: {
      total: totalPatients,
      newLast30Days: newPatientsLast30Days,
    },
    byGender: genderStats.map((item: any) => ({
      gender: item.gender || "UNKNOWN",
      count: parseInt(item.count),
      percentage: totalPatients > 0 ? (parseInt(item.count) / totalPatients) * 100 : 0,
    })),
    byAge: ageStats,
    topPatients: topPatientsByVisits.map((item: any) => ({
      patientId: item.patientId,
      patientName: item.patient?.user?.fullName || "N/A",
      patientEmail: item.patient?.user?.email || "N/A",
      visitCount: parseInt(item.getDataValue("visitCount")),
    })),
  };
};

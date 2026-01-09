import { Op, fn, col, literal } from "sequelize";
import Invoice from "../models/Invoice";
import Visit from "../models/Visit";
import Appointment from "../models/Appointment";
import Patient from "../models/Patient";
import Doctor from "../models/Doctor";
import User from "../models/User";
import { CacheService, CacheKeys } from "./cache.service";

/**
 * Dashboard realtime data
 * GET /api/dashboard
 * Note: This is real-time data, so caching is not recommended
 */
export const getDashboardDataService = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Doanh thu hôm nay
  const todayRevenue = await Invoice.sum("totalAmount", {
    where: {
      createdAt: {
        [Op.gte]: today,
        [Op.lt]: tomorrow,
      },
      paymentStatus: "PAID",
    },
  });

  // Doanh thu hôm qua
  const yesterdayRevenue = await Invoice.sum("totalAmount", {
    where: {
      createdAt: {
        [Op.gte]: yesterday,
        [Op.lt]: today,
      },
      paymentStatus: "PAID",
    },
  });

  // Tính % thay đổi doanh thu
  const revenueChange =
    yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : 0;

  // Số bệnh nhân hôm nay (visits)
  const todayPatients = await Visit.count({
    where: {
      checkInTime: {
        [Op.gte]: today,
        [Op.lt]: tomorrow,
      },
    },
  });

  // Số bệnh nhân hôm qua
  const yesterdayPatients = await Visit.count({
    where: {
      checkInTime: {
        [Op.gte]: yesterday,
        [Op.lt]: today,
      },
    },
  });

  // Tính % thay đổi bệnh nhân
  const patientsChange =
    yesterdayPatients > 0
      ? ((todayPatients - yesterdayPatients) / yesterdayPatients) * 100
      : 0;

  // Số lịch hẹn hôm nay
  const todayAppointments = await Appointment.count({
    where: {
      appointmentDate: {
        [Op.gte]: today,
        [Op.lt]: tomorrow,
      },
      status: {
        [Op.in]: ["SCHEDULED", "CONFIRMED"],
      },
    },
  });

  // Số lịch hẹn hôm qua
  const yesterdayAppointments = await Appointment.count({
    where: {
      appointmentDate: {
        [Op.gte]: yesterday,
        [Op.lt]: today,
      },
      status: {
        [Op.in]: ["SCHEDULED", "CONFIRMED"],
      },
    },
  });

  // Tính % thay đổi lịch hẹn
  const appointmentsChange =
    yesterdayAppointments > 0
      ? ((todayAppointments - yesterdayAppointments) / yesterdayAppointments) *
        100
      : 0;

  // Số bác sĩ đang trực (có lịch hẹn hoặc visit hôm nay)
  const activeDoctors = await Doctor.count({
    include: [
      {
        model: Visit,
        as: "visits",
        where: {
          checkInTime: {
            [Op.gte]: today,
            [Op.lt]: tomorrow,
          },
        },
        required: true,
      },
    ],
    distinct: true,
  });

  // Tổng số bác sĩ
  const totalDoctors = await Doctor.count();

  // Top 5 bệnh phổ biến trong tuần
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const topDiseases = await Visit.findAll({
    attributes: [
      "diseaseCategoryId",
      [fn("COUNT", col("Visit.id")), "count"],
    ],
    where: {
      checkInTime: {
        [Op.gte]: weekAgo,
      },
      diseaseCategoryId: {
        [Op.ne]: null,
      },
    },
    group: ["diseaseCategoryId", "diseaseCategory.id", "diseaseCategory.categoryName"],
    include: [
      {
        model: require("../models/DiseaseCategory").default,
        as: "diseaseCategory",
        attributes: ["categoryName"],
      },
    ],
    order: [[literal("count"), "DESC"]],
    limit: 5,
    raw: false,
  });

  // Doanh thu theo ngày trong tuần qua (cho chart)
  const dailyRevenue = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const revenue = await Invoice.sum("totalAmount", {
      where: {
        createdAt: {
          [Op.gte]: date,
          [Op.lt]: nextDate,
        },
        paymentStatus: "PAID",
      },
    });

    dailyRevenue.push({
      date: date.toISOString().split("T")[0],
      revenue: revenue || 0,
    });
  }

  return {
    summary: {
      revenue: {
        today: todayRevenue || 0,
        yesterday: yesterdayRevenue || 0,
        changePercent: parseFloat(revenueChange.toFixed(2)),
      },
      patients: {
        today: todayPatients,
        yesterday: yesterdayPatients,
        changePercent: parseFloat(patientsChange.toFixed(2)),
      },
      appointments: {
        today: todayAppointments,
        yesterday: yesterdayAppointments,
        changePercent: parseFloat(appointmentsChange.toFixed(2)),
      },
      doctors: {
        active: activeDoctors,
        total: totalDoctors,
        percentage: totalDoctors > 0 ? (activeDoctors / totalDoctors) * 100 : 0,
      },
    },
    charts: {
      dailyRevenue,
      topDiseases: topDiseases.map((item: any) => ({
        disease: item.diseaseCategory?.categoryName || "Unknown",
        count: parseInt(item.getDataValue("count")),
      })),
    },
  };
};

/**
 * Get appointments for a specific date (for calendar widget)
 * GET /api/dashboard/appointments/:date
 * Cache: 2 minutes (appointments change frequently)
 */
export const getDashboardAppointmentsByDateService = async (date: string) => {
  // Try cache first
  const cacheKey = CacheKeys.DASHBOARD_APPOINTMENTS(date);
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return cached;
  }
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);

  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const appointments = await Appointment.findAll({
    where: {
      date: {
        [Op.gte]: selectedDate,
        [Op.lt]: nextDate,
      },
    },
    include: [
      {
        model: Patient,
        as: "patient",
        attributes: ["id", "fullName", "patientCode"],
      },
      {
        model: Doctor,
        as: "doctor",
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
    order: [["slotNumber", "ASC"]],
  });

  const result = appointments.map((apt: any) => ({
    id: apt.id,
    patientName: apt.patient?.fullName,
    patientCode: apt.patient?.patientCode,
    patientPhone: undefined, // Phone number not available in Patient model
    doctorName: apt.doctor?.user?.fullName,
    slotNumber: apt.slotNumber,
    status: apt.status,
    symptomInitial: apt.symptomInitial,
    bookingType: apt.bookingType,
  }));

  // Cache for 2 minutes (appointments change frequently)
  await CacheService.set(cacheKey, result, 120);

  return result;
};

/**
 * Dashboard stats overview
 * GET /api/dashboard/stats
 * Cache: 5 minutes (stats change frequently)
 */
export const getDashboardStatsService = async () => {
  // Try cache first
  const cached = await CacheService.get(CacheKeys.DASHBOARD_STATS);
  if (cached) {
    return cached;
  }

  // Tổng số bệnh nhân
  const totalPatients = await Patient.count();

  // Tổng số bác sĩ
  const totalDoctors = await Doctor.count();

  // Tổng số lịch hẹn
  const totalAppointments = await Appointment.count();

  // Tổng doanh thu (all time)
  const totalRevenue = await Invoice.sum("totalAmount", {
    where: {
      paymentStatus: "PAID",
    },
  });

  // Doanh thu tháng này
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthRevenue = await Invoice.sum("totalAmount", {
    where: {
      createdAt: {
        [Op.gte]: startOfMonth,
      },
      paymentStatus: "PAID",
    },
  });

  // Doanh thu tháng trước
  const startOfLastMonth = new Date(startOfMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

  const lastMonthRevenue = await Invoice.sum("totalAmount", {
    where: {
      createdAt: {
        [Op.gte]: startOfLastMonth,
        [Op.lt]: startOfMonth,
      },
      paymentStatus: "PAID",
    },
  });

  // % thay đổi doanh thu tháng
  const monthRevenueChange =
    lastMonthRevenue > 0
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

  const result = {
    overview: {
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalRevenue: totalRevenue || 0,
    },
    monthly: {
      currentMonth: monthRevenue || 0,
      lastMonth: lastMonthRevenue || 0,
      changePercent: parseFloat(monthRevenueChange.toFixed(2)),
    },
  };

  // Cache for 5 minutes
  await CacheService.set(CacheKeys.DASHBOARD_STATS, result, 300);

  return result;
};

/**
 * Dashboard Overview Service
 * GET /api/dashboard/overview
 * Cache: 5 minutes
 */
export const getDashboardOverviewService = async () => {
  // Try cache first
  const cached = await CacheService.get(CacheKeys.DASHBOARD_OVERVIEW);
  if (cached) {
    return cached;
  }
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Tổng số bệnh nhân
  const totalPatients = await Patient.count();

  // Lịch hẹn hôm nay
  const todayAppointments = await Appointment.count({
    where: {
      date: {
        [Op.gte]: startOfToday,
        [Op.lt]: endOfToday,
      },
    },
  });

  // Lịch hẹn đang chờ (PENDING)
  const pendingAppointments = await Appointment.count({
    where: {
      status: "PENDING",
    },
  });

  // Doanh thu tháng này
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlyRevenue = await Invoice.sum("totalAmount", {
    where: {
      createdAt: {
        [Op.gte]: startOfMonth,
      },
      paymentStatus: "PAID",
    },
  });

  // Hóa đơn chưa thanh toán
  const unpaidInvoices = await Invoice.count({
    where: {
      paymentStatus: "UNPAID",
    },
  });

  // Bác sĩ đang hoạt động
  const activeDoctors = await Doctor.count({
    include: [
      {
        model: User,
        as: "user",
        where: { isActive: true },
        attributes: [],
      },
    ],
  });

  const result = {
    patients: {
      total: totalPatients,
    },
    appointments: {
      today: todayAppointments,
      pending: pendingAppointments,
    },
    revenue: {
      thisMonth: monthlyRevenue || 0,
    },
    invoices: {
      unpaid: unpaidInvoices,
    },
    doctors: {
      active: activeDoctors,
    },
  };

  // Cache for 5 minutes
  await CacheService.set(CacheKeys.DASHBOARD_OVERVIEW, result, 300);

  return result;
};

/**
 * Recent Activities Service
 * GET /api/dashboard/recent-activities
 * Cache: 2 minutes (activities change frequently)
 */
export const getRecentActivitiesService = async (limit: number = 10) => {
  // Try cache first (cache key includes limit)
  const cacheKey = `${CacheKeys.DASHBOARD_RECENT_ACTIVITIES}:${limit}`;
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return cached;
  }
  // Lịch hẹn gần đây
  const recentAppointments = await Appointment.findAll({
    limit,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: Patient,
        as: "patient",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName"],
          },
        ],
      },
      {
        model: Doctor,
        as: "doctor",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName"],
          },
        ],
      },
    ],
  });

  // Hóa đơn gần đây
  const recentInvoices = await Invoice.findAll({
    limit,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: Patient,
        as: "patient",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName"],
          },
        ],
      },
    ],
  });

  // Bệnh nhân mới
  const recentPatients = await Patient.findAll({
    limit,
    order: [["id", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["fullName", "email", "createdAt"],
      },
    ],
  });

  const result = {
    appointments: recentAppointments.map((apt: any) => ({
      id: apt.id,
      appointmentCode: apt.appointmentCode,
      date: apt.date,
      status: apt.status,
      patientName: apt.patient?.user?.fullName || "N/A",
      doctorName: apt.doctor?.user?.fullName || "N/A",
      createdAt: apt.createdAt,
    })),
    invoices: recentInvoices.map((inv: any) => ({
      id: inv.id,
      invoiceCode: inv.invoiceCode,
      totalAmount: inv.totalAmount,
      paymentStatus: inv.paymentStatus,
      patientName: inv.patient?.user?.fullName || "N/A",
      createdAt: inv.createdAt,
    })),
    patients: recentPatients.map((pat: any) => ({
      id: pat.id,
      patientCode: pat.patientCode,
      fullName: pat.user?.fullName || "N/A",
      email: pat.user?.email || "N/A",
      createdAt: pat.user?.createdAt,
    })),
  };

  // Cache for 2 minutes (activities change frequently)
  await CacheService.set(cacheKey, result, 120);

  return result;
};

/**
 * Quick Statistics Service
 * GET /api/dashboard/quick-stats
 * Cache: 5 minutes
 */
export const getQuickStatsService = async () => {
  // Try cache first
  const cached = await CacheService.get(CacheKeys.DASHBOARD_QUICK_STATS);
  if (cached) {
    return cached;
  }
  const Specialty = (await import("../models/Specialty")).default;
  const DiseaseCategory = (await import("../models/DiseaseCategory")).default;

  // Top 5 bác sĩ có nhiều lịch hẹn nhất
  const topDoctors = await Appointment.findAll({
    attributes: [
      "doctorId",
      [fn("COUNT", col("Appointment.id")), "appointmentCount"],
    ],
    group: ["doctorId", "doctor.id", "doctor->user.id", "doctor->specialty.id"],
    include: [
      {
        model: Doctor,
        as: "doctor",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName"],
          },
          {
            model: Specialty,
            as: "specialty",
            attributes: ["name"],
          },
        ],
      },
    ],
    order: [[fn("COUNT", col("Appointment.id")), "DESC"]],
    limit: 5,
    raw: false,
  });

  // Top 5 bệnh phổ biến
  const topDiseases = await Visit.findAll({
    attributes: [
      "diseaseCategoryId",
      [fn("COUNT", col("Visit.id")), "visitCount"],
    ],
    where: {
      diseaseCategoryId: {
        [Op.ne]: null,
      },
    },
    group: ["diseaseCategoryId", "DiseaseCategory.id"],
    include: [
      {
        model: DiseaseCategory,
        attributes: ["name", "code"],
      },
    ],
    order: [[fn("COUNT", col("Visit.id")), "DESC"]],
    limit: 5,
    raw: false,
  });

  // Tỷ lệ hoàn thành lịch hẹn (7 ngày qua)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const totalRecentAppointments = await Appointment.count({
    where: {
      createdAt: {
        [Op.gte]: sevenDaysAgo,
      },
    },
  });

  const completedRecentAppointments = await Appointment.count({
    where: {
      createdAt: {
        [Op.gte]: sevenDaysAgo,
      },
      status: "COMPLETED",
    },
  });

  const completionRate =
    totalRecentAppointments > 0
      ? (completedRecentAppointments / totalRecentAppointments) * 100
      : 0;

  const result = {
    topDoctors: topDoctors.map((item: any) => ({
      doctorId: item.doctorId,
      doctorName: item.doctor?.user?.fullName || "N/A",
      specialty: item.doctor?.specialty?.name || "N/A",
      appointmentCount: parseInt(item.getDataValue("appointmentCount")),
    })),
    topDiseases: topDiseases.map((item: any) => ({
      diseaseCategoryId: item.diseaseCategoryId,
      diseaseName: item.DiseaseCategory?.name || "N/A",
      diseaseCode: item.DiseaseCategory?.code || "N/A",
      visitCount: parseInt(item.getDataValue("visitCount")),
    })),
    appointmentStats: {
      last7Days: {
        total: totalRecentAppointments,
        completed: completedRecentAppointments,
        completionRate: parseFloat(completionRate.toFixed(2)),
      },
    },
  };

  // Cache for 5 minutes
  await CacheService.set(CacheKeys.DASHBOARD_QUICK_STATS, result, 300);

  return result;
};

/**
 * System Alerts Service
 * GET /api/dashboard/alerts
 * Cache: 5 minutes (alerts change frequently)
 */
export const getSystemAlertsService = async () => {
  // Try cache first
  const cached = await CacheService.get(CacheKeys.DASHBOARD_ALERTS);
  if (cached) {
    return cached;
  }
  const Medicine = (await import("../models/Medicine")).default;
  const DoctorShift = (await import("../models/DoctorShift")).default;
  const Shift = (await import("../models/Shift")).default;

  const today = new Date();

  // Thuốc sắp hết hạn (30 ngày)
  const expiryDate = new Date(today);
  expiryDate.setDate(expiryDate.getDate() + 30);

  const expiringMedicines = await Medicine.count({
    where: {
      expiryDate: {
        [Op.gte]: today,
        [Op.lte]: expiryDate,
      },
    },
  });

  // Thuốc đã hết hạn
  const expiredMedicines = await Medicine.count({
    where: {
      expiryDate: {
        [Op.lt]: today,
      },
    },
  });

  // Thuốc sắp hết tồn kho (dưới 10)
  const lowStockMedicines = await Medicine.count({
    where: {
      quantity: {
        [Op.lte]: 10,
      },
      expiryDate: {
        [Op.gte]: today,
      },
    },
  });

  // Lịch trực thiếu người (7 ngày tới)
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Get all shifts
  const allShifts = await Shift.count();

  // Get assigned shifts
  const assignedShifts = await DoctorShift.count({
    where: {
      workDate: {
        [Op.gte]: today.toISOString().split("T")[0],
        [Op.lte]: nextWeek.toISOString().split("T")[0],
      },
    },
  });

  // Số ngày trong 7 ngày tới
  const daysInPeriod = 7;
  const totalSlotsNeeded = allShifts * daysInPeriod;
  const unassignedSlots = totalSlotsNeeded - assignedShifts;

  // Hóa đơn quá hạn (chưa thanh toán quá 30 ngày)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const overdueInvoices = await Invoice.count({
    where: {
      paymentStatus: "UNPAID",
      createdAt: {
        [Op.lte]: thirtyDaysAgo,
      },
    },
  });

  const result = {
    medicine: {
      expiring: expiringMedicines,
      expired: expiredMedicines,
      lowStock: lowStockMedicines,
    },
    shifts: {
      unassignedSlots,
      totalSlotsNeeded,
      assignedSlots: assignedShifts,
    },
    invoices: {
      overdue: overdueInvoices,
    },
    totalAlerts:
      expiringMedicines +
      expiredMedicines +
      lowStockMedicines +
      (unassignedSlots > 0 ? 1 : 0) +
      overdueInvoices,
  };

  // Cache for 5 minutes
  await CacheService.set(CacheKeys.DASHBOARD_ALERTS, result, 300);

  return result;
};

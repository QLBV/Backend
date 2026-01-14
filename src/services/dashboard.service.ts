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
 */
export const getDashboardDataService = async (days: number = 7, month?: number, year?: number) => {
  const today = new Date();
  const filterYear = year || today.getFullYear();
  const filterMonth = month !== undefined ? month : today.getMonth() + 1; // 1-indexed

  // Base date for calculating relative spans
  const baseDate = new Date(filterYear, filterMonth - 1, 1);
  const nextMonth = new Date(filterYear, filterMonth, 1);
  const daysInMonth = new Date(filterYear, filterMonth, 0).getDate();

  const [stats, overview, recentActivities, quickStats, alerts] = await Promise.all([
    getDashboardStatsService(),
    getDashboardOverviewService(),
    getRecentActivitiesService(10),
    getQuickStatsService(),
    getSystemAlertsService(),
  ]);

  // Generate chart data
  const dailyRevenue = [];
  
  if (month !== undefined) {
    // If a specific month is selected, show data for that entire month
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(filterYear, filterMonth - 1, i);
        const nextDate = new Date(filterYear, filterMonth - 1, i + 1);

        const revenue = await Invoice.sum("totalAmount", {
            where: {
                createdAt: { [Op.gte]: date, [Op.lt]: nextDate },
                paymentStatus: "PAID",
            },
        });

        dailyRevenue.push({
            name: `${i}/${filterMonth}`,
            date: date.toISOString().split("T")[0],
            revenue: revenue || 0,
        });
    }
  } else {
    // Traditional "last X days" view
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(todayStart);
        date.setDate(date.getDate() - i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const revenue = await Invoice.sum("totalAmount", {
            where: {
                createdAt: { [Op.gte]: date, [Op.lt]: nextDate },
                paymentStatus: "PAID",
            },
        });

        dailyRevenue.push({
            name: date.toLocaleDateString("vi-VN", { 
                weekday: days <= 7 ? "short" : undefined, 
                day: "2-digit", 
                month: "2-digit" 
            }),
            date: date.toISOString().split("T")[0],
            revenue: revenue || 0,
        });
    }
  }

  // Appointment status distribution for today (always relevant)
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayStatusDist = await Appointment.findAll({
    attributes: [
      'status',
      [fn('COUNT', col('id')), 'count']
    ],
    where: {
      date: { [Op.gte]: todayStart, [Op.lt]: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) }
    },
    group: ['status']
  });

  // Appointment status distribution for the SELECTED month
  const monthlyStatusDist = await Appointment.findAll({
    attributes: [
      'status',
      [fn('COUNT', col('id')), 'count']
    ],
    where: {
      date: { [Op.gte]: baseDate, [Op.lt]: nextMonth }
    },
    group: ['status']
  });

  return {
    stats,
    overview,
    recentActivities,
    quickStats,
    alerts,
    charts: {
      dailyRevenue,
      todayStatusDistribution: todayStatusDist.map((item: any) => ({
        status: item.status,
        count: parseInt(item.get('count')) || 0
      })),
      monthlyStatusDistribution: monthlyStatusDist.map((item: any) => ({
        status: item.status,
        count: parseInt(item.get('count')) || 0
      }))
    }
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
  const cached = await CacheService.get<any[]>(cacheKey);
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
 */
export const getDashboardStatsService = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalPatients,
    totalDoctors,
    totalAppointments,
    totalRevenue,
    todayAppointments,
    todayPatientsCount,
    todayRevenueCount,
    pendingAppointments,
    completedAppointments,
  ] = await Promise.all([
    Patient.count(),
    Doctor.count(),
    Appointment.count(),
    Invoice.sum("totalAmount", { where: { paymentStatus: "PAID" } }),
    Appointment.count({ where: { date: { [Op.gte]: today, [Op.lt]: tomorrow } } }),
    Visit.count({ where: { checkInTime: { [Op.gte]: today, [Op.lt]: tomorrow } } }),
    Invoice.sum("totalAmount", { where: { paymentStatus: "PAID", createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } } }),
    Appointment.count({ where: { status: "WAITING" } }),
    Appointment.count({ where: { status: "COMPLETED" } }),
  ]);

  return {
    totalPatients,
    totalDoctors,
    totalAppointments,
    totalRevenue: totalRevenue || 0,
    todayAppointments,
    todayPatients: todayPatientsCount,
    todayRevenue: todayRevenueCount || 0,
    pendingAppointments,
    completedAppointments,
  };
};

/**
 * Dashboard Overview Service
 * GET /api/dashboard/overview
 */
export const getDashboardOverviewService = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const [
    todayRev, yesterdayRev, weekRev, monthRev, lastMonthRev,
    todayApt, yesterdayApt, weekApt, monthApt,
    todayPat, yesterdayPat, weekPat, monthPat,
    medicationStock
  ] = await Promise.all([
    Invoice.sum("totalAmount", { where: { paymentStatus: "PAID", createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } } }),
    Invoice.sum("totalAmount", { where: { paymentStatus: "PAID", createdAt: { [Op.gte]: yesterday, [Op.lt]: today } } }),
    Invoice.sum("totalAmount", { where: { paymentStatus: "PAID", createdAt: { [Op.gte]: startOfWeek } } }),
    Invoice.sum("totalAmount", { where: { paymentStatus: "PAID", createdAt: { [Op.gte]: startOfMonth } } }),
    Invoice.sum("totalAmount", { where: { paymentStatus: "PAID", createdAt: { [Op.gte]: startOfLastMonth, [Op.lte]: endOfLastMonth } } }),
    
    Appointment.count({ where: { date: { [Op.gte]: today, [Op.lt]: tomorrow } } }),
    Appointment.count({ where: { date: { [Op.gte]: yesterday, [Op.lt]: today } } }),
    Appointment.count({ where: { date: { [Op.gte]: startOfWeek } } }),
    Appointment.count({ where: { date: { [Op.gte]: startOfMonth } } }),

    Visit.count({ where: { checkInTime: { [Op.gte]: today, [Op.lt]: tomorrow } } }),
    Visit.count({ where: { checkInTime: { [Op.gte]: yesterday, [Op.lt]: today } } }),
    Visit.count({ where: { checkInTime: { [Op.gte]: startOfWeek } } }),
    Visit.count({ where: { checkInTime: { [Op.gte]: startOfMonth } } }),

    require("../models/Medicine").default.count()
  ]);

  const revChange = yesterdayRev > 0 ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 : 0;
  const aptChange = yesterdayApt > 0 ? ((todayApt - yesterdayApt) / yesterdayApt) * 100 : 0;
  const patChange = yesterdayPat > 0 ? ((todayPat - yesterdayPat) / yesterdayPat) * 100 : 0;

  // Calculate target: e.g., 10% more than last month, or a default 50M
  const targetRevenue = lastMonthRev ? lastMonthRev * 1.1 : 50000000;
  const performancePercentage = targetRevenue > 0 ? Math.min(100, Math.floor((monthRev / targetRevenue) * 100)) : 0;

  return {
    revenue: {
      today: todayRev || 0,
      thisWeek: weekRev || 0,
      thisMonth: monthRev || 0,
      targetMonth: Math.round(targetRevenue),
      performance: performancePercentage,
      change: parseFloat(revChange.toFixed(2))
    },
    appointments: {
      today: todayApt,
      thisWeek: weekApt,
      thisMonth: monthApt,
      change: parseFloat(aptChange.toFixed(2))
    },
    patients: {
      today: todayPat,
      thisWeek: weekPat,
      thisMonth: monthPat,
      change: parseFloat(patChange.toFixed(2))
    },
    medicationStock: medicationStock || 0,
    medicationChange: 0
  };
};

/**
 * Recent Activities Service
 * GET /api/dashboard/recent-activities
 */
export const getRecentActivitiesService = async (limit: number = 10) => {
  const [recentInvoices, recentAppointments, recentVisits] = await Promise.all([
    Invoice.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [{ model: Patient, as: "patient", include: [{ model: User, as: "user", attributes: ["fullName"] }] }]
    }),
    Appointment.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [{ model: Patient, as: "patient", attributes: ["fullName"] }]
    }),
    Visit.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [{ model: Patient, as: "patient", attributes: ["fullName"] }]
    })
  ]);

  const activities = [
    ...recentInvoices.map((inv: any) => ({
      id: `inv-${inv.id}`,
      type: "invoice",
      description: `Hóa đơn mới: ${inv.patient?.user?.fullName || "Bệnh nhân"} (${(inv.totalAmount || 0).toLocaleString()}đ)`,
      timestamp: inv.createdAt,
      user: { id: 0, fullName: "Hệ thống" }
    })),
    ...recentAppointments.map((apt: any) => ({
      id: `apt-${apt.id}`,
      type: "appointment",
      description: `Lịch hẹn mới: ${apt.patient?.fullName || "Bệnh nhân"}`,
      timestamp: apt.createdAt,
      user: { id: 0, fullName: "Hệ thống" }
    })),
    ...recentVisits.map((v: any) => ({
      id: `visit-${v.id}`,
      type: "visit",
      description: `Lượt khám mới: ${v.patient?.fullName || "Bệnh nhân"}`,
      timestamp: v.createdAt,
      user: { id: 0, fullName: "Hệ thống" }
    }))
  ];

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

/**
 * Quick Statistics Service
 * GET /api/dashboard/quick-stats
 */
export const getQuickStatsService = async () => {
  const Medicine = (await import("../models/Medicine")).default;
  const today = new Date();

  const [lowStock, expiring, unpaid, pending, visits] = await Promise.all([
    Medicine.count({ where: { quantity: { [Op.lte]: literal("minStockLevel") } } }),
    Medicine.count({ where: { expiryDate: { [Op.lte]: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) } } }),
    Invoice.count({ where: { paymentStatus: "UNPAID" } }),
    Appointment.count({ where: { status: "WAITING" } }),
    Visit.count({ where: { checkInTime: { [Op.gte]: new Date(today.setHours(0,0,0,0)) } } })
  ]);

  return {
    lowStockMedicines: lowStock,
    expiringMedicines: expiring,
    unpaidInvoices: unpaid,
    pendingAppointments: pending,
    todayVisits: visits
  };
};

/**
 * System Alerts Service
 * GET /api/dashboard/alerts
 */
export const getSystemAlertsService = async () => {
  const Medicine = (await import("../models/Medicine")).default;
  const today = new Date();

  // Low stock alert
  const lowStockCount = await Medicine.count({
    where: { quantity: { [Op.lte]: literal("minStockLevel") } }
  });

  const alerts = [];
  if (lowStockCount > 0) {
    alerts.push({
      id: 1,
      type: "warning",
      message: `Có ${lowStockCount} loại thuốc sắp hết hàng.`,
      timestamp: new Date().toISOString(),
      actionUrl: "/pharmacy"
    });
  }

  return alerts;
};

/**
 * Landing Page Stats Service
 * GET /api/dashboard/public/landing-stats
 */
export const getLandingStatsService = async () => {
  const [patientCount, doctorCount, visitCount] = await Promise.all([
    Patient.count(),
    Doctor.count(),
    Visit.count()
  ]);

  return {
    patientCount,
    doctorCount,
    visitCount,
    experienceYears: 15, // Hardcoded
    satisfactionRate: 98 // Hardcoded
  };
};

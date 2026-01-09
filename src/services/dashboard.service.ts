import { Op, fn, col, literal } from "sequelize";
import sequelize from "../config/database";
import Invoice from "../models/Invoice";
import Visit from "../models/Visit";
import Appointment from "../models/Appointment";
import Patient from "../models/Patient";
import Doctor from "../models/Doctor";
import User from "../models/User";

/**
 * Dashboard realtime data
 * GET /api/dashboard
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
      date: {
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
      date: {
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
  /*
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
  }); */

  const activeDoctors = await Visit.count({
    where: {
      checkInTime: { // Đảm bảo bạn đã sửa visitDate thành checkInTime
        [Op.gte]: today,
        [Op.lt]: tomorrow,
      },
    },
    distinct: true,
    col: 'doctorId' // Đếm số lượng bác sĩ duy nhất có lượt khám
  });

  // Tổng số bác sĩ
  const totalDoctors = await Doctor.count();

  // Top 5 bệnh phổ biến trong tuần
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const topDiseases = await Visit.findAll({
    attributes: [
      "DiseaseCategoryId",
      [fn("COUNT", col("Visit.id")), "count"],
    ],
    where: {
      checkInTime: {
        [Op.gte]: weekAgo,
      },
      DiseaseCategoryId: {
        [Op.ne]: null,
      },
    },
    group: ["DiseaseCategoryId", "DiseaseCategory.id", "DiseaseCategory.name"],
    include: [
      {
        model: require("../models/DiseaseCategory").default,
        as: "DiseaseCategory",
        attributes: ["name"],
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
        disease: item.DiseaseCategory?.name || "Unknown",
        count: parseInt(item.getDataValue("count")),
      })),
    },
  };
};

/**
 * Get appointments for a specific date (for calendar widget)
 * GET /api/dashboard/appointments/:date
 */
export const getDashboardAppointmentsByDateService = async (date: string) => {
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
        attributes: ["id", "fullName", "patientCode", "phoneNumber"],
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

  return appointments.map((apt: any) => ({
    id: apt.id,
    patientName: apt.patient?.fullName,
    patientCode: apt.patient?.patientCode,
    patientPhone: apt.patient?.phoneNumber,
    doctorName: apt.doctor?.user?.fullName,
    slotNumber: apt.slotNumber,
    status: apt.status,
    symptomInitial: apt.symptomInitial,
    bookingType: apt.bookingType,
  }));
};

/**
 * Dashboard stats overview
 * GET /api/dashboard/stats
 */
export const getDashboardStatsService = async () => {
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

  return {
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
};

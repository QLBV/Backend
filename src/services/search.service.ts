import { Op } from "sequelize";
import Appointment from "../models/Appointment";
import Doctor from "../models/Doctor";
import Invoice, { PaymentStatus } from "../models/Invoice";
import Patient from "../models/Patient";
import PatientProfile from "../models/PatientProfile";
import Shift from "../models/Shift";
import User from "../models/User";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const normalizePagination = (page?: number, limit?: number) => {
  const safePage = page && page > 0 ? page : DEFAULT_PAGE;
  const safeLimit = limit && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = (safePage - 1) * safeLimit;

  return { page: safePage, limit: safeLimit, offset };
};

export const searchPatientsService = async (filters: {
  keyword?: string;
  profileKeyword?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  isActive?: boolean;
  dateOfBirthFrom?: Date;
  dateOfBirthTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  limit?: number;
}) => {
  const { page, limit, offset } = normalizePagination(filters.page, filters.limit);
  const where: any = {};

  if (filters.gender) {
    where.gender = filters.gender;
  }

  if (typeof filters.isActive === "boolean") {
    where.isActive = filters.isActive;
  }

  if (filters.dateOfBirthFrom || filters.dateOfBirthTo) {
    where.dateOfBirth = {};
    if (filters.dateOfBirthFrom) {
      where.dateOfBirth[Op.gte] = filters.dateOfBirthFrom;
    }
    if (filters.dateOfBirthTo) {
      where.dateOfBirth[Op.lte] = filters.dateOfBirthTo;
    }
  }

  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {};
    if (filters.createdFrom) {
      where.createdAt[Op.gte] = filters.createdFrom;
    }
    if (filters.createdTo) {
      where.createdAt[Op.lte] = filters.createdTo;
    }
  }

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    where[Op.or] = [
      { fullName: { [Op.like]: keyword } },
      { patientCode: { [Op.like]: keyword } },
      { cccd: { [Op.like]: keyword } },
    ];
  }

  const profileInclude: any = {
    model: PatientProfile,
    as: "profiles",
  };

  if (filters.profileKeyword) {
    profileInclude.where = { value: { [Op.like]: `%${filters.profileKeyword}%` } };
    profileInclude.required = true;
  }

  const { count, rows } = await Patient.findAndCountAll({
    where,
    include: [profileInclude],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  return {
    patients: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

export const searchAppointmentsService = async (filters: {
  keyword?: string;
  status?: string;
  bookingType?: "ONLINE" | "OFFLINE";
  bookedBy?: "PATIENT" | "RECEPTIONIST";
  doctorId?: number;
  patientId?: number;
  shiftId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  limit?: number;
}) => {
  const { page, limit, offset } = normalizePagination(filters.page, filters.limit);
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.bookingType) {
    where.bookingType = filters.bookingType;
  }

  if (filters.bookedBy) {
    where.bookedBy = filters.bookedBy;
  }

  if (filters.doctorId) {
    where.doctorId = filters.doctorId;
  }

  if (filters.patientId) {
    where.patientId = filters.patientId;
  }

  if (filters.shiftId) {
    where.shiftId = filters.shiftId;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) {
      where.date[Op.gte] = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.date[Op.lte] = filters.dateTo;
    }
  }

  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {};
    if (filters.createdFrom) {
      where.createdAt[Op.gte] = filters.createdFrom;
    }
    if (filters.createdTo) {
      where.createdAt[Op.lte] = filters.createdTo;
    }
  }

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    where[Op.or] = [
      { "$patient.fullName$": { [Op.like]: keyword } },
      { "$patient.patientCode$": { [Op.like]: keyword } },
      { "$doctor.user.fullName$": { [Op.like]: keyword } },
    ];
  }

  const { count, rows } = await Appointment.findAndCountAll({
    where,
    include: [
      { model: Patient, as: "patient", attributes: ["id", "fullName", "patientCode"] },
      {
        model: Doctor,
        as: "doctor",
        attributes: ["id"],
        include: [{ model: User, as: "user", attributes: ["fullName"] }],
      },
      { model: Shift, as: "shift" },
    ],
    order: [["date", "DESC"], ["shiftId", "ASC"], ["slotNumber", "ASC"]],
    limit,
    offset,
    distinct: true,
  });

  return {
    appointments: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

export const searchInvoicesService = async (filters: {
  keyword?: string;
  invoiceCode?: string;
  paymentStatus?: PaymentStatus;
  patientId?: number;
  doctorId?: number;
  totalMin?: number;
  totalMax?: number;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  limit?: number;
}) => {
  const { page, limit, offset } = normalizePagination(filters.page, filters.limit);
  const where: any = {};

  if (filters.invoiceCode) {
    where.invoiceCode = { [Op.like]: `%${filters.invoiceCode}%` };
  }

  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }

  if (filters.patientId) {
    where.patientId = filters.patientId;
  }

  if (filters.doctorId) {
    where.doctorId = filters.doctorId;
  }

  if (filters.totalMin || filters.totalMax) {
    where.totalAmount = {};
    if (filters.totalMin !== undefined) {
      where.totalAmount[Op.gte] = filters.totalMin;
    }
    if (filters.totalMax !== undefined) {
      where.totalAmount[Op.lte] = filters.totalMax;
    }
  }

  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {};
    if (filters.createdFrom) {
      where.createdAt[Op.gte] = filters.createdFrom;
    }
    if (filters.createdTo) {
      where.createdAt[Op.lte] = filters.createdTo;
    }
  }

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    where[Op.or] = [
      { invoiceCode: { [Op.like]: keyword } },
      { "$patient.fullName$": { [Op.like]: keyword } },
      { "$patient.patientCode$": { [Op.like]: keyword } },
      { "$doctor.user.fullName$": { [Op.like]: keyword } },
    ];
  }

  const { count, rows } = await Invoice.findAndCountAll({
    where,
    include: [
      { model: Patient, as: "patient", attributes: ["id", "fullName", "patientCode"] },
      {
        model: Doctor,
        as: "doctor",
        attributes: ["id"],
        include: [{ model: User, as: "user", attributes: ["fullName"] }],
      },
      { model: User, as: "creator", attributes: ["id", "fullName", "email"] },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    distinct: true,
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

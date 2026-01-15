import { Request, Response } from "express";
import {
  searchAppointmentsService,
  searchInvoicesService,
  searchPatientsService,
} from "./search.service";
import { PaymentStatus } from "../../models/Invoice";

const parseOptionalNumber = (value: any) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseOptionalBoolean = (value: any) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
};

const parseOptionalDate = (value: any) => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};


export const searchPatients = async (req: Request, res: Response) => {
  try {
    const {
      keyword,
      profileKeyword,
      gender,
      isActive,
      dateOfBirthFrom,
      dateOfBirthTo,
      createdFrom,
      createdTo,
      page,
      limit,
    } = req.body || {};

    const parsedDobFrom = parseOptionalDate(dateOfBirthFrom);
    const parsedDobTo = parseOptionalDate(dateOfBirthTo);
    const parsedCreatedFrom = parseOptionalDate(createdFrom);
    const parsedCreatedTo = parseOptionalDate(createdTo);

    if (
      parsedDobFrom === null ||
      parsedDobTo === null ||
      parsedCreatedFrom === null ||
      parsedCreatedTo === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format in filters",
      });
    }

    const filters = {
      keyword: typeof keyword === "string" ? keyword.trim() : undefined,
      profileKeyword: typeof profileKeyword === "string" ? profileKeyword.trim() : undefined,
      gender,
      isActive: parseOptionalBoolean(isActive),
      dateOfBirthFrom: parsedDobFrom || undefined,
      dateOfBirthTo: parsedDobTo || undefined,
      createdFrom: parsedCreatedFrom || undefined,
      createdTo: parsedCreatedTo || undefined,
      page: parseOptionalNumber(page),
      limit: parseOptionalNumber(limit),
    };

    const result = await searchPatientsService(filters);

    return res.json({
      success: true,
      message: "Patients search completed successfully",
      data: result.patients,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to search patients",
    });
  }
};


export const searchAppointments = async (req: Request, res: Response) => {
  try {
    const {
      keyword,
      status,
      bookingType,
      bookedBy,
      doctorId,
      patientId,
      shiftId,
      dateFrom,
      dateTo,
      createdFrom,
      createdTo,
      page,
      limit,
    } = req.body || {};

    const parsedDateFrom = parseOptionalDate(dateFrom);
    const parsedDateTo = parseOptionalDate(dateTo);
    const parsedCreatedFrom = parseOptionalDate(createdFrom);
    const parsedCreatedTo = parseOptionalDate(createdTo);

    if (
      parsedDateFrom === null ||
      parsedDateTo === null ||
      parsedCreatedFrom === null ||
      parsedCreatedTo === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format in filters",
      });
    }

    const filters = {
      keyword: typeof keyword === "string" ? keyword.trim() : undefined,
      status,
      bookingType,
      bookedBy,
      doctorId: parseOptionalNumber(doctorId),
      patientId: parseOptionalNumber(patientId),
      shiftId: parseOptionalNumber(shiftId),
      dateFrom: parsedDateFrom || undefined,
      dateTo: parsedDateTo || undefined,
      createdFrom: parsedCreatedFrom || undefined,
      createdTo: parsedCreatedTo || undefined,
      page: parseOptionalNumber(page),
      limit: parseOptionalNumber(limit),
    };

    const result = await searchAppointmentsService(filters);

    return res.json({
      success: true,
      message: "Appointments search completed successfully",
      data: result.appointments,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to search appointments",
    });
  }
};


export const searchInvoices = async (req: Request, res: Response) => {
  try {
    const {
      keyword,
      invoiceCode,
      paymentStatus,
      patientId,
      doctorId,
      totalMin,
      totalMax,
      createdFrom,
      createdTo,
      page,
      limit,
    } = req.body || {};

    const parsedCreatedFrom = parseOptionalDate(createdFrom);
    const parsedCreatedTo = parseOptionalDate(createdTo);

    if (parsedCreatedFrom === null || parsedCreatedTo === null) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format in filters",
      });
    }

    const filters = {
      keyword: typeof keyword === "string" ? keyword.trim() : undefined,
      invoiceCode: typeof invoiceCode === "string" ? invoiceCode.trim() : undefined,
      paymentStatus: paymentStatus as PaymentStatus | undefined,
      patientId: parseOptionalNumber(patientId),
      doctorId: parseOptionalNumber(doctorId),
      totalMin: parseOptionalNumber(totalMin),
      totalMax: parseOptionalNumber(totalMax),
      createdFrom: parsedCreatedFrom || undefined,
      createdTo: parsedCreatedTo || undefined,
      page: parseOptionalNumber(page),
      limit: parseOptionalNumber(limit),
    };

    const result = await searchInvoicesService(filters);

    return res.json({
      success: true,
      message: "Invoices search completed successfully",
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to search invoices",
    });
  }
};

import { Request, Response } from "express";
import { Op } from "sequelize";
import DoctorShift from "../models/DoctorShift";
import Doctor from "../models/Doctor";
import Shift from "../models/Shift";
import User from "../models/User";
import Specialty from "../models/Specialty";
import Employee from "../models/Employee";
import { cancelDoctorShiftAndReschedule } from "../services/appointmentReschedule.service";
import { assignDoctorToShiftService } from "../services/doctorShift.service";
import * as auditLogService from "../services/auditLog.service";
import Appointment from "../models/Appointment";

export const assignDoctorToShift = async (req: Request, res: Response) => {
  try {
    const doctorId = Number(req.body.doctorId);
    const shiftId = Number(req.body.shiftId);
    const workDate = String(req.body.workDate || "").trim(); // YYYY-MM-DD
    const maxSlots = req.body.maxSlots ? Number(req.body.maxSlots) : null;

    if (!doctorId || !shiftId || !workDate) {
      return res.status(400).json({
        success: false,
        message: "Missing doctorId/shiftId/workDate",
      });
    }

    // Check format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
      return res.status(400).json({
        success: false,
        message: "workDate must be YYYY-MM-DD",
      });
    }

    // Call service layer (handles transaction + validation)
    const doctorShift = await assignDoctorToShiftService(
      doctorId,
      shiftId,
      workDate,
      maxSlots
    );

    // Audit log
    await auditLogService
      .logCreate(req, "doctor_shifts", doctorShift.id, {
        doctorId: doctorShift.doctorId,
        shiftId: doctorShift.shiftId,
        workDate: doctorShift.workDate,
      })
      .catch((err: any) => console.error("Failed to log audit:", err));

    return res.status(201).json({
      success: true,
      message: "DOCTOR_ASSIGNED_TO_SHIFT",
      data: doctorShift,
    });
  } catch (error: any) {
    // Handle overlap error
    if (error.code === "DOCTOR_SHIFT_OVERLAP") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    // Handle doctor not found
    if (error.code === "DOCTOR_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Handle shift not found
    if (error.code === "SHIFT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    // Handle inactive doctor
    if (error.code === "DOCTOR_INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Cannot assign inactive doctor to shift",
      });
    }

    // Handle duplicate constraint from database
    if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Doctor already assigned to this shift on this date",
      });
    }

    console.error("Error assigning doctor to shift:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "INTERNAL_SERVER_ERROR",
    });
  }
};

export const unassignDoctorFromShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cancelReason = req.body.cancelReason || "Admin unassigned doctor from shift";

    // Validate doctorShift exists
    const doctorShift = await DoctorShift.findByPk(id);
    if (!doctorShift) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    // Use official reschedule service with transaction safety
    const result = await cancelDoctorShiftAndReschedule(
      Number(id),
      cancelReason
    );

    // Return detailed result
    return res.json({
      success: true,
      message: "Doctor unassigned from shift successfully",
      data: {
        totalAppointments: result.totalAppointments,
        rescheduledCount: result.rescheduledCount,
        failedCount: result.failedCount,
        details: result.details,
      },
    });
  } catch (error: any) {
    // Handle specific errors
    const errorMessage = error?.message || "Unassign doctor from shift failed";

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error?.message || error,
    });
  }
};

/**
 * Get all doctor shifts (Admin only)
 * GET /api/doctor-shifts
 */
export const getAllDoctorShifts = async (req: Request, res: Response) => {
  try {
    const { workDate, doctorId, shiftId } = req.query;
    
    const where: any = {};
    if (workDate) where.workDate = String(workDate);
    if (doctorId) where.doctorId = Number(doctorId);
    if (shiftId) where.shiftId = Number(shiftId);
    
    const doctorShifts = await DoctorShift.findAll({
      where,
      include: [
        {
          model: Doctor,
          as: "doctor",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email", "avatar", "isActive"],
              include: [
                {
                  model: Employee,
                  as: "employee",
                  attributes: ["phone", "gender", "dateOfBirth", "address"],
                },
              ],
            },
            {
              model: Specialty,
              as: "specialty",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: Shift,
          as: "shift",
          attributes: ["id", "name", "startTime", "endTime"],
        },
      ],
      order: [["workDate", "DESC"], ["shiftId", "ASC"]],
    });
    
    return res.json({ success: true, data: doctorShifts });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Get all doctor shifts failed",
      error: error?.message || error,
    });
  }
};

export const getShiftsByDoctor = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const docId = Number(doctorId);
    
    if (isNaN(docId)) {
      return res.status(400).json({ success: false, message: "Invalid doctor ID" });
    }

    const shifts = await DoctorShift.findAll({
      where: { doctorId: docId },
      include: [
        { 
          model: Shift, 
          as: "shift",
          required: false,
          attributes: ["id", "name", "startTime", "endTime"],
        },
        {
          model: Doctor,
          as: "doctor",
          required: false,
          include: [
            {
              model: User,
              as: "user",
              required: false,
              attributes: ["id", "fullName", "email", "avatar", "isActive"],
              include: [
                {
                  model: Employee,
                  as: "employee",
                  attributes: ["phone", "gender", "dateOfBirth", "address"],
                },
              ],
            },
          ],
        },
      ],
      order: [["workDate", "DESC"], ["shiftId", "ASC"]],
    });
    
    // Debug: Log first shift to check data structure
    if (shifts.length > 0) {
      console.log("🔍 First doctor shift data:", {
        id: shifts[0].id,
        doctorId: shifts[0].doctorId,
        shiftId: shifts[0].shiftId,
        workDate: shifts[0].workDate,
        hasShift: !!shifts[0].shift,
        shiftName: shifts[0].shift?.name,
      });
    }
    
    return res.json({ success: true, data: shifts });
  } catch (error: any) {
    console.error("Error in getShiftsByDoctor:", error);
    return res
      .status(500)
      .json({ success: false, message: "Get shifts by doctor failed", error: error.message });
  }
};

export const getDoctorsOnDuty = async (req: Request, res: Response) => {
  try {
    let shiftId = req.query.shiftId ? Number(req.query.shiftId) : undefined;
    let workDate = req.query.workDate ? String(req.query.workDate) : undefined;

    // Automatic detection if no specific shift/date provided
    if (!shiftId || !workDate) {
      // Use local time for shift detection (VN Timezone)
      const now = new Date();
      // Add 7 hours if server is UTC to match VN (optional but good for consistency)
      const vnTime = new Date(now.getTime() + (now.getTimezoneOffset() == 0 ? 7 * 60 * 60 * 1000 : 0));
      
      const currentTime = vnTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const currentDate = vnTime.toISOString().split('T')[0];

      if (!workDate) workDate = currentDate;
      
      if (!shiftId) {
        const allShifts = await Shift.findAll();
        const activeShift = allShifts.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
        
        if (!activeShift) {
          return res.json({ success: true, data: [], message: "No active shift at this time" });
        }
        shiftId = activeShift.id;
      }
    }

    const doctorShifts = await DoctorShift.findAll({
      where: { 
        shiftId, 
        workDate,
        status: "ACTIVE"
      },
      include: [
        { 
          model: Doctor, 
          as: "doctor",
          include: [
            { model: User, as: "user", attributes: ["fullName", "avatar"] },
            { model: Specialty, as: "specialty", attributes: ["name"] }
          ]
        },
        { model: Shift, as: "shift" },
      ],
    });

    // Flatten data for frontend ShiftService expectations
    const formattedDoctors = doctorShifts.map((ds: any) => ({
      id: ds.doctor.id,
      doctorCode: ds.doctor.doctorCode,
      fullName: ds.doctor.user?.fullName || "Bác sĩ",
      avatar: ds.doctor.user?.avatar || null,
      specialty: ds.doctor.specialty?.name || "Đang cập nhật",
      workDate: ds.workDate,
      shift: ds.shift
    }));

    return res.json({ success: true, data: formattedDoctors });
  } catch (error: any) {
    console.error("Error in getDoctorsOnDuty:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Get doctors on duty failed", 
      error: error.message 
    });
  }
};

export const getAvailableShifts = async (req: Request, res: Response) => {
  try {
    const { workDate, specialtyId } = req.query;

    if (!workDate) {
      return res.status(400).json({
        success: false,
        message: "workDate is required (YYYY-MM-DD)",
      });
    }

    // Get all shifts
    const allShifts = await Shift.findAll();

    // ✅ Check if querying for today
    const today = new Date().toLocaleDateString("en-CA");
    const isToday = String(workDate) === today;
    let currentTime = "";

    if (isToday) {
      const now = new Date();
      currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
      console.log(`⏰ Querying shifts for today. Current time: ${currentTime}`);
    }

    // Get doctor shifts for the specified date
    const whereCondition: any = { workDate: String(workDate) };

    const doctorShifts = await DoctorShift.findAll({
      where: whereCondition,
      include: [
        {
          model: Doctor,
          as: "doctor",
          where: specialtyId ? { specialtyId: Number(specialtyId) } : undefined,
        },
        { model: Shift, as: "shift" },
      ],
    });

    // Group by shift and count doctors
    const shiftMap = new Map<number, any>();

    allShifts.forEach((shift: any) => {
      // ✅ Filter out shifts that have already ended (if today)
      if (isToday && currentTime >= shift.endTime) {
        console.log(`⏰ Skipping shift "${shift.name}" (${shift.endTime}) - already ended`);
        return; // Skip this shift
      }

      shiftMap.set(shift.id, {
        shift: shift.toJSON(),
        doctorCount: 0,
        doctors: [],
      });
    });

    doctorShifts.forEach((ds: any) => {
      const shiftData = shiftMap.get(ds.shiftId);
      if (shiftData) {
        shiftData.doctorCount += 1;
        shiftData.doctors.push(ds.doctor);
      }
    });

    // Convert map to array and filter available shifts (with doctors)
    const availableShifts = Array.from(shiftMap.values()).filter(
      (item) => item.doctorCount > 0
    );

    return res.json({
      success: true,
      data: availableShifts,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Get available shifts failed",
    });
  }
};

/**
 * Get available doctors by date and specialty
 * NEW ENDPOINT for booking flow: Choose Date -> Choose Doctor
 */
export const getAvailableDoctorsByDate = async (req: Request, res: Response) => {
  try {
    const { workDate, specialtyId } = req.query;

    if (!workDate) {
      return res.status(400).json({
        success: false,
        message: "workDate is required (YYYY-MM-DD)",
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(workDate))) {
      return res.status(400).json({
        success: false,
        message: "workDate must be in YYYY-MM-DD format",
      });
    }

    // Build where condition
    const whereCondition: any = {
      workDate: String(workDate),
      status: "ACTIVE" // Only get active shifts
    };

    // Build doctor where condition
    const doctorWhere: any = {};
    if (specialtyId) {
      doctorWhere.specialtyId = Number(specialtyId);
    }

    // Get doctor shifts for the specified date
    const doctorShifts = await DoctorShift.findAll({
      where: whereCondition,
      include: [
        {
          model: Doctor,
          as: "doctor",
          where: Object.keys(doctorWhere).length > 0 ? doctorWhere : undefined,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email", "avatar", "isActive"],
              include: [
                {
                  model: Employee,
                  as: "employee",
                  attributes: ["phone", "gender", "dateOfBirth", "address"],
                },
              ],
            },
            {
              model: Specialty,
              as: "specialty",
              attributes: ["id", "name", "description"],
            },
          ],
        },
        {
          model: Shift,
          as: "shift",
          attributes: ["id", "name", "startTime", "endTime"],
        },
      ],
    });

    // Fetch booking counts for this date
    // We count non-cancelled appointments
    const bookings = await Appointment.findAll({
      where: {
        date: String(workDate),
        status: {
            [Op.ne]: "CANCELLED"
        }
      },
      attributes: ["doctorId", "shiftId", "status"]
    });

    // Create a map of booking counts: doctorId_shiftId -> count
    const bookingMap = new Map<string, number>();
    bookings.forEach((booking: any) => {
        if (booking.status !== "CANCELLED" && booking.status !== "NO_SHOW") { // Check status string literals
            const key = `${booking.doctorId}_${booking.shiftId}`;
            bookingMap.set(key, (bookingMap.get(key) || 0) + 1);
        }
    });

    // Group by doctor to get all shifts for each doctor
    const doctorMap = new Map<number, any>();

    doctorShifts.forEach((ds: any) => {
      const doctorId = ds.doctor.id;
      const shiftId = ds.shiftId;
      
      const currentBookings = bookingMap.get(`${doctorId}_${shiftId}`) || 0;
      // Use doctor shift specific maxSlots if available, otherwise global default (e.g. 10 or from config)
      // Since we don't import config here, let's just pass null if not set, frontend handles fallback? 
      // Or safer: logic in backend. 
      // Let's rely on what we have. ds.maxSlots is in model.
      const maxSlots = ds.maxSlots || 10; // Default fallback if not set

      if (!doctorMap.has(doctorId)) {
        doctorMap.set(doctorId, {
          doctor: {
            id: ds.doctor.id,
            userId: ds.doctor.userId,
            specialtyId: ds.doctor.specialtyId,
            licenseNumber: ds.doctor.licenseNumber,
            yearsOfExperience: ds.doctor.yearsOfExperience,
            biography: ds.doctor.biography,
            user: ds.doctor.user,
            specialty: ds.doctor.specialty,
          },
          shifts: [],
          shiftCount: 0,
        });
      }

      const doctorData = doctorMap.get(doctorId);
      doctorData.shifts.push({
        doctorShiftId: ds.id,
        shift: ds.shift,
        workDate: ds.workDate,
        status: ds.status,
        maxSlots: maxSlots,
        currentBookings: currentBookings,
        isFull: currentBookings >= maxSlots
      });
      doctorData.shiftCount += 1;
    });

    // Convert map to array
    const availableDoctors = Array.from(doctorMap.values());

    return res.json({
      success: true,
      data: availableDoctors,
      count: availableDoctors.length,
      date: workDate,
    });
  } catch (error: any) {
    console.error("Get available doctors by date error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Get available doctors by date failed",
    });
  }
};

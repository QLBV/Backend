import { Op } from "sequelize";
import Attendance, { AttendanceStatus } from "../../models/Attendance";
import User from "../../models/User";
import Doctor from "../../models/Doctor";
import DoctorShift from "../../models/DoctorShift";
import Shift from "../../models/Shift";
import { sequelize } from "../../models/index";

interface AttendanceFilters {
  userId?: number;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export interface AttendanceUpdateData {
  status?: AttendanceStatus;
  note?: string;
  checkInTime?: Date;
  checkOutTime?: Date;
}

export class AttendanceService {
  
  static async checkIn(userId: number) {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    
    const existing = await Attendance.findOne({
      where: {
        userId,
        date: today,
      },
    });

    if (existing && existing.checkInTime) {
      throw new Error("ALREADY_CHECKED_IN_TODAY");
    }

    
    
    
    let isLate = false;
    let note = "";

    const doctor = await Doctor.findOne({ where: { userId } });
    if (doctor) {
      
      const doctorShift = await DoctorShift.findOne({
        where: { doctorId: doctor.id, workDate: today },
        include: [{ model: Shift, as: "shift" }],
      });

      if (doctorShift && (doctorShift as any).shift) {
        const shiftStart = (doctorShift as any).shift.startTime; 
        const [h, m] = shiftStart.split(":").map(Number);
        const shiftStartTime = new Date();
        shiftStartTime.setHours(h, m, 0, 0);

        if (now > shiftStartTime) {
          isLate = true;
          note = `Đi muộn so với ca trực: ${shiftStart}`;
        }
      } else {
        
        const defaultStart = new Date();
        defaultStart.setHours(8, 0, 0, 0);
        if (now > defaultStart) {
          isLate = true;
          note = "Đi muộn (Ca làm việc mặc định 08:00)";
        }
      }
    } else {
      
      const defaultStart = new Date();
      defaultStart.setHours(8, 0, 0, 0);
      if (now > defaultStart) {
        isLate = true;
        note = "Đi muộn (Giờ làm việc 08:00)";
      }
    }

    const status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    if (existing) {
      existing.checkInTime = now;
      existing.status = status;
      existing.note = existing.note ? `${existing.note}; ${note}` : note;
      await existing.save();
      return existing;
    }

    return await Attendance.create({
      userId,
      date: today as any,
      checkInTime: now,
      status,
      note,
    });
  }

  
  static async checkOut(userId: number) {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    const attendance = await Attendance.findOne({
      where: {
        userId,
        date: today,
      },
    });

    if (!attendance) {
      throw new Error("NO_CHECK_IN_RECORD_TODAY");
    }

    if (!attendance.checkInTime) {
      throw new Error("MUST_CHECK_IN_FIRST");
    }

    if (attendance.checkOutTime) {
      throw new Error("ALREADY_CHECKED_OUT");
    }

    
    const doctor = await Doctor.findOne({ where: { userId } });
    let isEarly = false;
    if (doctor) {
      const doctorShift = await DoctorShift.findOne({
        where: { doctorId: doctor.id, workDate: today },
        include: [{ model: Shift, as: "shift" }],
      });

      if (doctorShift && (doctorShift as any).shift) {
        const shiftEnd = (doctorShift as any).shift.endTime; 
        const [h, m] = shiftEnd.split(":").map(Number);
        const shiftEndTime = new Date();
        shiftEndTime.setHours(h, m, 0, 0);

        if (now < shiftEndTime) {
          isEarly = true;
        }
      }
    } else {
      const defaultEnd = new Date();
      defaultEnd.setHours(17, 0, 0, 0);
      if (now < defaultEnd) {
        isEarly = true;
      }
    }

    attendance.checkOutTime = now;
    if (isEarly && attendance.status !== AttendanceStatus.LATE) {
      attendance.status = AttendanceStatus.EARLY_LEAVE;
    }
    
    await attendance.save();
    return attendance;
  }

  
  static async getAttendance(filters: AttendanceFilters) {
    const { userId, startDate, endDate, status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    const { rows, count } = await Attendance.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "roleId"],
        },
      ],
      order: [
        ["date", "DESC"],
        ["id", "DESC"],
      ],
      limit,
      offset,
    });

    return {
      records: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  
  static async requestLeave(userId: number, date: string, type: "sick" | "vacation", reason: string) {
    const leaveDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (leaveDate < today) {
      throw new Error("CANNOT_REQUEST_LEAVE_FOR_PAST_DATE");
    }

    const existing = await Attendance.findOne({
      where: { userId, date: leaveDate },
    });

    if (existing) {
      throw new Error("ATTENDANCE_RECORD_ALREADY_EXISTS");
    }

    const status = type === "sick" ? AttendanceStatus.SICK_LEAVE : AttendanceStatus.LEAVE;

    return await Attendance.create({
      userId,
      date: leaveDate,
      status,
      note: reason,
    });
  }

  
  static async autoMarkAbsence(dateStr?: string) {
    const targetDate = dateStr || new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    
    
    
    const eligibleUsers = await User.findAll({
      where: {
        isActive: true,
        roleId: {
          [Op.in]: [1, 2, 4] 
        }
      }
    });

    let markCount = 0;
    for (const user of eligibleUsers) {
      const existing = await Attendance.findOne({
        where: { userId: user.id, date: targetDate }
      });

      if (!existing) {
        
        let shouldHaveWorked = true;
        
        
        const doctor = await Doctor.findOne({ where: { userId: user.id } });
        if (doctor) {
          const hasShift = await DoctorShift.findOne({
            where: { doctorId: doctor.id, workDate: targetDate, status: "ACTIVE" }
          });
          if (!hasShift) shouldHaveWorked = false;
        }

        if (shouldHaveWorked) {
          await Attendance.create({
            userId: user.id,
            date: new Date(targetDate),
            status: AttendanceStatus.ABSENT,
            note: "Automatically marked as absent",
          });
          markCount++;
        }
      }
    }

    return markCount;
  }

  
  static async manualMarkAbsence(userId: number, date: string, note?: string) {
    const existing = await Attendance.findOne({
      where: { userId, date },
    });

    if (existing) {
      existing.status = AttendanceStatus.ABSENT;
      existing.note = note || "Marked as absent by administrator";
      await existing.save();
      return existing;
    }

    return await Attendance.create({
      userId,
      date: new Date(date),
      status: AttendanceStatus.ABSENT,
      note: note || "Marked as absent by administrator",
    });
  }

  
  static async updateAttendance(id: number, data: AttendanceUpdateData) {
    const attendance = await Attendance.findByPk(id);

    if (!attendance) {
      throw new Error("ATTENDANCE_NOT_FOUND");
    }

    if (data.status !== undefined) attendance.status = data.status;
    if (data.note !== undefined) attendance.note = data.note;
    if (data.checkInTime !== undefined) attendance.checkInTime = new Date(data.checkInTime);
    if (data.checkOutTime !== undefined) attendance.checkOutTime = new Date(data.checkOutTime);

    await attendance.save();
    return attendance;
  }
}

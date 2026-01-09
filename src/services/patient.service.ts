import sequelize from "../config/database";
import Patient from "../models/Patient";
import PatientProfile from "../models/PatientProfile";
import { Op } from "sequelize";

interface ProfileInput {
  type: "phone" | "email" | "address";
  value: string;
  city?: string;
  ward?: string;
  isPrimary?: boolean;
}

interface SetupPatientProfileInput {
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
  cccd: string;
  profiles: ProfileInput[];
}

/* ================= SETUP Patient Profile (NEW) ================= */

export const setupPatientProfileService = async (
  userId: number,
  data: SetupPatientProfileInput
) => {
  const transaction = await sequelize.transaction();
  try {
    // Kiểm tra Patient đã tồn tại
    let patient = await Patient.findOne({
      where: { userId },
      transaction,
    });

    // Nếu đã setup xong, không cho setup lại
    if (patient && patient.isActive && patient.patientCode) {
      throw new Error("PATIENT_ALREADY_SETUP");
    }

    // Validate CCCD format (12 chữ số)
    if (!/^\d{12}$/.test(data.cccd.trim())) {
      throw new Error("CCCD_INVALID_FORMAT");
    }

    // Validate dateOfBirth
    const dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime())) {
      throw new Error("DOB_INVALID_FORMAT");
    }
    if (dob > new Date()) {
      throw new Error("DOB_CANNOT_BE_FUTURE");
    }

    // Kiểm tra CCCD không trùng
    const existingCCCD = await Patient.findOne({
      where: {
        cccd: data.cccd.trim(),
        ...(patient ? { id: { [Op.ne]: patient.id } } : {}),
      },
      transaction,
    });

    if (existingCCCD) {
      throw new Error("CCCD_ALREADY_EXISTS");
    }

    // Tạo hoặc update Patient
    if (!patient) {
      patient = await Patient.create(
        {
          userId,
          fullName: data.fullName.trim(),
          gender: data.gender,
          dateOfBirth: dob,
          cccd: data.cccd.trim(),
          avatar: null,
          isActive: true,
        },
        { transaction }
      );

      // Tạo patientCode
      const patientCode = "BN" + String(patient.id).padStart(6, "0");
      await patient.update({ patientCode }, { transaction });
    } else {
      // Update existing patient
      await patient.update(
        {
          fullName: data.fullName.trim(),
          gender: data.gender,
          dateOfBirth: dob,
          cccd: data.cccd.trim(),
        },
        { transaction }
      );
    }

    // Xóa profiles cũ
    await PatientProfile.destroy({
      where: { patientId: patient.id },
      transaction,
    });

    // Chuẩn hoá và tạo profiles mới
    const profiles = data.profiles.map((p) => ({
      patientId: patient.id,
      type: p.type,
      value: p.value.trim(),
      city: p.city?.trim() || undefined,
      ward: p.ward?.trim() || undefined,
      isPrimary: p.isPrimary ?? false,
    }));

    if (profiles.length > 0) {
      await PatientProfile.bulkCreate(profiles, { transaction });
    }

    // Reload patient với profiles trong transaction trước khi commit
    await patient.reload({
      include: [{ model: PatientProfile, as: "profiles" }],
      transaction,
    });

    await transaction.commit();

    // Reload lại sau khi commit để đảm bảo data đã được lưu
    const updatedPatient = await Patient.findByPk(patient.id, {
      include: [{ model: PatientProfile, as: "profiles" }],
    });

    if (!updatedPatient) {
      throw new Error("Failed to reload patient after setup");
    }

    console.log("✅ Patient profile setup successfully:", {
      patientId: updatedPatient.id,
      patientCode: updatedPatient.patientCode,
      profilesCount: updatedPatient.profiles?.length || 0,
    });

    return updatedPatient;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/* ================= READ ================= */

export const getPatientsService = async (page = 1, limit = 10, cccd?: string) => {
  const offset = (page - 1) * limit;
  const where: any = { isActive: true };

  // Filter by CCCD if provided
  if (cccd) {
    where.cccd = cccd;
  }

  return Patient.findAll({
    where,
    include: [{ model: PatientProfile, as: "profiles" }],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });
};

export const getPatientByIdService = async (id: number) => {
  const patient = await Patient.findOne({
    where: { id, isActive: true },
    include: [{ model: PatientProfile, as: "profiles" }],
  });
  if (!patient) {
    throw new Error("PATIENT_NOT_FOUND");
  }
  return patient;
};

export const getPatientByCccdService = async (cccd: string) => {
  const patient = await Patient.findOne({
    where: { cccd, isActive: true },
    include: [{ model: PatientProfile, as: "profiles" }],
  });
  if (!patient) {
    throw new Error("PATIENT_NOT_FOUND");
  }
  return patient;
};

/* ================= UPDATE ================= */

export const updatePatientService = async (id: number, data: any) => {
  return sequelize.transaction(async (t) => {
    try {
      const patient = await Patient.findByPk(id, { transaction: t });
      if (!patient || !patient.isActive) {
        throw new Error("PATIENT_NOT_FOUND");
      }

    /* ================= UPDATE CORE ================= */
    const updateData: any = {
      fullName: data.fullName ? data.fullName.trim() : patient.fullName,
      gender: data.gender ?? patient.gender,
      dateOfBirth: data.dateOfBirth
        ? new Date(data.dateOfBirth)
        : patient.dateOfBirth,
    };

    // Update health information fields
    if (data.bloodType !== undefined) {
      updateData.bloodType = data.bloodType || null;
    }
    if (data.height !== undefined) {
      updateData.height = data.height ? parseFloat(data.height) : null;
    }
    if (data.weight !== undefined) {
      updateData.weight = data.weight ? parseFloat(data.weight) : null;
    }
    if (data.chronicDiseases !== undefined) {
      updateData.chronicDiseases = Array.isArray(data.chronicDiseases) 
        ? data.chronicDiseases.filter((d: string) => d && d.trim()) 
        : [];
      // Ensure it's saved as JSON - keep empty array instead of null for consistency
      console.log("📝 Updating chronicDiseases:", updateData.chronicDiseases);
    }
    if (data.allergies !== undefined) {
      updateData.allergies = Array.isArray(data.allergies) 
        ? data.allergies.filter((a: string) => a && a.trim()) 
        : [];
      // Ensure it's saved as JSON - keep empty array instead of null for consistency
      console.log("📝 Updating allergies:", updateData.allergies);
    }

    console.log("📝 Updating patient with data:", {
      id,
      updateData,
      chronicDiseases: updateData.chronicDiseases,
      allergies: updateData.allergies,
      updateDataKeys: Object.keys(updateData),
    });

    try {
      await patient.update(updateData, { transaction: t });
      console.log("✅ Patient.update() completed successfully");
    } catch (updateError: any) {
      console.error("❌ Patient.update() failed:", updateError.message);
      console.error("Update error details:", {
        code: updateError.code,
        sqlState: updateError.sqlState,
        sqlMessage: updateError.sqlMessage,
      });
      throw updateError;
    }

    /* ================= UPDATE PROFILES ================= */
    if (Array.isArray(data.profiles)) {
      // Xoá cũ
      await PatientProfile.destroy({
        where: { patientId: id },
        transaction: t,
      });

      // Chuẩn hoá dữ liệu
      const profiles = data.profiles.map((p: any) => ({
        patientId: id,
        type: p.type,
        value: p.value.trim(),
        city: p.city?.trim() || undefined,
        ward: p.ward?.trim() || undefined,
        isPrimary: p.isPrimary ?? false,
      }));

      if (profiles.length > 0) {
        await PatientProfile.bulkCreate(profiles, { transaction: t });
      }
    }

    /* ================= RETURN FULL DATA ================= */
    const updatedPatient = await Patient.findByPk(id, {
      include: [{ model: PatientProfile, as: "profiles" }],
      transaction: t,
    });

    // Ensure JSON fields are parsed correctly
    if (updatedPatient) {
      // Sequelize should auto-parse JSON, but ensure it's an array
      if (updatedPatient.chronicDiseases) {
        if (typeof updatedPatient.chronicDiseases === 'string') {
          try {
            (updatedPatient as any).chronicDiseases = JSON.parse(updatedPatient.chronicDiseases);
          } catch (e) {
            console.error("Error parsing chronicDiseases:", e);
            (updatedPatient as any).chronicDiseases = [];
          }
        } else if (!Array.isArray(updatedPatient.chronicDiseases)) {
          (updatedPatient as any).chronicDiseases = [];
        }
      } else {
        (updatedPatient as any).chronicDiseases = [];
      }

      if (updatedPatient.allergies) {
        if (typeof updatedPatient.allergies === 'string') {
          try {
            (updatedPatient as any).allergies = JSON.parse(updatedPatient.allergies);
          } catch (e) {
            console.error("Error parsing allergies:", e);
            (updatedPatient as any).allergies = [];
          }
        } else if (!Array.isArray(updatedPatient.allergies)) {
          (updatedPatient as any).allergies = [];
        }
      } else {
        (updatedPatient as any).allergies = [];
      }

      console.log("✅ Updated patient with chronicDiseases:", (updatedPatient as any).chronicDiseases);
      console.log("✅ Updated patient with allergies:", (updatedPatient as any).allergies);
    }

    return updatedPatient;
    } catch (error: any) {
      console.error("❌ Error in updatePatientService:", {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        stack: error.stack,
      });
      throw error;
    }
  });
};

/* ================= DELETE (SOFT) ================= */

export const deletePatientService = async (id: number) => {
  const transaction = await sequelize.transaction();
  try {
    const patient = await Patient.findByPk(id, { transaction });
    if (!patient || !patient.isActive) {
      throw new Error("PATIENT_NOT_FOUND");
    }

    await patient.update({ isActive: false }, { transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

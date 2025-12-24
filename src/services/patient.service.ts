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

    await transaction.commit();

    // Reload patient với profiles
    const updatedPatient = await Patient.findByPk(patient.id, {
      include: [{ model: PatientProfile, as: "profiles" }],
    });

    return updatedPatient;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/* ================= READ ================= */

export const getPatientsService = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return Patient.findAll({
    where: { isActive: true },
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

/* ================= UPDATE ================= */

export const updatePatientService = async (id: number, data: any) => {
  return sequelize.transaction(async (t) => {
    const patient = await Patient.findByPk(id, { transaction: t });
    if (!patient || !patient.isActive) {
      throw new Error("PATIENT_NOT_FOUND");
    }

    /* ================= UPDATE CORE ================= */
    await patient.update(
      {
        fullName: data.fullName ? data.fullName.trim() : patient.fullName,
        gender: data.gender ?? patient.gender,
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth)
          : patient.dateOfBirth,
      },
      { transaction: t }
    );

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
    return Patient.findByPk(id, {
      include: [{ model: PatientProfile, as: "profiles" }],
      transaction: t,
    });
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

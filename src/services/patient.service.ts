import sequelize from "../config/database";
import Patient from "../models/Patient";
import PatientProfile from "../models/PatientProfile";

/* ================= BƯỚC 2: CREATE - Patient Identity ================= */
interface CreatePatientIdentityInput {
  fullName: string;
  gender: "male" | "female" | "other";
  dateOfBirth: string;
  cccd: string;
}
export const createPatientIdentityService = async (
  userId: number,
  data: CreatePatientIdentityInput
) => {
  const transaction = await sequelize.transaction();
  try {
    // Kiểm tra patient đã tồn tại
    const existingPatient = await Patient.findOne({
      where: { userId },
      transaction,
    });
    if (existingPatient) {
      throw new Error("PATIENT_ALREADY_EXISTS");
    }

    // Kiểm tra CCCD đã được đăng ký
    const existingCCCD = await Patient.findOne({
      where: { cccd: data.cccd },
      transaction,
    });

    if (existingCCCD) {
      throw new Error("CCCD_ALREADY_EXISTS");
    }

    // Tạo patient
    const patient = await Patient.create(
      {
        userId,
        fullName: data.fullName.trim(),
        gender: data.gender,
        dateOfBirth: new Date(data.dateOfBirth),
        cccd: data.cccd.trim(),
        avatar: null,
        isActive: true,
      },
      { transaction }
    );

    // Tạo patientCode
    const patientCode = "BN" + String(patient.id).padStart(6, "0");
    await patient.update({ patientCode }, { transaction });

    await transaction.commit();

    return {
      id: patient.id,
      patientCode: patient.patientCode,
      fullName: patient.fullName,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      cccd: patient.cccd,
      userId: patient.userId,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
/* ================= BƯỚC 3: CREATE - Patient Profiles ================= */
interface ProfileInput {
  type: "phone" | "email" | "address";
  value: string;
  city?: string;
  ward?: string;
  isPrimary?: boolean;
}
export const updatePatientProfileService = async (
  patientId: number,
  profilesData: ProfileInput[]
) => {
  const transaction = await sequelize.transaction();
  try {
    // Kiểm tra patient có tồn tại không
    const patient = await Patient.findByPk(patientId, { transaction });
    if (!patient || !patient.isActive) {
      throw new Error("PATIENT_NOT_FOUND");
    }

    // Xóa profiles cũ
    await PatientProfile.destroy({
      where: { patientId },
      transaction,
    });

    // Chuẩn hoá dữ liệu profiles
    const profiles = profilesData.map((p) => ({
      patientId,
      type: p.type,
      value: p.value,
      city: p.city || null,
      ward: p.ward || null,
      isPrimary: p.isPrimary ?? false,
    }));

    // Tạo profiles mới
    const result = await PatientProfile.bulkCreate(profiles as any, {
      transaction,
    });
    await transaction.commit();

    return {
      patientId,
      profiles: result,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
/* ================= READ ================= */
export const getPatientsService = async () => {
  return Patient.findAll({
    where: { isActive: true },
    include: [{ model: PatientProfile, as: "profiles" }],
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
        value: p.value,
        city: p.city || null,
        ward: p.ward || null,
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

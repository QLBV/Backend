import sequelize from "../config/database";
import Patient from "../models/Patient";
import PatientProfile from "../models/PatientProfile";

/* ================= CREATE ================= */

interface CreatePatientInput {
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  profiles?: {
    type: "phone" | "email" | "address";
    value: string;
    city?: string;
    ward?: string;
    isPrimary?: boolean;
  }[];
}

export const createPatientService = async (data: CreatePatientInput) => {
  const transaction = await sequelize.transaction();

  try {
    // Create patient
    const patient = await Patient.create(
      {
        fullName: data.fullName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
      },
      { transaction }
    );

    // Generate patientCode
    const patientCode = "BN" + String(patient.id).padStart(6, "0");
    await patient.update({ patientCode }, { transaction });

    // Create profiles
    if (data.profiles?.length) {
      const profiles = data.profiles.map((p) => ({
        ...p,
        patientId: patient.id,
      }));

      await PatientProfile.bulkCreate(profiles, { transaction });
    }

    await transaction.commit();
    return patient;
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
        fullName: data.fullName ?? patient.fullName,
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

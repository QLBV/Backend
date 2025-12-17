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

    // Update patient core
    await patient.update(
      {
        fullName: data.fullName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth)
          : patient.dateOfBirth,
      },
      { transaction: t }
    );

    // Replace profiles
    if (data.profiles) {
      await PatientProfile.destroy({
        where: { patientId: id },
        transaction: t,
      });

      const profiles = data.profiles.map((p: any) => ({
        ...p,
        patientId: id,
      }));

      await PatientProfile.bulkCreate(profiles, { transaction: t });
    }

    return patient;
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

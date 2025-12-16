import sequelize from "../config/database";
import Patient from "../models/Patient";
import PatientContact from "../models/PatientContact";

/* ================= CREATE ================= */

interface CreatePatientInput {
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  contacts?: {
    type: "email" | "phone";
    value: string;
    isPrimary?: boolean;
  }[];
}

export const createPatientService = async (data: CreatePatientInput) => {
  return sequelize.transaction(async (t) => {
    // Create patient
    const patient = await Patient.create(
      {
        fullName: data.fullName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
      },
      { transaction: t }
    );

    // Generate patientCode BN000xxx
    const patientCode = "BN" + String(patient.id).padStart(6, "0");
    await patient.update({ patientCode }, { transaction: t });

    // Create contacts
    if (data.contacts?.length) {
      const contacts = data.contacts.map((c) => ({
        patientId: patient.id,
        type: c.type,
        value: c.value,
        isPrimary: c.isPrimary ?? false,
      }));

      await PatientContact.bulkCreate(contacts, { transaction: t });
    }

    return patient;
  });
};

/* ================= READ ================= */

export const getPatientsService = async () => {
  return Patient.findAll({
    where: { isActive: true },
    include: [
      {
        model: PatientContact,
        as: "contacts",
        attributes: ["type", "value", "isPrimary"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

export const getPatientByIdService = async (id: number) => {
  const patient = await Patient.findOne({
    where: { id, isActive: true },
    include: [
      {
        model: PatientContact,
        as: "contacts",
      },
    ],
  });

  if (!patient) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  return patient;
};

/* ================= UPDATE ================= */

export const updatePatientService = async (
  id: number,
  data: Partial<CreatePatientInput>
) => {
  const patient = await Patient.findByPk(id);
  if (!patient || !patient.isActive) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  await patient.update({
    fullName: data.fullName,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth
      ? new Date(data.dateOfBirth)
      : patient.dateOfBirth,
  });

  return patient;
};

/* ================= DELETE ================= */

export const deletePatientService = async (id: number) => {
  const patient = await Patient.findByPk(id);
  if (!patient || !patient.isActive) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  await patient.update({ isActive: false });
};

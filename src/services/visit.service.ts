import sequelize from "../config/database";
import Visit from "../models/Visit";
import Patient from "../models/Patient";

interface CreateVisitInput {
  visitDate: string;
  symptomInitial: string;
}

/* ================= CREATE - Visit ================= */

export const createVisitService = async (
  patientId: number,
  data: CreateVisitInput
) => {
  const transaction = await sequelize.transaction();
  try {
    // ✅ Kiểm tra patient tồn tại và đã setup đầy đủ
    const patient = await Patient.findOne({
      where: { id: patientId, isActive: true },
      transaction,
    });

    if (!patient) {
      throw new Error("PATIENT_NOT_FOUND");
    }

    // Kiểm tra patient đã setup profile chưa
    if (!patient.patientCode || !patient.cccd) {
      throw new Error("PATIENT_NOT_SETUP");
    }

    // Validate input
    if (!data.symptomInitial || !data.symptomInitial.trim()) {
      throw new Error("SYMPTOM_REQUIRED");
    }

    // Validate visit date format
    const visitDate = new Date(data.visitDate);
    if (isNaN(visitDate.getTime())) {
      throw new Error("VISIT_DATE_INVALID_FORMAT");
    }

    // Không cho đặt lịch quá khứ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (visitDate < today) {
      throw new Error("VISIT_DATE_CANNOT_BE_PAST");
    }

    // Không cho đặt lịch quá 90 ngày trong tương lai
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 90);
    if (visitDate > maxDate) {
      throw new Error("VISIT_DATE_TOO_FAR");
    }

    // Create visit
    const visit = await Visit.create(
      {
        patientId,
        visitDate,
        symptomInitial: data.symptomInitial.trim(),
        status: "waiting",
      },
      { transaction }
    );

    // Generate visit code
    const visitCode = "LK" + String(visit.id).padStart(6, "0");
    await visit.update({ visitCode }, { transaction });

    await transaction.commit();

    return visit;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/* ================= READ ================= */

export const getVisitsByPatientService = async (patientId: number) => {
  return Visit.findAll({
    where: { patientId },
    order: [["visitDate", "DESC"]],
  });
};

export const getVisitByIdService = async (
  id: number,
  currentUser?: { role: string; patientId?: number }
) => {
  const visit = await Visit.findByPk(id);
  if (!visit) {
    throw new Error("VISIT_NOT_FOUND");
  }

  if (
    currentUser?.role === "PATIENT" &&
    visit.patientId !== currentUser.patientId
  ) {
    throw new Error("FORBIDDEN");
  }

  return visit;
};

/* ================= UPDATE ================= */

export const updateVisitService = async (
  id: number,
  data: any,
  currentUser?: { role: string; patientId?: number }
) => {
  const transaction = await sequelize.transaction();
  try {
    const visit = await Visit.findByPk(id, { transaction });
    if (!visit) {
      throw new Error("VISIT_NOT_FOUND");
    }

    // 🔐 PATIENT chỉ được sửa visit của mình
    if (
      currentUser?.role === "PATIENT" &&
      visit.patientId !== currentUser.patientId
    ) {
      throw new Error("FORBIDDEN");
    }

    if (
      data.status &&
      !["waiting", "examining", "done"].includes(data.status)
    ) {
      throw new Error("INVALID_STATUS");
    }
    if (currentUser?.role === "PATIENT" && data.status) {
      throw new Error("FORBIDDEN");
    }

    await visit.update(
      {
        symptomInitial: data.symptomInitial
          ? data.symptomInitial.trim()
          : visit.symptomInitial,
        status: data.status ?? visit.status,
      },
      { transaction }
    );

    await transaction.commit();
    return visit;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
/* ================= DELETE ================= */

export const deleteVisitService = async (
  id: number,
  currentUser?: { role: string; patientId?: number }
) => {
  const transaction = await sequelize.transaction();
  try {
    const visit = await Visit.findByPk(id, { transaction });
    if (!visit) {
      throw new Error("VISIT_NOT_FOUND");
    }

    // 🔐 PATIENT chỉ được xoá visit của mình
    if (
      currentUser?.role === "PATIENT" &&
      visit.patientId !== currentUser.patientId
    ) {
      throw new Error("FORBIDDEN");
    }

    if (visit.status !== "waiting") {
      throw new Error("VISIT_CANNOT_DELETE");
    }

    await visit.destroy({ transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

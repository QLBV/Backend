import Visit from "../models/Visit";

export const createVisitService = async (
  patientId: number,
  data: {
    visitDate: string;
    symptomInitial: string;
  }
) => {
  // Validate
  if (!data.symptomInitial) {
    throw new Error("SYMPTOM_REQUIRED");
  }

  // Create visit
  const visit = await Visit.create({
    patientId,
    visitDate: new Date(data.visitDate),
    symptomInitial: data.symptomInitial,
    status: "waiting",
  });

  // Generate visit code
  const visitCode = "LK" + String(visit.id).padStart(6, "0");
  await visit.update({ visitCode });

  return visit;
};

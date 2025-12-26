import { Op } from "sequelize";
import Prescription from "../models/Prescription";
import Medicine from "../models/Medicine";

/**
 * Generate prescription code with format: RX-YYYYMMDD-00001
 * Sequential counter resets daily
 */
export const generatePrescriptionCode = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

  // Find the latest prescription code for today
  const latestPrescription = await Prescription.findOne({
    where: {
      prescriptionCode: {
        [Op.like]: `RX-${dateStr}-%`,
      },
    },
    order: [["prescriptionCode", "DESC"]],
  });

  let sequence = 1;
  if (latestPrescription) {
    // Extract the sequence number from the last code
    const lastCode = latestPrescription.prescriptionCode;
    const lastSequence = parseInt(lastCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  // Format: RX-YYYYMMDD-00001
  const sequenceStr = sequence.toString().padStart(5, "0");
  return `RX-${dateStr}-${sequenceStr}`;
};

/**
 * Generate medicine code with format: MED-000001
 * Sequential counter increments globally
 */
export const generateMedicineCode = async (): Promise<string> => {
  // Find the latest medicine code
  const latestMedicine = await Medicine.findOne({
    where: {
      medicineCode: {
        [Op.like]: "MED-%",
      },
    },
    order: [["medicineCode", "DESC"]],
  });

  let sequence = 1;
  if (latestMedicine) {
    // Extract the sequence number from the last code
    const lastCode = latestMedicine.medicineCode;
    const lastSequence = parseInt(lastCode.split("-")[1], 10);
    sequence = lastSequence + 1;
  }

  // Format: MED-000001 (6 digits)
  const sequenceStr = sequence.toString().padStart(6, "0");
  return `MED-${sequenceStr}`;
};

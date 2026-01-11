import { Op } from "sequelize";
import Prescription from "../models/Prescription";
import Medicine from "../models/Medicine";
import Invoice from "../models/Invoice";
import Payroll from "../models/Payroll";
import Appointment from "../models/Appointment";
import Visit from "../models/Visit";
import MedicineExport from "../models/MedicineExport";

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

/**
 * Generate invoice code with format: INV-YYYYMMDD-00001
 * Sequential counter resets daily
 */
export const generateInvoiceCode = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

  // Find the latest invoice code for today
  const latestInvoice = await Invoice.findOne({
    where: {
      invoiceCode: {
        [Op.like]: `INV-${dateStr}-%`,
      },
    },
    order: [["invoiceCode", "DESC"]],
  });

  let sequence = 1;
  if (latestInvoice) {
    // Extract the sequence number from the last code
    const lastCode = latestInvoice.invoiceCode;
    const lastSequence = parseInt(lastCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  // Format: INV-YYYYMMDD-00001
  const sequenceStr = sequence.toString().padStart(5, "0");
  return `INV-${dateStr}-${sequenceStr}`;
};

/**
 * Generate payroll code with format: PAY-YYYYMM-00001
 * Sequential counter resets monthly
 */
export const generatePayrollCode = async (
  year: number,
  month: number
): Promise<string> => {
  const yearMonth = `${year}${month.toString().padStart(2, "0")}`; // YYYYMM

  // Find the latest payroll code for this month
  const latestPayroll = await Payroll.findOne({
    where: {
      payrollCode: {
        [Op.like]: `PAY-${yearMonth}-%`,
      },
    },
    order: [["payrollCode", "DESC"]],
  });

  let sequence = 1;
  if (latestPayroll) {
    // Extract the sequence number from the last code
    const lastCode = latestPayroll.payrollCode;
    const lastSequence = parseInt(lastCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  // Format: PAY-YYYYMM-00001
  const sequenceStr = sequence.toString().padStart(5, "0");
  return `PAY-${yearMonth}-${sequenceStr}`;
};

/**
 * Generate appointment code with format: APT-YYYYMMDD-00001
 * Sequential counter resets daily
 */
export const generateAppointmentCode = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

  // Find the latest appointment code for today
  const latestAppointment = await Appointment.findOne({
    where: {
      appointmentCode: {
        [Op.like]: `APT-${dateStr}-%`,
      },
    },
    order: [["appointmentCode", "DESC"]],
  });

  let sequence = 1;
  if (latestAppointment) {
    // Extract the sequence number from the last code
    const lastCode = latestAppointment.appointmentCode;
    const lastSequence = parseInt(lastCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  // Format: APT-YYYYMMDD-00001
  const sequenceStr = sequence.toString().padStart(5, "0");
  return `APT-${dateStr}-${sequenceStr}`;
};

/**
 * Generate visit code with format: VIS-YYYYMMDD-00001
 * Sequential counter resets daily
 */
export const generateVisitCode = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

  // Find the latest visit code for today
  const latestVisit = await Visit.findOne({
    where: {
      visitCode: {
        [Op.like]: `VIS-${dateStr}-%`,
      },
    },
    order: [["visitCode", "DESC"]],
  });

  let sequence = 1;
  if (latestVisit) {
    // Extract the sequence number from the last code
    const lastCode = (latestVisit as any).visitCode;
    const lastSequence = parseInt(lastCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  // Format: VIS-YYYYMMDD-00001
  const sequenceStr = sequence.toString().padStart(5, "0");
  return `VIS-${dateStr}-${sequenceStr}`;
};

/**
 * Generate export code with format: EXP-YYYYMMDD-00001
 * Sequential counter resets daily
 */
export const generateExportCode = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

  // Find the latest export code for today
  const latestExport = await MedicineExport.findOne({
    where: {
      exportCode: {
        [Op.like]: `EXP-${dateStr}-%`,
      },
    },
    order: [["exportCode", "DESC"]],
  });

  let sequence = 1;
  if (latestExport) {
    // Extract the sequence number from the last code
    const lastCode = (latestExport as any).exportCode;
    const lastSequence = parseInt(lastCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  // Format: EXP-YYYYMMDD-00001
  const sequenceStr = sequence.toString().padStart(5, "0");
  return `EXP-${dateStr}-${sequenceStr}`;
};

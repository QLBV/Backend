import { Op } from "sequelize";
import Prescription from "../models/Prescription";
import Medicine from "../models/Medicine";
import Invoice from "../models/Invoice";
import Payroll from "../models/Payroll";
import Appointment from "../models/Appointment";
import Visit from "../models/Visit";
import MedicineExport from "../models/MedicineExport";

export const generatePrescriptionCode = async (transaction?: any): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); 

  
  const latestPrescription = await Prescription.findOne({
    where: {
      prescriptionCode: {
        [Op.like]: `RX-${dateStr}-%`,
      },
    },
    order: [["prescriptionCode", "DESC"]],
    transaction,
  });

  let sequence = 1;
  if (latestPrescription) {
    
    const lastCode = latestPrescription.prescriptionCode;
    const lastSequence = parseInt(lastCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  
  const sequenceStr = sequence.toString().padStart(5, "0");
  return `RX-${dateStr}-${sequenceStr}`;
};


export const generateMedicineCode = async (): Promise<string> => {
  
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
    
    const lastCode = latestMedicine.medicineCode;
    const lastSequence = parseInt(lastCode.split("-")[1], 10);
    sequence = lastSequence + 1;
  }

  
  const sequenceStr = sequence.toString().padStart(6, "0");
  return `MED-${sequenceStr}`;
};


export const generateInvoiceCode = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); 

  
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
    
    const lastCode = latestInvoice.invoiceCode;
    const lastSequence = parseInt(lastCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  
  const sequenceStr = sequence.toString().padStart(5, "0");
  return `INV-${dateStr}-${sequenceStr}`;
};


export const generatePayrollCode = async (
  year: number,
  month: number
): Promise<string> => {
  const yearMonth = `${year}${month.toString().padStart(2, "0")}`; 

  
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
    
    const lastCode = latestPayroll.payrollCode;
    const lastSequence = parseInt(lastCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  
  const sequenceStr = sequence.toString().padStart(5, "0");
  return `PAY-${yearMonth}-${sequenceStr}`;
};


export const generateAppointmentCode = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); 

  
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
    
    const lastCode = latestAppointment.appointmentCode;
    const lastSequence = parseInt(lastCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  
  const sequenceStr = sequence.toString().padStart(5, "0");
  return `APT-${dateStr}-${sequenceStr}`;
};


export const generateVisitCode = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); 

  
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
    
    const lastCode = (latestVisit as any).visitCode;
    const lastSequence = parseInt(lastCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  
  const sequenceStr = sequence.toString().padStart(5, "0");
  return `VIS-${dateStr}-${sequenceStr}`;
};


export const generateExportCode = async (transaction?: any): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); 

  
  const latestExport = await MedicineExport.findOne({
    where: {
      exportCode: {
        [Op.like]: `EXP-${dateStr}-%`,
      },
    },
    order: [["exportCode", "DESC"]],
    transaction,
  });

  let sequence = 1;
  if (latestExport) {
    
    const lastCode = (latestExport as any).exportCode;
    const lastSequence = parseInt(lastCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  
  const sequenceStr = sequence.toString().padStart(5, "0");
  return `EXP-${dateStr}-${sequenceStr}`;
};

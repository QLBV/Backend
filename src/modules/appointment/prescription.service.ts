import { Transaction, Op } from "sequelize";
import { sequelize } from "../../models/index";
import Prescription, { PrescriptionStatus } from "../../models/Prescription";
import PrescriptionDetail from "../../models/PrescriptionDetail";
import Medicine from "../../models/Medicine";
import MedicineExport from "../../models/MedicineExport";
import Visit from "../../models/Visit";
import Patient from "../../models/Patient";
import Doctor from "../../models/Doctor";
import User from "../../models/User";
import PatientProfile from "../../models/PatientProfile";
import Specialty from "../../models/Specialty";
import Appointment from "../../models/Appointment";
import Invoice, { PaymentStatus } from "../../models/Invoice";
import InvoiceItem, { ItemType } from "../../models/InvoiceItem";
import {
  generatePrescriptionCode,
  generateExportCode,
  generateInvoiceCode,
} from "../../utils/codeGenerator";


interface MedicineInput {
  medicineId: number;
  quantity: number;
  dosageMorning: number;
  dosageNoon: number;
  dosageAfternoon: number;
  dosageEvening: number;
  instruction?: string;
  days?: number;
}

interface CreatePrescriptionInput {
  visitId: number;
  medicines: MedicineInput[];
  note?: string;
}

interface UpdatePrescriptionInput {
  medicines?: MedicineInput[];
  note?: string;
}


export const createPrescriptionService = async (
  doctorId: number,
  patientId: number,
  input: CreatePrescriptionInput
) => {
  return await sequelize.transaction(
    {
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    },
    async (t) => {
      
      const visit = await Visit.findByPk(input.visitId, { transaction: t });
      if (!visit) {
        throw new Error("VISIT_NOT_FOUND");
      }
      if (visit.doctorId !== doctorId) {
        throw new Error("UNAUTHORIZED_VISIT");
      }
      
      if (
        visit.status !== "EXAMINING" &&
        visit.status !== "EXAMINED" &&
        visit.status !== "COMPLETED"
      ) {
        throw new Error("VISIT_NOT_EXAMINED");
      }

      
      const appointment = await Appointment.findByPk(visit.appointmentId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!appointment) {
        throw new Error("APPOINTMENT_NOT_FOUND");
      }
      if (appointment.status === "CHECKED_IN") {
        appointment.status = "IN_PROGRESS";
        await appointment.save({ transaction: t });
      } else if (appointment.status !== "IN_PROGRESS") {
        throw new Error("APPOINTMENT_NOT_IN_PROGRESS");
      }

      
      const existingPrescription = await Prescription.findOne({
        where: { visitId: input.visitId },
        transaction: t,
      });
      if (existingPrescription) {
        throw new Error("PRESCRIPTION_ALREADY_EXISTS");
      }

      
      const prescriptionCode = await generatePrescriptionCode(t);
      const doctorUser = await Doctor.findByPk(doctorId, { transaction: t });
      const doctorUserId = doctorUser?.userId || doctorId;

      
      const prescription = await Prescription.create(
        {
          prescriptionCode,
          visitId: input.visitId,
          doctorId,
          patientId,
          totalAmount: 0,
          status: PrescriptionStatus.DRAFT,
          note: input.note,
        },
        { transaction: t }
      );

      let totalAmount = 0;

      
      for (const item of input.medicines) {
        
        const medicine = await Medicine.findByPk(item.medicineId, {
          transaction: t,
          lock: t.LOCK.UPDATE, 
        });

        if (!medicine) {
          throw new Error(`MEDICINE_NOT_FOUND_${item.medicineId}`);
        }

        if (medicine.status !== "ACTIVE") {
          throw new Error(`MEDICINE_NOT_ACTIVE_${medicine.name}`);
        }

        
        if (medicine.quantity < item.quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK_${medicine.name}_Available:${medicine.quantity}_Requested:${item.quantity}`
          );
        }

        
        medicine.quantity -= item.quantity;
        await medicine.save({ transaction: t });

        
        const itemTotal = medicine.salePrice * item.quantity;
        totalAmount += itemTotal;

        
        await PrescriptionDetail.create(
          {
            prescriptionId: prescription.id,
            medicineId: medicine.id,
            medicineName: medicine.name, 
            quantity: item.quantity,
            unit: medicine.unit, 
            unitPrice: medicine.salePrice, 
            dosageMorning: item.dosageMorning,
            dosageNoon: item.dosageNoon,
            dosageAfternoon: item.dosageAfternoon,
            dosageEvening: item.dosageEvening,
            instruction: item.instruction,
            days: item.days || 1,
          },
          { transaction: t }
        );

        
        const exportCode = await generateExportCode(t);
        await MedicineExport.create(
          {
            exportCode,
            medicineId: medicine.id,
            quantity: item.quantity,
            exportDate: new Date(),
            userId: doctorId,
            reason: `PRESCRIPTION_${prescriptionCode}`,
          },
          { transaction: t }
        );
      }

      
      prescription.totalAmount = totalAmount;
      await prescription.save({ transaction: t });

      
      if (visit.status !== "COMPLETED") {
        
        if (visit.status !== "EXAMINED") {
           visit.status = "EXAMINED";
        }
        visit.checkOutTime = visit.checkOutTime ?? new Date();
        await visit.save({ transaction: t });
      }

      
      

      
      
      
      
      return prescription;
    }
  );
};


export const updatePrescriptionService = async (
  prescriptionId: number,
  doctorId: number,
  input: UpdatePrescriptionInput
) => {
  return await sequelize.transaction(
    {
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    },
    async (t) => {
      
      const prescription = await Prescription.findByPk(prescriptionId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!prescription) {
        throw new Error("PRESCRIPTION_NOT_FOUND");
      }

      if (prescription.doctorId !== doctorId) {
        throw new Error("UNAUTHORIZED_PRESCRIPTION");
      }

      
      if (prescription.status === PrescriptionStatus.LOCKED) {
        throw new Error("PRESCRIPTION_LOCKED_CANNOT_EDIT");
      }

      if (prescription.status === PrescriptionStatus.CANCELLED) {
        throw new Error("PRESCRIPTION_CANCELLED");
      }

      
      if (input.medicines && input.medicines.length > 0) {
        
        const invoice = await Invoice.findOne({
          where: { visitId: prescription.visitId },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (invoice) {
          await InvoiceItem.destroy({
            where: { invoiceId: invoice.id, itemType: ItemType.MEDICINE },
            transaction: t,
          });
        }

        
        const oldDetails = await PrescriptionDetail.findAll({
          where: { prescriptionId },
          transaction: t,
        });

        for (const oldDetail of oldDetails) {
          const medicine = await Medicine.findByPk(oldDetail.medicineId, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          if (medicine) {
            medicine.quantity += oldDetail.quantity; 
            await medicine.save({ transaction: t });
          }
        }

        
        await PrescriptionDetail.destroy({
          where: { prescriptionId },
          transaction: t,
        });
        await MedicineExport.destroy({
          where: { reason: `PRESCRIPTION_${prescription.prescriptionCode}` },
          transaction: t,
        });

        
        let totalAmount = 0;
        const newDetails = [];

        for (const item of input.medicines) {
          const medicine = await Medicine.findByPk(item.medicineId, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });

          if (!medicine) {
            throw new Error(`MEDICINE_NOT_FOUND_${item.medicineId}`);
          }

          if (medicine.status !== "ACTIVE") {
            throw new Error(`MEDICINE_NOT_ACTIVE_${medicine.name}`);
          }

          if (medicine.quantity < item.quantity) {
            throw new Error(
              `INSUFFICIENT_STOCK_${medicine.name}_Available:${medicine.quantity}_Requested:${item.quantity}`
            );
          }

          medicine.quantity -= item.quantity;
          await medicine.save({ transaction: t });

          const itemTotal = medicine.salePrice * item.quantity;
          totalAmount += itemTotal;

          const detail = await PrescriptionDetail.create(
            {
              prescriptionId: prescription.id,
              medicineId: medicine.id,
              medicineName: medicine.name,
              quantity: item.quantity,
              unit: medicine.unit,
              unitPrice: medicine.salePrice,
              dosageMorning: item.dosageMorning,
              dosageNoon: item.dosageNoon,
              dosageAfternoon: item.dosageAfternoon,
              dosageEvening: item.dosageEvening,
              instruction: item.instruction,
              days: item.days || 1,
            },
            { transaction: t }
          );
          newDetails.push(detail);

          const exportCode = await generateExportCode(t);
          await MedicineExport.create(
            {
              exportCode,
              medicineId: medicine.id,
              quantity: item.quantity,
              exportDate: new Date(),
              userId: doctorId,
              reason: `PRESCRIPTION_${prescription.prescriptionCode}`,
            },
            { transaction: t }
          );
        }

        prescription.totalAmount = totalAmount;

        
        if (invoice) {
          let medicineTotalAmount = 0;

          for (const detail of newDetails) {
            const subtotal = Number(detail.quantity) * Number(detail.unitPrice);
            medicineTotalAmount += subtotal;

            await InvoiceItem.create(
              {
                invoiceId: invoice.id,
                itemType: ItemType.MEDICINE,
                prescriptionDetailId: detail.id,
                medicineName: detail.medicineName,
                quantity: detail.quantity,
                unitPrice: detail.unitPrice,
                subtotal,
              },
              { transaction: t }
            );
          }

          invoice.medicineTotalAmount = medicineTotalAmount;
          invoice.totalAmount =
            Number(invoice.examinationFee) +
            Number(invoice.medicineTotalAmount) -
            Number(invoice.discount || 0);
          await invoice.save({ transaction: t });
        }
      }

      
      if (input.note !== undefined) {
        prescription.note = input.note;
      }

      await prescription.save({ transaction: t });

      return prescription;
    }
  );
};


export const cancelPrescriptionService = async (
  prescriptionId: number,
  doctorId: number
) => {
  return await sequelize.transaction(
    {
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    },
    async (t) => {
      const prescription = await Prescription.findByPk(prescriptionId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!prescription) {
        throw new Error("PRESCRIPTION_NOT_FOUND");
      }

      if (prescription.doctorId !== doctorId) {
        throw new Error("UNAUTHORIZED_PRESCRIPTION");
      }

      if (prescription.status === PrescriptionStatus.LOCKED) {
        throw new Error("PRESCRIPTION_LOCKED_CANNOT_CANCEL");
      }

      if (prescription.status === PrescriptionStatus.CANCELLED) {
        throw new Error("PRESCRIPTION_ALREADY_CANCELLED");
      }

      
      const details = await PrescriptionDetail.findAll({
        where: { prescriptionId },
        transaction: t,
      });

      for (const detail of details) {
        const medicine = await Medicine.findByPk(detail.medicineId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (medicine) {
          medicine.quantity += detail.quantity;
          await medicine.save({ transaction: t });
        }
      }

      
      prescription.status = PrescriptionStatus.CANCELLED;
      await prescription.save({ transaction: t });

      return prescription;
    }
  );
};


export const lockPrescriptionService = async (
  prescriptionId: number,
  transaction?: Transaction
) => {
  const t = transaction || (await sequelize.transaction());

  try {
    const prescription = await Prescription.findByPk(prescriptionId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!prescription) {
      throw new Error("PRESCRIPTION_NOT_FOUND");
    }

    if (prescription.status === PrescriptionStatus.LOCKED) {
      throw new Error("PRESCRIPTION_ALREADY_LOCKED");
    }

    if (prescription.status === PrescriptionStatus.CANCELLED) {
      throw new Error("PRESCRIPTION_CANCELLED");
    }

    
    prescription.status = PrescriptionStatus.LOCKED;
    await prescription.save({ transaction: t });

    
    
    const visit = await Visit.findByPk(prescription.visitId, { transaction: t });
    if (!visit) {
      throw new Error("VISIT_NOT_FOUND");
    }

    const doctor = await Doctor.findByPk(prescription.doctorId, { transaction: t });
    const doctorUserId = doctor?.userId || prescription.doctorId;

    
    let invoice = await Invoice.findOne({
      where: { visitId: visit.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!invoice) {
      
      const invoiceCode = await generateInvoiceCode();
      
      invoice = await Invoice.create(
        {
          invoiceCode,
          visitId: visit.id,
          patientId: visit.patientId,
          doctorId: visit.doctorId,
          examinationFee: 100000,
          medicineTotalAmount: 0,
          discount: 0,
          totalAmount: 100000,
          paymentStatus: PaymentStatus.UNPAID,
          paidAmount: 0,
          createdBy: doctorUserId,
        },
        { transaction: t }
      );

      
      await InvoiceItem.create(
        {
          invoiceId: invoice.id,
          itemType: ItemType.EXAMINATION,
          description: `Kham benh`,
          quantity: 1,
          unitPrice: 100000,
          subtotal: 100000,
        },
        { transaction: t }
      );
    }

    
    await InvoiceItem.destroy({
      where: { invoiceId: invoice.id, itemType: ItemType.MEDICINE },
      transaction: t,
    });

    
    const details = await PrescriptionDetail.findAll({
      where: { prescriptionId: prescription.id },
      transaction: t,
    });

    let medicineTotalAmount = 0;

    for (const detail of details) {
      const subtotal = Number(detail.quantity) * Number(detail.unitPrice);
      medicineTotalAmount += subtotal;

      await InvoiceItem.create(
        {
          invoiceId: invoice.id,
          itemType: ItemType.MEDICINE,
          prescriptionDetailId: detail.id,
          medicineName: detail.medicineName,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          subtotal,
        },
        { transaction: t }
      );
    }

    
    invoice.medicineTotalAmount = medicineTotalAmount;
    invoice.totalAmount =
      Number(invoice.examinationFee) +
      Number(invoice.medicineTotalAmount) -
      Number(invoice.discount || 0);
    await invoice.save({ transaction: t });

    if (!transaction) {
      await t.commit();
    }

    return { prescription, invoice };
  } catch (error) {
    if (!transaction) {
      await t.rollback();
    }
    throw error;
  }
};


export const getPrescriptionByIdService = async (prescriptionId: number) => {
  const prescription = await Prescription.findByPk(prescriptionId, {
    include: [
      {
        model: PrescriptionDetail,
        as: "details",
        include: [
          {
            model: Medicine,
            as: "Medicine",
            attributes: ["name", "unit"],
          },
        ],
      },
      {
        model: Doctor,
        as: "doctor",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName", "email", "avatar"],
          },
          {
            model: Specialty,
            as: "specialty",
            attributes: ["name"],
          },
        ],
      },
      {
        model: Patient,
        as: "patient",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName", "email", "avatar"],
          },
        ],
      },
      {
        model: Visit,
        as: "visit",
        include: [
          {
            model: Appointment,
            as: "appointment",
            required: false,
          },
        ],
      },
    ],
  });

  if (!prescription) {
    throw new Error("PRESCRIPTION_NOT_FOUND");
  }

  
  const prescriptionData = prescription.toJSON();

  
  if ((prescriptionData as any).details) {
    (prescriptionData as any).details = (prescriptionData as any).details.map((detail: any) => {
      if (!detail.medicineName && detail.Medicine) {
        detail.medicineName = detail.Medicine.name;
        detail.unit = detail.Medicine.unit;
      }
      return detail;
    });
  }

  return prescriptionData;
};


export const getPrescriptionsByPatientService = async (patientId: number) => {
  const prescriptions = await Prescription.findAll({
    where: { patientId },
    include: [
      {
        model: PrescriptionDetail,
        as: "details",
      },
      {
        model: Doctor,
        as: "doctor",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "fullName", "email", "avatar"],
          },
          {
            model: Specialty,
            as: "specialty",
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: Visit,
        as: "visit",
        attributes: ["id", "checkInTime", "diagnosis", "symptoms"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return prescriptions;
};


export const getPrescriptionByVisitService = async (visitId: number) => {
  const prescription = await Prescription.findOne({
    where: { visitId },
    include: [
      {
        model: PrescriptionDetail,
        as: "details",
      },
    ],
  });

  return prescription;
};


export const getPrescriptionsService = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  patientId?: number;
  doctorId?: number;
}) => {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  const where: any = {};

  if (params?.status) {
    where.status = params.status;
  }

  if (params?.patientId) {
    where.patientId = params.patientId;
  }

  if (params?.doctorId) {
    where.doctorId = params.doctorId;
  }

  const { rows: prescriptions, count: total } =
    await Prescription.findAndCountAll({
      where,
      include: [
        {
          model: PrescriptionDetail,
          as: "details",
          include: [
            {
              model: Medicine,
              as: "Medicine",
              attributes: ["id", "name", "medicineCode"],
              required: false,
            },
          ],
        },
        {
          model: Patient,
          as: "patient",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email", "avatar"],
            },
          ],
        },
        {
          model: Doctor,
          as: "doctor",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email", "avatar"],
            },
            {
              model: Specialty,
              as: "specialty",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: Visit,
          as: "visit",
          attributes: ["id", "checkInTime", "diagnosis", "symptoms"],
          include: [
            {
              model: Appointment,
              as: "appointment",
              required: false,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

  return {
    prescriptions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

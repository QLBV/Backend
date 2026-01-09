import { Transaction, Op } from "sequelize";
import { sequelize } from "../models";
import Prescription, { PrescriptionStatus } from "../models/Prescription";
import PrescriptionDetail from "../models/PrescriptionDetail";
import Medicine from "../models/Medicine";
import MedicineExport from "../models/MedicineExport";
import Visit from "../models/Visit";
import Patient from "../models/Patient";
import Doctor from "../models/Doctor";
import User from "../models/User";
import PatientProfile from "../models/PatientProfile";
import Specialty from "../models/Specialty";
import { generatePrescriptionCode } from "../utils/codeGenerator";

interface MedicineInput {
  medicineId: number;
  quantity: number;
  dosageMorning: number;
  dosageNoon: number;
  dosageAfternoon: number;
  dosageEvening: number;
  instruction?: string;
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

/**
 * Create a new prescription with transaction safety and inventory locking
 * Features:
 * - Pessimistic locking to prevent race conditions
 * - Sequential medicine processing (NOT parallel)
 * - Automatic stock deduction
 * - Price snapshot mechanism
 * - Audit trail via MedicineExport
 */
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
      // 1. Validate visit exists and belongs to the doctor
      const visit = await Visit.findByPk(input.visitId, { transaction: t });
      if (!visit) {
        throw new Error("VISIT_NOT_FOUND");
      }
      if (visit.doctorId !== doctorId) {
        throw new Error("UNAUTHORIZED_VISIT");
      }
      if (visit.status !== "COMPLETED") {
        throw new Error("VISIT_NOT_COMPLETED");
      }

      // 2. Check if prescription already exists for this visit
      const existingPrescription = await Prescription.findOne({
        where: { visitId: input.visitId },
        transaction: t,
      });
      if (existingPrescription) {
        throw new Error("PRESCRIPTION_ALREADY_EXISTS");
      }

      // 3. Generate prescription code
      const prescriptionCode = await generatePrescriptionCode();

      // 4. Create prescription (totalAmount will be calculated)
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

      // 5. Process medicines SEQUENTIALLY to prevent race conditions
      for (const item of input.medicines) {
        // 🔒 PESSIMISTIC LOCKING - Prevents concurrent modifications
        const medicine = await Medicine.findByPk(item.medicineId, {
          transaction: t,
          lock: t.LOCK.UPDATE, // Row-level lock
        });

        if (!medicine) {
          throw new Error(`MEDICINE_NOT_FOUND_${item.medicineId}`);
        }

        if (medicine.status !== "ACTIVE") {
          throw new Error(`MEDICINE_NOT_ACTIVE_${medicine.name}`);
        }

        // ❌ Check stock availability
        if (medicine.quantity < item.quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK_${medicine.name}_Available:${medicine.quantity}_Requested:${item.quantity}`
          );
        }

        // ✅ Deduct stock atomically
        medicine.quantity -= item.quantity;
        await medicine.save({ transaction: t });

        // 💰 Calculate item total (price snapshot)
        const itemTotal = medicine.salePrice * item.quantity;
        totalAmount += itemTotal;

        // 📝 Create prescription detail with price snapshot
        await PrescriptionDetail.create(
          {
            prescriptionId: prescription.id,
            medicineId: medicine.id,
            medicineName: medicine.name, // Snapshot
            quantity: item.quantity,
            unit: medicine.unit, // Snapshot
            unitPrice: medicine.salePrice, // Snapshot at prescription time
            dosageMorning: item.dosageMorning,
            dosageNoon: item.dosageNoon,
            dosageAfternoon: item.dosageAfternoon,
            dosageEvening: item.dosageEvening,
            instruction: item.instruction,
          },
          { transaction: t }
        );

        // 📊 Create audit trail
        await MedicineExport.create(
          {
            medicineId: medicine.id,
            quantity: item.quantity,
            exportDate: new Date(),
            userId: doctorId,
            reason: `PRESCRIPTION_${prescriptionCode}`,
          },
          { transaction: t }
        );
      }

      // 6. Update total amount
      prescription.totalAmount = totalAmount;
      await prescription.save({ transaction: t });

      return prescription;
    }
  );
};

/**
 * Update prescription (only allowed if status = DRAFT)
 * This will restore previous stock and apply new stock deduction
 */
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
      // 1. Find prescription with lock
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

      // 🔒 Check if prescription is locked
      if (prescription.status === PrescriptionStatus.LOCKED) {
        throw new Error("PRESCRIPTION_LOCKED_CANNOT_EDIT");
      }

      if (prescription.status === PrescriptionStatus.CANCELLED) {
        throw new Error("PRESCRIPTION_CANCELLED");
      }

      // 2. If medicines are being updated, restore old stock and apply new
      if (input.medicines && input.medicines.length > 0) {
        // Restore previous stock
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
            medicine.quantity += oldDetail.quantity; // Restore
            await medicine.save({ transaction: t });
          }
        }

        // Delete old details and exports
        await PrescriptionDetail.destroy({
          where: { prescriptionId },
          transaction: t,
        });
        await MedicineExport.destroy({
          where: { reason: `PRESCRIPTION_${prescription.prescriptionCode}` },
          transaction: t,
        });

        // Apply new medicines (same logic as create)
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
            },
            { transaction: t }
          );

          await MedicineExport.create(
            {
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
      }

      // 3. Update note if provided
      if (input.note !== undefined) {
        prescription.note = input.note;
      }

      await prescription.save({ transaction: t });

      return prescription;
    }
  );
};

/**
 * Cancel prescription and restore stock
 */
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

      // Restore stock
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

      // Update status
      prescription.status = PrescriptionStatus.CANCELLED;
      await prescription.save({ transaction: t });

      return prescription;
    }
  );
};

/**
 * Lock prescription (called by payment service)
 * Once locked, prescription cannot be edited or cancelled
 */
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

    if (!transaction) {
      await t.commit();
    }

    return prescription;
  } catch (error) {
    if (!transaction) {
      await t.rollback();
    }
    throw error;
  }
};

/**
 * Get prescription by ID with details
 */
export const getPrescriptionByIdService = async (prescriptionId: number) => {
  const prescription = await Prescription.findByPk(prescriptionId, {
    include: [
      {
        model: PrescriptionDetail,
        as: "details",
      },
    ],
  });

  if (!prescription) {
    throw new Error("PRESCRIPTION_NOT_FOUND");
  }

  return prescription;
};

/**
 * Get all prescriptions for a patient
 */
export const getPrescriptionsByPatientService = async (patientId: number) => {
  const prescriptions = await Prescription.findAll({
    where: { patientId },
    include: [
      {
        model: PrescriptionDetail,
        as: "details",
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return prescriptions;
};

/**
 * Get all prescriptions for a visit
 */
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

/**
 * Get all prescriptions with pagination and filtering
 */
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

  const { rows: prescriptions, count: total } = await Prescription.findAndCountAll({
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
        as: "Doctor",
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
        attributes: ["id", "checkInTime", "diagnosis", "symptoms"],
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

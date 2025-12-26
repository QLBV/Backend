import { Op, Transaction } from "sequelize";
import { sequelize } from "../models";
import Medicine, { MedicineStatus, MedicineUnit } from "../models/Medicine";
import MedicineImport from "../models/MedicineImport";
import MedicineExport from "../models/MedicineExport";
import { generateMedicineCode } from "../utils/codeGenerator";

interface CreateMedicineInput {
  name: string;
  group: string;
  activeIngredient?: string;
  manufacturer?: string;
  unit: MedicineUnit;
  importPrice: number;
  salePrice: number;
  quantity: number;
  minStockLevel?: number;
  expiryDate: Date;
  description?: string;
}

interface UpdateMedicineInput {
  name?: string;
  group?: string;
  activeIngredient?: string;
  manufacturer?: string;
  unit?: MedicineUnit;
  importPrice?: number;
  salePrice?: number;
  minStockLevel?: number;
  expiryDate?: Date;
  description?: string;
  status?: MedicineStatus;
}

interface ImportMedicineInput {
  medicineId: number;
  quantity: number;
  importPrice: number;
  userId: number;
}

/**
 * Create a new medicine with auto-generated medicine code
 */
export const createMedicineService = async (input: CreateMedicineInput) => {
  // Auto-generate medicine code
  const medicineCode = await generateMedicineCode();

  const medicine = await Medicine.create({
    medicineCode,
    ...input,
    status: MedicineStatus.ACTIVE,
  });

  return medicine;
};

/**
 * Update medicine information (not quantity)
 */
export const updateMedicineService = async (
  medicineId: number,
  input: UpdateMedicineInput
) => {
  const medicine = await Medicine.findByPk(medicineId);

  if (!medicine) {
    throw new Error("MEDICINE_NOT_FOUND");
  }

  await medicine.update(input);

  return medicine;
};

/**
 * Import medicine stock with transaction
 */
export const importMedicineService = async (input: ImportMedicineInput) => {
  return await sequelize.transaction(
    {
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    },
    async (t) => {
      // Lock medicine row
      const medicine = await Medicine.findByPk(input.medicineId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!medicine) {
        throw new Error("MEDICINE_NOT_FOUND");
      }

      // Update quantity and import price
      medicine.quantity += input.quantity;
      medicine.importPrice = input.importPrice;
      await medicine.save({ transaction: t });

      // Create import record
      const importRecord = await MedicineImport.create(
        {
          medicineId: input.medicineId,
          quantity: input.quantity,
          importPrice: input.importPrice,
          importDate: new Date(),
          userId: input.userId,
        },
        { transaction: t }
      );

      return { medicine, importRecord };
    }
  );
};

/**
 * Get all medicines with optional filters
 */
export const getAllMedicinesService = async (filters?: {
  status?: MedicineStatus;
  group?: string;
  lowStock?: boolean;
  search?: string;
}) => {
  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.group) {
    where.group = filters.group;
  }

  if (filters?.lowStock) {
    where[Op.and] = sequelize.literal(
      "`Medicine`.`quantity` <= `Medicine`.`minStockLevel`"
    );
  }

  if (filters?.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filters.search}%` } },
      { medicineCode: { [Op.like]: `%${filters.search}%` } },
      { activeIngredient: { [Op.like]: `%${filters.search}%` } },
    ];
  }

  const medicines = await Medicine.findAll({
    where,
    order: [["name", "ASC"]],
  });

  return medicines;
};

/**
 * Get medicine by ID
 */
export const getMedicineByIdService = async (medicineId: number) => {
  const medicine = await Medicine.findByPk(medicineId);

  if (!medicine) {
    throw new Error("MEDICINE_NOT_FOUND");
  }

  return medicine;
};

/**
 * Get low stock medicines
 */
export const getLowStockMedicinesService = async () => {
  const medicines = await Medicine.findAll({
    where: sequelize.literal(
      "`Medicine`.`quantity` <= `Medicine`.`minStockLevel`"
    ),
    order: [["quantity", "ASC"]],
  });

  return medicines;
};

/**
 * Get medicine import history
 */
export const getMedicineImportHistoryService = async (medicineId: number) => {
  const imports = await MedicineImport.findAll({
    where: { medicineId },
    order: [["importDate", "DESC"]],
  });

  return imports;
};

/**
 * Get medicine export history
 */
export const getMedicineExportHistoryService = async (medicineId: number) => {
  const exports = await MedicineExport.findAll({
    where: { medicineId },
    order: [["exportDate", "DESC"]],
  });

  return exports;
};

/**
 * Mark medicine as expired
 */
export const markMedicineAsExpiredService = async (medicineId: number) => {
  const medicine = await Medicine.findByPk(medicineId);

  if (!medicine) {
    throw new Error("MEDICINE_NOT_FOUND");
  }

  medicine.status = MedicineStatus.EXPIRED;
  await medicine.save();

  return medicine;
};

/**
 * Remove medicine from system (soft delete via status)
 */
export const removeMedicineService = async (medicineId: number) => {
  const medicine = await Medicine.findByPk(medicineId);

  if (!medicine) {
    throw new Error("MEDICINE_NOT_FOUND");
  }

  if (medicine.quantity > 0) {
    throw new Error("CANNOT_REMOVE_MEDICINE_WITH_STOCK");
  }

  medicine.status = MedicineStatus.REMOVED;
  await medicine.save();

  return medicine;
};

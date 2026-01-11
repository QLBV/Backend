import { Op, Transaction } from "sequelize";
import { sequelize } from "../models";
import Medicine, { MedicineStatus, MedicineUnit } from "../models/Medicine";
import MedicineImport from "../models/MedicineImport";
import MedicineExport from "../models/MedicineExport";
import { generateMedicineCode } from "../utils/codeGenerator";
import User from "../models/User";

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
  supplier?: string;
  supplierInvoice?: string;
  batchNumber?: string;
  note?: string;
}

interface ExportMedicineInput {
  medicineId: number;
  quantity: number;
  reason: string;
  userId: number;
  note?: string;
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

      // Generate import code
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
      const latestImport = await MedicineImport.findOne({
        where: {
          importCode: {
            [Op.like]: `IMP-${dateStr}-%`,
          },
        },
        order: [["importCode", "DESC"]],
        transaction: t,
      });

      let sequence = 1;
      if (latestImport && latestImport.importCode) {
        const lastCode = latestImport.importCode;
        const lastSequence = parseInt(lastCode.split("-")[2], 10);
        sequence = lastSequence + 1;
      }

      const importCode = `IMP-${dateStr}-${sequence.toString().padStart(5, "0")}`;

      // Create import record
      const importRecord = await MedicineImport.create(
        {
          medicineId: input.medicineId,
          quantity: input.quantity,
          importPrice: input.importPrice,
          importDate: new Date(),
          userId: input.userId,
          importCode,
          supplier: input.supplier,
          supplierInvoice: input.supplierInvoice,
          batchNumber: input.batchNumber,
          note: input.note,
        },
        { transaction: t }
      );

      return { medicine, importRecord };
    }
  );
};

/**
 * Get all medicines with optional filters and pagination
 */
export const getAllMedicinesService = async (filters?: {
  status?: MedicineStatus;
  group?: string;
  lowStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const where: any = {};
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

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

  const { rows: medicines, count: total } = await Medicine.findAndCountAll({
    where,
    order: [["name", "ASC"]],
    limit,
    offset,
  });

  return {
    medicines,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
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
 * Get low stock medicines with pagination
 */
export const getLowStockMedicinesService = async (params?: {
  page?: number;
  limit?: number;
}) => {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  const { rows: medicines, count: total } = await Medicine.findAndCountAll({
    where: sequelize.literal(
      "`Medicine`.`quantity` <= `Medicine`.`minStockLevel`"
    ),
    order: [["quantity", "ASC"]],
    limit,
    offset,
  });

  return {
    medicines,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
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

/**
 * Get medicines expiring within specified days threshold with pagination
 * Default: 30 days
 */
export const getExpiringMedicinesService = async (
  daysThreshold: number = 30,
  params?: {
    page?: number;
    limit?: number;
  }
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const thresholdDate = new Date(today);
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  const { rows: medicines, count: total } = await Medicine.findAndCountAll({
    where: {
      status: MedicineStatus.ACTIVE,
      expiryDate: {
        [Op.gte]: today, // Not yet expired
        [Op.lte]: thresholdDate, // Within threshold
      },
    },
    order: [["expiryDate", "ASC"]], // Soonest expiry first
    limit,
    offset,
  });

  // Calculate days until expiry for each medicine
  const medicinesWithDays = medicines.map((medicine) => {
    const daysUntilExpiry = Math.ceil(
      (medicine.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...medicine.toJSON(),
      daysUntilExpiry,
    };
  });

  return {
    medicines: medicinesWithDays,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Auto-mark expired medicines (for scheduled job)
 * Returns count of medicines marked as expired
 */
export const autoMarkExpiredMedicinesService = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredMedicines = await Medicine.findAll({
    where: {
      status: MedicineStatus.ACTIVE,
      expiryDate: {
        [Op.lt]: today, // Already expired
      },
    },
  });

  let markedCount = 0;

  for (const medicine of expiredMedicines) {
    medicine.status = MedicineStatus.EXPIRED;
    await medicine.save();
    markedCount++;
  }

  return {
    markedCount,
    medicines: expiredMedicines,
  };
};

/**
 * Manual export medicine stock with transaction
 * Used for manual exports (expired, damaged, transfer, etc.)
 */
export const exportMedicineService = async (input: ExportMedicineInput) => {
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

      if (medicine.status !== MedicineStatus.ACTIVE) {
        throw new Error("MEDICINE_NOT_ACTIVE");
      }

      // Check stock availability
      if (medicine.quantity < input.quantity) {
        throw new Error(
          `INSUFFICIENT_STOCK_Available:${medicine.quantity}_Requested:${input.quantity}`
        );
      }

      // Generate export code
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
      const latestExport = await MedicineExport.findOne({
        where: {
          exportCode: {
            [Op.like]: `EXP-${dateStr}-%`,
          },
        },
        order: [["exportCode", "DESC"]],
        transaction: t,
      });

      let sequence = 1;
      if (latestExport && latestExport.exportCode) {
        const lastCode = latestExport.exportCode;
        const lastSequence = parseInt(lastCode.split("-")[2], 10);
        sequence = lastSequence + 1;
      }

      const exportCode = `EXP-${dateStr}-${sequence.toString().padStart(5, "0")}`;

      // Update quantity
      medicine.quantity -= input.quantity;
      await medicine.save({ transaction: t });

      // Create export record
      const exportRecord = await MedicineExport.create(
        {
          medicineId: input.medicineId,
          quantity: input.quantity,
          exportDate: new Date(),
          userId: input.userId,
          reason: input.reason,
          exportCode,
          note: input.note,
        },
        { transaction: t }
      );

      return { medicine, exportRecord };
    }
  );
};

/**
 * Get all medicine imports with pagination and filters
 */
export const getAllMedicineImportsService = async (params?: {
  page?: number;
  limit?: number;
  medicineId?: number;
  startDate?: Date;
  endDate?: Date;
}) => {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  const where: any = {};

  if (params?.medicineId) {
    where.medicineId = params.medicineId;
  }

  if (params?.startDate || params?.endDate) {
    where.importDate = {};
    if (params.startDate) {
      where.importDate[Op.gte] = params.startDate;
    }
    if (params.endDate) {
      where.importDate[Op.lte] = params.endDate;
    }
  }

  const { rows: imports, count: total } = await MedicineImport.findAndCountAll({
    where,
    include: [
      {
        model: Medicine,
        as: "medicine",
        attributes: ["id", "name", "medicineCode", "unit"],
        required: false,
      },
      {
        model: User,
        as: "importer",
        attributes: ["id", "fullName", "email"],
        required: false,
      },
    ],
    attributes: {
      include: [[sequelize.col("userId"), "importedBy"]],
    },
    order: [["importDate", "DESC"]],
    limit,
    offset,
  });

  return {
    imports,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get medicine import by ID
 */
export const getMedicineImportByIdService = async (importId: number) => {
  const importRecord = await MedicineImport.findByPk(importId, {
    include: [
      {
        model: Medicine,
        as: "medicine",
        attributes: ["id", "name", "medicineCode", "unit"],
        required: false,
      },
      {
        model: User,
        as: "importer",
        attributes: ["id", "fullName", "email"],
        required: false,
      },
    ],
    attributes: {
      include: [[sequelize.col("userId"), "importedBy"]],
    },
  });

  if (!importRecord) {
    throw new Error("IMPORT_RECORD_NOT_FOUND");
  }

  return importRecord;
};

/**
 * Get all medicine exports with pagination and filters
 */
export const getAllMedicineExportsService = async (params?: {
  page?: number;
  limit?: number;
  medicineId?: number;
  reason?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  const where: any = {};

  if (params?.medicineId) {
    where.medicineId = params.medicineId;
  }

  if (params?.reason) {
    where.reason = params.reason;
  }

  if (params?.startDate || params?.endDate) {
    where.exportDate = {};
    if (params.startDate) {
      where.exportDate[Op.gte] = params.startDate;
    }
    if (params.endDate) {
      where.exportDate[Op.lte] = params.endDate;
    }
  }

  const { rows: exports, count: total } = await MedicineExport.findAndCountAll({
    where,
    include: [
      {
        model: Medicine,
        as: "medicine",
        attributes: ["id", "name", "medicineCode", "unit"],
        required: false,
      },
      {
        model: User,
        as: "exporter",
        attributes: ["id", "fullName", "email"],
        required: false,
      },
    ],
    attributes: {
      include: [[sequelize.col("userId"), "exportedBy"]],
    },
    order: [["exportDate", "DESC"]],
    limit,
    offset,
  });

  return {
    exports,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get medicine export by ID
 */
export const getMedicineExportByIdService = async (exportId: number) => {
  const exportRecord = await MedicineExport.findByPk(exportId, {
    include: [
      {
        model: Medicine,
        as: "medicine",
        attributes: ["id", "name", "medicineCode", "unit"],
        required: false,
      },
      {
        model: User,
        as: "exporter",
        attributes: ["id", "fullName", "email"],
        required: false,
      },
    ],
    attributes: {
      include: [[sequelize.col("userId"), "exportedBy"]],
    },
  });

  if (!exportRecord) {
    throw new Error("EXPORT_RECORD_NOT_FOUND");
  }

  return exportRecord;
};

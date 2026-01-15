import { Op, Transaction } from "sequelize";
import { sequelize } from "../../models/index";
import Medicine, { MedicineStatus, MedicineUnit } from "../../models/Medicine";
import MedicineImport from "../../models/MedicineImport";
import MedicineExport from "../../models/MedicineExport";
import { generateMedicineCode } from "../../utils/codeGenerator";
import User from "../../models/User";

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

export const createMedicineService = async (input: CreateMedicineInput) => {
  
  const medicineCode = await generateMedicineCode();

  const medicine = await Medicine.create({
    medicineCode,
    ...input,
    status: MedicineStatus.ACTIVE,
  });

  return medicine;
};

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

export const importMedicineService = async (input: ImportMedicineInput) => {
  return await sequelize.transaction(
    {
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    },
    async (t) => {
      
      const medicine = await Medicine.findByPk(input.medicineId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!medicine) {
        throw new Error("MEDICINE_NOT_FOUND");
      }

      
      medicine.quantity += input.quantity;
      medicine.importPrice = input.importPrice;
      await medicine.save({ transaction: t });

      
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

      const importCode = `IMP-${dateStr}-${sequence
        .toString()
        .padStart(5, "0")}`;

      
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

export const getMedicineByIdService = async (medicineId: number) => {
  const medicine = await Medicine.findByPk(medicineId);

  if (!medicine) {
    throw new Error("MEDICINE_NOT_FOUND");
  }

  return medicine;
};

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

export const getMedicineImportHistoryService = async (medicineId: number) => {
  const imports = await MedicineImport.findAll({
    where: { medicineId },
    order: [["importDate", "DESC"]],
  });

  return imports;
};

export const getMedicineExportHistoryService = async (medicineId: number) => {
  const exports = await MedicineExport.findAll({
    where: { medicineId },
    order: [["exportDate", "DESC"]],
  });

  return exports;
};

export const markMedicineAsExpiredService = async (medicineId: number) => {
  const medicine = await Medicine.findByPk(medicineId);

  if (!medicine) {
    throw new Error("MEDICINE_NOT_FOUND");
  }

  medicine.status = MedicineStatus.EXPIRED;
  await medicine.save();

  return medicine;
};

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

export const getExpiringMedicinesService = async (
  daysThreshold: number = 30,
  params?: {
    page?: number;
    limit?: number;
  }
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  const thresholdDate = new Date(today);
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  const { rows: medicines, count: total } = await Medicine.findAndCountAll({
    where: {
      status: MedicineStatus.ACTIVE,
      expiryDate: {
        [Op.gte]: today, 
        [Op.lte]: thresholdDate, 
      },
    },
    order: [["expiryDate", "ASC"]], 
    limit,
    offset,
  });

  
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


export const autoMarkExpiredMedicinesService = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredMedicines = await Medicine.findAll({
    where: {
      status: MedicineStatus.ACTIVE,
      expiryDate: {
        [Op.lt]: today, 
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

export const exportMedicineService = async (input: ExportMedicineInput) => {
  return await sequelize.transaction(
    {
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    },
    async (t) => {
      
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

      
      if (medicine.quantity < input.quantity) {
        throw new Error(
          `INSUFFICIENT_STOCK_Available:${medicine.quantity}_Requested:${input.quantity}`
        );
      }

      
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

      const exportCode = `EXP-${dateStr}-${sequence
        .toString()
        .padStart(5, "0")}`;

      
      medicine.quantity -= input.quantity;
      await medicine.save({ transaction: t });

      
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

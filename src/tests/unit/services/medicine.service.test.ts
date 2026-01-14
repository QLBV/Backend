/**
 * Unit tests for medicine.service.ts
 */

import {
  createMedicineService,
  importMedicineService,
  exportMedicineService,
  getAllMedicineImportsService,
  getAllMedicineExportsService,
} from "../../../services/medicine.service";
import Medicine from "../../../models/Medicine";
import MedicineImport from "../../../models/MedicineImport";
import MedicineExport from "../../../models/MedicineExport";
import { sequelize } from "../../../models";

// Mock models
jest.mock("../../../models/Medicine");
jest.mock("../../../models/MedicineImport");
jest.mock("../../../models/MedicineExport");
jest.mock("../../../models", () => ({
  sequelize: {
    transaction: jest.fn(),
  },
}));

describe("Medicine Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createMedicineService", () => {
    it("should create a new medicine with auto-generated code", async () => {
      const mockMedicine = {
        id: 1,
        medicineCode: "MED-000001",
        name: "Paracetamol",
        quantity: 100,
      };

      (Medicine.findOne as jest.Mock).mockResolvedValue(null);
      (Medicine.create as jest.Mock).mockResolvedValue(mockMedicine);

      const result = await createMedicineService({
        name: "Paracetamol",
        group: "Pain Relief",
        unit: "VIEN" as any,
        importPrice: 1000,
        salePrice: 1500,
        quantity: 100,
        expiryDate: new Date("2025-12-31"),
      });

      expect(result).toEqual(mockMedicine);
      expect(Medicine.create).toHaveBeenCalled();
    });
  });

  describe("importMedicineService", () => {
    it("should import medicine stock with transaction", async () => {
      const mockMedicine = {
        id: 1,
        quantity: 100,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockImport = {
        id: 1,
        medicineId: 1,
        quantity: 50,
        importCode: "IMP-20250104-00001",
      };

      const mockTransaction = {
        LOCK: { UPDATE: "UPDATE" },
      };

      (sequelize.transaction as jest.Mock).mockImplementation(
        async (options: any, callback: any) => {
          return callback(mockTransaction);
        }
      );

      (Medicine.findByPk as jest.Mock).mockResolvedValue(mockMedicine);
      (MedicineImport.findOne as jest.Mock).mockResolvedValue(null);
      (MedicineImport.create as jest.Mock).mockResolvedValue(mockImport);

      const result = await importMedicineService({
        medicineId: 1,
        quantity: 50,
        importPrice: 1000,
        userId: 1,
      });

      expect(mockMedicine.quantity).toBe(150); // 100 + 50
      expect(mockMedicine.save).toHaveBeenCalled();
      expect(MedicineImport.create).toHaveBeenCalled();
    });

    it("should throw error if medicine not found", async () => {
      const mockTransaction = {
        LOCK: { UPDATE: "UPDATE" },
      };

      (sequelize.transaction as jest.Mock).mockImplementation(
        async (options: any, callback: any) => {
          return callback(mockTransaction);
        }
      );

      (Medicine.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        importMedicineService({
          medicineId: 999,
          quantity: 50,
          importPrice: 1000,
          userId: 1,
        })
      ).rejects.toThrow("MEDICINE_NOT_FOUND");
    });
  });

  describe("exportMedicineService", () => {
    it("should export medicine stock with transaction", async () => {
      const mockMedicine = {
        id: 1,
        quantity: 100,
        status: "ACTIVE",
        save: jest.fn().mockResolvedValue(true),
      };

      const mockExport = {
        id: 1,
        medicineId: 1,
        quantity: 20,
        exportCode: "EXP-20250104-00001",
      };

      const mockTransaction = {
        LOCK: { UPDATE: "UPDATE" },
      };

      (sequelize.transaction as jest.Mock).mockImplementation(
        async (options: any, callback: any) => {
          return callback(mockTransaction);
        }
      );

      (Medicine.findByPk as jest.Mock).mockResolvedValue(mockMedicine);
      (MedicineExport.findOne as jest.Mock).mockResolvedValue(null);
      (MedicineExport.create as jest.Mock).mockResolvedValue(mockExport);

      const result = await exportMedicineService({
        medicineId: 1,
        quantity: 20,
        reason: "EXPIRED",
        userId: 1,
      });

      expect(mockMedicine.quantity).toBe(80); // 100 - 20
      expect(mockMedicine.save).toHaveBeenCalled();
      expect(MedicineExport.create).toHaveBeenCalled();
    });

    it("should throw error if insufficient stock", async () => {
      const mockMedicine = {
        id: 1,
        quantity: 10,
        status: "ACTIVE",
      };

      const mockTransaction = {
        LOCK: { UPDATE: "UPDATE" },
      };

      (sequelize.transaction as jest.Mock).mockImplementation(
        async (options: any, callback: any) => {
          return callback(mockTransaction);
        }
      );

      (Medicine.findByPk as jest.Mock).mockResolvedValue(mockMedicine);

      await expect(
        exportMedicineService({
          medicineId: 1,
          quantity: 50, // More than available
          reason: "EXPIRED",
          userId: 1,
        })
      ).rejects.toThrow("INSUFFICIENT_STOCK");
    });
  });

  describe("getAllMedicineImportsService", () => {
    it("should get all medicine imports with pagination", async () => {
      const mockImports = [
        { id: 1, medicineId: 1, quantity: 50 },
        { id: 2, medicineId: 1, quantity: 30 },
      ];

      (MedicineImport.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockImports,
        count: 2,
      });

      const result = await getAllMedicineImportsService({
        page: 1,
        limit: 20,
      });

      expect(result.imports).toEqual(mockImports);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe("getAllMedicineExportsService", () => {
    it("should get all medicine exports with pagination", async () => {
      const mockExports = [
        { id: 1, medicineId: 1, quantity: 20, reason: "EXPIRED" },
        { id: 2, medicineId: 1, quantity: 10, reason: "DAMAGED" },
      ];

      (MedicineExport.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockExports,
        count: 2,
      });

      const result = await getAllMedicineExportsService({
        page: 1,
        limit: 20,
      });

      expect(result.exports).toEqual(mockExports);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });
});

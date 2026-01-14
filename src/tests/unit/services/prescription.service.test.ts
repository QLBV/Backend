/**
 * Unit tests for prescription.service.ts
 */

import {
  createPrescriptionService,
  cancelPrescriptionService,
  lockPrescriptionService,
} from "../../../services/prescription.service";
import Prescription from "../../../models/Prescription";
import PrescriptionDetail from "../../../models/PrescriptionDetail";
import Medicine from "../../../models/Medicine";
import MedicineExport from "../../../models/MedicineExport";
import Visit from "../../../models/Visit";
import { sequelize } from "../../../models";

// Mock models
jest.mock("../../../models/Prescription");
jest.mock("../../../models/PrescriptionDetail");
jest.mock("../../../models/Medicine");
jest.mock("../../../models/MedicineExport");
jest.mock("../../../models/Visit");
jest.mock("../../../models", () => ({
  sequelize: {
    transaction: jest.fn(),
  },
}));

describe("Prescription Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createPrescriptionService", () => {
    it("should create prescription with stock deduction", async () => {
      const mockVisit = {
        id: 1,
        doctorId: 1,
        status: "COMPLETED",
      };

      const mockMedicine = {
        id: 1,
        name: "Paracetamol",
        quantity: 100,
        salePrice: 1500,
        unit: "VIEN",
        status: "ACTIVE",
        save: jest.fn().mockResolvedValue(true),
      };

      const mockPrescription = {
        id: 1,
        prescriptionCode: "RX-20250104-00001",
        visitId: 1,
        doctorId: 1,
        patientId: 1,
        totalAmount: 0,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockTransaction = {
        LOCK: { UPDATE: "UPDATE" },
      };

      (sequelize.transaction as jest.Mock).mockImplementation(
        async (options: any, callback: any) => {
          return callback(mockTransaction);
        }
      );

      (Visit.findByPk as jest.Mock).mockResolvedValue(mockVisit);
      (Prescription.findOne as jest.Mock).mockResolvedValue(null);
      (Medicine.findByPk as jest.Mock).mockResolvedValue(mockMedicine);
      (Prescription.create as jest.Mock).mockResolvedValue(mockPrescription);
      (PrescriptionDetail.create as jest.Mock).mockResolvedValue({});
      (MedicineExport.create as jest.Mock).mockResolvedValue({});

      const result = await createPrescriptionService(
        1, // doctorId
        1, // patientId
        {
          visitId: 1,
          medicines: [
            {
              medicineId: 1,
              quantity: 20,
              dosageMorning: 1,
              dosageNoon: 0,
              dosageAfternoon: 1,
              dosageEvening: 0,
            },
          ],
        }
      );

      expect(mockMedicine.quantity).toBe(80); // 100 - 20
      expect(mockMedicine.save).toHaveBeenCalled();
      expect(Prescription.create).toHaveBeenCalled();
      expect(PrescriptionDetail.create).toHaveBeenCalled();
      expect(MedicineExport.create).toHaveBeenCalled();
    });

    it("should throw error if visit not found", async () => {
      const mockTransaction = {
        LOCK: { UPDATE: "UPDATE" },
      };

      (sequelize.transaction as jest.Mock).mockImplementation(
        async (options: any, callback: any) => {
          return callback(mockTransaction);
        }
      );

      (Visit.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        createPrescriptionService(1, 1, {
          visitId: 999,
          medicines: [],
        })
      ).rejects.toThrow("VISIT_NOT_FOUND");
    });

    it("should throw error if insufficient stock", async () => {
      const mockVisit = {
        id: 1,
        doctorId: 1,
        status: "COMPLETED",
      };

      const mockMedicine = {
        id: 1,
        name: "Paracetamol",
        quantity: 10, // Less than requested
        salePrice: 1500,
        unit: "VIEN",
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

      (Visit.findByPk as jest.Mock).mockResolvedValue(mockVisit);
      (Prescription.findOne as jest.Mock).mockResolvedValue(null);
      (Medicine.findByPk as jest.Mock).mockResolvedValue(mockMedicine);

      await expect(
        createPrescriptionService(1, 1, {
          visitId: 1,
          medicines: [
            {
              medicineId: 1,
              quantity: 50, // More than available
              dosageMorning: 1,
              dosageNoon: 0,
              dosageAfternoon: 1,
              dosageEvening: 0,
            },
          ],
        })
      ).rejects.toThrow("INSUFFICIENT_STOCK");
    });
  });

  describe("cancelPrescriptionService", () => {
    it("should cancel prescription and restore stock", async () => {
      const mockPrescription = {
        id: 1,
        doctorId: 1,
        status: "DRAFT",
        save: jest.fn().mockResolvedValue(true),
      };

      const mockDetail = {
        medicineId: 1,
        quantity: 20,
      };

      const mockMedicine = {
        id: 1,
        quantity: 80,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockTransaction = {
        LOCK: { UPDATE: "UPDATE" },
      };

      (sequelize.transaction as jest.Mock).mockImplementation(
        async (options: any, callback: any) => {
          return callback(mockTransaction);
        }
      );

      (Prescription.findByPk as jest.Mock).mockResolvedValue(mockPrescription);
      (PrescriptionDetail.findAll as jest.Mock).mockResolvedValue([mockDetail]);
      (Medicine.findByPk as jest.Mock).mockResolvedValue(mockMedicine);

      const result = await cancelPrescriptionService(1, 1);

      expect(mockMedicine.quantity).toBe(100); // 80 + 20 (restored)
      expect(mockMedicine.save).toHaveBeenCalled();
      expect(mockPrescription.status).toBe("CANCELLED");
      expect(mockPrescription.save).toHaveBeenCalled();
    });
  });

  describe("lockPrescriptionService", () => {
    it("should lock prescription", async () => {
      const mockPrescription = {
        id: 1,
        status: "DRAFT",
        save: jest.fn().mockResolvedValue(true),
      };

      const mockTransaction = {
        LOCK: { UPDATE: "UPDATE" },
        commit: jest.fn().mockResolvedValue(true),
      };

      (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
      (Prescription.findByPk as jest.Mock).mockResolvedValue(mockPrescription);

      const result = await lockPrescriptionService(1);

      expect(mockPrescription.status).toBe("LOCKED");
      expect(mockPrescription.save).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });
});



import { createAppointmentService } from "../../../modules/appointment/appointment.service";
import Appointment from "../../../models/Appointment";
import DoctorShift from "../../../models/DoctorShift";
import { sequelize } from "../../../models/index";


jest.mock("../../../models/Appointment");
jest.mock("../../../models/DoctorShift");
jest.mock("../../../models", () => ({
  sequelize: {
    transaction: jest.fn(),
  },
}));

describe("Appointment Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAppointmentService", () => {
    it("should create appointment with next available slot", async () => {
      const mockDoctorShift = {
        id: 1,
        doctorId: 1,
        shiftId: 1,
        workDate: "2025-01-10",
      };

      const mockLastAppointment = {
        slotNumber: 5,
      };

      const mockAppointment = {
        id: 1,
        patientId: 1,
        doctorId: 1,
        shiftId: 1,
        date: "2025-01-10",
        slotNumber: 6,
        status: "WAITING",
      };

      const mockTransaction = {
        LOCK: { UPDATE: "UPDATE" },
      };

      (sequelize.transaction as jest.Mock).mockImplementation(
        async (options: any, callback: any) => {
          return callback(mockTransaction);
        }
      );

      (DoctorShift.findOne as jest.Mock).mockResolvedValue(mockDoctorShift);
      (Appointment.count as jest.Mock).mockResolvedValue(10); 
      (Appointment.findOne as jest.Mock).mockResolvedValue(mockLastAppointment);
      (Appointment.create as jest.Mock).mockResolvedValue(mockAppointment);

      const result = await createAppointmentService({
        patientId: 1,
        doctorId: 1,
        shiftId: 1,
        date: "2025-01-10",
        bookingType: "ONLINE",
        bookedBy: "PATIENT",
      });

      expect(result).toEqual(mockAppointment);
      expect(Appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slotNumber: 6, 
        }),
        expect.any(Object)
      );
    });

    it("should throw error if doctor not on duty", async () => {
      const mockTransaction = {
        LOCK: { UPDATE: "UPDATE" },
      };

      (sequelize.transaction as jest.Mock).mockImplementation(
        async (options: any, callback: any) => {
          return callback(mockTransaction);
        }
      );

      (DoctorShift.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        createAppointmentService({
          patientId: 1,
          doctorId: 1,
          shiftId: 1,
          date: "2025-01-10",
          bookingType: "ONLINE",
          bookedBy: "PATIENT",
        })
      ).rejects.toThrow("DOCTOR_NOT_ON_DUTY");
    });

    it("should throw error if day is full", async () => {
      const mockDoctorShift = {
        id: 1,
        doctorId: 1,
        shiftId: 1,
        workDate: "2025-01-10",
      };

      const mockTransaction = {
        LOCK: { UPDATE: "UPDATE" },
      };

      (sequelize.transaction as jest.Mock).mockImplementation(
        async (options: any, callback: any) => {
          return callback(mockTransaction);
        }
      );

      (DoctorShift.findOne as jest.Mock).mockResolvedValue(mockDoctorShift);
      (Appointment.count as jest.Mock).mockResolvedValue(40); 

      await expect(
        createAppointmentService({
          patientId: 1,
          doctorId: 1,
          shiftId: 1,
          date: "2025-01-10",
          bookingType: "ONLINE",
          bookedBy: "PATIENT",
        })
      ).rejects.toThrow("DAY_FULL");
    });
  });
});

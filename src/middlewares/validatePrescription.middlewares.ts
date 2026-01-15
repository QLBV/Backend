import { Request, Response, NextFunction } from "express";


export const validateCreatePrescription = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { visitId, patientId, medicines } = req.body;
  if (!visitId) {
    return res.status(400).json({
      success: false,
      message: "Visit ID is required",
    });
  }
  if (!patientId) {
    return res.status(400).json({
      success: false,
      message: "Patient ID is required",
    });
  }
  if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one medicine is required",
    });
  }
  for (let i = 0; i < medicines.length; i++) {
    const medicine = medicines[i];

    if (!medicine.medicineId) {
      return res.status(400).json({
        success: false,
        message: `Medicine ID is required for medicine at index ${i}`,
      });
    }

    if (!medicine.quantity || medicine.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: `Valid quantity is required for medicine at index ${i}`,
      });
    }
    const totalDosage =
      (medicine.dosageMorning || 0) +
      (medicine.dosageNoon || 0) +
      (medicine.dosageAfternoon || 0) +
      (medicine.dosageEvening || 0);

    if (totalDosage <= 0) {
      return res.status(400).json({
        success: false,
        message: `At least one dosage field must be greater than 0 for medicine at index ${i}`,
      });
    }

    if (medicine.days && (typeof medicine.days !== "number" || medicine.days <= 0)) {
      return res.status(400).json({
        success: false,
        message: `Number of days must be a positive number for medicine at index ${i}`,
      });
    }
  }
  next();
};

export const validateUpdatePrescription = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { medicines } = req.body;

  if (medicines) {
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Medicines must be a non-empty array",
      });
    }

    for (let i = 0; i < medicines.length; i++) {
      const medicine = medicines[i];

      if (!medicine.medicineId) {
        return res.status(400).json({
          success: false,
          message: `Medicine ID is required for medicine at index ${i}`,
        });
      }

      if (!medicine.quantity || medicine.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Valid quantity is required for medicine at index ${i}`,
        });
      }

      const totalDosage =
        (medicine.dosageMorning || 0) +
        (medicine.dosageNoon || 0) +
        (medicine.dosageAfternoon || 0) +
        (medicine.dosageEvening || 0);

      if (totalDosage <= 0) {
        return res.status(400).json({
          success: false,
          message: `At least one dosage field must be greater than 0 for medicine at index ${i}`,
        });
      }

      if (medicine.days && (typeof medicine.days !== "number" || medicine.days <= 0)) {
        return res.status(400).json({
          success: false,
          message: `Number of days must be a positive number for medicine at index ${i}`,
        });
      }
    }
  }
  next();
};

import { ShiftTemplate, Doctor, Shift, Specialty, User } from "../models";
import { AppError } from "../utils/AppError";

export class ShiftTemplateService {
  /**
   * Create a new shift template
   */
  static async createTemplate(data: {
    doctorId: number;
    shiftId: number;
    dayOfWeek: number;
    notes?: string;
  }) {
    // Validate dayOfWeek (1-7)
    if (data.dayOfWeek < 1 || data.dayOfWeek > 7) {
      throw new AppError(
        "INVALID_DAY_OF_WEEK",
        "Day of week must be between 1 (Monday) and 7 (Sunday)",
        400
      );
    }

    // Check if doctor exists
    const doctor = await Doctor.findByPk(data.doctorId);
    if (!doctor) {
      throw new AppError("DOCTOR_NOT_FOUND", "Doctor not found", 404);
    }

    // Check if shift exists
    const shift = await Shift.findByPk(data.shiftId);
    if (!shift) {
      throw new AppError("SHIFT_NOT_FOUND", "Shift not found", 404);
    }

    // Check for duplicate template
    const existing = await ShiftTemplate.findOne({
      where: {
        doctorId: data.doctorId,
        shiftId: data.shiftId,
        dayOfWeek: data.dayOfWeek,
      },
    });

    if (existing) {
      throw new AppError(
        "DUPLICATE_TEMPLATE",
        "This doctor already has a template for this shift and day",
        409
      );
    }

    // Create template
    const template = await ShiftTemplate.create({
      doctorId: data.doctorId,
      shiftId: data.shiftId,
      dayOfWeek: data.dayOfWeek,
      notes: data.notes,
      isActive: true,
    });

    return template;
  }

  /**
   * Get all templates with filters
   */
  static async getTemplates(filters?: {
    doctorId?: number;
    shiftId?: number;
    dayOfWeek?: number;
    isActive?: boolean;
  }) {
    const where: any = {};

    if (filters?.doctorId) where.doctorId = filters.doctorId;
    if (filters?.shiftId) where.shiftId = filters.shiftId;
    if (filters?.dayOfWeek && filters.dayOfWeek !== 0) where.dayOfWeek = filters.dayOfWeek;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const templates = await ShiftTemplate.findAll({
      where,
      include: [
        {
          model: Doctor,
          as: "doctor",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email"],
            },
            {
              model: Specialty,
              as: "specialty",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: Shift,
          as: "shift",
        },
      ],
      order: [
        ["dayOfWeek", "ASC"],
        ["shiftId", "ASC"],
      ],
    });

    return templates;
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(id: number) {
    const template = await ShiftTemplate.findByPk(id, {
      include: [
        {
          model: Doctor,
          as: "doctor",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email"],
            },
            {
              model: Specialty,
              as: "specialty",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: Shift,
          as: "shift",
        },
      ],
    });

    if (!template) {
      throw new AppError("TEMPLATE_NOT_FOUND", "Template not found", 404);
    }

    return template;
  }

  /**
   * Update template
   */
  static async updateTemplate(
    id: number,
    data: {
      dayOfWeek?: number;
      isActive?: boolean;
      notes?: string;
    }
  ) {
    const template = await ShiftTemplate.findByPk(id);
    if (!template) {
      throw new AppError("TEMPLATE_NOT_FOUND", "Template not found", 404);
    }

    // Validate dayOfWeek if provided
    if (data.dayOfWeek && (data.dayOfWeek < 1 || data.dayOfWeek > 7)) {
      throw new AppError(
        "INVALID_DAY_OF_WEEK",
        "Day of week must be between 1 (Monday) and 7 (Sunday)",
        400
      );
    }

    // Check for duplicate if dayOfWeek is being changed
    if (data.dayOfWeek && data.dayOfWeek !== template.dayOfWeek) {
      const existing = await ShiftTemplate.findOne({
        where: {
          doctorId: template.doctorId,
          shiftId: template.shiftId,
          dayOfWeek: data.dayOfWeek,
        },
      });

      if (existing) {
        throw new AppError(
          "DUPLICATE_TEMPLATE",
          "This doctor already has a template for this shift and day",
          409
        );
      }
    }

    await template.update(data);
    return template;
  }

  /**
   * Delete template
   */
  static async deleteTemplate(id: number) {
    const template = await ShiftTemplate.findByPk(id);
    if (!template) {
      throw new AppError("TEMPLATE_NOT_FOUND", "Template not found", 404);
    }

    await template.destroy();
    return { message: "Template deleted successfully" };
  }

  /**
   * Get active templates (for schedule generation)
   */
  static async getActiveTemplates() {
    return await ShiftTemplate.findAll({
      where: { isActive: true },
      include: [
        {
          model: Doctor,
          as: "doctor",
        },
        {
          model: Shift,
          as: "shift",
        },
      ],
    });
  }
}

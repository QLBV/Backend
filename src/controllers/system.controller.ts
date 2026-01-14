import { Request, Response } from "express";
import SystemSettings from "../models/SystemSettings";
import { asyncHandler, sendSuccess } from "../utils/response.utils";
import logger from "../utils/logger";
import { clearMaintenanceCache } from "../middlewares/maintenance.middlewares";

/**
 * Lấy cài đặt hệ thống hiện tại
 * GET /api/system/settings
 */
export const getSystemSettings = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info("Fetching system settings");

    // Lấy settings đầu tiên (chỉ có 1 row)
    let settings = await SystemSettings.findOne();

    // Nếu chưa có settings, tạo mới với giá trị mặc định
    if (!settings) {
      logger.info("No system settings found, creating default settings");
      settings = await SystemSettings.create({
        clinicName: "Phòng khám Y tế",
        clinicAddress: "Địa chỉ phòng khám",
        clinicPhone: "0123456789",
        clinicEmail: "info@clinic.com",
        clinicWebsite: "",
        businessHours: {
          monday: { open: "08:00", close: "17:00", closed: false },
          tuesday: { open: "08:00", close: "17:00", closed: false },
          wednesday: { open: "08:00", close: "17:00", closed: false },
          thursday: { open: "08:00", close: "17:00", closed: false },
          friday: { open: "08:00", close: "17:00", closed: false },
          saturday: { open: "08:00", close: "12:00", closed: false },
          sunday: { open: "", close: "", closed: true },
        },
        systemSettings: {
          maintenanceMode: false,
          allowOnlineBooking: true,
          allowOfflineBooking: true,
          maxAppointmentsPerDay: 50,
          appointmentDuration: 30,
          currency: "VND",
          timezone: "Asia/Ho_Chi_Minh",
        },
        emailSettings: {
          smtpHost: "",
          smtpPort: 587,
          smtpUser: "",
          smtpPassword: "",
          fromEmail: "",
          fromName: "",
        },
      });
    }

    sendSuccess(res, settings, "Lấy cài đặt hệ thống thành công");
  }
);

/**
 * Cập nhật cài đặt hệ thống
 * PUT /api/system/settings
 */
export const updateSystemSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      clinicName,
      clinicAddress,
      clinicPhone,
      clinicEmail,
      clinicWebsite,
      businessHours,
      systemSettings,
      emailSettings,
    } = req.body;

    logger.info("Updating system settings", { userId: req.user?.userId });

    // Validate required fields
    if (!clinicName || !clinicAddress || !clinicPhone || !clinicEmail) {
      return res.status(400).json({
        success: false,
        message: "Tên, địa chỉ, số điện thoại và email phòng khám là bắt buộc",
      });
    }

    // Lấy settings hiện tại hoặc tạo mới
    let settings = await SystemSettings.findOne();

    if (settings) {
      // Cập nhật settings hiện có
      settings.clinicName = clinicName;
      settings.clinicAddress = clinicAddress;
      settings.clinicPhone = clinicPhone;
      settings.clinicEmail = clinicEmail;
      settings.clinicWebsite = clinicWebsite || "";

      if (businessHours) {
        settings.businessHours = businessHours;
      }

      if (systemSettings) {
        settings.systemSettings = systemSettings;
      }

      if (emailSettings) {
        settings.emailSettings = emailSettings;
      }

      await settings.save();

      logger.info("System settings updated successfully");
    } else {
      // Tạo mới settings
      settings = await SystemSettings.create({
        clinicName,
        clinicAddress,
        clinicPhone,
        clinicEmail,
        clinicWebsite: clinicWebsite || "",
        businessHours:
          businessHours ||
          ({
            monday: { open: "08:00", close: "17:00", closed: false },
            tuesday: { open: "08:00", close: "17:00", closed: false },
            wednesday: { open: "08:00", close: "17:00", closed: false },
            thursday: { open: "08:00", close: "17:00", closed: false },
            friday: { open: "08:00", close: "17:00", closed: false },
            saturday: { open: "08:00", close: "12:00", closed: false },
            sunday: { open: "", close: "", closed: true },
          } as any),
        systemSettings:
          systemSettings ||
          ({
            maintenanceMode: false,
            allowOnlineBooking: true,
            allowOfflineBooking: true,
            maxAppointmentsPerDay: 50,
            appointmentDuration: 30,
            currency: "VND",
            timezone: "Asia/Ho_Chi_Minh",
          } as any),
        emailSettings:
          emailSettings ||
          ({
            smtpHost: "",
            smtpPort: 587,
            smtpUser: "",
            smtpPassword: "",
            fromEmail: "",
            fromName: "",
          } as any),
      });

      logger.info("System settings created successfully");
    }

    // Xóa cache maintenance mode để áp dụng ngay lập tức
    clearMaintenanceCache();

    sendSuccess(res, settings, "Cập nhật cài đặt hệ thống thành công");
  }
);

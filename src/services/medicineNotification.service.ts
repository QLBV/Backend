import { createNotification } from "./notification.service";
import { NotificationType } from "../models/Notification";
import Medicine from "../models/Medicine";
import User from "../models/User";
import { RoleCode } from "../constant/role";

/**
 * Send notification to all admins about expiring medicines
 */
export const notifyExpiringMedicines = async (
  medicines: any[],
  daysThreshold: number
) => {
  try {
    // Get all admin users
    const adminUsers = await User.findAll({
      include: [
        {
          association: "role",
          where: { roleCode: RoleCode.ADMIN },
        },
      ],
    });

    if (adminUsers.length === 0) {
      console.log("⚠️  No admin users found to notify");
      return;
    }

    // Create notification for each admin
    for (const admin of adminUsers) {
      const medicineList = medicines
        .map((m) => `- ${m.name} (${m.daysUntilExpiry} ngày)`)
        .join("\n");

      await createNotification({
        userId: admin.id,
        type: NotificationType.SYSTEM,
        title: `⚠️ Cảnh báo thuốc sắp hết hạn`,
        message: `Có ${medicines.length} loại thuốc sẽ hết hạn trong ${daysThreshold} ngày tới:\n${medicineList}`,
      });
    }

    console.log(
      `✅ Sent expiring medicines notifications to ${adminUsers.length} admin(s)`
    );
  } catch (error: any) {
    console.error("❌ Failed to send expiring medicines notifications:", error.message);
  }
};

/**
 * Send notification to all admins about low stock medicines
 */
export const notifyLowStockMedicines = async (medicines: Medicine[]) => {
  try {
    // Get all admin users
    const adminUsers = await User.findAll({
      include: [
        {
          association: "role",
          where: { roleCode: RoleCode.ADMIN },
        },
      ],
    });

    if (adminUsers.length === 0) {
      console.log("⚠️  No admin users found to notify");
      return;
    }

    // Create notification for each admin
    for (const admin of adminUsers) {
      const medicineList = medicines
        .map((m) => `- ${m.name} (Còn: ${m.quantity}/${m.minStockLevel})`)
        .join("\n");

      await createNotification({
        userId: admin.id,
        type: NotificationType.SYSTEM,
        title: `⚠️ Cảnh báo thuốc sắp hết`,
        message: `Có ${medicines.length} loại thuốc đang ở mức tồn kho thấp:\n${medicineList}`,
      });
    }

    console.log(
      `✅ Sent low stock notifications to ${adminUsers.length} admin(s)`
    );
  } catch (error: any) {
    console.error("❌ Failed to send low stock notifications:", error.message);
  }
};

/**
 * Send notification to all admins about expired medicines
 */
export const notifyExpiredMedicines = async (medicines: Medicine[]) => {
  try {
    // Get all admin users
    const adminUsers = await User.findAll({
      include: [
        {
          association: "role",
          where: { roleCode: RoleCode.ADMIN },
        },
      ],
    });

    if (adminUsers.length === 0) {
      console.log("⚠️  No admin users found to notify");
      return;
    }

    // Create notification for each admin
    for (const admin of adminUsers) {
      const medicineList = medicines
        .map(
          (m) =>
            `- ${m.medicineCode} | ${m.name} | Hết hạn: ${new Date(m.expiryDate).toLocaleDateString("vi-VN")}`
        )
        .join("\n");

      await createNotification({
        userId: admin.id,
        type: NotificationType.SYSTEM,
        title: `🚫 Đã đánh dấu thuốc hết hạn`,
        message: `Hệ thống đã tự động đánh dấu ${medicines.length} loại thuốc hết hạn:\n${medicineList}\n\nVui lòng kiểm tra và chuyển vào kho loại bỏ.`,
      });
    }

    console.log(
      `✅ Sent expired medicines notifications to ${adminUsers.length} admin(s)`
    );
  } catch (error: any) {
    console.error("❌ Failed to send expired medicines notifications:", error.message);
  }
};

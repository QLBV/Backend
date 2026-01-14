import { Request, Response, NextFunction } from "express";
import { emailService } from "../services/email.service";
import { sendSuccess } from "../utils/response.utils";
import { asyncHandler } from "../utils/asyncHandler";

export const sendMessage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName, email, phone, department, message } = req.body;

    // Validation cơ bản
    if (!firstName || !lastName || !email || !message) {
      res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin (Họ, Tên, Email, Nội dung).",
      });
      return;
    }

    // Nội dung email
    const emailSubject = `[Liên hệ] Tin nhắn mới từ ${lastName} ${firstName}`;
    const emailHtml = `
      <h2>Thông tin liên hệ mới</h2>
      <p><strong>Họ tên:</strong> ${lastName} ${firstName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Số điện thoại:</strong> ${phone || "Không cung cấp"}</p>
      <p><strong>Phòng ban liên hệ:</strong> ${department || "Chung"}</p>
      <br/>
      <p><strong>Nội dung:</strong></p>
      <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${message}</p>
    `;

    // Gửi email admin (hoặc email config)
    // Trong thực tế, nên gửi đến bộ phận CSKH
    const adminEmail = process.env.EMAIL_USER || "admin@example.com";

    const isSent = await emailService.sendEmail({
      to: adminEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (!isSent) {
       res.status(500).json({
        success: false,
        message: "Gửi tin nhắn thất bại. Vui lòng thử lại sau.",
      });
      return;
    }

    sendSuccess(res, { message: "Gửi tin nhắn thành công!" });
  }
);

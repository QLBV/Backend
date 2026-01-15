import { Request, Response } from "express";
import User from "../../models/User";
import { OTPService } from "./otp.service";
import { sendOTPEmail, sendVerificationSuccessEmail } from "./otpEmail.service";


export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email là bắt buộc",
      });
    }

    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email không tồn tại trong hệ thống",
      });
    }

    
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email đã được xác thực",
      });
    }

    
    if (
      user.emailVerificationExpires &&
      !OTPService.isExpired(user.emailVerificationExpires)
    ) {
      const timeSinceLastSend = Date.now() - (new Date(user.emailVerificationExpires).getTime() - 5 * 60 * 1000); 
      const secondsSinceLastSend = Math.floor(timeSinceLastSend / 1000);
      
      if (secondsSinceLastSend < 60) {
        
        return res.status(429).json({
          success: false,
          message: `Vui lòng đợi ${60 - secondsSinceLastSend} giây trước khi gửi lại`,
        });
      }
    }

    
    const otp = OTPService.generateOTP();
    const hashedToken = OTPService.generateToken(otp);
    const expiresAt = OTPService.getExpirationTime();

    
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    
    const emailSent = await sendOTPEmail(user.email, user.fullName, otp);

    if (!emailSent) {
      console.error(`Failed to send OTP email to ${user.email}`);
      return res.status(500).json({
        success: false,
        message: "Không thể gửi email. Vui lòng thử lại sau.",
      });
    }

    console.log(` OTP sent to ${user.email}: ${otp} (expires at ${expiresAt})`);

    return res.json({
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn",
      data: {
        email: user.email,
        expiresIn: 300, 
      },
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi gửi OTP",
    });
  }
};


export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email và mã OTP là bắt buộc",
      });
    }

    
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email không tồn tại trong hệ thống",
      });
    }

    
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email đã được xác thực",
      });
    }

    
    if (!user.emailVerificationToken || !user.emailVerificationExpires) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy mã OTP. Vui lòng yêu cầu gửi lại.",
      });
    }

    
    if (OTPService.isExpired(user.emailVerificationExpires)) {
      return res.status(400).json({
        success: false,
        message: "Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.",
      });
    }

    
    const isValid = OTPService.verifyOTP(otp, user.emailVerificationToken);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Mã OTP không đúng. Vui lòng thử lại.",
      });
    }

    
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    
    await sendVerificationSuccessEmail(user.email, user.fullName);

    console.log(` Email verified successfully for ${user.email}`);

    return res.json({
      success: true,
      message: "Xác thực email thành công!",
      data: {
        email: user.email,
        isEmailVerified: true,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xác thực OTP",
    });
  }
};


export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email là bắt buộc",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email không tồn tại trong hệ thống",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email đã được xác thực",
      });
    }

    
    if (
      user.emailVerificationExpires &&
      !OTPService.isExpired(user.emailVerificationExpires)
    ) {
      const remainingSeconds = Math.floor(
        (new Date(user.emailVerificationExpires).getTime() - Date.now()) / 1000
      );

      if (remainingSeconds > 240) {
        
        return res.status(429).json({
          success: false,
          message: `Vui lòng đợi ${Math.floor(remainingSeconds / 60)} phút trước khi gửi lại`,
        });
      }
    }

    
    const otp = OTPService.generateOTP();
    const hashedToken = OTPService.generateToken(otp);
    const expiresAt = OTPService.getExpirationTime();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    const emailSent = await sendOTPEmail(user.email, user.fullName, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Không thể gửi email. Vui lòng thử lại sau.",
      });
    }

    console.log(` OTP resent to ${user.email}: ${otp}`);

    return res.json({
      success: true,
      message: "Mã OTP mới đã được gửi đến email của bạn",
      data: {
        email: user.email,
        expiresIn: 300,
      },
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi gửi lại OTP",
    });
  }
};

import { sendEmail } from "./email.service";

/**
 * Email template cho OTP verification
 */
export async function sendOTPEmail(
  email: string,
  fullName: string,
  otp: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          padding: 40px;
          color: white;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          background: white;
          color: #333;
          border-radius: 8px;
          padding: 30px;
          margin: 20px 0;
        }
        .otp-box {
          background: #f8f9fa;
          border: 2px dashed #667eea;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .otp-code {
          font-size: 36px;
          font-weight: bold;
          color: #667eea;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
        }
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,0.8);
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Xác Thực Email</h1>
          <p>Hệ thống Quản lý Phòng khám</p>
        </div>
        
        <div class="content">
          <p>Xin chào <strong>${fullName}</strong>,</p>
          
          <p>Chúng tôi đã nhận được yêu cầu xác thực email cho tài khoản của bạn.</p>
          
          <p>Vui lòng sử dụng mã OTP dưới đây để hoàn tất xác thực:</p>
          
          <div class="otp-box">
            <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Mã xác thực của bạn</div>
            <div class="otp-code">${otp}</div>
            <div style="font-size: 12px; color: #666; margin-top: 10px;">Mã có hiệu lực trong 5 phút</div>
          </div>
          
          <div class="warning">
            <strong>Lưu ý bảo mật:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Không chia sẻ mã OTP này với bất kỳ ai</li>
              <li>Nhân viên của chúng tôi sẽ không bao giờ yêu cầu mã OTP qua điện thoại hoặc email</li>
              <li>Nếu bạn không yêu cầu xác thực này, vui lòng bỏ qua email</li>
            </ul>
          </div>
          
          <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
          
          <p style="margin-top: 20px;">
            Trân trọng,<br>
            <strong>Đội ngũ Hỗ trợ Phòng khám</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          <p>&copy; ${new Date().getFullYear()} Hệ thống Quản lý Phòng khám. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Mã xác thực OTP: ${otp}`,
    html,
  });
}

/**
 * Email template cho xác thực thành công
 */
export async function sendVerificationSuccessEmail(
  email: string,
  fullName: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          border-radius: 10px;
          padding: 40px;
          color: white;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .success-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        .content {
          background: white;
          color: #333;
          border-radius: 8px;
          padding: 30px;
          margin: 20px 0;
          text-align: center;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,0.8);
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>Email Đã Được Xác Thực!</h1>
        </div>
        
        <div class="content">
          <p>Xin chào <strong>${fullName}</strong>,</p>
          
          <p style="font-size: 18px; color: #38ef7d; font-weight: bold;">
            Chúc mừng! Email của bạn đã được xác thực thành công.
          </p>
          
          <p>Bây giờ bạn có thể sử dụng đầy đủ các tính năng của hệ thống!</p>
          
          <p style="margin-top: 30px;">
            Trân trọng,<br>
            <strong>Đội ngũ Hỗ trợ Phòng khám</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Hệ thống Quản lý Phòng khám.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Email đã được xác thực thành công",
    html,
  });
}

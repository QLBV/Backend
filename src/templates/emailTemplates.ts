function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Healos - Hệ thống Quản lý Phòng khám</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .email-wrapper {
      padding: 40px 20px;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    .header {
      background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
      animation: pulse 4s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    .header-icon {
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      backdrop-filter: blur(10px);
      position: relative;
      z-index: 1;
    }
    
    .header-icon span {
      font-size: 36px;
    }
    
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
    }
    
    .header .subtitle {
      margin-top: 8px;
      font-size: 14px;
      opacity: 0.9;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }
    
    .content {
      padding: 40px 30px;
      line-height: 1.7;
      color: #1f2937;
    }
    
    .greeting {
      font-size: 18px;
      color: #374151;
      margin-bottom: 16px;
    }
    
    .greeting strong {
      color: #0ea5e9;
    }
    
    .message {
      font-size: 15px;
      color: #6b7280;
      margin-bottom: 24px;
    }
    
    .info-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 16px;
      padding: 28px;
      margin: 24px 0;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    
    .info-card-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0ea5e9;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .info-card-title::before {
      content: '';
      width: 4px;
      height: 18px;
      background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%);
      border-radius: 2px;
    }
    
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .info-table tr {
      border-bottom: 1px solid #e2e8f0;
    }
    
    .info-table tr:last-child {
      border-bottom: none;
    }
    
    .info-table td {
      padding: 14px 0;
      vertical-align: middle;
    }
    
    .info-table td:first-child {
      width: 40%;
      padding-right: 16px;
    }
    
    .info-table td:last-child {
      width: 60%;
      text-align: right;
    }
    
    .info-row {
      display: table;
      width: 100%;
      padding: 14px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .info-row:first-of-type {
      padding-top: 0;
    }
    
    .info-label {
      display: table-cell;
      width: 40%;
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
      vertical-align: middle;
      padding-right: 16px;
    }
    
    .info-value {
      display: table-cell;
      width: 60%;
      font-size: 14px;
      color: #1e293b;
      font-weight: 600;
      text-align: right;
      vertical-align: middle;
    }
    
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%);
      color: white;
      padding: 6px 16px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
    }
    
    .highlight-box {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-left: 4px solid #10b981;
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 0 12px 12px 0;
    }
    
    .highlight-box.warning {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border-left-color: #f59e0b;
    }
    
    .highlight-box.danger {
      background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
      border-left-color: #ef4444;
    }
    
    .highlight-box p {
      margin: 0;
      font-size: 14px;
      color: #374151;
    }
    
    .highlight-box strong {
      color: #059669;
    }
    
    .highlight-box.warning strong {
      color: #d97706;
    }
    
    .highlight-box.danger strong {
      color: #dc2626;
    }
    
    .notes-section {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    
    .notes-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .notes-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .notes-list li {
      font-size: 13px;
      color: #6b7280;
      padding: 8px 0;
      padding-left: 24px;
      position: relative;
      line-height: 1.5;
    }
    
    .notes-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }
    
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 14px 0 rgba(14, 165, 233, 0.4);
      transition: all 0.3s ease;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px 0 rgba(14, 165, 233, 0.5);
    }
    
    .footer {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-logo {
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 12px;
    }
    
    .footer p {
      font-size: 12px;
      color: #9ca3af;
      margin: 4px 0;
      line-height: 1.6;
    }
    
    .footer-divider {
      width: 50px;
      height: 3px;
      background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%);
      margin: 16px auto;
      border-radius: 2px;
    }
    
    .social-links {
      margin: 16px 0;
    }
    
    .social-links a {
      display: inline-block;
      width: 36px;
      height: 36px;
      background: #e2e8f0;
      border-radius: 50%;
      margin: 0 6px;
      line-height: 36px;
      text-decoration: none;
      font-size: 16px;
    }
    
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      
      .email-container {
        border-radius: 16px;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .header h1 {
        font-size: 22px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .info-card {
        padding: 16px;
      }
      
      .info-row {
        flex-direction: column;
        gap: 4px;
      }
      
      .info-value {
        text-align: left;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      ${content}
      <div class="footer">
        <div class="footer-logo">Healos</div>
        <div class="footer-divider"></div>
        <p>Hệ thống Quản lý Phòng khám Thông minh</p>
        
        <div style="margin: 20px 0; padding: 16px; background: #f1f5f9; border-radius: 12px;">
          <p style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px;">Liên hệ hỗ trợ</p>
          <p style="font-size: 13px; color: #6b7280; margin: 4px 0;">
            📞 Hotline: <a href="tel:19001234" style="color: #0ea5e9; text-decoration: none; font-weight: 600;">1900 1234</a>
          </p>
          <p style="font-size: 13px; color: #6b7280; margin: 4px 0;">
            ✉️ Email: <a href="mailto:support@healos.vn" style="color: #0ea5e9; text-decoration: none; font-weight: 600;">support@healos.vn</a>
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
            Thời gian hỗ trợ: 7:00 - 21:00 (Thứ 2 - 7)
          </p>
        </div>
        
        <p style="font-size: 11px; color: #9ca3af;">Đây là email tự động, vui lòng không trả lời email này.</p>
        <p style="margin-top: 12px; font-size: 11px; color: #9ca3af;">
          © ${new Date().getFullYear()} Healos Healthcare. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Format ngày giờ Việt Nam
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Template: Xác nhận lịch khám mới
 */
export function appointmentConfirmationTemplate(data: {
  patientName: string;
  doctorName: string;
  doctorSpecialty: string;
  appointmentDate: string;
  shiftName: string;
  shiftTime?: string; // e.g. "08:00 - 12:00"
  appointmentTime?: string; // e.g. "18:10"
  slotNumber: number;
  appointmentId: number;
}): string {
  const content = `
    <div class="header">
      <h1>Xác nhận lịch khám</h1>
      <p class="subtitle">Lịch hẹn của bạn đã được đặt thành công</p>
    </div>
    <div class="content">
      <p class="greeting">Xin chào <strong>${data.patientName}</strong>,</p>
      <p class="message">
        Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi. 
        Lịch khám của bạn đã được xác nhận thành công!
      </p>

      <div class="info-card">
        <div class="info-card-title">Thông tin lịch khám</div>
        <table class="info-table">
          <tr>
            <td class="info-label">Mã lịch hẹn</td>
            <td class="info-value" style="color: #0ea5e9; font-weight: 700;">#${
              data.appointmentId
            }</td>
          </tr>
          <tr>
            <td class="info-label">Bác sĩ</td>
            <td class="info-value">${data.doctorName}</td>
          </tr>
          <tr>
            <td class="info-label">Chuyên khoa</td>
            <td class="info-value">${data.doctorSpecialty}</td>
          </tr>
          <tr>
            <td class="info-label">Ngày khám</td>
            <td class="info-value" style="color: #0d9488; font-weight: 700;">${formatDate(
              data.appointmentDate
            )}</td>
          </tr>
          <tr>
            <td class="info-label">${
              data.appointmentTime ? "Giờ khám dự kiến" : "Ca khám"
            }</td>
            <td class="info-value">
              ${
                data.appointmentTime
                  ? `<div style="background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%); color: white; padding: 10px 16px; border-radius: 12px; font-size: 16px; display: inline-block; font-weight: 700; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);">
                🕐 ${data.appointmentTime}
              </div>
              <div style="margin-top: 8px; color: #64748b; font-size: 12px; font-weight: 400;">
                (${data.shiftName}${
                      data.shiftTime ? ` - ${data.shiftTime}` : ""
                    })
              </div>`
                  : `<div>${data.shiftName} ${
                      data.shiftTime
                        ? `<span style="color: #64748b; font-weight: 400; font-size: 13px;">(${data.shiftTime})</span>`
                        : ""
                    }</div>`
              }
            </td>
          </tr>
          <tr>
            <td class="info-label">Số thứ tự</td>
            <td class="info-value"><span class="badge">${
              data.slotNumber
            }</span></td>
          </tr>
        </table>
      </div>

      <div class="notes-section">
        <div class="notes-title">📋 Lưu ý quan trọng</div>
        <ul class="notes-list">
          <li>- Vui lòng đến trước giờ khám <strong>15 phút</strong> để làm thủ tục</li>
          <li>- Mang theo CMND/CCCD và thẻ BHYT (nếu có)</li>
          <li>- Nếu cần hủy lịch, vui lòng thông báo trước ít nhất <strong>2 giờ</strong></li>
        </ul>
      </div>
      <div class="highlight-box">
        <p><strong>💡</strong> Bạn có thể xem và quản lý lịch hẹn của mình trên hệ thống bất cứ lúc nào.</p>
      </div>
    </div>
  `;

  return baseTemplate(content);
}

/**
 * Template: Thông báo hủy lịch khám
 */
export function appointmentCancellationTemplate(data: {
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  shiftName: string;
  shiftTime?: string;
  appointmentTime?: string;
  reason?: string;
  appointmentId: number;
}): string {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      <h1>Thông báo hủy lịch khám</h1>
      <p class="subtitle">Lịch hẹn của bạn đã bị hủy</p>
    </div>
    <div class="content">
      <p class="greeting">Xin chào <strong>${data.patientName}</strong>,</p>
      <p class="message">
        Chúng tôi rất tiếc phải thông báo rằng lịch khám của bạn đã bị hủy.
      </p>

      <div class="info-card">
        <div class="info-card-title" style="color: #dc2626;">Thông tin lịch khám đã hủy</div>
        <table class="info-table">
          <tr>
            <td class="info-label">Mã lịch hẹn</td>
            <td class="info-value" style="color: #dc2626; text-decoration: line-through;">#${
              data.appointmentId
            }</td>
          </tr>
          <tr>
            <td class="info-label">Bác sĩ</td>
            <td class="info-value">${data.doctorName}</td>
          </tr>
          <tr>
            <td class="info-label">Ngày khám</td>
            <td class="info-value">${formatDate(data.appointmentDate)}</td>
          </tr>
          <tr>
            <td class="info-label">${
              data.appointmentTime ? "Giờ khám dự kiến" : "Ca khám"
            }</td>
            <td class="info-value">
              ${
                data.appointmentTime
                  ? `<div style="background-color: #f1f5f9; color: #64748b; padding: 8px 14px; border-radius: 8px; font-size: 15px; display: inline-block; font-weight: 600; border: 1px solid #e2e8f0; text-decoration: line-through;">
                🕐 ${data.appointmentTime}
              </div>
              <div style="margin-top: 8px; color: #9ca3af; font-size: 12px; font-weight: 400; text-decoration: line-through;">
                (${data.shiftName}${
                      data.shiftTime ? ` - ${data.shiftTime}` : ""
                    })
              </div>`
                  : `<div>${data.shiftName} ${
                      data.shiftTime
                        ? `<span style="color: #64748b; font-weight: 400; font-size: 13px;">(${data.shiftTime})</span>`
                        : ""
                    }</div>`
              }
            </td>
          </tr>
          ${
            data.reason
              ? `<tr>
            <td class="info-label">Lý do hủy</td>
            <td class="info-value" style="color: #dc2626;">${data.reason}</td>
          </tr>`
              : ""
          }
        </table>
      </div>

      <div class="highlight-box warning">
        <p><strong>💡 Nếu bạn vẫn cần khám, hãy đặt lịch hẹn mới trên hệ thống của chúng tôi.</p>
      </div>

      <div class="button-container">
        <a href="#" class="button">Đặt lịch khám mới</a>
      </div>

      <p style="text-align: center; font-size: 14px; color: #6b7280;">
        Chúng tôi xin lỗi vì sự bất tiện này và mong được phục vụ bạn trong tương lai!
      </p>
    </div>
  `;

  return baseTemplate(content);
}

/**
 * Template: Thông báo thay đổi bác sĩ
 */
export function doctorChangedTemplate(data: {
  patientName: string;
  oldDoctorName: string;
  newDoctorName: string;
  newDoctorSpecialty: string;
  appointmentDate: string;
  shiftName: string;
  shiftTime?: string;
  appointmentTime?: string;
  slotNumber: number;
  reason?: string;
  appointmentId: number;
}): string {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      <h1>Thông báo thay đổi bác sĩ</h1>
      <p class="subtitle">Bác sĩ khám của bạn đã được thay đổi</p>
    </div>
    <div class="content">
      <p class="greeting">Xin chào <strong>${data.patientName}</strong>,</p>
      <p class="message">
        Chúng tôi xin thông báo có sự thay đổi về bác sĩ khám cho lịch hẹn của bạn. 
        Các thông tin khác vẫn được giữ nguyên.
      </p>

      <div class="highlight-box warning">
        <p><strong>⚠️ Thay đổi:</strong> Bác sĩ khám của bạn đã được chuyển đổi</p>
      </div>

      <div class="info-card">
        <div class="info-card-title">Thông tin lịch khám</div>
        <table class="info-table">
          <tr>
            <td class="info-label">Mã lịch hẹn</td>
            <td class="info-value" style="color: #0ea5e9; font-weight: 700;">#${
              data.appointmentId
            }</td>
          </tr>
          <tr>
            <td class="info-label">Bác sĩ cũ</td>
            <td class="info-value" style="color: #9ca3af; text-decoration: line-through;">${
              data.oldDoctorName
            }</td>
          </tr>
          <tr>
            <td class="info-label">Bác sĩ mới</td>
            <td class="info-value" style="color: #10b981; font-weight: 700;">${
              data.newDoctorName
            }</td>
          </tr>
          <tr>
            <td class="info-label">Chuyên khoa</td>
            <td class="info-value">${data.newDoctorSpecialty}</td>
          </tr>
          <tr>
            <td class="info-label">Ngày khám</td>
            <td class="info-value" style="color: #0d9488; font-weight: 700;">${formatDate(
              data.appointmentDate
            )}</td>
          </tr>
          <tr>
            <td class="info-label">${
              data.appointmentTime ? "Giờ khám dự kiến" : "Ca khám"
            }</td>
            <td class="info-value">
              ${
                data.appointmentTime
                  ? `<div style="background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%); color: white; padding: 10px 16px; border-radius: 12px; font-size: 16px; display: inline-block; font-weight: 700; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);">
                🕐 ${data.appointmentTime}
              </div>
              <div style="margin-top: 8px; color: #64748b; font-size: 12px; font-weight: 400;">
                (${data.shiftName}${
                      data.shiftTime ? ` - ${data.shiftTime}` : ""
                    })
              </div>`
                  : `<div>${data.shiftName} ${
                      data.shiftTime
                        ? `<span style="color: #64748b; font-weight: 400; font-size: 13px;">(${data.shiftTime})</span>`
                        : ""
                    }</div>`
              }
            </td>
          </tr>
          <tr>
            <td class="info-label">Số thứ tự</td>
            <td class="info-value"><span class="badge">${
              data.slotNumber
            }</span></td>
          </tr>
          ${
            data.reason
              ? `<tr>
            <td class="info-label">Lý do</td>
            <td class="info-value">${data.reason}</td>
          </tr>`
              : ""
          }
        </table>
      </div>

      <div class="highlight-box">
        <p><strong>✅ Yên tâm:</strong> Bác sĩ mới cùng chuyên khoa và sẽ đảm bảo chất lượng khám chữa bệnh tốt nhất cho bạn.</p>
      </div>

      <p style="text-align: center; font-size: 14px; color: #6b7280;">
        Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.<br/>
        Xin cảm ơn sự thông cảm của bạn!
      </p>
    </div>
  `;

  return baseTemplate(content);
}

/**
 * Template: Thông báo đổi lịch khám
 */
export function appointmentRescheduledTemplate(data: {
  patientName: string;
  oldDate: string;
  newDate: string;
  oldShiftName: string;
  newShiftName: string;
  oldShiftTime?: string;
  newShiftTime?: string;
  oldAppointmentTime?: string;
  newAppointmentTime?: string;
  oldDoctorName: string;
  newDoctorName: string;
  appointmentId: number;
}): string {
  const sameDoctor = data.oldDoctorName === data.newDoctorName;

  const content = `
    <div class="header" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
      <h1>Lịch khám đã được thay đổi</h1>
      <p class="subtitle">Thông tin lịch hẹn của bạn đã được cập nhật</p>
    </div>
    <div class="content">
      <p class="greeting">Xin chào <strong>${data.patientName}</strong>,</p>
      <p class="message">
        Lịch khám của bạn đã được cập nhật. Vui lòng kiểm tra thông tin mới bên dưới.
      </p>

      <div class="info-card" style="background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); border: 1px solid #fecaca;">
        <div class="info-card-title" style="color: #dc2626;">❌ Thông tin cũ (đã hủy)</div>
        <table class="info-table">
          <tr>
            <td class="info-label">Mã lịch hẹn</td>
            <td class="info-value">#${data.appointmentId}</td>
          </tr>
          <tr>
            <td class="info-label">Ngày khám</td>
            <td class="info-value" style="text-decoration: line-through; color: #9ca3af;">${formatDate(
              data.oldDate
            )}</td>
          </tr>
          <tr>
            <td class="info-label">${
              data.oldAppointmentTime ? "Giờ khám dự kiến" : "Ca khám"
            }</td>
            <td class="info-value">
              ${
                data.oldAppointmentTime
                  ? `<div style="background-color: #f1f5f9; color: #9ca3af; padding: 8px 14px; border-radius: 8px; font-size: 15px; display: inline-block; font-weight: 600; border: 1px solid #e2e8f0; text-decoration: line-through;">
                🕐 ${data.oldAppointmentTime}
              </div>
              <div style="margin-top: 8px; color: #9ca3af; font-size: 12px; font-weight: 400; text-decoration: line-through;">
                (${data.oldShiftName}${
                      data.oldShiftTime ? ` - ${data.oldShiftTime}` : ""
                    })
              </div>`
                  : `<div style="text-decoration: line-through; color: #9ca3af;">${
                      data.oldShiftName
                    } ${
                      data.oldShiftTime ? `(${data.oldShiftTime})` : ""
                    }</div>`
              }
            </td>
          </tr>
          <tr>
            <td class="info-label">Bác sĩ</td>
            <td class="info-value" style="text-decoration: line-through; color: #9ca3af;">${
              data.oldDoctorName
            }</td>
          </tr>
        </table>
      </div>

      <div class="info-card" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0;">
        <div class="info-card-title" style="color: #059669;">✅ Thông tin mới</div>
        <table class="info-table">
          <tr>
            <td class="info-label">Mã lịch hẹn</td>
            <td class="info-value" style="color: #0ea5e9; font-weight: 700;">#${
              data.appointmentId
            }</td>
          </tr>
          <tr>
            <td class="info-label">Ngày khám</td>
            <td class="info-value" style="color: #059669; font-weight: 700;">${formatDate(
              data.newDate
            )}</td>
          </tr>
          <tr>
            <td class="info-label">${
              data.newAppointmentTime ? "Giờ khám dự kiến" : "Ca khám"
            }</td>
            <td class="info-value">
              ${
                data.newAppointmentTime
                  ? `<div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 10px 16px; border-radius: 12px; font-size: 16px; display: inline-block; font-weight: 700; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
                🕐 ${data.newAppointmentTime}
              </div>
              <div style="margin-top: 8px; color: #64748b; font-size: 12px; font-weight: 400;">
                (${data.newShiftName}${
                      data.newShiftTime ? ` - ${data.newShiftTime}` : ""
                    })
              </div>`
                  : `<div>${data.newShiftName} ${
                      data.newShiftTime
                        ? `<span style="color: #64748b; font-weight: 400; font-size: 13px;">(${data.newShiftTime})</span>`
                        : ""
                    }</div>`
              }
            </td>
          </tr>
          <tr>
            <td class="info-label">Bác sĩ</td>
            <td class="info-value" style="color: #059669; font-weight: 700;">${
              data.newDoctorName
            }</td>
          </tr>
        </table>
      </div>

      ${
        sameDoctor
          ? `<div class="highlight-box">
        <p><strong>✅ Lưu ý:</strong> Bác sĩ khám giữ nguyên, chỉ thay đổi thời gian/ca khám.</p>
      </div>`
          : `<div class="highlight-box warning">
        <p><strong>⚠️ Lưu ý:</strong> Bác sĩ khám đã được đổi để đảm bảo lịch trình phù hợp.</p>
      </div>`
      }

      <p style="text-align: center; font-size: 14px; color: #6b7280;">
        Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ quầy lễ tân.
      </p>
    </div>
  `;

  return baseTemplate(content);
}

/**
 * Template: Nhắc nhở lịch khám (Reminder)
 */
export function appointmentReminderTemplate(data: {
  patientName: string;
  doctorName: string;
  doctorSpecialty: string;
  appointmentDate: string;
  shiftName: string;
  shiftTime?: string;
  appointmentTime?: string;
  slotNumber: number;
  appointmentId: number;
}): string {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
      <h1>Nhắc nhở lịch khám</h1>
      <p class="subtitle">Đừng quên lịch hẹn của bạn vào ngày mai!</p>
    </div>
    <div class="content">
      <p class="greeting">Xin chào <strong>${data.patientName}</strong>,</p>
      <p class="message">
        Đây là lời nhắc nhở về lịch khám sắp tới của bạn. 
        Hãy chuẩn bị sẵn sàng để đến đúng giờ!
      </p>

      <div class="info-card">
        <div class="info-card-title">Thông tin lịch khám</div>
        <table class="info-table">
          <tr>
            <td class="info-label">Mã lịch hẹn</td>
            <td class="info-value" style="color: #0ea5e9; font-weight: 700;">#${
              data.appointmentId
            }</td>
          </tr>
          <tr>
            <td class="info-label">Bác sĩ</td>
            <td class="info-value">${data.doctorName}</td>
          </tr>
          <tr>
            <td class="info-label">Chuyên khoa</td>
            <td class="info-value">${data.doctorSpecialty}</td>
          </tr>
          <tr>
            <td class="info-label">Ngày khám</td>
            <td class="info-value" style="color: #8b5cf6; font-weight: 700;">${formatDate(
              data.appointmentDate
            )}</td>
          </tr>
          <tr>
            <td class="info-label">${
              data.appointmentTime ? "Giờ khám dự kiến" : "Ca khám"
            }</td>
            <td class="info-value">
              ${
                data.appointmentTime
                  ? `<div style="background: linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%); color: white; padding: 10px 16px; border-radius: 12px; font-size: 16px; display: inline-block; font-weight: 700; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);">
                🕐 ${data.appointmentTime}
              </div>
              <div style="margin-top: 8px; color: #64748b; font-size: 12px; font-weight: 400;">
                (${data.shiftName}${
                      data.shiftTime ? ` - ${data.shiftTime}` : ""
                    })
              </div>`
                  : `<div>${data.shiftName} ${
                      data.shiftTime
                        ? `<span style="color: #64748b; font-weight: 400; font-size: 13px;">(${data.shiftTime})</span>`
                        : ""
                    }</div>`
              }
            </td>
          </tr>
          <tr>
            <td class="info-label">Số thứ tự</td>
            <td class="info-value"><span class="badge" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">${
              data.slotNumber
            }</span></td>
          </tr>
        </table>
      </div>

      <div class="notes-section">
        <div class="notes-title">📝 Checklist trước khi đến</div>
        <ul class="notes-list">
          <li>CMND/CCCD hoặc giấy tờ tùy thân</li>
          <li>Thẻ BHYT (nếu có)</li>
          <li>Kết quả xét nghiệm, chụp chiếu trước đây (nếu có)</li>
          <li>Đơn thuốc đang sử dụng (nếu có)</li>
        </ul>
      </div>

      <div class="highlight-box">
        <p><strong>⏰ Nhớ nhé:</strong> Hãy đến trước giờ khám 15 phút để làm thủ tục!</p>
      </div>
    </div>
  `;

  return baseTemplate(content);
}

export const emailTemplates = {
  appointmentRescheduled: appointmentRescheduledTemplate,
  appointmentConfirmation: appointmentConfirmationTemplate,
  appointmentCancellation: appointmentCancellationTemplate,
  doctorChanged: doctorChangedTemplate,
  appointmentReminder: appointmentReminderTemplate,
};

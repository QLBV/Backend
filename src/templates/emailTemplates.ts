/**
 * Email Templates với responsive design
 */

/**
 * Base HTML template với styling
 */
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
      line-height: 1.6;
      color: #333;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box strong {
      color: #667eea;
      display: inline-block;
      min-width: 120px;
    }
    .info-row {
      margin: 8px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #667eea;
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 500;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .warning-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .success-box {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    ${content}
    <div class="footer">
      <p>Đây là email tự động từ Hệ thống Phòng khám</p>
      <p>Vui lòng không trả lời email này</p>
      <p style="margin-top: 10px; color: #999;">
        © ${new Date().getFullYear()} Healthcare Management System
      </p>
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
  slotNumber: number;
  appointmentId: number;
}): string {
  const content = `
    <div class="header">
      <h1>Xác nhận lịch khám</h1>
    </div>
    <div class="content">
      <p>Xin chào <strong>${data.patientName}</strong>,</p>
      <p>Lịch khám của bạn đã được đặt thành công!</p>

      <div class="success-box">
        <strong>Thông tin lịch khám:</strong>
      </div>

      <div class="info-box">
        <div class="info-row">
          <strong>Mã lịch hẹn:</strong> #${data.appointmentId}
        </div>
        <div class="info-row">
          <strong>Bác sĩ:</strong> ${data.doctorName}
        </div>
        <div class="info-row">
          <strong>Chuyên khoa:</strong> ${data.doctorSpecialty}
        </div>
        <div class="info-row">
          <strong>Ngày khám:</strong> ${formatDate(data.appointmentDate)}
        </div>
        <div class="info-row">
          <strong>Ca khám:</strong> ${data.shiftName}
        </div>
        <div class="info-row">
          <strong>Số thứ tự:</strong> ${data.slotNumber}
        </div>
      </div>

      <p><strong>Lưu ý quan trọng:</strong></p>
      <ul>
        <li>Vui lòng đến trước giờ khám 15 phút để làm thủ tục</li>
        <li>Mang theo CMND/CCCD và thẻ BHYT (nếu có)</li>
        <li>Nếu cần hủy lịch, vui lòng thông báo trước ít nhất 2 giờ</li>
      </ul>

      <p>Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi!</p>
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
  reason?: string;
  appointmentId: number;
}): string {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
      <h1>❌ Thông báo hủy lịch khám</h1>
    </div>
    <div class="content">
      <p>Xin chào <strong>${data.patientName}</strong>,</p>
      <p>Chúng tôi xin thông báo lịch khám của bạn đã bị hủy.</p>

      <div class="warning-box">
        <strong>Thông tin lịch khám đã hủy:</strong>
      </div>

      <div class="info-box">
        <div class="info-row">
          <strong>Mã lịch hẹn:</strong> #${data.appointmentId}
        </div>
        <div class="info-row">
          <strong>Bác sĩ:</strong> ${data.doctorName}
        </div>
        <div class="info-row">
          <strong>Ngày khám:</strong> ${formatDate(data.appointmentDate)}
        </div>
        <div class="info-row">
          <strong>Ca khám:</strong> ${data.shiftName}
        </div>
        ${
          data.reason
            ? `<div class="info-row">
          <strong>Lý do hủy:</strong> ${data.reason}
        </div>`
            : ""
        }
      </div>

      <p>Nếu bạn muốn đặt lịch khám mới, vui lòng truy cập hệ thống hoặc liên hệ với chúng tôi.</p>

      <p>Chúng tôi xin lỗi vì sự bất tiện này!</p>
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
  slotNumber: number;
  reason?: string;
  appointmentId: number;
}): string {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #ffa751 0%, #ffe259 100%);">
      <h1>Thông báo thay đổi bác sĩ</h1>
    </div>
    <div class="content">
      <p>Xin chào <strong>${data.patientName}</strong>,</p>
      <p>Chúng tôi xin thông báo có sự thay đổi về bác sĩ khám cho lịch hẹn của bạn.</p>

      <div class="warning-box">
        <strong>Thay đổi:</strong> Bác sĩ khám của bạn đã được chuyển
      </div>

      <div class="info-box">
        <div class="info-row">
          <strong>Mã lịch hẹn:</strong> #${data.appointmentId}
        </div>
        <div class="info-row">
          <strong>Bác sĩ cũ:</strong> <del style="color: #999;">${data.oldDoctorName}</del>
        </div>
        <div class="info-row">
          <strong>Bác sĩ mới:</strong> <span style="color: #28a745;">${data.newDoctorName}</span>
        </div>
        <div class="info-row">
          <strong>Chuyên khoa:</strong> ${data.newDoctorSpecialty}
        </div>
        <div class="info-row">
          <strong>Ngày khám:</strong> ${formatDate(data.appointmentDate)}
        </div>
        <div class="info-row">
          <strong>Ca khám:</strong> ${data.shiftName}
        </div>
        <div class="info-row">
          <strong>Số thứ tự:</strong> ${data.slotNumber}
        </div>
        ${
          data.reason
            ? `<div class="info-row">
          <strong>Lý do:</strong> ${data.reason}
        </div>`
            : ""
        }
      </div>

      <div class="success-box">
        <p style="margin: 0;"><strong>Lịch khám của bạn vẫn được giữ nguyên</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Chỉ có bác sĩ khám thay đổi, các thông tin khác không đổi.</p>
      </div>

      <p><strong>Bác sĩ mới cùng chuyên khoa</strong> và sẽ đảm bảo chất lượng khám chữa bệnh tốt nhất cho bạn.</p>

      <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>

      <p>Xin cảm ơn sự thông cảm của bạn!</p>
    </div>
  `;

  return baseTemplate(content);
}

/**
 * Export tất cả templates
 */
export const emailTemplates = {
  appointmentConfirmation: appointmentConfirmationTemplate,
  appointmentCancellation: appointmentCancellationTemplate,
  doctorChanged: doctorChangedTemplate,
};

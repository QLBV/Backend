/**
 * Email Templates vá»›i responsive design
 */

/**
 * Base HTML template vá»›i styling
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
      <p>ÄÃ¢y lÃ  email tá»± Ä‘á»™ng tá»« Há»‡ thá»‘ng PhÃ²ng khÃ¡m</p>
      <p>Vui lÃ²ng khÃ´ng tráº£ lá»i email nÃ y</p>
      <p style="margin-top: 10px; color: #999;">
        Â© ${new Date().getFullYear()} Healthcare Management System
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Format ngÃ y giá» Viá»‡t Nam
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
 * Template: XÃ¡c nháº­n lá»‹ch khÃ¡m má»›i
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
      <h1>XÃ¡c nháº­n lá»‹ch khÃ¡m</h1>
    </div>
    <div class="content">
      <p>Xin chÃ o <strong>${data.patientName}</strong>,</p>
      <p>Lá»‹ch khÃ¡m cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c Ä‘áº·t thÃ nh cÃ´ng!</p>

      <div class="success-box">
        <strong>ThÃ´ng tin lá»‹ch khÃ¡m:</strong>
      </div>

      <div class="info-box">
        <div class="info-row">
          <strong>MÃ£ lá»‹ch háº¹n:</strong> #${data.appointmentId}
        </div>
        <div class="info-row">
          <strong>BÃ¡c sÄ©:</strong> ${data.doctorName}
        </div>
        <div class="info-row">
          <strong>ChuyÃªn khoa:</strong> ${data.doctorSpecialty}
        </div>
        <div class="info-row">
          <strong>NgÃ y khÃ¡m:</strong> ${formatDate(data.appointmentDate)}
        </div>
        <div class="info-row">
          <strong>Ca khÃ¡m:</strong> ${data.shiftName}
        </div>
        <div class="info-row">
          <strong>Sá»‘ thá»© tá»±:</strong> ${data.slotNumber}
        </div>
      </div>

      <p><strong>LÆ°u Ã½ quan trá»ng:</strong></p>
      <ul>
        <li>Vui lÃ²ng Ä‘áº¿n trÆ°á»›c giá» khÃ¡m 15 phÃºt Ä‘á»ƒ lÃ m thá»§ tá»¥c</li>
        <li>Mang theo CMND/CCCD vÃ  tháº» BHYT (náº¿u cÃ³)</li>
        <li>Náº¿u cáº§n há»§y lá»‹ch, vui lÃ²ng thÃ´ng bÃ¡o trÆ°á»›c Ã­t nháº¥t 2 giá»</li>
      </ul>

      <p>Cáº£m Æ¡n báº¡n Ä‘Ã£ tin tÆ°á»Ÿng sá»­ dá»¥ng dá»‹ch vá»¥ cá»§a chÃºng tÃ´i!</p>
    </div>
  `;

  return baseTemplate(content);
}

/**
 * Template: ThÃ´ng bÃ¡o há»§y lá»‹ch khÃ¡m
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
      <h1>âŒ ThÃ´ng bÃ¡o há»§y lá»‹ch khÃ¡m</h1>
    </div>
    <div class="content">
      <p>Xin chÃ o <strong>${data.patientName}</strong>,</p>
      <p>ChÃºng tÃ´i xin thÃ´ng bÃ¡o lá»‹ch khÃ¡m cá»§a báº¡n Ä‘Ã£ bá»‹ há»§y.</p>

      <div class="warning-box">
        <strong>ThÃ´ng tin lá»‹ch khÃ¡m Ä‘Ã£ há»§y:</strong>
      </div>

      <div class="info-box">
        <div class="info-row">
          <strong>MÃ£ lá»‹ch háº¹n:</strong> #${data.appointmentId}
        </div>
        <div class="info-row">
          <strong>BÃ¡c sÄ©:</strong> ${data.doctorName}
        </div>
        <div class="info-row">
          <strong>NgÃ y khÃ¡m:</strong> ${formatDate(data.appointmentDate)}
        </div>
        <div class="info-row">
          <strong>Ca khÃ¡m:</strong> ${data.shiftName}
        </div>
        ${
          data.reason
            ? `<div class="info-row">
          <strong>LÃ½ do há»§y:</strong> ${data.reason}
        </div>`
            : ""
        }
      </div>

      <p>Náº¿u báº¡n muá»‘n Ä‘áº·t lá»‹ch khÃ¡m má»›i, vui lÃ²ng truy cáº­p há»‡ thá»‘ng hoáº·c liÃªn há»‡ vá»›i chÃºng tÃ´i.</p>

      <p>ChÃºng tÃ´i xin lá»—i vÃ¬ sá»± báº¥t tiá»‡n nÃ y!</p>
    </div>
  `;

  return baseTemplate(content);
}

/**
 * Template: ThÃ´ng bÃ¡o thay Ä‘á»•i bÃ¡c sÄ©
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
      <h1>ThÃ´ng bÃ¡o thay Ä‘á»•i bÃ¡c sÄ©</h1>
    </div>
    <div class="content">
      <p>Xin chÃ o <strong>${data.patientName}</strong>,</p>
      <p>ChÃºng tÃ´i xin thÃ´ng bÃ¡o cÃ³ sá»± thay Ä‘á»•i vá» bÃ¡c sÄ© khÃ¡m cho lá»‹ch háº¹n cá»§a báº¡n.</p>

      <div class="warning-box">
        <strong>Thay Ä‘á»•i:</strong> BÃ¡c sÄ© khÃ¡m cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c chuyá»ƒn
      </div>

      <div class="info-box">
        <div class="info-row">
          <strong>MÃ£ lá»‹ch háº¹n:</strong> #${data.appointmentId}
        </div>
        <div class="info-row">
          <strong>BÃ¡c sÄ© cÅ©:</strong> <del style="color: #999;">${data.oldDoctorName}</del>
        </div>
        <div class="info-row">
          <strong>BÃ¡c sÄ© má»›i:</strong> <span style="color: #28a745;">${data.newDoctorName}</span>
        </div>
        <div class="info-row">
          <strong>ChuyÃªn khoa:</strong> ${data.newDoctorSpecialty}
        </div>
        <div class="info-row">
          <strong>NgÃ y khÃ¡m:</strong> ${formatDate(data.appointmentDate)}
        </div>
        <div class="info-row">
          <strong>Ca khÃ¡m:</strong> ${data.shiftName}
        </div>
        <div class="info-row">
          <strong>Sá»‘ thá»© tá»±:</strong> ${data.slotNumber}
        </div>
        ${
          data.reason
            ? `<div class="info-row">
          <strong>LÃ½ do:</strong> ${data.reason}
        </div>`
            : ""
        }
      </div>

      <div class="success-box">
        <p style="margin: 0;"><strong>Lá»‹ch khÃ¡m cá»§a báº¡n váº«n Ä‘Æ°á»£c giá»¯ nguyÃªn</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Chá»‰ cÃ³ bÃ¡c sÄ© khÃ¡m thay Ä‘á»•i, cÃ¡c thÃ´ng tin khÃ¡c khÃ´ng Ä‘á»•i.</p>
      </div>

      <p><strong>BÃ¡c sÄ© má»›i cÃ¹ng chuyÃªn khoa</strong> vÃ  sáº½ Ä‘áº£m báº£o cháº¥t lÆ°á»£ng khÃ¡m chá»¯a bá»‡nh tá»‘t nháº¥t cho báº¡n.</p>

      <p>Náº¿u báº¡n cÃ³ báº¥t ká»³ tháº¯c máº¯c nÃ o, vui lÃ²ng liÃªn há»‡ vá»›i chÃºng tÃ´i.</p>

      <p>Xin cáº£m Æ¡n sá»± thÃ´ng cáº£m cá»§a báº¡n!</p>
    </div>
  `;

  return baseTemplate(content);
}

/**
 * Export táº¥t cáº£ templates
 */
/**
 * Template: Thông báo đổi lịch khám
 */
export function appointmentRescheduledTemplate(data: {
  patientName: string;
  oldDate: string;
  newDate: string;
  oldShiftName: string;
  newShiftName: string;
  oldDoctorName: string;
  newDoctorName: string;
  appointmentId: number;
}): string {
  const sameDoctor = data.oldDoctorName === data.newDoctorName;

  const content = `
    <div class="header">
      <h1>Lịch khám của bạn đã được thay đổi</h1>
    </div>
    <div class="content">
      <p>Xin chào <strong>${data.patientName}</strong>,</p>
      <p>Lịch khám của bạn đã được cập nhật. Vui lòng kiểm tra thông tin mới bên dưới.</p>

      <div class="warning-box">
        <strong>Thông tin cũ</strong>
        <div class="info-row"><strong>Mã lịch hẹn:</strong> #${data.appointmentId}</div>
        <div class="info-row"><strong>Ngày:</strong> ${formatDate(data.oldDate)}</div>
        <div class="info-row"><strong>Ca khám:</strong> ${data.oldShiftName}</div>
        <div class="info-row"><strong>Bác sĩ:</strong> ${data.oldDoctorName}</div>
      </div>

      <div class="success-box">
        <strong>Thông tin mới</strong>
        <div class="info-row"><strong>Mã lịch hẹn:</strong> #${data.appointmentId}</div>
        <div class="info-row"><strong>Ngày:</strong> ${formatDate(data.newDate)}</div>
        <div class="info-row"><strong>Ca khám:</strong> ${data.newShiftName}</div>
        <div class="info-row"><strong>Bác sĩ:</strong> ${data.newDoctorName}</div>
      </div>

      ${
        sameDoctor
          ? `<p>Bác sĩ khám giữ nguyên, chỉ thay đổi thời gian/ca khám.</p>`
          : `<p>Bác sĩ khám đã được đổi để đảm bảo lịch trình phù hợp.</p>`
      }

      <p>Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ quầy lễ tân.</p>
    </div>
  `;

  return baseTemplate(content);
}
export const emailTemplates = {
  appointmentRescheduled: appointmentRescheduledTemplate,
  appointmentConfirmation: appointmentConfirmationTemplate,
  appointmentCancellation: appointmentCancellationTemplate,
  doctorChanged: doctorChangedTemplate,
};



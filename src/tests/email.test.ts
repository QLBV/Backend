


import dotenv from "dotenv";
dotenv.config();

import { emailService, sendEmail } from "../services/email.service";
import { emailTemplates } from "../templates/emailTemplates";


async function testEmailConnection() {
  console.log("\n=== TEST 1: Kiểm tra kết nối Email Server ===");
  try {
    const isConnected = await emailService.verifyConnection();
    if (isConnected) {
      console.log(" Kết nối email server thành công!");
      return true;
    } else {
      console.log(" Không thể kết nối email server");
      return false;
    }
  } catch (error) {
    console.error(" Lỗi khi kiểm tra kết nối:", error);
    return false;
  }
}


async function testSimpleEmail() {
  console.log("\n=== TEST 2: Gửi email đơn giản ===");
  try {
    const result = await sendEmail({
      to: process.env.EMAIL_USER || "test@example.com", 
      subject: "Test Email - Hệ thống Phòng khám",
      html: `
        <h1>Email Test</h1>
        <p>Đây là email test từ hệ thống Healthcare Management System.</p>
        <p>Thời gian: ${new Date().toLocaleString("vi-VN")}</p>
        <p>Nếu bạn nhận được email này, nghĩa là hệ thống email đang hoạt động tốt!</p>
      `,
    });

    if (result) {
      console.log(" Gửi email đơn giản thành công!");
      return true;
    } else {
      console.log(" Gửi email thất bại");
      return false;
    }
  } catch (error) {
    console.error(" Lỗi khi gửi email:", error);
    return false;
  }
}


async function testAppointmentConfirmationEmail() {
  console.log("\n=== TEST 3: Gửi email xác nhận lịch khám ===");
  try {
    const appointmentData = {
      patientName: "Nguyễn Văn A",
      doctorName: "BS. Trần Thị B",
      doctorSpecialty: "Tim mạch",
      appointmentDate: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(), 
      shiftName: "Sáng (8:00 - 12:00)",
      slotNumber: 5,
      appointmentId: 12345,
    };

    const html = emailTemplates.appointmentConfirmation(appointmentData);

    const result = await sendEmail({
      to: process.env.EMAIL_USER || "test@example.com",
      subject: "Xác nhận lịch khám - Hệ thống Phòng khám",
      html: html,
    });

    if (result) {
      console.log(" Gửi email xác nhận lịch khám thành công!");
      return true;
    } else {
      console.log(" Gửi email xác nhận lịch khám thất bại");
      return false;
    }
  } catch (error) {
    console.error(" Lỗi khi gửi email xác nhận lịch khám:", error);
    return false;
  }
}


async function testAppointmentCancellationEmail() {
  console.log("\n=== TEST 4: Gửi email thông báo hủy lịch khám ===");
  try {
    const cancellationData = {
      patientName: "Nguyễn Văn A",
      doctorName: "BS. Trần Thị B",
      appointmentDate: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
      shiftName: "Sáng (8:00 - 12:00)",
      reason: "Bác sĩ có việc đột xuất",
      appointmentId: 12345,
    };

    const html = emailTemplates.appointmentCancellation(cancellationData);

    const result = await sendEmail({
      to: process.env.EMAIL_USER || "test@example.com",
      subject: "Thông báo hủy lịch khám - Hệ thống Phòng khám",
      html: html,
    });

    if (result) {
      console.log(" Gửi email thông báo hủy lịch khám thành công!");
      return true;
    } else {
      console.log(" Gửi email thông báo hủy lịch khám thất bại");
      return false;
    }
  } catch (error) {
    console.error(" Lỗi khi gửi email thông báo hủy lịch khám:", error);
    return false;
  }
}


async function testDoctorChangedEmail() {
  console.log("\n=== TEST 5: Gửi email thông báo thay đổi bác sĩ ===");
  try {
    const doctorChangedData = {
      patientName: "Nguyễn Văn A",
      oldDoctorName: "BS. Trần Thị B",
      newDoctorName: "BS. Lê Văn C",
      newDoctorSpecialty: "Tim mạch",
      appointmentDate: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
      shiftName: "Sáng (8:00 - 12:00)",
      slotNumber: 5,
      reason: "Bác sĩ cũ có việc đột xuất",
      appointmentId: 12345,
    };

    const html = emailTemplates.doctorChanged(doctorChangedData);

    const result = await sendEmail({
      to: process.env.EMAIL_USER || "test@example.com",
      subject: "Thông báo thay đổi bác sĩ - Hệ thống Phòng khám",
      html: html,
    });

    if (result) {
      console.log(" Gửi email thông báo thay đổi bác sĩ thành công!");
      return true;
    } else {
      console.log(" Gửi email thông báo thay đổi bác sĩ thất bại");
      return false;
    }
  } catch (error) {
    console.error(" Lỗi khi gửi email thông báo thay đổi bác sĩ:", error);
    return false;
  }
}


async function runAllTests() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║       TEST HỆ THỐNG GỬI EMAIL - EMAIL SERVICE       ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log(`\n Email nhận: ${process.env.EMAIL_USER}`);
  console.log(` Thời gian test: ${new Date().toLocaleString("vi-VN")}\n`);

  const results = {
    connection: false,
    simpleEmail: false,
    appointmentConfirmation: false,
    appointmentCancellation: false,
    doctorChanged: false,
  };

  
  results.connection = await testEmailConnection();

  
  if (results.connection) {
    
    await delay(2000);
    results.simpleEmail = await testSimpleEmail();

    await delay(2000);
    results.appointmentConfirmation = await testAppointmentConfirmationEmail();

    await delay(2000);
    results.appointmentCancellation = await testAppointmentCancellationEmail();

    await delay(2000);
    results.doctorChanged = await testDoctorChangedEmail();
  }

  
  console.log("\n" + "=".repeat(60));
  console.log(" TỔNG KẾT KẾT QUẢ TEST");
  console.log("=".repeat(60));
  console.log(
    ` Kết nối Email Server:              ${results.connection ? " PASS" : " FAIL"}`
  );
  console.log(
    ` Gửi email đơn giản:                 ${results.simpleEmail ? " PASS" : " FAIL"}`
  );
  console.log(
    ` Email xác nhận lịch khám:          ${results.appointmentConfirmation ? " PASS" : " FAIL"}`
  );
  console.log(
    ` Email thông báo hủy lịch:          ${results.appointmentCancellation ? " PASS" : " FAIL"}`
  );
  console.log(
    ` Email thông báo thay đổi bác sĩ:   ${results.doctorChanged ? " PASS" : " FAIL"}`
  );
  console.log("=".repeat(60));

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter((r) => r === true).length;
  console.log(`\n Kết quả: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log("\n TẤT CẢ CÁC TEST ĐỀU THÀNH CÔNG!");
  } else {
    console.log(
      "\n️  Một số test thất bại. Vui lòng kiểm tra lại cấu hình email."
    );
  }

  console.log("\n Lưu ý:");
  console.log("   - Kiểm tra email trong hộp thư đến hoặc spam");
  console.log(
    "   - Nếu dùng Gmail, đảm bảo đã bật 'App Password' trong cài đặt bảo mật"
  );
  console.log(
    "   - Kiểm tra các biến môi trường: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD"
  );
}


function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log("\n Hoàn thành tất cả các test!\n");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n Lỗi khi chạy test:", error);
      process.exit(1);
    });
}


export {
  testEmailConnection,
  testSimpleEmail,
  testAppointmentConfirmationEmail,
  testAppointmentCancellationEmail,
  testDoctorChangedEmail,
  runAllTests,
};

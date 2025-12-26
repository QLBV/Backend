-- ===============================================
-- HEALTHCARE MANAGEMENT SYSTEM - SAMPLE DATA
-- ===============================================
-- Version: 2.0.0 (Fixed schema)
-- Date: 2025-12-26
-- Purpose: Insert sample data for testing
-- ===============================================

USE healthcare_db;

-- Xóa dữ liệu cũ (nếu có)
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE visits;
TRUNCATE TABLE appointments;
TRUNCATE TABLE notifications;
TRUNCATE TABLE doctor_shifts;
TRUNCATE TABLE doctors;
TRUNCATE TABLE patient_profiles;
TRUNCATE TABLE patients;
TRUNCATE TABLE shifts;
TRUNCATE TABLE specialties;
TRUNCATE TABLE users;
TRUNCATE TABLE roles;

SET FOREIGN_KEY_CHECKS = 1;

-- ===============================================
-- 1. ROLES
-- ===============================================
INSERT INTO roles (id, name, description, createdAt, updatedAt) VALUES
(1, 'ADMIN', 'Quản trị viên hệ thống', NOW(), NOW()),
(2, 'RECEPTIONIST', 'Nhân viên lễ tân', NOW(), NOW()),
(3, 'PATIENT', 'Bệnh nhân', NOW(), NOW()),
(4, 'DOCTOR', 'Bác sĩ', NOW(), NOW());

-- ===============================================
-- 2. USERS (Admin, Receptionist, Patients, Doctors)
-- ===============================================
-- Password cho tất cả: "password123" (bcrypt hashed)
INSERT INTO users (id, email, password, fullName, avatar, roleId, isActive, createdAt, updatedAt) VALUES
-- Admin (roleId = 1)
(1, 'admin@example.com', '$2b$10$kYidcUT81h/WgEIa64jMrOzUl4c5fwQNVEywnVApgKQgiTNv9fhki', 'Nguyễn Văn Admin', NULL, 1, 1, NOW(), NOW()),

-- Receptionist (roleId = 2)
(2, 'receptionist@example.com', '$2b$10$kYidcUT81h/WgEIa64jMrOzUl4c5fwQNVEywnVApgKQgiTNv9fhki', 'Trần Thị Lễ Tân', NULL, 2, 1, NOW(), NOW()),

-- Patients (roleId = 3) - có userId để link
(3, 'patient1@example.com', '$2b$10$kYidcUT81h/WgEIa64jMrOzUl4c5fwQNVEywnVApgKQgiTNv9fhki', 'Lê Văn Bệnh Nhân 1', NULL, 3, 1, NOW(), NOW()),
(4, 'patient2@example.com', '$2b$10$kYidcUT81h/WgEIa64jMrOzUl4c5fwQNVEywnVApgKQgiTNv9fhki', 'Phạm Thị Bệnh Nhân 2', NULL, 3, 1, NOW(), NOW()),
(5, 'patient3@example.com', '$2b$10$kYidcUT81h/WgEIa64jMrOzUl4c5fwQNVEywnVApgKQgiTNv9fhki', 'Hoàng Văn Bệnh Nhân 3', NULL, 3, 1, NOW(), NOW()),
(6, 'patient4@example.com', '$2b$10$kYidcUT81h/WgEIa64jMrOzUl4c5fwQNVEywnVApgKQgiTNv9fhki', 'Vũ Thị Bệnh Nhân 4', NULL, 3, 1, NOW(), NOW()),
(7, 'patient5@example.com', '$2b$10$kYidcUT81h/WgEIa64jMrOzUl4c5fwQNVEywnVApgKQgiTNv9fhki', 'Đỗ Văn Bệnh Nhân 5', NULL, 3, 1, NOW(), NOW()),

-- Doctors (roleId = 4)
(8, 'doctor1@example.com', '$2b$10$kYidcUT81h/WgEIa64jMrOzUl4c5fwQNVEywnVApgKQgiTNv9fhki', 'BS. Nguyễn Văn Tâm', NULL, 4, 1, NOW(), NOW()),
(9, 'doctor2@example.com', '$2b$10$kYidcUT81h/WgEIa64jMrOzUl4c5fwQNVEywnVApgKQgiTNv9fhki', 'BS. Trần Thị Hương', NULL, 4, 1, NOW(), NOW()),
(10, 'doctor3@example.com', '$2b$10$kYidcUT81h/WgEIa64jMrOzUl4c5fwQNVEywnVApgKQgiTNv9fhki', 'BS. Lê Minh Đức', NULL, 4, 1, NOW(), NOW()),
(11, 'doctor4@example.com', '$2b$10$kYidcUT81h/WgEIa64jMrOzUl4c5fwQNVEywnVApgKQgiTNv9fhki', 'BS. Phạm Thu Lan', NULL, 4, 1, NOW(), NOW()),
(12, 'doctor5@example.com', '$2b$10$kYidcUT81h/WgEIa64jMrOzUl4c5fwQNVEywnVApgKQgiTNv9fhki', 'BS. Hoàng Quốc Bảo', NULL, 4, 1, NOW(), NOW()),
(13, 'doctor6@example.com', '$2b$10$kYidcUT81h/WgEIa64jMrOzUl4c5fwQNVEywnVApgKQgiTNv9fhki', 'BS. Vũ Thị Mai', NULL, 4, 1, NOW(), NOW());

-- ===============================================
-- 3. SPECIALTIES (Chuyên khoa)
-- ===============================================
INSERT INTO specialties (id, name, description, createdAt, updatedAt) VALUES
(1, 'Nội khoa', 'Chuyên khoa điều trị các bệnh lý nội tạng', NOW(), NOW()),
(2, 'Ngoại khoa', 'Chuyên khoa phẫu thuật', NOW(), NOW()),
(3, 'Sản phụ khoa', 'Chuyên khoa phụ nữ và thai sản', NOW(), NOW()),
(4, 'Nhi khoa', 'Chuyên khoa trẻ em', NOW(), NOW()),
(5, 'Tim mạch', 'Chuyên khoa tim mạch và huyết áp', NOW(), NOW()),
(6, 'Da liễu', 'Chuyên khoa da liễu và thẩm mỹ', NOW(), NOW());

-- ===============================================
-- 4. PATIENTS (Chi tiết bệnh nhân)
-- ===============================================
-- Schema: id, patientCode, fullName, gender, dateOfBirth, avatar, cccd, userId, isActive
INSERT INTO patients (id, patientCode, fullName, gender, dateOfBirth, avatar, cccd, userId, isActive, createdAt, updatedAt) VALUES
(1, 'BN000001', 'Lê Văn Bệnh Nhân 1', 'MALE', '1990-05-15', NULL, '001234567890', 3, 1, NOW(), NOW()),
(2, 'BN000002', 'Phạm Thị Bệnh Nhân 2', 'FEMALE', '1985-08-22', NULL, '001234567891', 4, 1, NOW(), NOW()),
(3, 'BN000003', 'Hoàng Văn Bệnh Nhân 3', 'MALE', '1995-03-10', NULL, '001234567892', 5, 1, NOW(), NOW()),
(4, 'BN000004', 'Vũ Thị Bệnh Nhân 4', 'FEMALE', '1988-12-05', NULL, '001234567893', 6, 1, NOW(), NOW()),
(5, 'BN000005', 'Đỗ Văn Bệnh Nhân 5', 'MALE', '1992-07-18', NULL, '001234567894', 7, 1, NOW(), NOW());

-- ===============================================
-- 5. PATIENT_PROFILES (Thông tin liên hệ bệnh nhân)
-- ===============================================
-- Schema: id, patientId, type, value, ward, city, isPrimary
INSERT INTO patient_profiles (id, patient_id, type, value, ward, city, is_primary, created_at, updated_at) VALUES
-- Patient 1
(1, 1, 'phone', '0903456789', NULL, NULL, 1, NOW(), NOW()),
(2, 1, 'email', 'patient1@example.com', NULL, NULL, 1, NOW(), NOW()),
(3, 1, 'address', '123 Đường Láng', 'Đống Đa', 'Hà Nội', 1, NOW(), NOW()),

-- Patient 2
(4, 2, 'phone', '0904567890', NULL, NULL, 1, NOW(), NOW()),
(5, 2, 'email', 'patient2@example.com', NULL, NULL, 1, NOW(), NOW()),
(6, 2, 'address', '456 Nguyễn Trãi', 'Quận 1', 'Hồ Chí Minh', 1, NOW(), NOW()),

-- Patient 3
(7, 3, 'phone', '0905678901', NULL, NULL, 1, NOW(), NOW()),
(8, 3, 'address', '789 Trần Phú', 'Hải Châu', 'Đà Nẵng', 1, NOW(), NOW()),

-- Patient 4
(9, 4, 'phone', '0906789012', NULL, NULL, 1, NOW(), NOW()),
(10, 4, 'address', '321 Điện Biên Phủ', 'Ngô Quyền', 'Hải Phòng', 1, NOW(), NOW()),

-- Patient 5
(11, 5, 'phone', '0907890123', NULL, NULL, 1, NOW(), NOW()),
(12, 5, 'address', '654 Trần Hưng Đạo', 'Ninh Kiều', 'Cần Thơ', 1, NOW(), NOW());

-- ===============================================
-- 6. DOCTORS (Chi tiết bác sĩ)
-- ===============================================
INSERT INTO doctors (id, doctorCode, userId, specialtyId, position, degree, description, createdAt, updatedAt) VALUES
(1, 'BS000001', 8, 5, 'Bác sĩ', 'Thạc sĩ', 'Chuyên gia tim mạch với 10 năm kinh nghiệm', NOW(), NOW()),
(2, 'BS000002', 9, 1, 'Phó khoa', 'Tiến sĩ', 'Chuyên gia nội khoa, từng công tác tại bệnh viện Bạch Mai', NOW(), NOW()),
(3, 'BS000003', 10, 4, 'Bác sĩ', 'Bác sĩ', 'Bác sĩ nhi khoa với 5 năm kinh nghiệm', NOW(), NOW()),
(4, 'BS000004', 11, 3, 'Trưởng khoa', 'Tiến sĩ', 'Chuyên gia sản phụ khoa hàng đầu', NOW(), NOW()),
(5, 'BS000005', 12, 5, 'Bác sĩ', 'Thạc sĩ', 'Chuyên điều trị bệnh tim mạch', NOW(), NOW()),
(6, 'BS000006', 13, 6, 'Bác sĩ', 'Bác sĩ', 'Chuyên khoa da liễu và thẩm mỹ', NOW(), NOW());

-- ===============================================
-- 7. SHIFTS (Ca làm việc)
-- ===============================================
INSERT INTO shifts (id, name, startTime, endTime, createdAt, updatedAt) VALUES
(1, 'Sáng', '07:00', '11:00', NOW(), NOW()),
(2, 'Chiều', '13:00', '17:00', NOW(), NOW()),
(3, 'Tối', '18:00', '21:00', NOW(), NOW());

-- ===============================================
-- 8. DOCTOR_SHIFTS (Lịch trực của bác sĩ)
-- ===============================================
-- Lịch trực cho tuần này (26-30/12/2025)
INSERT INTO doctor_shifts (id, doctorId, shiftId, workDate, status, replacedBy, cancelReason, createdAt, updatedAt) VALUES
-- Ngày 26/12/2025 (Thứ Hai)
(1, 1, 1, '2025-12-26', 'ACTIVE', NULL, NULL, NOW(), NOW()),  -- BS Tim mạch - Ca Sáng
(2, 2, 1, '2025-12-26', 'ACTIVE', NULL, NULL, NOW(), NOW()),  -- BS Nội khoa - Ca Sáng
(3, 3, 2, '2025-12-26', 'ACTIVE', NULL, NULL, NOW(), NOW()),  -- BS Nhi khoa - Ca Chiều
(4, 4, 2, '2025-12-26', 'ACTIVE', NULL, NULL, NOW(), NOW()),  -- BS Sản - Ca Chiều
(5, 5, 3, '2025-12-26', 'ACTIVE', NULL, NULL, NOW(), NOW()),  -- BS Tim mạch - Ca Tối
(6, 6, 3, '2025-12-26', 'ACTIVE', NULL, NULL, NOW(), NOW()),  -- BS Da liễu - Ca Tối

-- Ngày 27/12/2025 (Thứ Ba)
(7, 1, 1, '2025-12-27', 'ACTIVE', NULL, NULL, NOW(), NOW()),
(8, 2, 1, '2025-12-27', 'ACTIVE', NULL, NULL, NOW(), NOW()),
(9, 3, 2, '2025-12-27', 'ACTIVE', NULL, NULL, NOW(), NOW()),
(10, 4, 2, '2025-12-27', 'ACTIVE', NULL, NULL, NOW(), NOW()),
(11, 5, 3, '2025-12-27', 'ACTIVE', NULL, NULL, NOW(), NOW()),

-- Ngày 28/12/2025 (Thứ Tư)
(12, 1, 1, '2025-12-28', 'ACTIVE', NULL, NULL, NOW(), NOW()),
(13, 2, 1, '2025-12-28', 'ACTIVE', NULL, NULL, NOW(), NOW()),
(14, 3, 2, '2025-12-28', 'ACTIVE', NULL, NULL, NOW(), NOW()),
(15, 5, 2, '2025-12-28', 'ACTIVE', NULL, NULL, NOW(), NOW()), -- BS Tim mạch thêm ca Chiều

-- Ngày 29/12/2025 (Thứ Năm)
(16, 2, 1, '2025-12-29', 'ACTIVE', NULL, NULL, NOW(), NOW()),
(17, 3, 1, '2025-12-29', 'ACTIVE', NULL, NULL, NOW(), NOW()),
(18, 4, 2, '2025-12-29', 'ACTIVE', NULL, NULL, NOW(), NOW()),
(19, 6, 2, '2025-12-29', 'ACTIVE', NULL, NULL, NOW(), NOW()),

-- Ngày 30/12/2025 (Thứ Sáu)
(20, 1, 1, '2025-12-30', 'ACTIVE', NULL, NULL, NOW(), NOW()),
(21, 2, 1, '2025-12-30', 'ACTIVE', NULL, NULL, NOW(), NOW()),
(22, 3, 2, '2025-12-30', 'ACTIVE', NULL, NULL, NOW(), NOW()),
(23, 5, 2, '2025-12-30', 'ACTIVE', NULL, NULL, NOW(), NOW());

-- ===============================================
-- 9. APPOINTMENTS (Lịch hẹn mẫu)
-- ===============================================
-- Lịch hẹn cho ngày 26/12/2025
INSERT INTO appointments (id, patientId, doctorId, shiftId, date, slotNumber, bookingType, bookedBy, symptomInitial, status, createdAt, updatedAt) VALUES
-- Ca sáng 26/12
(1, 1, 1, 1, '2025-12-26', 1, 'ONLINE', 'PATIENT', 'Đau ngực, khó thở', 'WAITING', NOW(), NOW()),
(2, 2, 1, 1, '2025-12-26', 2, 'ONLINE', 'PATIENT', 'Tim đập nhanh', 'WAITING', NOW(), NOW()),
(3, 3, 2, 1, '2025-12-26', 1, 'OFFLINE', 'RECEPTIONIST', 'Đau bụng, ợ nóng', 'WAITING', NOW(), NOW()),
(4, 4, 2, 1, '2025-12-26', 2, 'ONLINE', 'PATIENT', 'Tiêu chảy', 'WAITING', NOW(), NOW()),

-- Ca chiều 26/12
(5, 5, 3, 2, '2025-12-26', 1, 'ONLINE', 'PATIENT', 'Trẻ sốt cao', 'WAITING', NOW(), NOW()),
(6, 1, 3, 2, '2025-12-26', 2, 'ONLINE', 'PATIENT', 'Trẻ ho nhiều', 'WAITING', NOW(), NOW()),
(7, 2, 4, 2, '2025-12-26', 1, 'OFFLINE', 'RECEPTIONIST', 'Khám thai định kỳ', 'WAITING', NOW(), NOW()),

-- Ca tối 26/12
(8, 3, 5, 3, '2025-12-26', 1, 'ONLINE', 'PATIENT', 'Huyết áp cao', 'WAITING', NOW(), NOW()),
(9, 4, 6, 3, '2025-12-26', 1, 'ONLINE', 'PATIENT', 'Mụn trứng cá', 'WAITING', NOW(), NOW()),

-- Lịch hẹn cho ngày 27/12/2025
(10, 1, 1, 1, '2025-12-27', 1, 'ONLINE', 'PATIENT', 'Tái khám tim mạch', 'WAITING', NOW(), NOW()),
(11, 5, 2, 1, '2025-12-27', 1, 'ONLINE', 'PATIENT', 'Đau dạ dày', 'WAITING', NOW(), NOW()),
(12, 2, 3, 2, '2025-12-27', 1, 'OFFLINE', 'RECEPTIONIST', 'Trẻ tiêm phòng', 'WAITING', NOW(), NOW()),

-- Lịch đã check-in
(13, 3, 1, 1, '2025-12-27', 2, 'ONLINE', 'PATIENT', 'Khám tổng quát', 'CHECKED_IN', NOW(), NOW()),

-- Lịch đã hủy
(14, 4, 2, 1, '2025-12-27', 2, 'ONLINE', 'PATIENT', 'Khám định kỳ', 'CANCELLED', NOW(), NOW());

-- ===============================================
-- 10. NOTIFICATIONS (Thông báo mẫu)
-- ===============================================
INSERT INTO notifications (id, userId, type, title, message, relatedAppointmentId, isRead, emailSent, emailSentAt, createdAt, updatedAt) VALUES
-- Notifications cho Patient 1 (userId = 3)
(1, 3, 'APPOINTMENT_CREATED', 'Lịch khám mới được tạo',
 'Bạn có lịch khám với BS. Nguyễn Văn Tâm vào Sáng ngày 2025-12-26',
 1, 0, 1, NOW(), NOW(), NOW()),

(2, 3, 'APPOINTMENT_CREATED', 'Lịch khám mới được tạo',
 'Bạn có lịch khám với BS. Lê Minh Đức vào Chiều ngày 2025-12-26',
 6, 0, 1, NOW(), NOW(), NOW()),

(3, 3, 'APPOINTMENT_CREATED', 'Lịch khám mới được tạo',
 'Bạn có lịch khám với BS. Hoàng Quốc Bảo vào Tối ngày 2025-12-26',
 8, 1, 1, NOW(), NOW(), NOW()),

-- Notifications cho Patient 2 (userId = 4)
(4, 4, 'APPOINTMENT_CREATED', 'Lịch khám mới được tạo',
 'Bạn có lịch khám với BS. Nguyễn Văn Tâm vào Sáng ngày 2025-12-26',
 2, 1, 1, NOW(), NOW(), NOW()),

(5, 4, 'APPOINTMENT_CREATED', 'Lịch khám mới được tạo',
 'Bạn có lịch khám với BS. Trần Thị Hương vào Sáng ngày 2025-12-26',
 4, 0, 1, NOW(), NOW(), NOW()),

-- Notification hủy lịch
(6, 4, 'APPOINTMENT_CANCELLED', 'Lịch khám đã bị hủy',
 'Lịch khám với BS. Trần Thị Hương vào Sáng ngày 2025-12-27 đã bị hủy: Bệnh nhân hủy lịch',
 14, 0, 1, NOW(), NOW(), NOW());

-- ===============================================
-- 11. VISITS (Phiếu khám - cho appointments đã check-in)
-- ===============================================
-- Schema: id, appointmentId, patientId, doctorId, checkInTime, diagnosis, note, status
INSERT INTO visits (id, appointmentId, patientId, doctorId, checkInTime, diagnosis, note, status, createdAt, updatedAt) VALUES
(1, 13, 3, 1, NOW(), 'Viêm amidan cấp',
 'Kê đơn: Amoxicillin 500mg x 3 lần/ngày x 7 ngày, Paracetamol 500mg khi sốt. Tái khám sau 7 ngày nếu không đỡ.',
 'COMPLETED', NOW(), NOW());

-- ===============================================
-- VERIFY DATA
-- ===============================================
SELECT '=== SUMMARY ===' as '';
SELECT COUNT(*) as total_roles FROM roles;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_patients FROM patients;
SELECT COUNT(*) as total_patient_profiles FROM patient_profiles;
SELECT COUNT(*) as total_doctors FROM doctors;
SELECT COUNT(*) as total_specialties FROM specialties;
SELECT COUNT(*) as total_shifts FROM shifts;
SELECT COUNT(*) as total_doctor_shifts FROM doctor_shifts;
SELECT COUNT(*) as total_appointments FROM appointments;
SELECT COUNT(*) as total_notifications FROM notifications;
SELECT COUNT(*) as total_visits FROM visits;

SELECT '=== APPOINTMENTS BY STATUS ===' as '';
SELECT status, COUNT(*) as count FROM appointments GROUP BY status;

SELECT '=== DOCTORS BY SPECIALTY ===' as '';
SELECT s.name as specialty, COUNT(d.id) as doctor_count
FROM specialties s
LEFT JOIN doctors d ON s.id = d.specialtyId
GROUP BY s.id, s.name;

SELECT '=== PATIENTS WITH PROFILES ===' as '';
SELECT p.patientCode, p.fullName, COUNT(pp.id) as profile_count
FROM patients p
LEFT JOIN patient_profiles pp ON p.id = pp.patient_id
GROUP BY p.id, p.patientCode, p.fullName;

SELECT '=== SAMPLE DONE ===' as '';

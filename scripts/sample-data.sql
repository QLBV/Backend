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

TRUNCATE TABLE prescription_details;
TRUNCATE TABLE prescriptions;
TRUNCATE TABLE medicine_exports;
TRUNCATE TABLE medicine_imports;
TRUNCATE TABLE medicines;
TRUNCATE TABLE disease_categories;
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
-- 11. DISEASE CATEGORIES (Loại bệnh - ICD-10)
-- ===============================================
INSERT INTO disease_categories (id, code, name, description, createdAt, updatedAt) VALUES
(1, 'J03', 'Viêm amidan cấp', 'Viêm amidan cấp tính', NOW(), NOW()),
(2, 'J06', 'Nhiễm trùng đường hô hấp trên', 'Nhiễm trùng đường hô hấp trên cấp tính', NOW(), NOW()),
(3, 'K29', 'Viêm dạ dày', 'Viêm dạ dày và tá tràng', NOW(), NOW()),
(4, 'I10', 'Tăng huyết áp', 'Tăng huyết áp nguyên phát', NOW(), NOW()),
(5, 'L70', 'Mụn trứng cá', 'Mụn trứng cá (Acne vulgaris)', NOW(), NOW()),
(6, 'Z34', 'Khám thai định kỳ', 'Khám thai cho thai kỳ bình thường', NOW(), NOW()),
(7, 'J20', 'Viêm phế quản cấp', 'Viêm phế quản cấp tính', NOW(), NOW()),
(8, 'A09', 'Tiêu chảy', 'Tiêu chảy và viêm dạ dày ruột', NOW(), NOW());

-- ===============================================
-- 12. MEDICINES (Thuốc trong kho)
-- ===============================================
INSERT INTO medicines (id, medicineCode, name, `group`, activeIngredient, manufacturer, unit, importPrice, salePrice, quantity, minStockLevel, expiryDate, description, status, createdAt, updatedAt) VALUES
-- Kháng sinh
(1, 'MED-000001', 'Amoxicillin 500mg', 'Kháng sinh', 'Amoxicillin', 'Công ty Dược phẩm Hà Nội', 'VIEN', 500, 1000, 5000, 500, '2026-12-31', 'Kháng sinh nhóm Penicillin, điều trị nhiễm khuẩn đường hô hấp', 'ACTIVE', NOW(), NOW()),
(2, 'MED-000002', 'Augmentin 625mg', 'Kháng sinh', 'Amoxicillin + Clavulanic acid', 'GSK Việt Nam', 'VIEN', 3000, 5000, 3000, 300, '2026-06-30', 'Kháng sinh phổ rộng, điều trị nhiễm khuẩn nặng', 'ACTIVE', NOW(), NOW()),

-- Giảm đau - Hạ sốt
(3, 'MED-000003', 'Paracetamol 500mg', 'Giảm đau - Hạ sốt', 'Paracetamol', 'Công ty Dược Hậu Giang', 'VIEN', 100, 200, 10000, 1000, '2027-03-31', 'Thuốc giảm đau, hạ sốt thông dụng', 'ACTIVE', NOW(), NOW()),
(4, 'MED-000004', 'Ibuprofen 400mg', 'Giảm đau - Chống viêm', 'Ibuprofen', 'Công ty Dược Sài Gòn', 'VIEN', 500, 800, 4000, 400, '2026-09-30', 'Thuốc giảm đau, chống viêm không steroid', 'ACTIVE', NOW(), NOW()),

-- Thuốc dạ dày
(5, 'MED-000005', 'Omeprazole 20mg', 'Thuốc dạ dày', 'Omeprazole', 'Teva Việt Nam', 'VIEN', 800, 1500, 3000, 300, '2026-08-31', 'Ức chế bơm proton, điều trị loét dạ dày', 'ACTIVE', NOW(), NOW()),
(6, 'MED-000006', 'Phosphalugel', 'Thuốc dạ dày', 'Aluminium phosphate', 'Pharmedic France', 'GOI', 2000, 3500, 2000, 200, '2026-12-31', 'Chống trào ngược dạ dày, trung hòa acid', 'ACTIVE', NOW(), NOW()),

-- Thuốc tim mạch
(7, 'MED-000007', 'Amlodipine 5mg', 'Thuốc tim mạch', 'Amlodipine', 'Pymepharco', 'VIEN', 300, 600, 5000, 500, '2027-06-30', 'Thuốc hạ huyết áp nhóm chẹn kênh canxi', 'ACTIVE', NOW(), NOW()),
(8, 'MED-000008', 'Bisoprolol 5mg', 'Thuốc tim mạch', 'Bisoprolol', 'Berlin Pharma', 'VIEN', 800, 1500, 3000, 300, '2026-10-31', 'Thuốc chẹn beta, điều trị tăng huyết áp', 'ACTIVE', NOW(), NOW()),

-- Vitamin
(9, 'MED-000009', 'Vitamin C 1000mg', 'Vitamin', 'Ascorbic acid', 'DHG Pharma', 'VIEN', 1000, 2000, 6000, 600, '2027-12-31', 'Bổ sung vitamin C, tăng sức đề kháng', 'ACTIVE', NOW(), NOW()),
(10, 'MED-000010', 'Vitamin B Complex', 'Vitamin', 'Vitamin B1, B6, B12', 'US Pharma', 'VIEN', 1500, 2500, 4000, 400, '2026-11-30', 'Bổ sung vitamin nhóm B', 'ACTIVE', NOW(), NOW()),

-- Thuốc ho
(11, 'MED-000011', 'Prospan 100ml', 'Thuốc ho', 'Hedera helix extract', 'Engelhard Germany', 'CHAI', 30000, 55000, 500, 50, '2026-07-31', 'Siro long đàm, trị ho có đờm', 'ACTIVE', NOW(), NOW()),
(12, 'MED-000012', 'Bisolvon 8mg', 'Thuốc ho', 'Bromhexine', 'Boehringer Vietnam', 'VIEN', 1200, 2000, 2000, 200, '2026-05-31', 'Thuốc long đàm', 'ACTIVE', NOW(), NOW()),

-- Thuốc ngoài da
(13, 'MED-000013', 'Gel trị mụn Acnes 25g', 'Thuốc ngoài da', 'Benzoyl peroxide', 'Rohto Việt Nam', 'TUYP', 25000, 45000, 1000, 100, '2026-04-30', 'Gel điều trị mụn trứng cá', 'ACTIVE', NOW(), NOW()),
(14, 'MED-000014', 'Dung dịch Betadine 100ml', 'Thuốc sát khuẩn', 'Povidone-iodine', 'Mundipharma', 'CHAI', 20000, 35000, 1500, 150, '2026-08-31', 'Dung dịch sát khuẩn vết thương', 'ACTIVE', NOW(), NOW()),

-- Thuốc tiêu chảy
(15, 'MED-000015', 'Smecta', 'Thuốc tiêu hóa', 'Diosmectite', 'Ipsen France', 'GOI', 3000, 5000, 3000, 300, '2026-09-30', 'Thuốc cầm tiêu chảy, hấp phụ độc tố', 'ACTIVE', NOW(), NOW());

-- ===============================================
-- 13. MEDICINE IMPORTS (Lịch sử nhập thuốc)
-- ===============================================
INSERT INTO medicine_imports (id, medicineId, quantity, importPrice, importDate, userId, createdAt, updatedAt) VALUES
-- Đợt nhập tháng 12/2025
(1, 1, 5000, 500, '2025-12-01', 1, NOW(), NOW()),  -- Amoxicillin
(2, 2, 3000, 3000, '2025-12-01', 1, NOW(), NOW()),  -- Augmentin
(3, 3, 10000, 100, '2025-12-01', 1, NOW(), NOW()),  -- Paracetamol
(4, 5, 3000, 800, '2025-12-05', 1, NOW(), NOW()),  -- Omeprazole
(5, 7, 5000, 300, '2025-12-05', 1, NOW(), NOW()),  -- Amlodipine
(6, 9, 6000, 1000, '2025-12-10', 1, NOW(), NOW()),  -- Vitamin C
(7, 11, 500, 30000, '2025-12-15', 1, NOW(), NOW()),  -- Prospan
(8, 13, 1000, 25000, '2025-12-20', 1, NOW(), NOW());  -- Gel trị mụn

-- ===============================================
-- 14. VISITS (Phiếu khám - có triệu chứng và loại bệnh)
-- ===============================================
INSERT INTO visits (id, appointmentId, patientId, doctorId, checkInTime, symptoms, diseaseCategoryId, diagnosis, note, status, createdAt, updatedAt) VALUES
-- Visit 1: Viêm amidan - ĐÃ KÊ ĐƠN
(1, 13, 3, 1, '2025-12-27 08:30:00', 'Đau họng, sốt 38.5°C, nuốt đau, mệt mỏi', 1,
 'Viêm amidan cấp độ 2',
 'Bệnh nhân có triệu chứng viêm amidan cấp, họng đỏ, amidan to. Kê đơn kháng sinh và thuốc hạ sốt. Khuyên nghỉ ngơi, uống nhiều nước. Tái khám sau 5-7 ngày.',
 'COMPLETED', '2025-12-27 08:30:00', NOW()),

-- Visit 2: Viêm dạ dày - ĐÃ KÊ ĐƠN
(2, 3, 3, 2, '2025-12-26 09:00:00', 'Đau bụng vùng thượng vị, ợ nóng, buồn nôn sau ăn', 3,
 'Viêm dạ dày cấp',
 'Triệu chứng viêm dạ dày điển hình. Kê thuốc ức chế acid, thuốc bảo vệ niêm mạc. Kiêng ăn cay, nóng, chua. Ăn nhiều bữa/ngày.',
 'COMPLETED', '2025-12-26 09:00:00', NOW()),

-- Visit 3: Tăng huyết áp - ĐÃ KÊ ĐƠN
(3, 8, 3, 5, '2025-12-26 19:00:00', 'Huyết áp 160/100 mmHg, đau đầu, chóng mặt, mệt', 4,
 'Tăng huyết áp độ 2',
 'Huyết áp cao cần điều trị. Kê thuốc hạ áp. Khuyên giảm muối, tập thể dục nhẹ, kiểm soát cân nặng. Theo dõi huyết áp tại nhà.',
 'COMPLETED', '2025-12-26 19:00:00', NOW()),

-- Visit 4: Mụn trứng cá - ĐÃ KÊ ĐƠN
(4, 9, 4, 6, '2025-12-26 19:30:00', 'Mụn nhiều ở mặt, mụn đầu đen, mụn viêm đỏ', 5,
 'Mụn trứng cá mức độ trung bình',
 'Mụn trứng cá do tăng tiết bã nhờn. Kê gel bôi ngoài, vitamin. Khuyên vệ sinh da sạch, không nặn mụn.',
 'COMPLETED', '2025-12-26 19:30:00', NOW()),

-- Visit 5: Tiêu chảy - ĐÃ KÊ ĐƠN
(5, 4, 4, 2, '2025-12-26 09:30:00', 'Tiêu chảy 5-6 lần/ngày, phân lỏng, đau bụng quặn', 8,
 'Tiêu chảy cấp do nhiễm khuẩn',
 'Tiêu chảy cấp, cần bù nước điện giải. Kê thuốc cầm tiêu chảy, men vi sinh. Kiêng ăn dầu mỡ, sữa.',
 'COMPLETED', '2025-12-26 09:30:00', NOW());

-- ===============================================
-- 15. PRESCRIPTIONS (Đơn thuốc - có mã tự động)
-- ===============================================
INSERT INTO prescriptions (id, prescriptionCode, visitId, doctorId, patientId, totalAmount, status, note, createdAt, updatedAt) VALUES
-- Đơn 1: Viêm amidan (Visit 1)
(1, 'RX-20251227-00001', 1, 1, 3, 32000, 'DRAFT',
 'Uống đủ liều kháng sinh, không tự ý ngưng thuốc. Tái khám nếu sau 3 ngày vẫn sốt cao.',
 '2025-12-27 08:45:00', NOW()),

-- Đơn 2: Viêm dạ dày (Visit 2)
(2, 'RX-20251226-00001', 2, 2, 3, 52500, 'DRAFT',
 'Uống thuốc trước ăn 30 phút. Ăn nhiều bữa, tránh căng thẳng.',
 '2025-12-26 09:15:00', NOW()),

-- Đơn 3: Tăng huyết áp (Visit 3) - ĐÃ KHÓA
(3, 'RX-20251226-00002', 3, 5, 3, 43200, 'LOCKED',
 'Uống thuốc mỗi sáng cùng giờ. Đo huyết áp hàng ngày, ghi chép lại.',
 '2025-12-26 19:15:00', NOW()),

-- Đơn 4: Mụn trứng cá (Visit 4)
(4, 'RX-20251226-00003', 4, 6, 4, 115000, 'DRAFT',
 'Bôi gel 2 lần/ngày sau khi rửa mặt sạch. Uống vitamin đều đặn.',
 '2025-12-26 19:45:00', NOW()),

-- Đơn 5: Tiêu chảy (Visit 5)
(5, 'RX-20251226-00004', 5, 2, 4, 40000, 'DRAFT',
 'Uống nhiều nước lọc. Ăn cháo loãng, tránh đồ ăn khó tiêu.',
 '2025-12-26 09:45:00', NOW());

-- ===============================================
-- 16. PRESCRIPTION DETAILS (Chi tiết đơn thuốc)
-- ===============================================
-- Đơn 1: Viêm amidan (Amoxicillin + Paracetamol)
INSERT INTO prescription_details (id, prescriptionId, medicineId, medicineName, quantity, unit, unitPrice, dosageMorning, dosageNoon, dosageAfternoon, dosageEvening, instruction, createdAt, updatedAt) VALUES
(1, 1, 1, 'Amoxicillin 500mg', 21, 'VIEN', 1000, 1, 1, 1, 0,
 'Uống sau ăn 30 phút. Uống đủ 7 ngày liên tục.', NOW(), NOW()),
(2, 1, 3, 'Paracetamol 500mg', 10, 'VIEN', 200, 1, 0, 1, 1,
 'Uống khi sốt trên 38.5°C. Cách mỗi lần uống ít nhất 4 giờ.', NOW(), NOW()),

-- Đơn 2: Viêm dạ dày (Omeprazole + Phosphalugel)
(3, 2, 5, 'Omeprazole 20mg', 30, 'VIEN', 1500, 1, 0, 0, 0,
 'Uống trước ăn sáng 30 phút.', NOW(), NOW()),
(4, 2, 6, 'Phosphalugel', 15, 'GOI', 3500, 1, 1, 1, 0,
 'Uống sau ăn 1 giờ hoặc khi đau.', NOW(), NOW()),

-- Đơn 3: Tăng huyết áp (Amlodipine + Bisoprolol)
(5, 3, 7, 'Amlodipine 5mg', 60, 'VIEN', 600, 1, 0, 0, 0,
 'Uống mỗi sáng cùng giờ.', NOW(), NOW()),
(6, 3, 8, 'Bisoprolol 5mg', 30, 'VIEN', 1500, 0.5, 0, 0, 0,
 'Uống nửa viên mỗi sáng.', NOW(), NOW()),

-- Đơn 4: Mụn trứng cá (Gel + Vitamin C)
(7, 4, 13, 'Gel trị mụn Acnes 25g', 2, 'TUYP', 45000, 0, 0, 0, 0,
 'Bôi lên vùng da có mụn, sáng và tối sau khi rửa mặt.', NOW(), NOW()),
(8, 4, 9, 'Vitamin C 1000mg', 30, 'VIEN', 2000, 1, 0, 0, 0,
 'Uống sau ăn sáng.', NOW(), NOW()),

-- Đơn 5: Tiêu chảy (Smecta)
(9, 5, 15, 'Smecta', 12, 'GOI', 5000, 1, 1, 1, 0,
 'Pha với nước, uống trước ăn 30 phút hoặc giữa các bữa ăn.', NOW(), NOW());

-- ===============================================
-- 17. MEDICINE EXPORTS (Lịch sử xuất thuốc - Audit trail)
-- ===============================================
INSERT INTO medicine_exports (id, medicineId, quantity, exportDate, userId, reason, createdAt, updatedAt) VALUES
-- Xuất cho đơn RX-20251227-00001 (Viêm amidan)
(1, 1, 21, '2025-12-27 08:45:00', 1, 'PRESCRIPTION_RX-20251227-00001', NOW(), NOW()),
(2, 3, 10, '2025-12-27 08:45:00', 1, 'PRESCRIPTION_RX-20251227-00001', NOW(), NOW()),

-- Xuất cho đơn RX-20251226-00001 (Viêm dạ dày)
(3, 5, 30, '2025-12-26 09:15:00', 2, 'PRESCRIPTION_RX-20251226-00001', NOW(), NOW()),
(4, 6, 15, '2025-12-26 09:15:00', 2, 'PRESCRIPTION_RX-20251226-00001', NOW(), NOW()),

-- Xuất cho đơn RX-20251226-00002 (Tăng huyết áp)
(5, 7, 60, '2025-12-26 19:15:00', 5, 'PRESCRIPTION_RX-20251226-00002', NOW(), NOW()),
(6, 8, 30, '2025-12-26 19:15:00', 5, 'PRESCRIPTION_RX-20251226-00002', NOW(), NOW()),

-- Xuất cho đơn RX-20251226-00003 (Mụn trứng cá)
(7, 13, 2, '2025-12-26 19:45:00', 6, 'PRESCRIPTION_RX-20251226-00003', NOW(), NOW()),
(8, 9, 30, '2025-12-26 19:45:00', 6, 'PRESCRIPTION_RX-20251226-00003', NOW(), NOW()),

-- Xuất cho đơn RX-20251226-00004 (Tiêu chảy)
(9, 15, 12, '2025-12-26 09:45:00', 2, 'PRESCRIPTION_RX-20251226-00004', NOW(), NOW());

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

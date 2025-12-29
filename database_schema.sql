-- =====================================================
-- CSDL HỆ THỐNG QUẢN LÝ PHÒNG KHÁM
-- =====================================================
-- Ngày tạo: 2025-12-29
-- Phiên bản: 2.0.0
-- =====================================================

-- Đặt charset và collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- =====================================================
-- 1. MODULE QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN
-- =====================================================

-- Bảng: roles (Vai trò)
CREATE TABLE `roles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Tên vai trò',
  `description` VARCHAR(255) DEFAULT NULL COMMENT 'Mô tả vai trò',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng vai trò người dùng';

-- Bảng: users (Người dùng)
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Email đăng nhập',
  `password` VARCHAR(255) DEFAULT NULL COMMENT 'Mật khẩu (nullable cho OAuth)',
  `fullName` VARCHAR(100) NOT NULL COMMENT 'Họ và tên',
  `roleId` INT UNSIGNED NOT NULL COMMENT 'ID vai trò',
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái hoạt động',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT 'Ảnh đại diện',
  `userCode` VARCHAR(50) DEFAULT NULL UNIQUE COMMENT 'Mã người dùng',
  `oauth2Provider` ENUM('GOOGLE') DEFAULT NULL COMMENT 'Nhà cung cấp OAuth2',
  `oauth2Id` VARCHAR(255) DEFAULT NULL COMMENT 'ID OAuth2',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_userCode_unique` (`userCode`),
  KEY `users_roleId_foreign` (`roleId`),
  CONSTRAINT `users_roleId_foreign` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng người dùng hệ thống';

-- Bảng: permissions (Quyền hạn)
CREATE TABLE `permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên quyền',
  `description` VARCHAR(255) DEFAULT NULL COMMENT 'Mô tả quyền',
  `module` VARCHAR(50) NOT NULL COMMENT 'Module chức năng',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_unique` (`name`),
  KEY `permissions_module_index` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng quyền hạn';

-- Bảng: role_permissions (Quyền của vai trò - Many-to-Many)
CREATE TABLE `role_permissions` (
  `roleId` INT UNSIGNED NOT NULL COMMENT 'ID vai trò',
  `permissionId` INT UNSIGNED NOT NULL COMMENT 'ID quyền',
  PRIMARY KEY (`roleId`, `permissionId`),
  KEY `role_permissions_permissionId_foreign` (`permissionId`),
  CONSTRAINT `role_permissions_roleId_foreign` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_permissions_permissionId_foreign` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng trung gian vai trò - quyền hạn';

-- =====================================================
-- 2. MODULE QUẢN LÝ BỆNH NHÂN
-- =====================================================

-- Bảng: patients (Bệnh nhân)
CREATE TABLE `patients` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patientCode` VARCHAR(20) DEFAULT NULL UNIQUE COMMENT 'Mã bệnh nhân',
  `fullName` VARCHAR(100) NOT NULL COMMENT 'Họ và tên',
  `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL COMMENT 'Giới tính',
  `dateOfBirth` DATE NOT NULL COMMENT 'Ngày sinh',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT 'Ảnh đại diện',
  `cccd` VARCHAR(20) DEFAULT NULL UNIQUE COMMENT 'Số CCCD',
  `userId` INT UNSIGNED DEFAULT NULL COMMENT 'ID tài khoản người dùng',
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái hoạt động',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patients_patientCode_unique` (`patientCode`),
  UNIQUE KEY `patients_cccd_unique` (`cccd`),
  KEY `patients_userId_foreign` (`userId`),
  CONSTRAINT `patients_userId_foreign` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng bệnh nhân';

-- Bảng: patient_profiles (Hồ sơ bệnh nhân - Email, Phone, Address)
CREATE TABLE `patient_profiles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_id` INT UNSIGNED NOT NULL COMMENT 'ID bệnh nhân',
  `type` ENUM('email', 'phone', 'address') NOT NULL COMMENT 'Loại thông tin',
  `value` VARCHAR(255) NOT NULL COMMENT 'Giá trị',
  `ward` VARCHAR(100) DEFAULT NULL COMMENT 'Phường/Xã',
  `city` VARCHAR(100) DEFAULT NULL COMMENT 'Thành phố',
  `is_primary` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Thông tin chính',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `patient_profiles_patient_id_foreign` (`patient_id`),
  KEY `patient_profiles_type_index` (`type`),
  CONSTRAINT `patient_profiles_patient_id_foreign` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng hồ sơ liên hệ bệnh nhân';

-- =====================================================
-- 3. MODULE QUẢN LÝ BÁC SĨ & CA LÀM VIỆC
-- =====================================================

-- Bảng: specialties (Chuyên khoa)
CREATE TABLE `specialties` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên chuyên khoa',
  `description` VARCHAR(255) DEFAULT NULL COMMENT 'Mô tả',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `specialties_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng chuyên khoa';

-- Bảng: doctors (Bác sĩ)
CREATE TABLE `doctors` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `doctorCode` VARCHAR(10) NOT NULL UNIQUE COMMENT 'Mã bác sĩ',
  `userId` INT UNSIGNED NOT NULL COMMENT 'ID người dùng',
  `specialtyId` INT UNSIGNED NOT NULL COMMENT 'ID chuyên khoa',
  `position` VARCHAR(100) DEFAULT NULL COMMENT 'Chức vụ',
  `degree` VARCHAR(100) DEFAULT NULL COMMENT 'Học vị',
  `description` VARCHAR(255) DEFAULT NULL COMMENT 'Mô tả',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `doctors_doctorCode_unique` (`doctorCode`),
  KEY `doctors_userId_foreign` (`userId`),
  KEY `doctors_specialtyId_foreign` (`specialtyId`),
  CONSTRAINT `doctors_userId_foreign` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `doctors_specialtyId_foreign` FOREIGN KEY (`specialtyId`) REFERENCES `specialties` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng bác sĩ';

-- Bảng: shifts (Ca làm việc)
CREATE TABLE `shifts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Tên ca làm việc',
  `startTime` VARCHAR(5) NOT NULL COMMENT 'Giờ bắt đầu (HH:mm)',
  `endTime` VARCHAR(5) NOT NULL COMMENT 'Giờ kết thúc (HH:mm)',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shifts_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng ca làm việc';

-- Bảng: doctor_shifts (Lịch làm việc bác sĩ)
CREATE TABLE `doctor_shifts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `doctorId` INT UNSIGNED NOT NULL COMMENT 'ID bác sĩ',
  `shiftId` INT UNSIGNED NOT NULL COMMENT 'ID ca làm việc',
  `workDate` VARCHAR(10) NOT NULL COMMENT 'Ngày làm việc (YYYY-MM-DD)',
  `status` ENUM('ACTIVE', 'CANCELLED', 'REPLACED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái',
  `replacedBy` INT UNSIGNED DEFAULT NULL COMMENT 'ID bác sĩ thay thế',
  `cancelReason` TEXT DEFAULT NULL COMMENT 'Lý do hủy',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `doctor_shifts_unique` (`doctorId`, `shiftId`, `workDate`),
  KEY `doctor_shifts_shiftId_foreign` (`shiftId`),
  KEY `doctor_shifts_replacedBy_foreign` (`replacedBy`),
  CONSTRAINT `doctor_shifts_doctorId_foreign` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `doctor_shifts_shiftId_foreign` FOREIGN KEY (`shiftId`) REFERENCES `shifts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `doctor_shifts_replacedBy_foreign` FOREIGN KEY (`replacedBy`) REFERENCES `doctors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng lịch làm việc bác sĩ';

-- =====================================================
-- 4. MODULE ĐẶT LỊCH & KHÁM BỆNH
-- =====================================================

-- Bảng: appointments (Lịch hẹn khám)
CREATE TABLE `appointments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patientId` INT UNSIGNED NOT NULL COMMENT 'ID bệnh nhân',
  `doctorId` INT UNSIGNED NOT NULL COMMENT 'ID bác sĩ',
  `shiftId` INT UNSIGNED NOT NULL COMMENT 'ID ca làm việc',
  `date` DATE NOT NULL COMMENT 'Ngày hẹn',
  `slotNumber` INT NOT NULL COMMENT 'Số thứ tự slot',
  `bookingType` ENUM('ONLINE', 'OFFLINE') NOT NULL COMMENT 'Loại đặt lịch',
  `bookedBy` ENUM('PATIENT', 'RECEPTIONIST') NOT NULL COMMENT 'Người đặt',
  `symptomInitial` TEXT DEFAULT NULL COMMENT 'Triệu chứng ban đầu',
  `status` ENUM('WAITING', 'CANCELLED', 'CHECKED_IN') NOT NULL DEFAULT 'WAITING' COMMENT 'Trạng thái',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `appointments_slot_unique` (`doctorId`, `shiftId`, `date`, `slotNumber`),
  KEY `appointments_patientId_foreign` (`patientId`),
  KEY `appointments_shiftId_foreign` (`shiftId`),
  KEY `appointments_status_index` (`status`),
  CONSTRAINT `appointments_patientId_foreign` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `appointments_doctorId_foreign` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `appointments_shiftId_foreign` FOREIGN KEY (`shiftId`) REFERENCES `shifts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng lịch hẹn khám bệnh';

-- Bảng: disease_categories (Danh mục bệnh)
CREATE TABLE `disease_categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã danh mục bệnh',
  `name` VARCHAR(200) NOT NULL COMMENT 'Tên danh mục bệnh',
  `description` TEXT DEFAULT NULL COMMENT 'Mô tả',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `disease_categories_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng danh mục bệnh';

-- Bảng: visits (Phiên khám bệnh)
CREATE TABLE `visits` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `appointmentId` INT UNSIGNED NOT NULL UNIQUE COMMENT 'ID lịch hẹn',
  `patientId` INT UNSIGNED NOT NULL COMMENT 'ID bệnh nhân',
  `doctorId` INT UNSIGNED NOT NULL COMMENT 'ID bác sĩ',
  `checkInTime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian check-in',
  `symptoms` TEXT DEFAULT NULL COMMENT 'Triệu chứng',
  `diseaseCategoryId` INT UNSIGNED DEFAULT NULL COMMENT 'ID danh mục bệnh',
  `diagnosis` TEXT DEFAULT NULL COMMENT 'Chẩn đoán',
  `note` TEXT DEFAULT NULL COMMENT 'Ghi chú',
  `status` ENUM('EXAMINING', 'COMPLETED') NOT NULL DEFAULT 'EXAMINING' COMMENT 'Trạng thái',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `visits_appointmentId_unique` (`appointmentId`),
  KEY `visits_patientId_foreign` (`patientId`),
  KEY `visits_doctorId_foreign` (`doctorId`),
  KEY `visits_diseaseCategoryId_foreign` (`diseaseCategoryId`),
  KEY `visits_status_index` (`status`),
  CONSTRAINT `visits_appointmentId_foreign` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `visits_patientId_foreign` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `visits_doctorId_foreign` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `visits_diseaseCategoryId_foreign` FOREIGN KEY (`diseaseCategoryId`) REFERENCES `disease_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng phiên khám bệnh';

-- =====================================================
-- 5. MODULE QUẢN LÝ THUỐC
-- =====================================================

-- Bảng: medicines (Thuốc)
CREATE TABLE `medicines` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `medicineCode` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã thuốc',
  `name` VARCHAR(200) NOT NULL COMMENT 'Tên thuốc',
  `group` VARCHAR(100) NOT NULL COMMENT 'Nhóm thuốc',
  `activeIngredient` VARCHAR(200) DEFAULT NULL COMMENT 'Hoạt chất',
  `manufacturer` VARCHAR(200) DEFAULT NULL COMMENT 'Nhà sản xuất',
  `unit` ENUM('VIEN', 'ML', 'HOP', 'CHAI', 'TUYP', 'GOI') NOT NULL DEFAULT 'VIEN' COMMENT 'Đơn vị tính',
  `importPrice` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Giá nhập',
  `salePrice` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Giá bán',
  `quantity` INT NOT NULL DEFAULT 0 COMMENT 'Số lượng tồn kho',
  `minStockLevel` INT NOT NULL DEFAULT 10 COMMENT 'Mức tồn kho tối thiểu',
  `expiryDate` DATETIME NOT NULL COMMENT 'Hạn sử dụng',
  `description` TEXT DEFAULT NULL COMMENT 'Mô tả',
  `status` ENUM('ACTIVE', 'EXPIRED', 'REMOVED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `medicines_medicineCode_unique` (`medicineCode`),
  KEY `medicines_status_index` (`status`),
  KEY `medicines_group_index` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng thuốc';

-- Bảng: medicine_imports (Phiếu nhập thuốc)
CREATE TABLE `medicine_imports` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `medicineId` INT UNSIGNED NOT NULL COMMENT 'ID thuốc',
  `quantity` INT NOT NULL COMMENT 'Số lượng nhập',
  `importPrice` DECIMAL(10,2) NOT NULL COMMENT 'Giá nhập',
  `importDate` DATETIME NOT NULL COMMENT 'Ngày nhập',
  `userId` INT UNSIGNED NOT NULL COMMENT 'ID người nhập',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `medicine_imports_medicineId_foreign` (`medicineId`),
  KEY `medicine_imports_userId_foreign` (`userId`),
  KEY `medicine_imports_importDate_index` (`importDate`),
  CONSTRAINT `medicine_imports_medicineId_foreign` FOREIGN KEY (`medicineId`) REFERENCES `medicines` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `medicine_imports_userId_foreign` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng phiếu nhập thuốc';

-- Bảng: medicine_exports (Phiếu xuất thuốc)
CREATE TABLE `medicine_exports` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `medicineId` INT UNSIGNED NOT NULL COMMENT 'ID thuốc',
  `quantity` INT NOT NULL COMMENT 'Số lượng xuất',
  `exportDate` DATETIME NOT NULL COMMENT 'Ngày xuất',
  `userId` INT UNSIGNED NOT NULL COMMENT 'ID người xuất',
  `reason` VARCHAR(255) NOT NULL COMMENT 'Lý do xuất',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `medicine_exports_medicineId_foreign` (`medicineId`),
  KEY `medicine_exports_userId_foreign` (`userId`),
  KEY `medicine_exports_exportDate_index` (`exportDate`),
  CONSTRAINT `medicine_exports_medicineId_foreign` FOREIGN KEY (`medicineId`) REFERENCES `medicines` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `medicine_exports_userId_foreign` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng phiếu xuất thuốc';

-- =====================================================
-- 6. MODULE KÊ ĐƠN THUỐC
-- =====================================================

-- Bảng: prescriptions (Đơn thuốc)
CREATE TABLE `prescriptions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `prescriptionCode` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã đơn thuốc',
  `visitId` INT UNSIGNED NOT NULL UNIQUE COMMENT 'ID phiên khám',
  `doctorId` INT UNSIGNED NOT NULL COMMENT 'ID bác sĩ',
  `patientId` INT UNSIGNED NOT NULL COMMENT 'ID bệnh nhân',
  `totalAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng tiền',
  `status` ENUM('DRAFT', 'LOCKED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT' COMMENT 'Trạng thái',
  `note` TEXT DEFAULT NULL COMMENT 'Ghi chú',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `prescriptions_prescriptionCode_unique` (`prescriptionCode`),
  UNIQUE KEY `prescriptions_visitId_unique` (`visitId`),
  KEY `prescriptions_doctorId_foreign` (`doctorId`),
  KEY `prescriptions_patientId_foreign` (`patientId`),
  KEY `prescriptions_status_index` (`status`),
  CONSTRAINT `prescriptions_visitId_foreign` FOREIGN KEY (`visitId`) REFERENCES `visits` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `prescriptions_doctorId_foreign` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `prescriptions_patientId_foreign` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng đơn thuốc';

-- Bảng: prescription_details (Chi tiết đơn thuốc)
CREATE TABLE `prescription_details` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `prescriptionId` INT UNSIGNED NOT NULL COMMENT 'ID đơn thuốc',
  `medicineId` INT UNSIGNED NOT NULL COMMENT 'ID thuốc',
  `medicineName` VARCHAR(200) NOT NULL COMMENT 'Tên thuốc',
  `quantity` INT NOT NULL COMMENT 'Số lượng',
  `unit` VARCHAR(50) NOT NULL COMMENT 'Đơn vị',
  `unitPrice` DECIMAL(10,2) NOT NULL COMMENT 'Đơn giá',
  `dosageMorning` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Liều sáng',
  `dosageNoon` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Liều trưa',
  `dosageAfternoon` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Liều chiều',
  `dosageEvening` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Liều tối',
  `instruction` TEXT DEFAULT NULL COMMENT 'Hướng dẫn sử dụng',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `prescription_details_prescriptionId_foreign` (`prescriptionId`),
  KEY `prescription_details_medicineId_foreign` (`medicineId`),
  CONSTRAINT `prescription_details_prescriptionId_foreign` FOREIGN KEY (`prescriptionId`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `prescription_details_medicineId_foreign` FOREIGN KEY (`medicineId`) REFERENCES `medicines` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng chi tiết đơn thuốc';

-- =====================================================
-- 7. MODULE HÓA ĐƠN & THANH TOÁN
-- =====================================================

-- Bảng: invoices (Hóa đơn)
CREATE TABLE `invoices` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoiceCode` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã hóa đơn',
  `visitId` INT UNSIGNED NOT NULL UNIQUE COMMENT 'ID phiên khám',
  `patientId` INT UNSIGNED NOT NULL COMMENT 'ID bệnh nhân',
  `doctorId` INT UNSIGNED NOT NULL COMMENT 'ID bác sĩ',
  `examinationFee` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Phí khám bệnh',
  `medicineTotalAmount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng tiền thuốc',
  `discount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Giảm giá',
  `totalAmount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng tiền',
  `paymentStatus` ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID') NOT NULL DEFAULT 'UNPAID' COMMENT 'Trạng thái thanh toán',
  `paidAmount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Số tiền đã thanh toán',
  `note` TEXT DEFAULT NULL COMMENT 'Ghi chú',
  `createdBy` INT UNSIGNED NOT NULL COMMENT 'Người tạo',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_invoiceCode_unique` (`invoiceCode`),
  UNIQUE KEY `invoices_visitId_unique` (`visitId`),
  KEY `invoices_patientId_foreign` (`patientId`),
  KEY `invoices_doctorId_foreign` (`doctorId`),
  KEY `invoices_createdBy_foreign` (`createdBy`),
  KEY `invoices_paymentStatus_index` (`paymentStatus`),
  CONSTRAINT `invoices_visitId_foreign` FOREIGN KEY (`visitId`) REFERENCES `visits` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `invoices_patientId_foreign` FOREIGN KEY (`patientId`) REFERENCES `patients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `invoices_doctorId_foreign` FOREIGN KEY (`doctorId`) REFERENCES `doctors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `invoices_createdBy_foreign` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng hóa đơn';

-- Bảng: invoice_items (Chi tiết hóa đơn)
CREATE TABLE `invoice_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoiceId` INT UNSIGNED NOT NULL COMMENT 'ID hóa đơn',
  `itemType` ENUM('EXAMINATION', 'MEDICINE') NOT NULL COMMENT 'Loại mục',
  `description` VARCHAR(500) DEFAULT NULL COMMENT 'Mô tả (cho khám bệnh)',
  `prescriptionDetailId` INT UNSIGNED DEFAULT NULL COMMENT 'ID chi tiết đơn thuốc',
  `medicineName` VARCHAR(200) DEFAULT NULL COMMENT 'Tên thuốc',
  `medicineCode` VARCHAR(50) DEFAULT NULL COMMENT 'Mã thuốc',
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Số lượng',
  `unitPrice` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Đơn giá',
  `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Thành tiền',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `invoice_items_invoiceId_foreign` (`invoiceId`),
  KEY `invoice_items_prescriptionDetailId_foreign` (`prescriptionDetailId`),
  CONSTRAINT `invoice_items_invoiceId_foreign` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `invoice_items_prescriptionDetailId_foreign` FOREIGN KEY (`prescriptionDetailId`) REFERENCES `prescription_details` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng chi tiết hóa đơn';

-- Bảng: payments (Thanh toán)
CREATE TABLE `payments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoiceId` INT UNSIGNED NOT NULL COMMENT 'ID hóa đơn',
  `amount` DECIMAL(15,2) NOT NULL COMMENT 'Số tiền thanh toán',
  `paymentMethod` ENUM('CASH', 'BANK_TRANSFER', 'QR_CODE') NOT NULL COMMENT 'Phương thức thanh toán',
  `paymentDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày thanh toán',
  `reference` VARCHAR(200) DEFAULT NULL COMMENT 'Mã tham chiếu',
  `note` TEXT DEFAULT NULL COMMENT 'Ghi chú',
  `createdBy` INT UNSIGNED NOT NULL COMMENT 'Người tạo',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payments_invoiceId_foreign` (`invoiceId`),
  KEY `payments_createdBy_foreign` (`createdBy`),
  KEY `payments_paymentDate_index` (`paymentDate`),
  CONSTRAINT `payments_invoiceId_foreign` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `payments_createdBy_foreign` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng thanh toán';

-- =====================================================
-- 8. MODULE QUẢN LÝ NHÂN SỰ
-- =====================================================

-- Bảng: attendance (Chấm công)
CREATE TABLE `attendance` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED NOT NULL COMMENT 'ID người dùng',
  `date` DATE NOT NULL COMMENT 'Ngày chấm công',
  `status` ENUM('PRESENT', 'ABSENT', 'LEAVE', 'SICK_LEAVE') NOT NULL DEFAULT 'PRESENT' COMMENT 'Trạng thái',
  `note` TEXT DEFAULT NULL COMMENT 'Ghi chú',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `attendance_userId_foreign` (`userId`),
  KEY `attendance_date_index` (`date`),
  KEY `attendance_userId_date_index` (`userId`, `date`),
  CONSTRAINT `attendance_userId_foreign` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng chấm công nhân viên';

-- Bảng: payrolls (Bảng lương)
CREATE TABLE `payrolls` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payrollCode` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã bảng lương',
  `userId` INT UNSIGNED NOT NULL COMMENT 'ID người dùng',
  `month` INT UNSIGNED NOT NULL COMMENT 'Tháng',
  `year` INT UNSIGNED NOT NULL COMMENT 'Năm',

  -- Lương cơ bản và chức vụ
  `baseSalary` DECIMAL(15,2) NOT NULL DEFAULT 2500000.00 COMMENT 'Lương cơ bản',
  `roleCoefficient` DECIMAL(5,2) NOT NULL COMMENT 'Hệ số chức vụ',
  `roleSalary` DECIMAL(15,2) NOT NULL COMMENT 'Lương chức vụ = baseSalary * roleCoefficient',
  `yearsOfService` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số năm công tác',
  `experienceBonus` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Phụ cấp kinh nghiệm',

  -- Hoa hồng
  `totalInvoices` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng hóa đơn trong tháng',
  `commissionRate` DECIMAL(5,4) NOT NULL DEFAULT 0.0500 COMMENT 'Tỷ lệ hoa hồng',
  `commission` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Hoa hồng = totalInvoices * commissionRate',

  -- Khấu trừ
  `daysOff` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số ngày nghỉ',
  `allowedDaysOff` INT UNSIGNED NOT NULL DEFAULT 2 COMMENT 'Số ngày nghỉ cho phép',
  `penaltyDaysOff` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số ngày nghỉ bị phạt',
  `penaltyAmount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Tiền phạt',

  -- Tổng lương
  `grossSalary` DECIMAL(15,2) NOT NULL COMMENT 'Lương tổng',
  `netSalary` DECIMAL(15,2) NOT NULL COMMENT 'Lương thực nhận',

  -- Trạng thái
  `status` ENUM('DRAFT', 'APPROVED', 'PAID') NOT NULL DEFAULT 'DRAFT' COMMENT 'Trạng thái',
  `approvedBy` INT UNSIGNED DEFAULT NULL COMMENT 'Người phê duyệt',
  `approvedAt` DATETIME DEFAULT NULL COMMENT 'Ngày phê duyệt',
  `paidAt` DATETIME DEFAULT NULL COMMENT 'Ngày thanh toán',

  `note` TEXT DEFAULT NULL COMMENT 'Ghi chú',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payrolls_payrollCode_unique` (`payrollCode`),
  KEY `payrolls_userId_foreign` (`userId`),
  KEY `payrolls_approvedBy_foreign` (`approvedBy`),
  KEY `payrolls_month_year_index` (`month`, `year`),
  KEY `payrolls_status_index` (`status`),
  CONSTRAINT `payrolls_userId_foreign` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `payrolls_approvedBy_foreign` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng lương nhân viên';

-- =====================================================
-- 9. MODULE THÔNG BÁO
-- =====================================================

-- Bảng: notifications (Thông báo)
CREATE TABLE `notifications` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED NOT NULL COMMENT 'ID người nhận',
  `type` ENUM('APPOINTMENT_CREATED', 'APPOINTMENT_CANCELLED', 'DOCTOR_CHANGED', 'SYSTEM') NOT NULL COMMENT 'Loại thông báo',
  `title` VARCHAR(255) NOT NULL COMMENT 'Tiêu đề',
  `message` TEXT NOT NULL COMMENT 'Nội dung',
  `relatedAppointmentId` INT UNSIGNED DEFAULT NULL COMMENT 'ID lịch hẹn liên quan',
  `isRead` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đã đọc',
  `emailSent` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đã gửi email',
  `emailSentAt` DATETIME DEFAULT NULL COMMENT 'Thời gian gửi email',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notifications_userId_foreign` (`userId`),
  KEY `notifications_relatedAppointmentId_foreign` (`relatedAppointmentId`),
  KEY `notifications_userId_isRead_index` (`userId`, `isRead`),
  KEY `notifications_userId_createdAt_index` (`userId`, `createdAt`),
  CONSTRAINT `notifications_userId_foreign` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `notifications_relatedAppointmentId_foreign` FOREIGN KEY (`relatedAppointmentId`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng thông báo';

-- =====================================================
-- INDEX BỔ SUNG ĐỂ TỐI ƯU HIỆU NĂNG
-- =====================================================

-- Thêm index cho các trường thường xuyên tìm kiếm
CREATE INDEX idx_patients_fullName ON patients(fullName);
CREATE INDEX idx_users_fullName ON users(fullName);
CREATE INDEX idx_doctors_doctorCode ON doctors(doctorCode);
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_visits_checkInTime ON visits(checkInTime);
CREATE INDEX idx_invoices_createdAt ON invoices(createdAt);
CREATE INDEX idx_prescriptions_createdAt ON prescriptions(createdAt);

-- =====================================================
-- KẾT THÚC SCRIPT TẠO CSDL
-- =====================================================

-- Hiển thị thông báo hoàn thành
SELECT 'Database schema created successfully!' AS Status;
SELECT COUNT(*) AS TotalTables FROM information_schema.tables WHERE table_schema = DATABASE();

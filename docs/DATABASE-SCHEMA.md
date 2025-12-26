# 🗄️ Database Schema

## 📋 Tổng quan

Database sử dụng **MySQL 8.x** với **Sequelize ORM**.

**Tổng số bảng**: 19 tables
**Engine**: InnoDB
**Charset**: utf8mb4_unicode_ci

**Version**: 2.0.0 (Updated: 2025-12-26)

---

## 📊 Sơ đồ quan hệ (ER Diagram)

### Core System (v1.0)
```
┌─────────────┐
│    users    │───────┐
└─────────────┘       │
       │              │
       ├──────────────┼──────────┐
       │              │          │
       ▼              ▼          ▼
┌──────────┐   ┌──────────┐  ┌──────────────┐
│ patients │   │ doctors  │  │notifications │
└──────────┘   └──────────┘  └──────────────┘
       │              │              │
       │              ├──────┐       │
       │              │      │       │
       │              ▼      ▼       │
       │        ┌────────────────┐   │
       │        │ doctor_shifts  │   │
       │        └────────────────┘   │
       │              │      │       │
       │              │      │       │
       │              ▼      ▼       │
       │        ┌──────────┐  ┌──────────┐
       └────────│appointments│◄─┘
                └──────────┘
                     │
                     ▼
                ┌──────────┐
                │  visits  │
                └──────────┘
```

### Medicine & Prescription System (v2.0)
```
┌─────────────────┐
│    medicines    │
└────────┬────────┘
         │
         ├──────────┬─────────────┬────────────┐
         │          │             │            │
         ▼          ▼             ▼            ▼
┌──────────────┐  ┌─────────────┐  ┌────────────────────┐
│  medicine    │  │  medicine   │  │  prescription      │
│   imports    │  │   exports   │  │     details        │
└──────────────┘  └─────────────┘  └────────┬───────────┘
                                             │
                                             ▼
                                    ┌────────────────┐
                                    │ prescriptions  │
                                    └────────┬───────┘
                                             │
                                             ├──────┐
                                             ▼      ▼
                                    ┌──────────┐  ┌──────────┐
                                    │ visits   │  │ patients │
                                    └──────────┘  └──────────┘

┌────────────────────┐
│ disease_categories │
└──────────┬─────────┘
           │
           ▼
      ┌──────────┐
      │ visits   │
      └──────────┘
```

---

## 📑 Các bảng chính

### **1. users**
Lưu thông tin user (bệnh nhân, bác sĩ, admin)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `email` | VARCHAR(255) UNIQUE | Email đăng nhập |
| `password` | VARCHAR(255) | Hashed password (bcrypt) |
| `fullName` | VARCHAR(255) | Họ tên đầy đủ |
| `phoneNumber` | VARCHAR(20) | Số điện thoại |
| `roleId` | TINYINT | 1=Admin, 2=Receptionist, 3=Patient, 4=Doctor |

---

### **2. patients**
Thông tin bổ sung cho bệnh nhân

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `userId` | INT (FK → users.id) | Link tới user |
| `dateOfBirth` | DATE | Ngày sinh |
| `gender` | ENUM('MALE', 'FEMALE', 'OTHER') | Giới tính |
| `identityCard` | VARCHAR(20) | CMND/CCCD |
| `medicalHistory` | TEXT | Tiền sử bệnh |
| `allergies` | TEXT | Dị ứng |

---

### **3. specialties**
Chuyên khoa y tế

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `name` | VARCHAR(255) | Tên chuyên khoa (Tim mạch, Nhi khoa, ...) |
| `description` | TEXT | Mô tả chi tiết |

**Sample:** Nội khoa, Ngoại khoa, Sản phụ khoa, Nhi khoa, Tim mạch, Da liễu

---

### **4. doctors**
Thông tin bác sĩ

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `doctorCode` | VARCHAR(10) UNIQUE | Mã BS (BS000001, BS000002, ...) |
| `userId` | INT (FK → users.id) | Link tới user |
| `specialtyId` | INT (FK → specialties.id) | Chuyên khoa |
| `position` | VARCHAR(100) | Chức vụ (Bác sĩ, Trưởng khoa, ...) |
| `degree` | VARCHAR(100) | Học vị (Thạc sĩ, Tiến sĩ, ...) |

**Auto-increment:** `doctorCode` tự động: BS000001 → BS000002 → ...

---

### **5. shifts**
Ca làm việc

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `name` | VARCHAR(50) | Tên ca (Sáng, Chiều, Tối) |
| `startTime` | TIME | Giờ bắt đầu (08:00:00) |
| `endTime` | TIME | Giờ kết thúc (12:00:00) |

**Sample:**
- 1: Sáng (08:00 - 12:00)
- 2: Chiều (13:00 - 17:00)
- 3: Tối (18:00 - 21:00)

---

### **6. doctor_shifts** ⭐
Gán bác sĩ vào ca làm việc (quan trọng cho reschedule)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `doctorId` | INT (FK → doctors.id) | Bác sĩ nào |
| `shiftId` | INT (FK → shifts.id) | Ca nào |
| `workDate` | DATE | Ngày làm việc |
| `status` | ENUM('ACTIVE', 'CANCELLED', 'REPLACED') | Trạng thái ca |
| `replacedBy` | INT (FK → doctors.id) | Bác sĩ thay thế (nếu có) |
| `cancelReason` | TEXT | Lý do hủy ca |

**Indexes:**
```sql
UNIQUE KEY (doctorId, shiftId, workDate)
KEY (shiftId, workDate, status)
```

**Thêm vào migration:** [20251225175542-add-status-to-doctor-shifts.js](../migrations/20251225175542-add-status-to-doctor-shifts.js)

---

### **7. appointments** ⭐
Lịch hẹn khám bệnh

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `patientId` | INT (FK → patients.id) | Bệnh nhân nào |
| `doctorId` | INT (FK → doctors.id) | Bác sĩ nào |
| `shiftId` | INT (FK → shifts.id) | Ca nào |
| `date` | DATE | Ngày khám |
| `slotNumber` | INT | Số thứ tự (1, 2, 3, ...) |
| `symptomInitial` | TEXT | Triệu chứng ban đầu |
| `status` | ENUM('WAITING', 'CHECKED_IN', 'EXAMINING', 'COMPLETED', 'CANCELLED') | Trạng thái |

**Indexes:**
```sql
KEY (patientId, status)
KEY (doctorId, shiftId, date)
UNIQUE KEY (doctorId, shiftId, date, slotNumber)
```

---

### **8. notifications** ⭐
Thông báo in-app

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `userId` | INT (FK → users.id) | User nhận thông báo |
| `type` | ENUM | APPOINTMENT_CREATED, APPOINTMENT_CANCELLED, DOCTOR_CHANGED |
| `title` | VARCHAR(255) | Tiêu đề ngắn |
| `message` | TEXT | Nội dung chi tiết |
| `relatedAppointmentId` | INT (FK → appointments.id) | ID lịch hẹn liên quan |
| `isRead` | BOOLEAN | Đã đọc chưa (default: false) |
| `emailSent` | BOOLEAN | Đã gửi email chưa |
| `emailSentAt` | DATETIME | Thời gian gửi email |

**Indexes:**
```sql
KEY (userId, isRead)
KEY (userId, createdAt)
```

**Thêm vào migration:** [20251225182320-create-notifications.js](../migrations/20251225182320-create-notifications.js)

---

### **9. visits** ⭐
Thông tin khám bệnh (sau khi appointment hoàn thành)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `appointmentId` | INT (FK → appointments.id) | Link tới lịch hẹn |
| `diagnosis` | TEXT | Chẩn đoán |
| `symptoms` | TEXT | Triệu chứng (mới) |
| `diseaseCategoryId` | INT (FK → disease_categories.id) | Danh mục bệnh (ICD-10) |
| `prescription` | TEXT | Đơn thuốc |
| `notes` | TEXT | Ghi chú bác sĩ |
| `visitDate` | DATETIME | Thời gian khám |

**Updated:** Migration [20251226074430-update-visits-add-symptoms-and-category.js](../migrations/20251226074430-update-visits-add-symptoms-and-category.js)

---

### **10. disease_categories** 🆕
Danh mục bệnh theo tiêu chuẩn ICD-10

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `code` | VARCHAR(10) UNIQUE | Mã ICD-10 (J03, I10, E11, ...) |
| `name` | VARCHAR(255) | Tên bệnh |
| `description` | TEXT | Mô tả chi tiết |

**Sample:**
- J03 - Viêm amidan cấp
- I10 - Tăng huyết áp
- E11 - Đái tháo đường type 2
- J18 - Viêm phổi

**Migration:** [20251226074417-create-disease-categories.js](../migrations/20251226074417-create-disease-categories.js)

---

### **11. medicines** 🆕
Quản lý thuốc và tồn kho

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `medicineCode` | VARCHAR(20) UNIQUE | Mã thuốc (MED-000001, ...) |
| `name` | VARCHAR(200) | Tên thuốc |
| `group` | VARCHAR(100) | Nhóm thuốc (Kháng sinh, Giảm đau, ...) |
| `activeIngredient` | VARCHAR(200) | Hoạt chất |
| `manufacturer` | VARCHAR(200) | Nhà sản xuất |
| `unit` | ENUM | Đơn vị: VIEN, ML, HOP, CHAI, TUYP, GOI |
| `importPrice` | DECIMAL(10,2) | Giá nhập (VNĐ) |
| `salePrice` | DECIMAL(10,2) | Giá bán (VNĐ) |
| `quantity` | INT | Tồn kho hiện tại |
| `minStockLevel` | INT | Mức tồn tối thiểu (default: 10) |
| `expiryDate` | DATE | Ngày hết hạn |
| `description` | TEXT | Mô tả, hướng dẫn sử dụng |
| `status` | ENUM | ACTIVE, EXPIRED, REMOVED |

**Indexes:**
```sql
UNIQUE KEY (medicineCode)
KEY (status)
KEY (group)
```

**Migration:** [20251226074030-create-medicines.js](../migrations/20251226074030-create-medicines.js)

---

### **12. medicine_imports** 🆕
Lịch sử nhập kho (Audit Trail)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `medicineId` | INT (FK → medicines.id) | Thuốc nào |
| `quantity` | INT | Số lượng nhập |
| `importPrice` | DECIMAL(10,2) | Giá nhập |
| `importDate` | DATETIME | Ngày nhập |
| `userId` | INT (FK → users.id) | Người nhập (Admin) |

**Migration:** [20251226080000-create-medicine-imports.js](../migrations/20251226080000-create-medicine-imports.js)

---

### **13. medicine_exports** 🆕
Lịch sử xuất kho (Audit Trail)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `medicineId` | INT (FK → medicines.id) | Thuốc nào |
| `quantity` | INT | Số lượng xuất |
| `exportDate` | DATETIME | Ngày xuất |
| `userId` | INT (FK → users.id) | Người xuất (Doctor) |
| `reason` | VARCHAR(255) | Lý do xuất |

**Reason format:**
- `PRESCRIPTION_{prescriptionCode}` - Kê đơn thuốc
- `ADJUSTMENT` - Điều chỉnh tồn kho
- `EXPIRED` - Hủy thuốc hết hạn
- `DAMAGED` - Thuốc hỏng

**Migration:** [20251226080001-create-medicine-exports.js](../migrations/20251226080001-create-medicine-exports.js)

---

### **14. prescriptions** 🆕
Đơn thuốc

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `prescriptionCode` | VARCHAR(30) UNIQUE | Mã đơn (RX-YYYYMMDD-XXXXX) |
| `visitId` | INT (FK → visits.id) UNIQUE | Phiếu khám (1 visit = 1 prescription) |
| `doctorId` | INT (FK → doctors.id) | Bác sĩ kê đơn |
| `patientId` | INT (FK → patients.id) | Bệnh nhân |
| `totalAmount` | DECIMAL(10,2) | Tổng tiền |
| `status` | ENUM | DRAFT, LOCKED, CANCELLED |
| `note` | TEXT | Ghi chú của bác sĩ |
| `digitalSignature` | TEXT | Chữ ký số |

**Indexes:**
```sql
UNIQUE KEY (prescriptionCode)
UNIQUE KEY (visitId)
KEY (doctorId, status)
KEY (patientId)
```

**Migration:** [20251226074509-create-prescriptions.js](../migrations/20251226074509-create-prescriptions.js)

---

### **15. prescription_details** 🆕
Chi tiết đơn thuốc (Snapshot giá)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `prescriptionId` | INT (FK → prescriptions.id) | Đơn thuốc |
| `medicineId` | INT (FK → medicines.id) | Thuốc |
| `medicineName` | VARCHAR(200) | Tên thuốc (snapshot) |
| `quantity` | INT | Số lượng |
| `unit` | ENUM | Đơn vị (snapshot) |
| `unitPrice` | DECIMAL(10,2) | Giá bán (snapshot) |
| `dosageMorning` | DECIMAL(4,2) | Liều sáng (0-99.99) |
| `dosageNoon` | DECIMAL(4,2) | Liều trưa |
| `dosageAfternoon` | DECIMAL(4,2) | Liều chiều |
| `dosageEvening` | DECIMAL(4,2) | Liều tối |
| `instruction` | TEXT | Hướng dẫn sử dụng |

**Indexes:**
```sql
KEY (prescriptionId)
```

**Lý do snapshot:** Giá thuốc có thể thay đổi sau này, cần lưu giá tại thời điểm kê đơn

**Migration:** [20251226074511-create-prescription-details.js](../migrations/20251226074511-create-prescription-details.js)

---

## 🔄 Migration Files

Tất cả migrations nằm trong `/migrations`:

```bash
migrations/
# Core System (v1.0)
├── 20231201120000-create-users.js
├── 20231201120100-create-patients.js
├── 20231201120200-create-specialties.js
├── 20231201120300-create-doctors.js
├── 20231201120400-create-shifts.js
├── 20231201120500-create-doctor-shifts.js
├── 20231201120600-create-appointments.js
├── 20231201120700-create-visits.js

# Reschedule & Notification (v1.5)
├── 20251225175542-add-status-to-doctor-shifts.js   ← Reschedule feature
├── 20251225182320-create-notifications.js          ← Notification feature

# Medicine & Prescription System (v2.0)
├── 20251226074030-create-medicines.js
├── 20251226074417-create-disease-categories.js
├── 20251226074430-update-visits-add-symptoms-and-category.js
├── 20251226074509-create-prescriptions.js
├── 20251226074511-create-prescription-details.js
├── 20251226080000-create-medicine-imports.js
└── 20251226080001-create-medicine-exports.js
```

**Chạy migrations:**
```bash
npx sequelize-cli db:migrate
```

**Rollback:**
```bash
npx sequelize-cli db:migrate:undo
```

---

## 📈 Relationships Summary

### Core System
```
users (1) ──── (1) patients
users (1) ──── (1) doctors
users (1) ──── (N) notifications

doctors (N) ──── (1) specialties
doctors (1) ──── (N) doctor_shifts
doctors (1) ──── (N) appointments
doctors (1) ──── (N) prescriptions

shifts (1) ──── (N) doctor_shifts
shifts (1) ──── (N) appointments

patients (1) ──── (N) appointments
patients (1) ──── (N) prescriptions

appointments (1) ──── (1) visits
appointments (1) ──── (N) notifications
```

### Medicine & Prescription System
```
medicines (1) ──── (N) medicine_imports
medicines (1) ──── (N) medicine_exports
medicines (1) ──── (N) prescription_details

prescriptions (1) ──── (1) visits (UNIQUE)
prescriptions (1) ──── (N) prescription_details

visits (N) ──── (1) disease_categories
```

---

## 🎯 Key Features

### **1. Reschedule Logic**
- Sử dụng `doctor_shifts.status` và `doctor_shifts.replacedBy`
- Khi admin hủy ca → status = REPLACED, replacedBy = new doctorId
- Tất cả appointments update doctorId = replacedBy

### **2. Notification System**
- Mỗi event tạo 1 notification record
- Field `emailSent` track xem đã gửi email chưa
- Field `relatedAppointmentId` để link tới appointment

### **3. Medicine Inventory Management**
- **Pessimistic Locking**: `SELECT ... FOR UPDATE` khi kê đơn
- **Auto Stock Deduction**: Trừ kho tự động khi tạo prescription
- **Audit Trail**: medicine_imports + medicine_exports track mọi thay đổi
- **Price Snapshot**: Lưu giá tại thời điểm kê đơn (prescription_details)

### **4. Prescription Business Logic**
- 1 Visit chỉ có 1 Prescription (UNIQUE constraint)
- Status workflow: DRAFT → LOCKED (không thể sửa sau khi thanh toán)
- Chỉ bác sĩ kê đơn mới được sửa/hủy
- Hủy đơn → Hoàn trả kho tự động

### **5. Unique Constraints**
- Email unique trong `users`
- (doctorId, shiftId, workDate) unique trong `doctor_shifts`
- (doctorId, shiftId, date, slotNumber) unique trong `appointments`
- `medicineCode` unique trong `medicines`
- `prescriptionCode` unique trong `prescriptions`
- `visitId` unique trong `prescriptions` (1 visit = 1 prescription)

---

## 📝 Notes

- Tất cả bảng có `createdAt` và `updatedAt` (Sequelize timestamps)
- Foreign keys có ON DELETE CASCADE/SET NULL tùy business logic
- Indexes được tối ưu cho queries thường dùng
- Sử dụng ENUM để validate data ở DB level

Xem chi tiết:
- Models: [src/models/](../src/models/)
- Migrations: [migrations/](../migrations/)

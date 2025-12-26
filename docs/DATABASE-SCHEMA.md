# 🗄️ Database Schema

## 📋 Tổng quan

Database sử dụng **MySQL 8.x** với **Sequelize ORM**.

**Tổng số bảng**: 12 tables
**Engine**: InnoDB
**Charset**: utf8mb4_unicode_ci

---

## 📊 Sơ đồ quan hệ (ER Diagram)

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

┌──────────────┐   ┌──────────┐
│ specialties  │◄──│ doctors  │
└──────────────┘   └──────────┘

┌──────────┐   ┌──────────────┐
│  shifts  │◄──│doctor_shifts │
└──────────┘   └──────────────┘
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

### **9. visits**
Thông tin khám bệnh (sau khi appointment hoàn thành)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | ID duy nhất |
| `appointmentId` | INT (FK → appointments.id) | Link tới lịch hẹn |
| `diagnosis` | TEXT | Chẩn đoán |
| `prescription` | TEXT | Đơn thuốc |
| `notes` | TEXT | Ghi chú bác sĩ |
| `visitDate` | DATETIME | Thời gian khám |

---

## 🔄 Migration Files

Tất cả migrations nằm trong `/migrations`:

```bash
migrations/
├── 20231201120000-create-users.js
├── 20231201120100-create-patients.js
├── 20231201120200-create-specialties.js
├── 20231201120300-create-doctors.js
├── 20231201120400-create-shifts.js
├── 20231201120500-create-doctor-shifts.js
├── 20231201120600-create-appointments.js
├── 20231201120700-create-visits.js
├── 20251225175542-add-status-to-doctor-shifts.js   ← Reschedule feature
└── 20251225182320-create-notifications.js          ← Notification feature
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

```
users (1) ──── (1) patients
users (1) ──── (1) doctors
users (1) ──── (N) notifications

doctors (N) ──── (1) specialties
doctors (1) ──── (N) doctor_shifts
doctors (1) ──── (N) appointments

shifts (1) ──── (N) doctor_shifts
shifts (1) ──── (N) appointments

patients (1) ──── (N) appointments
appointments (1) ──── (1) visits
appointments (1) ──── (N) notifications
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

### **3. Unique Constraints**
- Email unique trong `users`
- (doctorId, shiftId, workDate) unique trong `doctor_shifts`
- (doctorId, shiftId, date, slotNumber) unique trong `appointments`

---

## 📝 Notes

- Tất cả bảng có `createdAt` và `updatedAt` (Sequelize timestamps)
- Foreign keys có ON DELETE CASCADE/SET NULL tùy business logic
- Indexes được tối ưu cho queries thường dùng
- Sử dụng ENUM để validate data ở DB level

Xem chi tiết:
- Models: [src/models/](../src/models/)
- Migrations: [migrations/](../migrations/)

# 📚 HƯỚNG DẪN CHI TIẾT - HEALTHCARE MANAGEMENT SYSTEM API

## 📋 MỤC LỤC

1. [Giới thiệu Đồ án](#1-giới-thiệu-đồ-án)
2. [Kiến trúc Database](#2-kiến-trúc-database)
3. [Setup Project](#3-setup-project)
4. [Nghiệp vụ Chi tiết](#4-nghiệp-vụ-chi-tiết)
5. [Test API từng bước](#5-test-api-từng-bước)
6. [Scenarios Nghiệp vụ](#6-scenarios-nghiệp-vụ)

---

## 1. GIỚI THIỆU ĐỒ ÁN

### 🎯 Tên đồ án: **Healthcare Management System - Hệ thống quản lý phòng khám**

### 📝 Mô tả:

Hệ thống quản lý phòng khám đa chức năng, hỗ trợ:

- **Bệnh nhân**: Đăng ký tài khoản, đặt lịch khám online, quản lý hồ sơ
- **Bác sĩ**: Quản lý lịch trực, khám bệnh, chẩn đoán
- **Lễ tân**: Đặt lịch offline cho bệnh nhân, check-in
- **Admin**: Quản lý toàn bộ hệ thống

### 🏗️ Công nghệ:

- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MySQL
- **ORM**: Sequelize
- **Authentication**: JWT (Access Token + Refresh Token)
- **Validation**: express-validator
- **Security**: bcryptjs, helmet, cors, rate-limit

### 👥 Vai trò (Roles):

1. **ADMIN** (id=1): Quản trị viên
2. **DOCTOR** (id=2): Bác sĩ
3. **PATIENT** (id=3): Bệnh nhân
4. **RECEPTIONIST** (id=4): Lễ tân

---

## 2. KIẾN TRÚC DATABASE

### 📊 ERD - Entity Relationship Diagram

```
┌─────────────┐
│    roles    │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────────────┐
│      users          │
│ - email             │
│ - password          │
│ - fullName          │
│ - roleId (FK)       │
│ - isActive          │
└──┬──────────────┬───┘
   │ 1            │ 1
   │              │
   │ 0..1         │ 0..1
┌──▼───────┐  ┌──▼────────────┐
│ patients │  │    doctors    │
│ -patCode │  │  -doctorCode  │
│ -cccd    │  │  -specialtyId │◄──┐
│ -userId  │  │  -userId      │   │
└──┬───────┘  └───┬───────────┘   │
   │ 1            │ 1              │ N
   │              │                │
   │ N            │ N           ┌──┴─────────┐
┌──▼──────────┐  └──────┐       │specialties│
│patient_     │         │       └───────────┘
│profiles     │         │
│ -type (enum)│         │
│ -value      │         │
└─────────────┘         │
                        │
   ┌────────────────────┘
   │
   │ N               N ┌─────────┐
   ▼                ┌──┤ shifts  │
┌──────────────┐    │  │ -name   │
│doctor_shifts │◄───┘  │ -start  │
│ -doctorId    │       │ -end    │
│ -shiftId     │       └─────────┘
│ -workDate    │
└──────────────┘
   │
   │ (Used for validation)
   │
   ▼
┌──────────────────────┐
│    appointments      │◄────────┐
│ -patientId (FK)      │         │
│ -doctorId (FK)       │         │
│ -shiftId (FK)        │         │
│ -date                │         │
│ -slotNumber          │         │
│ -bookingType         │         │
│ -bookedBy            │         │
│ -status              │         │
│ UNIQUE: (doctorId,   │         │
│  shiftId, date, slot)│         │
└──────┬───────────────┘         │
       │ 1                       │
       │                         │
       │ 0..1                    │ 1
   ┌───▼─────┐                   │
   │ visits  │                   │
   │ -apptId │───────────────────┘
   │ -diagno │
   │ -status │
   └─────────┘

┌──────────────┐     ┌────────────────┐
│ permissions  │◄───►│role_permissions│
│ -name        │  N:M│ -roleId        │
│ -module      │     │ -permissionId  │
└──────────────┘     └────────────────┘
```

---

## 3. SETUP PROJECT

### 📦 Bước 1: Clone và cài đặt

```bash
# Clone project
cd d:\DemoApp\Backend

# Cài dependencies
npm install

# Packages chính:
# - express@5.2.1
# - sequelize@6.37.7
# - mysql2@3.15.3
# - jsonwebtoken@9.0.3
# - bcryptjs@3.0.3
# - express-validator@7.3.1
# - tsconfig-paths@4.2.0
```

### 🗄️ Bước 2: Setup Database

```bash
# 1. Tạo database
npx sequelize-cli db:create

# 2. Chạy migrations (12 tables)
npx sequelize-cli db:migrate

# 3. Seed dữ liệu mẫu
npx sequelize-cli db:seed:all
```

### ▶️ Bước 3: Chạy server

```bash
# Development mode
npm run dev

# Server sẽ chạy tại: http://localhost:3000
```

### ✅ Bước 4: Verify

```bash
# Test health check
curl http://localhost:3000/

# Response:
{
  "success": true,
  "message": "Healthcare Management System API",
  "version": "1.0.0",
  "timestamp": "2025-12-24T03:00:00.000Z"
}
```

---

## 4. NGHIỆP VỤ CHI TIẾT

### 🔐 4.1. AUTHENTICATION & AUTHORIZATION

#### **JWT Token Structure:**

```typescript
// Access Token (15 phút)
{
  userId: number,
  roleId: RoleCode, // 1=ADMIN, 2=DOCTOR, 3=PATIENT, 4=RECEPTIONIST
  patientId?: number | null, // Nếu là PATIENT
  doctorId?: number | null   // Nếu là DOCTOR
}

// Refresh Token (7 ngày)
{
  userId: number
}
```

#### **Middleware Chain:**

```
Request → verifyToken → requireRole → requireContext → Business Logic
```

**Ví dụ:**

```typescript
// Patient đặt lịch online
POST /api/appointments
→ verifyToken (check JWT)
→ requireRole(PATIENT)
→ requirePatientContext (check patientId exists)
→ createAppointment()
```

---

### 👤 4.2. QUẢN LÝ BỆNH NHÂN (PATIENT MANAGEMENT)

#### **Flow đăng ký và thiết lập hồ sơ:**

```
1. User Register (public)
   POST /api/auth/register
   → Tạo User với roleId = 3 (PATIENT)
   → patientId = null (chưa setup)

2. User Login
   POST /api/auth/login
   → Nhận JWT: { userId, roleId: 3, patientId: null }

3. Setup Patient Profile (authenticated)
   POST /api/patients/setup
   → Tạo Patient record
   → Tạo PatientProfile records (email, phone, address)
   → Auto-generate patientCode (BN000001)
   → Từ giờ JWT sẽ có patientId

4. Bệnh nhân có thể đặt lịch
   POST /api/appointments
```

#### **Patient Code Generation:**

```typescript
// Format: BN + 6 chữ số
// Ví dụ: BN000001, BN000002, ...

// Logic:
1. Tìm patientCode lớn nhất hiện tại
2. Extract số (000001)
3. Tăng lên 1 → 000002
4. Prefix "BN" → BN000002
```

#### **Patient Profiles (Flexible Design):**

Thay vì tạo 3 bảng riêng (contacts, phones, addresses), ta dùng 1 bảng với `type` enum:

```sql
patient_profiles:
- id
- patient_id
- type: 'email' | 'phone' | 'address'
- value: 'test@example.com' | '0901234567' | '123 Nguyễn Văn Linh'
- ward: (only for address)
- city: (only for address)
- is_primary: boolean
```

**Ví dụ data:**

| id  | patient_id | type    | value               | ward     | city   | is_primary |
| --- | ---------- | ------- | ------------------- | -------- | ------ | ---------- |
| 1   | 1          | email   | patient@gmail.com   | NULL     | NULL   | true       |
| 2   | 1          | phone   | 0901234567          | NULL     | NULL   | true       |
| 3   | 1          | address | 123 Nguyễn Văn Linh | Phường 1 | TP.HCM | true       |

---

### 👨‍⚕️ 4.3. QUẢN LÝ BÁC SĨ (DOCTOR MANAGEMENT)

#### **Cấu trúc:**

```
User (roleId=2)
  ↓ 1:1
Doctor
  - doctorCode: BS000001
  - specialtyId: 1 (Nội khoa)
  - position: "Bác sĩ chuyên khoa II"
  - degree: "Thạc sĩ"
```

#### **Specialties (Chuyên khoa):**

| ID  | Name         | Description                 |
| --- | ------------ | --------------------------- |
| 1   | Nội khoa     | Chuyên khoa nội tổng quát   |
| 2   | Ngoại khoa   | Chuyên khoa ngoại tổng quát |
| 3   | Sản phụ khoa | Chuyên khoa sản phụ         |
| 4   | Nhi khoa     | Chuyên khoa nhi             |
| 5   | Tim mạch     | Chuyên khoa tim mạch        |
| 6   | Da liễu      | Chuyên khoa da liễu         |

---

### 🕐 4.4. CA LÀM VIỆC (SHIFTS)

#### **Shift Configuration:**

| ID  | Name  | Start Time | End Time | Duration         |
| --- | ----- | ---------- | -------- | ---------------- |
| 1   | Sáng  | 07:00      | 11:00    | 4 giờ (240 phút) |
| 2   | Chiều | 13:00      | 17:00    | 4 giờ (240 phút) |
| 3   | Tối   | 18:00      | 21:00    | 3 giờ (180 phút) |

#### **Slots per Shift:**

```typescript
// Config
SLOT_MINUTES = 10 phút/slot
MAX_SLOTS_PER_SHIFT = 40 slots

// Ca Sáng (4h = 240 phút)
// Lý thuyết: 240 / 10 = 24 slots
// Giới hạn: 40 slots (đủ dư)

// Slots: 1, 2, 3, ..., 40
```

#### **Doctor Shifts (Phân công bác sĩ):**

```
doctor_shifts:
- doctorId: 1
- shiftId: 1 (Sáng)
- workDate: "2025-12-24"
- UNIQUE(doctorId, shiftId, workDate) → Không thể trùng
```

**Ví dụ:**

```
BS. Nguyễn Văn A (doctorId=1)
  - 2025-12-24 Ca Sáng   ✓
  - 2025-12-24 Ca Chiều  ✓
  - 2025-12-24 Ca Sáng   ✗ (duplicate - CONSTRAINT violation)
```

---

### 📅 4.5. ĐẶT LỊCH KHÁM (APPOINTMENT BOOKING) - CORE FEATURE

#### **Business Rules:**

```typescript
BOOKING_CONFIG = {
  MAX_SLOTS_PER_SHIFT: 40, // Tối đa 40 slot/ca
  MAX_APPOINTMENTS_PER_DAY: 40, // Tối đa 40 lịch/ngày/bác sĩ
  SLOT_MINUTES: 10, // Mỗi slot = 10 phút
  CANCEL_BEFORE_HOURS: 2, // Hủy trước 2 giờ
};
```

#### **Appointment Schema:**

```typescript
appointments:
- patientId: number (FK → patients)
- doctorId: number (FK → doctors)
- shiftId: number (FK → shifts)
- date: DATEONLY (YYYY-MM-DD)
- slotNumber: number (1-40)
- bookingType: 'ONLINE' | 'OFFLINE'
- bookedBy: 'PATIENT' | 'RECEPTIONIST'
- symptomInitial: TEXT (triệu chứng ban đầu)
- status: 'WAITING' | 'CANCELLED' | 'CHECKED_IN'

// UNIQUE INDEX: (doctorId, shiftId, date, slotNumber)
// → Ngăn 2 bệnh nhân đặt cùng 1 slot
```

#### **Appointment Slot Assignment Flow:**

```typescript
// Khi tạo appointment:

1. Validate bác sĩ có trực ca đó không?
   Query: doctor_shifts
   WHERE doctorId = ? AND shiftId = ? AND workDate = ?
   → Nếu không tìm thấy: Error "DOCTOR_NOT_ON_DUTY"

2. Check giới hạn ngày
   Query: appointments
   WHERE doctorId = ? AND date = ?
   COUNT(*) < 40?
   → Nếu >= 40: Error "DAY_FULL"

3. Check giới hạn ca
   Query: appointments
   WHERE doctorId = ? AND shiftId = ? AND date = ?
   COUNT(*) < 40?
   → Nếu >= 40: Error "SHIFT_FULL"

4. Find next available slot (WITH LOCK)
   Query: appointments
   WHERE doctorId = ? AND shiftId = ? AND date = ?
   ORDER BY slotNumber DESC
   LIMIT 1
   FOR UPDATE  // Pessimistic lock

   nextSlot = lastSlot + 1
   → Nếu nextSlot > 40: Error "SHIFT_FULL"

5. Insert appointment
   INSERT INTO appointments
   (patientId, doctorId, shiftId, date, slotNumber, ...)
   VALUES (?, ?, ?, ?, nextSlot, ...)

   → Nếu UNIQUE constraint violation: RETRY (race condition)
```

#### **Concurrency Control:**

**Vấn đề:** 2 bệnh nhân đặt lịch cùng lúc → cùng lấy được slot 5 → conflict

**Giải pháp:**

```typescript
// 1. Transaction Isolation Level
isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED

// 2. Row-level Lock
await DoctorShift.findOne({
  where: { doctorId, shiftId, workDate },
  lock: Transaction.LOCK.UPDATE,  // FOR UPDATE
  transaction: t
});

// 3. Unique Constraint
UNIQUE INDEX (doctorId, shiftId, date, slotNumber)

// 4. Retry Mechanism
try {
  await appointment.save();
} catch (error) {
  if (error.name === 'SequelizeUniqueConstraintError') {
    // Retry với slot tiếp theo
  }
}
```

#### **Appointment Types:**

**1. Online Booking (Bệnh nhân tự đặt):**

```
POST /api/appointments
Authorization: Bearer <patient-token>
Body: {
  "doctorId": 1,
  "shiftId": 1,
  "date": "2025-12-25",
  "symptomInitial": "Đau đầu, sốt nhẹ"
}

→ bookingType: "ONLINE"
→ bookedBy: "PATIENT"
→ patientId: từ JWT
```

**2. Offline Booking (Lễ tân đặt cho bệnh nhân):**

```
POST /api/appointments/offline
Authorization: Bearer <receptionist-token>
Body: {
  "patientId": 5,
  "doctorId": 1,
  "shiftId": 2,
  "date": "2025-12-25",
  "symptomInitial": "Khám định kỳ"
}

→ bookingType: "OFFLINE"
→ bookedBy: "RECEPTIONIST"
```

#### **Appointment Status Flow:**

```
WAITING (khi vừa tạo)
   ↓
   ├─→ CANCELLED (patient/receptionist cancel)
   │
   └─→ CHECKED_IN (receptionist check-in)
          ↓
       Visit created (EXAMINING → COMPLETED)
```

---

### 🩺 4.6. KHÁM BỆNH (VISIT)

#### **Visit Schema:**

```typescript
visits:
- appointmentId: number (FK → appointments, UNIQUE)
- patientId: number (FK → patients)
- doctorId: number (FK → doctors)
- checkInTime: DATETIME (thời điểm check-in)
- diagnosis: TEXT (chẩn đoán)
- note: TEXT (ghi chú)
- status: 'EXAMINING' | 'COMPLETED'
```

#### **Visit Flow:**

```
1. Check-in (Lễ tân)
   POST /api/visits/checkin/:appointmentId
   Authorization: Bearer <receptionist-token>

   → Tạo Visit record
   → Appointment.status: WAITING → CHECKED_IN
   → Visit.status: EXAMINING
   → checkInTime: now()

2. Complete Visit (Bác sĩ)
   PUT /api/visits/:id/complete
   Authorization: Bearer <doctor-token>
   Body: {
     "diagnosis": "Viêm họng cấp, nhiễm khuẩn đường hô hấp trên",
     "note": "Kê toa: Amoxicillin 500mg x 3 lần/ngày x 7 ngày"
   }

   → Visit.status: EXAMINING → COMPLETED
   → Update diagnosis & note
```

---

### ❌ 4.7. HỦY LỊCH KHÁM (APPOINTMENT CANCELLATION)

#### **Business Rules:**

```typescript
// Điều kiện hủy lịch:
1. Appointment.status === "WAITING" (chưa check-in)
2. Thời gian hủy >= 2 giờ trước giờ hẹn
3. Patient chỉ hủy được lịch của mình
4. Receptionist/Admin hủy được mọi lịch
```

#### **Calculation Logic:**

```typescript
// Tính thời gian appointment:
const shift = await Shift.findByPk(appointment.shiftId);
// shift.startTime = "07:00"

const appointmentDateTime = new Date(`${appointment.date} ${shift.startTime}`);
// appointment.date = "2025-12-25"
// → appointmentDateTime = "2025-12-25 07:00:00"

// Check deadline
const now = new Date();
const hoursDiff = (appointmentDateTime - now) / (1000 * 60 * 60);

if (hoursDiff < 2) {
  throw new Error("CANCEL_DEADLINE_PASSED");
}
```

#### **API:**

```
PUT /api/appointments/:id/cancel
Authorization: Bearer <patient-or-receptionist-token>

→ Appointment.status: WAITING → CANCELLED
```

---

## 5. TEST API TỪNG BƯỚC

### 🔧 Tools cần thiết:

- **Postman** / **Thunder Client** / **REST Client** (VS Code extension)
- **curl** (command line)

### 📝 Environment Variables (Postman):

```json
{
  "baseUrl": "http://localhost:3000",
  "accessToken": "",
  "refreshToken": "",
  "patientId": "",
  "doctorId": ""
}
```

---

### ✅ TEST CASE 1: ĐĂNG KÝ VÀ ĐĂNG NHẬP

#### **1.1. Register Patient**

```http
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "email": "nguyenvana@gmail.com",
  "password": "Patient123",
  "fullName": "Nguyễn Văn A"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "REGISTER_SUCCESS",
  "user": {
    "id": 6,
    "email": "nguyenvana@gmail.com",
    "fullName": "Nguyễn Văn A",
    "roleId": 3
  }
}
```

**Validation Errors:**

```json
// Email không hợp lệ
{
  "success": false,
  "message": "EMAIL_INVALID",
  "field": "email"
}

// Password quá yếu
{
  "success": false,
  "message": "PASSWORD_WEAK",
  "field": "password"
}
```

#### **1.2. Login**

```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "nguyenvanan@gmail.com",
  "password": "Patient123"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "LOGIN_SUCCESS",
  "data": {
    "user": {
      "id": 6,
      "email": "nguyenvana@gmail.com",
      "fullName": "Nguyễn Văn A",
      "roleId": 3,
      "patientId": null // Chưa setup profile
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Lưu token vào environment:**

```javascript
// Postman: Tests tab
pm.environment.set("accessToken", pm.response.json().data.accessToken);
pm.environment.set("refreshToken", pm.response.json().data.refreshToken);
```

---

### ✅ TEST CASE 2: THIẾT LẬP HỒ SƠ BỆNH NHÂN

#### **2.1. Setup Patient Profile**

```http
POST {{baseUrl}}/api/patients/setup
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "fullName": "Nguyễn Văn A",
  "gender": "MALE",
  "dateOfBirth": "1990-05-15",
  "cccd": "001090012345",
  "profiles": [
    {
      "type": "email",
      "value": "nguyenvana@gmail.com",
      "isPrimary": true
    },
    {
      "type": "phone",
      "value": "0901234567",
      "isPrimary": true
    },
    {
      "type": "address",
      "value": "123 Nguyễn Văn Linh",
      "ward": "Phường 1",
      "city": "TP. Hồ Chí Minh",
      "isPrimary": true
    }
  ]
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "PATIENT_PROFILE_CREATED",
  "data": {
    "patient": {
      "id": 1,
      "patientCode": "BN000001",
      "fullName": "Nguyễn Văn A",
      "gender": "MALE",
      "dateOfBirth": "1990-05-15",
      "cccd": "001090012345",
      "userId": 6
    },
    "profiles": [
      { "type": "email", "value": "nguyenvana@gmail.com" },
      { "type": "phone", "value": "0901234567" },
      { "type": "address", "value": "123 Nguyễn Văn Linh" }
    ]
  }
}
```

**Lưu patientId:**

```javascript
pm.environment.set("patientId", pm.response.json().data.patient.id);
```

---

### ✅ TEST CASE 3: QUẢN LÝ BÁC SĨ

#### **3.1. Get All Doctors**

```http
GET {{baseUrl}}/api/doctors
Authorization: Bearer {{accessToken}}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "doctorCode": "BS000001",
      "position": "Bác sĩ chuyên khoa II",
      "degree": "Thạc sĩ",
      "user": {
        "id": 2,
        "fullName": "BS. Nguyễn Văn A"
      },
      "specialty": {
        "id": 1,
        "name": "Nội khoa"
      }
    },
    {
      "id": 2,
      "doctorCode": "BS000002",
      "position": "Bác sĩ chuyên khoa I",
      "degree": "Bác sĩ",
      "user": {
        "fullName": "BS. Trần Thị B"
      },
      "specialty": {
        "name": "Sản phụ khoa"
      }
    }
  ]
}
```

#### **3.2. Get All Specialties**

```http
GET {{baseUrl}}/api/specialties
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Nội khoa", "description": "Chuyên khoa nội tổng quát" },
    {
      "id": 2,
      "name": "Ngoại khoa",
      "description": "Chuyên khoa ngoại tổng quát"
    },
    { "id": 3, "name": "Sản phụ khoa" },
    { "id": 4, "name": "Nhi khoa" },
    { "id": 5, "name": "Tim mạch" }
  ]
}
```

---

### ✅ TEST CASE 4: PHÂN CÔNG BÁC SĨ

#### **4.1. Assign Doctor to Shift (Admin only)**

**Login as Admin:**

```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "admin@healthcare.com",
  "password": "admin123"
}
```

**Assign:**

```http
POST {{baseUrl}}/api/doctor-shifts
Authorization: Bearer {{adminAccessToken}}
Content-Type: application/json

{
  "doctorId": 1,
  "shiftId": 1,
  "workDate": "2025-12-25"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "DOCTOR_SHIFT_ASSIGNED",
  "data": {
    "id": 1,
    "doctorId": 1,
    "shiftId": 1,
    "workDate": "2025-12-25"
  }
}
```

#### **4.2. Get Doctors On Duty**

```http
GET {{baseUrl}}/api/doctor-shifts/on-duty?date=2025-12-25&shiftId=1
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "workDate": "2025-12-25",
      "doctor": {
        "id": 1,
        "doctorCode": "BS000001",
        "user": {
          "fullName": "BS. Nguyễn Văn A"
        },
        "specialty": {
          "name": "Nội khoa"
        }
      },
      "shift": {
        "id": 1,
        "name": "Sáng",
        "startTime": "07:00",
        "endTime": "11:00"
      }
    }
  ]
}
```

---

### ✅ TEST CASE 5: ĐẶT LỊCH KHÁM

#### **5.1. Create Appointment (Patient - Online)**

```http
POST {{baseUrl}}/api/appointments
Authorization: Bearer {{patientAccessToken}}
Content-Type: application/json

{
  "doctorId": 1,
  "shiftId": 1,
  "date": "2025-12-25",
  "symptomInitial": "Đau đầu, sốt nhẹ 38 độ, ho khan"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "APPOINTMENT_CREATED",
  "data": {
    "id": 1,
    "patientId": 1,
    "doctorId": 1,
    "shiftId": 1,
    "date": "2025-12-25",
    "slotNumber": 1,
    "bookingType": "ONLINE",
    "bookedBy": "PATIENT",
    "symptomInitial": "Đau đầu, sốt nhẹ 38 độ, ho khan",
    "status": "WAITING"
  }
}
```

**Error Cases:**

```json
// Bác sĩ không trực ca đó
{
  "success": false,
  "message": "DOCTOR_NOT_ON_DUTY"
}

// Ca đã đầy (40 slots)
{
  "success": false,
  "message": "SHIFT_FULL"
}

// Ngày đã đầy (40 appointments)
{
  "success": false,
  "message": "DAY_FULL"
}

// Đặt ngày quá khứ
{
  "success": false,
  "message": "DATE_IN_PAST",
  "field": "date"
}
```

#### **5.2. Create Appointment (Receptionist - Offline)**

**Login as Receptionist:**

```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "receptionist@healthcare.com",
  "password": "admin123"
}
```

**Create Offline Appointment:**

```http
POST {{baseUrl}}/api/appointments/offline
Authorization: Bearer {{receptionistAccessToken}}
Content-Type: application/json

{
  "patientId": 1,
  "doctorId": 1,
  "shiftId": 2,
  "date": "2025-12-25",
  "symptomInitial": "Khám định kỳ"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "APPOINTMENT_CREATED",
  "data": {
    "id": 2,
    "patientId": 1,
    "doctorId": 1,
    "shiftId": 2,
    "date": "2025-12-25",
    "slotNumber": 1,
    "bookingType": "OFFLINE",
    "bookedBy": "RECEPTIONIST",
    "status": "WAITING"
  }
}
```

#### **5.3. Get Appointments**

**Admin/Receptionist/Doctor view all:**

```http
GET {{baseUrl}}/api/appointments?date=2025-12-25&doctorId=1&shiftId=1&status=WAITING
Authorization: Bearer {{receptionistAccessToken}}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2025-12-25",
      "slotNumber": 1,
      "status": "WAITING",
      "patient": {
        "patientCode": "BN000001",
        "fullName": "Nguyễn Văn A"
      },
      "doctor": {
        "doctorCode": "BS000001",
        "user": { "fullName": "BS. Nguyễn Văn A" }
      },
      "shift": {
        "name": "Sáng",
        "startTime": "07:00"
      }
    }
  ]
}
```

---

### ✅ TEST CASE 6: HỦY LỊCH KHÁM

#### **6.1. Cancel Appointment (Patient)**

```http
PUT {{baseUrl}}/api/appointments/1/cancel
Authorization: Bearer {{patientAccessToken}}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "APPOINTMENT_CANCELLED",
  "data": {
    "id": 1,
    "status": "CANCELLED"
  }
}
```

**Error Cases:**

```json
// Hủy muộn (< 2 giờ trước giờ hẹn)
{
  "success": false,
  "message": "CANCEL_DEADLINE_PASSED"
}

// Đã check-in rồi
{
  "success": false,
  "message": "CANNOT_CANCEL_CHECKED_IN"
}

// Patient hủy lịch người khác
{
  "success": false,
  "message": "FORBIDDEN"
}
```

---

### ✅ TEST CASE 7: CHECK-IN VÀ KHÁM BỆNH

#### **7.1. Check-in Appointment (Receptionist)**

```http
POST {{baseUrl}}/api/visits/checkin/1
Authorization: Bearer {{receptionistAccessToken}}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "CHECKED_IN_SUCCESS",
  "data": {
    "visit": {
      "id": 1,
      "appointmentId": 1,
      "patientId": 1,
      "doctorId": 1,
      "checkInTime": "2025-12-25T07:05:00.000Z",
      "status": "EXAMINING"
    },
    "appointment": {
      "id": 1,
      "status": "CHECKED_IN"
    }
  }
}
```

#### **7.2. Complete Visit (Doctor)**

**Login as Doctor:**

```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "bsnguyen@healthcare.com",
  "password": "admin123"
}
```

**Complete Visit:**

```http
PUT {{baseUrl}}/api/visits/1/complete
Authorization: Bearer {{doctorAccessToken}}
Content-Type: application/json

{
  "diagnosis": "Viêm họng cấp, nhiễm khuẩn đường hô hấp trên",
  "note": "Kê toa:\n- Amoxicillin 500mg, uống 3 lần/ngày, sau ăn, x 7 ngày\n- Paracetamol 500mg, uống khi sốt > 38.5°C\n- Tái khám sau 3 ngày nếu không đỡ"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "VISIT_COMPLETED",
  "data": {
    "id": 1,
    "appointmentId": 1,
    "diagnosis": "Viêm họng cấp, nhiễm khuẩn đường hô hấp trên",
    "note": "Kê toa:\n- Amoxicillin 500mg...",
    "status": "COMPLETED"
  }
}
```

---

## 6. SCENARIOS NGHIỆP VỤ

### 🎬 SCENARIO 1: BỆNH NHÂN ĐẶT LỊCH KHÁM ĐẦY ĐỦ

**Nhân vật:** Nguyễn Văn A (bệnh nhân mới)

**Flow:**

1. **Đăng ký tài khoản**

   ```
   POST /api/auth/register
   → Tạo User với roleId=PATIENT
   ```

2. **Đăng nhập**

   ```
   POST /api/auth/login
   → Nhận JWT (patientId=null)
   ```

3. **Setup hồ sơ bệnh nhân**

   ```
   POST /api/patients/setup
   → Tạo Patient + PatientProfiles
   → patientCode: BN000001
   ```

4. **Xem danh sách bác sĩ**

   ```
   GET /api/doctors
   → Chọn BS. Nguyễn Văn A (Nội khoa)
   ```

5. **Xem lịch trực của bác sĩ**

   ```
   GET /api/doctor-shifts/on-duty?doctorId=1&date=2025-12-25
   → Thấy ca Sáng (07:00-11:00)
   ```

6. **Đặt lịch khám**

   ```
   POST /api/appointments
   Body: {
     doctorId: 1,
     shiftId: 1,
     date: "2025-12-25",
     symptomInitial: "Đau bụng, tiêu chảy"
   }
   → slotNumber: 1 (slot đầu tiên)
   ```

7. **Nhận thông báo xác nhận** (email/SMS - future feature)

8. **Đến phòng khám đúng giờ**

9. **Lễ tân check-in**

   ```
   POST /api/visits/checkin/1
   → Tạo Visit, status: EXAMINING
   ```

10. **Bác sĩ khám và chẩn đoán**
    ```
    PUT /api/visits/1/complete
    Body: {
      diagnosis: "Viêm dạ dày cấp",
      note: "Kê toa..."
    }
    → Visit status: COMPLETED
    ```

---

### 🎬 SCENARIO 2: LỄ TÂN ĐẶT LỊCH OFFLINE

**Nhân vật:**

- Nguyễn Thị Lễ Tân (receptionist)
- Trần Văn B (bệnh nhân đến trực tiếp)

**Flow:**

1. **Bệnh nhân đến quầy lễ tân**

   - "Tôi muốn đặt lịch khám bác sĩ Tim mạch"

2. **Lễ tân check bệnh nhân đã có hồ sơ chưa**

   ```
   GET /api/patients?cccd=001090099999
   → Không tìm thấy
   ```

3. **Tạo hồ sơ bệnh nhân mới** (có thể làm trực tiếp hoặc tạo User trước)

   ```
   Option 1: Tạo User + Setup Profile
   Option 2: Admin tạo Patient trực tiếp (future feature)
   ```

4. **Xem bác sĩ Tim mạch đang trực**

   ```
   GET /api/doctors?specialtyId=5
   GET /api/doctor-shifts/on-duty?date=2025-12-25&shiftId=2
   → BS. Lê Văn C đang trực ca Chiều
   ```

5. **Đặt lịch offline**

   ```
   POST /api/appointments/offline
   Body: {
     patientId: 2,
     doctorId: 3,
     shiftId: 2,
     date: "2025-12-25",
     symptomInitial: "Khám định kỳ tim mạch"
   }
   → Appointment created với bookingType: OFFLINE
   ```

6. **In phiếu hẹn cho bệnh nhân** (future feature)

---

### 🎬 SCENARIO 3: XỬ LÝ CONCURRENCY - 2 NGƯỜI ĐẶT CÙNG LÚC

**Tình huống:**

- Nguyễn Văn A và Trần Văn B cùng đặt lịch cho BS. Nguyễn (doctorId=1), ca Sáng (shiftId=1), ngày 25/12/2025
- Hiện tại có 4 appointments, slot cuối là slot 4
- Cả 2 đều request cùng lúc

**Xử lý:**

```typescript
// Request 1 (Nguyễn Văn A)
BEGIN TRANSACTION (isolation: READ_COMMITTED)

  // 1. Lock doctor_shifts row
  SELECT * FROM doctor_shifts
  WHERE doctorId=1 AND shiftId=1 AND workDate='2025-12-25'
  FOR UPDATE;  // ✓ Lock acquired

  // 2. Find last slot
  SELECT * FROM appointments
  WHERE doctorId=1 AND shiftId=1 AND date='2025-12-25'
  ORDER BY slotNumber DESC
  LIMIT 1;
  // → lastSlot = 4

  // 3. Calculate next slot
  nextSlot = 5

  // 4. Insert
  INSERT INTO appointments (..., slotNumber=5, ...)
  // ✓ Success

COMMIT

// Request 2 (Trần Văn B) - BỊ BLOCK CHO ĐẾN KHI REQUEST 1 COMMIT
BEGIN TRANSACTION

  // 1. Lock doctor_shifts row (WAITING...)
  SELECT * FROM doctor_shifts ... FOR UPDATE;
  // ⏳ Waiting for Request 1 to release lock...
  // ✓ Lock acquired after Request 1 commits

  // 2. Find last slot
  SELECT * ... ORDER BY slotNumber DESC LIMIT 1;
  // → lastSlot = 5 (đã có appointment của Request 1)

  // 3. Calculate next slot
  nextSlot = 6

  // 4. Insert
  INSERT INTO appointments (..., slotNumber=6, ...)
  // ✓ Success

COMMIT
```

**Kết quả:**

- Nguyễn Văn A: slot 5
- Trần Văn B: slot 6
- ✅ Không bị trùng slot!

---

### 🎬 SCENARIO 4: HỦY LỊCH QUÁ MUỘN

**Tình huống:**

- Nguyễn Văn A đặt lịch khám ca Sáng (07:00), ngày 25/12/2025
- Appointment.id = 10
- Bây giờ là 06:30 ngày 25/12/2025 (còn 30 phút nữa)
- A muốn hủy lịch

**Flow:**

```
PUT /api/appointments/10/cancel
Authorization: Bearer <A's token>

→ Backend calculates:
  appointmentTime = "2025-12-25 07:00:00"
  now = "2025-12-25 06:30:00"
  hoursDiff = 0.5 hours

  if (hoursDiff < 2) {
    throw Error("CANCEL_DEADLINE_PASSED")
  }

→ Response 400:
{
  "success": false,
  "message": "CANCEL_DEADLINE_PASSED",
  "detail": "Phải hủy lịch trước ít nhất 2 giờ"
}
```

**Lý do:** Bảo vệ lịch trình của bác sĩ và bệnh viện

---

### 🎬 SCENARIO 5: CA LÀM VIỆC ĐẦY

**Tình huống:**

- BS. Nguyễn Văn A (doctorId=1)
- Ca Sáng (shiftId=1), ngày 25/12/2025
- Đã có 40 appointments (MAX_SLOTS_PER_SHIFT = 40)
- Bệnh nhân mới muốn đặt lịch

**Flow:**

```
POST /api/appointments
Body: {
  doctorId: 1,
  shiftId: 1,
  date: "2025-12-25"
}

→ Backend checks:
  COUNT(*) FROM appointments
  WHERE doctorId=1 AND shiftId=1 AND date='2025-12-25'
  → Result: 40

  if (count >= MAX_SLOTS_PER_SHIFT) {
    throw Error("SHIFT_FULL")
  }

→ Response 400:
{
  "success": false,
  "message": "SHIFT_FULL",
  "detail": "Ca làm việc này đã đầy. Vui lòng chọn ca khác hoặc ngày khác."
}
```

**Giải pháp cho user:**

- Chọn ca khác (Chiều/Tối)
- Chọn ngày khác
- Chọn bác sĩ khác cùng chuyên khoa

---

## 📚 PHỤ LỤC

### A. DEMO ACCOUNTS

| Role         | Email                       | Password | Description                   |
| ------------ | --------------------------- | -------- | ----------------------------- |
| ADMIN        | admin@healthcare.com        | admin123 | Full access                   |
| DOCTOR       | bsnguyen@healthcare.com     | admin123 | BS. Nguyễn Văn A - Nội khoa   |
| DOCTOR       | bstran@healthcare.com       | admin123 | BS. Trần Thị B - Sản phụ khoa |
| DOCTOR       | bsle@healthcare.com         | admin123 | BS. Lê Văn C - Tim mạch       |
| RECEPTIONIST | receptionist@healthcare.com | admin123 | Lễ tân                        |

### B. DATABASE COMMANDS

```bash
# Drop và tạo lại database
npx sequelize-cli db:drop
npx sequelize-cli db:create

# Rollback 1 migration
npx sequelize-cli db:migrate:undo

# Rollback tất cả
npx sequelize-cli db:migrate:undo:all

# Check status
npx sequelize-cli db:migrate:status

# Rollback seeders
npx sequelize-cli db:seed:undo:all
```

### C. ERROR CODES

| Code                   | HTTP | Description                     |
| ---------------------- | ---- | ------------------------------- |
| REGISTER_SUCCESS       | 200  | Đăng ký thành công              |
| LOGIN_SUCCESS          | 200  | Đăng nhập thành công            |
| UNAUTHORIZED           | 401  | Token không hợp lệ hoặc hết hạn |
| FORBIDDEN              | 403  | Không có quyền truy cập         |
| PATIENT_NOT_SETUP      | 400  | Bệnh nhân chưa setup profile    |
| DOCTOR_NOT_ON_DUTY     | 400  | Bác sĩ không trực ca đó         |
| DAY_FULL               | 400  | Ngày đã đầy (40 lịch)           |
| SHIFT_FULL             | 400  | Ca đã đầy (40 slots)            |
| CANCEL_DEADLINE_PASSED | 400  | Hủy quá muộn (< 2 giờ)          |
| APPOINTMENT_NOT_FOUND  | 404  | Không tìm thấy lịch hẹn         |
| EMAIL_INVALID          | 400  | Email không hợp lệ              |
| PASSWORD_WEAK          | 400  | Mật khẩu quá yếu                |
| CCCD_INVALID           | 400  | CCCD không đúng định dạng       |

### D. BUSINESS RULES SUMMARY

```typescript
// Booking Configuration
MAX_SLOTS_PER_SHIFT = 40
MAX_APPOINTMENTS_PER_DAY = 40
SLOT_MINUTES = 10
CANCEL_BEFORE_HOURS = 2

// Patient Code Format
Pattern: BN + 6 digits (BN000001)

// Doctor Code Format
Pattern: BS + 6 digits (BS000001)

// CCCD Format
Pattern: 12 digits (001090012345)

// Password Requirements
- Min length: 8
- Must have: uppercase, lowercase, number

// Appointment Slot Calculation
slotNumber = auto-increment (1, 2, 3, ...)
appointmentTime = shift.startTime + (slotNumber - 1) * 10 minutes

// Unique Constraints
- users.email
- patients.patientCode
- patients.cccd
- doctors.doctorCode
- doctors.userId (1 user = 1 doctor max)
- doctor_shifts(doctorId, shiftId, workDate)
- appointments(doctorId, shiftId, date, slotNumber)
- visits.appointmentId (1 appointment = 1 visit max)
```

---

## 🎓 KẾT LUẬN

Đây là một hệ thống quản lý phòng khám hoàn chỉnh với các tính năng:

✅ **Authentication & Authorization** với JWT
✅ **Role-Based Access Control** (RBAC)
✅ **Patient Management** với flexible profiles
✅ **Doctor & Specialty Management**
✅ **Shift Management** với doctor assignment
✅ **Appointment Booking** với:

- Concurrent booking prevention
- Slot auto-assignment
- Daily & shift limits
- Cancellation policy
  ✅ **Visit Management** với check-in và diagnosis
  ✅ **Input Validation** với express-validator
  ✅ **Security** với bcrypt, helmet, rate-limit

**Database:** 12 tables, quan hệ rõ ràng, normalized tốt
**API:** RESTful, consistent response format
**Nghiệp vụ:** Realistic, cover real-world scenarios

---

**📝 Tài liệu này có thể dùng để:**

- Hướng dẫn setup và test hệ thống
- Demo cho khách hàng/giảng viên
- Onboarding cho developer mới
- Tài liệu đồ án tốt nghiệp

---

**Version:** 1.0.0
**Last Updated:** 2025-12-24
**Author:** Healthcare Management System Team

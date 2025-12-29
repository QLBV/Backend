# 📘 HƯỚNG DẪN TEST API - HEALTHCARE MANAGEMENT SYSTEM

**Version:** 3.0.0
**Last Updated:** 2025-12-26
**API Base URL:** `http://localhost:3000/api`

---

## 📋 MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Core Module APIs](#3-core-module-apis)
   - [Patient Management](#31-patient-management)
   - [Doctor Management](#32-doctor-management)
   - [Appointment Management](#33-appointment-management)
4. [Medicine Management APIs](#4-medicine-management-apis)
5. [Prescription Management APIs](#5-prescription-management-apis)
6. [Reschedule & Notification APIs](#6-reschedule--notification-apis)
7. [Test Scenarios](#7-test-scenarios)
8. [Common Errors](#8-common-errors)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│              HEALTHCARE MANAGEMENT SYSTEM                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   PATIENT    │  │   DOCTOR     │  │   MEDICINE   │  │
│  │  MANAGEMENT  │  │  MANAGEMENT  │  │  MANAGEMENT  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                 │                   │         │
│         └─────────┬───────┴─────┬─────────────┘         │
│                   ▼             ▼                        │
│           ┌──────────────────────────┐                  │
│           │   APPOINTMENT SYSTEM     │                  │
│           └───────────┬──────────────┘                  │
│                       │                                  │
│                       ▼                                  │
│           ┌──────────────────────────┐                  │
│           │  PRESCRIPTION SYSTEM     │                  │
│           │  - Auto Stock Deduction  │                  │
│           │  - Pessimistic Locking   │                  │
│           └──────────────────────────┘                  │
│                       │                                  │
│         ┌─────────────┴─────────────┐                   │
│         ▼                           ▼                    │
│  ┌──────────────┐          ┌──────────────┐            │
│  │  RESCHEDULE  │          │ NOTIFICATION │            │
│  │    SYSTEM    │          │    SYSTEM    │            │
│  └──────────────┘          └──────────────┘            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Modules

#### **Core Modules** (v1.0.0)
- ✅ Patient Management - Quản lý bệnh nhân
- ✅ Doctor Management - Quản lý bác sĩ
- ✅ Appointment Booking - Đặt lịch khám
- ✅ Visit Management - Quản lý phiếu khám
- ✅ Reschedule System - Tự động chuyển lịch
- ✅ Notification System - Email + In-app

#### **New Modules** (v2.0.0)
- ✅ Medicine Management - Quản lý thuốc + Tồn kho
- ✅ Prescription Management - Kê đơn thuốc
- ✅ Inventory Management - Tự động trừ kho
- ✅ Disease Categories - Danh mục bệnh (ICD-10)
- ✅ PDF Export - Xuất đơn thuốc PDF

### 1.3 Roles và Permissions

| Role | Mô tả | Quyền hạn |
|------|-------|-----------|
| **ADMIN** | Quản trị viên | Full access, quản lý thuốc, reschedule |
| **DOCTOR** | Bác sĩ | Kê đơn, khám bệnh, xem thuốc |
| **RECEPTIONIST** | Lễ tân | Đặt lịch, check-in |
| **PATIENT** | Bệnh nhân | Đặt lịch online, xem đơn thuốc |

---

## 2. AUTHENTICATION & AUTHORIZATION

### 2.1 Login API

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "doctor1@example.com",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 8,
      "email": "doctor1@example.com",
      "fullName": "BS. Nguyễn Văn Tâm",
      "roleId": 4,
      "roleName": "DOCTOR"
    }
  }
}
```

### 2.2 Tài khoản test

| Email | Password | Role | ID | Mô tả |
|-------|----------|------|-----|-------|
| `admin@example.com` | `password123` | ADMIN | 1 | Quản trị viên |
| `doctor1@example.com` | `password123` | DOCTOR | 8 | BS. Nguyễn Văn Tâm (Tim mạch) |
| `doctor2@example.com` | `password123` | DOCTOR | 9 | BS. Trần Thị Hương (Nội khoa) |
| `patient1@example.com` | `password123` | PATIENT | 3 | Lê Văn Bệnh Nhân 1 |

### 2.3 Sử dụng Token

Thêm header vào mọi request:
```
Authorization: Bearer {accessToken}
```

---

## 3. CORE MODULE APIs

### 3.1 Patient Management

#### **Setup Patient Profile**
```http
POST /api/patients/setup
Authorization: Bearer {patient_token}
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
    }
  ]
}
```

### 3.2 Doctor Management

#### **Get All Doctors**
```http
GET /api/doctors
Authorization: Bearer {token}
```

#### **Get Doctors On Duty**
```http
GET /api/doctor-shifts/on-duty?date=2025-12-26&shiftId=1
Authorization: Bearer {token}
```

### 3.3 Appointment Management

#### **Create Appointment (Patient)**
```http
POST /api/appointments
Authorization: Bearer {patient_token}
Content-Type: application/json

{
  "doctorId": 1,
  "shiftId": 1,
  "date": "2025-12-26",
  "symptomInitial": "Đau đầu, sốt nhẹ"
}
```

#### **Cancel Appointment**
```http
PUT /api/appointments/:id/cancel
Authorization: Bearer {patient_token}
```

---

## 4. MEDICINE MANAGEMENT APIs

### 4.1 Tạo thuốc mới

**Endpoint:** `POST /api/medicines`
**Role:** ADMIN
**Authorization:** Required

**Request Body:**
```json
{
  "name": "Paracetamol 500mg",
  "group": "Giảm đau - Hạ sốt",
  "activeIngredient": "Paracetamol",
  "manufacturer": "Công ty Dược Hậu Giang",
  "unit": "VIEN",
  "importPrice": 100,
  "salePrice": 200,
  "quantity": 10000,
  "minStockLevel": 1000,
  "expiryDate": "2027-03-31",
  "description": "Thuốc giảm đau, hạ sốt thông dụng"
}
```

**Field Descriptions:**

| Field | Type | Required | Mô tả | Ví dụ |
|-------|------|----------|-------|-------|
| `name` | string | ✅ | Tên thuốc (max 200) | "Amoxicillin 500mg" |
| `group` | string | ✅ | Nhóm thuốc | "Kháng sinh" |
| `activeIngredient` | string | ❌ | Hoạt chất | "Paracetamol" |
| `manufacturer` | string | ❌ | Nhà sản xuất | "DHG Pharma" |
| `unit` | enum | ✅ | Đơn vị tính | VIEN, ML, HOP, CHAI, TUYP, GOI |
| `importPrice` | number | ✅ | Giá nhập (VNĐ) | 100, 500 |
| `salePrice` | number | ✅ | Giá bán (VNĐ) | 200, 1000 |
| `quantity` | number | ✅ | Tồn kho ban đầu | 0, 5000 |
| `minStockLevel` | number | ❌ | Mức tồn tối thiểu | 10 (default) |
| `expiryDate` | date | ✅ | Ngày hết hạn | "2026-12-31" |
| `description` | text | ❌ | Mô tả | "Kháng sinh..." |

**Response Success (201):**
```json
{
  "success": true,
  "message": "Medicine created successfully",
  "data": {
    "id": 16,
    "medicineCode": "MED-000016",
    "name": "Paracetamol 500mg",
    "group": "Giảm đau - Hạ sốt",
    "unit": "VIEN",
    "salePrice": "200.00",
    "quantity": 10000,
    "status": "ACTIVE"
  }
}
```

**Nghiệp vụ:**
- `medicineCode` tự động sinh theo format `MED-XXXXXX` (6 chữ số)
- `status` mặc định là `ACTIVE`
- Hệ thống kiểm tra duplicate `medicineCode` (unique)

### 4.2 Nhập kho thuốc

**Endpoint:** `POST /api/medicines/:id/import`
**Role:** ADMIN

**Request Body:**
```json
{
  "quantity": 5000,
  "importPrice": 95
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Medicine imported successfully",
  "data": {
    "medicine": {
      "id": 16,
      "medicineCode": "MED-000016",
      "quantity": 15000,
      "importPrice": "95.00"
    },
    "importRecord": {
      "id": 9,
      "medicineId": 16,
      "quantity": 5000,
      "importPrice": "95.00",
      "userId": 1
    }
  }
}
```

**Nghiệp vụ:**
1. Cộng dồn số lượng: `quantity_mới = quantity_cũ + quantity_nhập`
2. Cập nhật giá nhập: `importPrice` được cập nhật
3. Lưu lịch sử: Tạo record trong `medicine_imports`

### 4.3 Xem danh sách thuốc

**Endpoint:** `GET /api/medicines`
**Role:** DOCTOR, ADMIN

**Query Parameters:**
- `status`: Lọc theo trạng thái (ACTIVE, EXPIRED, REMOVED)
- `group`: Lọc theo nhóm thuốc
- `lowStock`: Chỉ hiện thuốc sắp hết (true/false)
- `search`: Tìm kiếm theo tên/mã

**Ví dụ:**
```bash
GET /api/medicines?status=ACTIVE
GET /api/medicines?lowStock=true
GET /api/medicines?search=Paracetamol
```

### 4.4 Xem lịch sử xuất kho (Audit Trail)

**Endpoint:** `GET /api/medicines/:id/exports`
**Role:** ADMIN

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "medicineId": 1,
      "quantity": 21,
      "exportDate": "2025-12-27T08:45:00.000Z",
      "userId": 1,
      "reason": "PRESCRIPTION_RX-20251227-00001",
      "user": {
        "fullName": "Nguyễn Văn Admin"
      }
    }
  ]
}
```

**Reason format:**
- `PRESCRIPTION_{prescriptionCode}` - Xuất cho đơn thuốc
- `ADJUSTMENT` - Điều chỉnh tồn kho
- `EXPIRED` - Hủy thuốc hết hạn
- `DAMAGED` - Thuốc hỏng

---

## 5. PRESCRIPTION MANAGEMENT APIs

### 5.1 Kê đơn thuốc mới

**Endpoint:** `POST /api/prescriptions`
**Role:** DOCTOR
**Authorization:** Required

**Request Body:**
```json
{
  "visitId": 1,
  "patientId": 3,
  "medicines": [
    {
      "medicineId": 1,
      "quantity": 21,
      "dosageMorning": 1,
      "dosageNoon": 1,
      "dosageAfternoon": 1,
      "dosageEvening": 0,
      "instruction": "Uống sau ăn 30 phút. Uống đủ 7 ngày liên tục."
    },
    {
      "medicineId": 3,
      "quantity": 10,
      "dosageMorning": 1,
      "dosageNoon": 0,
      "dosageAfternoon": 1,
      "dosageEvening": 1,
      "instruction": "Uống khi sốt trên 38.5°C."
    }
  ],
  "note": "Uống đủ liều kháng sinh, không tự ý ngưng thuốc."
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Prescription created successfully",
  "data": {
    "id": 6,
    "prescriptionCode": "RX-20251226-00005",
    "visitId": 1,
    "doctorId": 1,
    "patientId": 3,
    "totalAmount": "32000.00",
    "status": "DRAFT",
    "details": [
      {
        "medicineId": 1,
        "medicineName": "Amoxicillin 500mg",
        "quantity": 21,
        "unitPrice": "1000.00"
      },
      {
        "medicineId": 3,
        "medicineName": "Paracetamol 500mg",
        "quantity": 10,
        "unitPrice": "200.00"
      }
    ]
  }
}
```

**Nghiệp vụ chi tiết:**

#### Bước 1: Validate
- Kiểm tra `visitId` tồn tại
- Kiểm tra visit thuộc bác sĩ đang login
- Kiểm tra visit chưa có đơn thuốc (1 visit = 1 prescription)
- Kiểm tra từng `medicineId` tồn tại và status = ACTIVE

#### Bước 2: Kiểm tra tồn kho (Pessimistic Locking)
- **Lock** từng medicine record để tránh race condition
```sql
SELECT * FROM medicines WHERE id = 1 FOR UPDATE;
```
- Kiểm tra `medicine.quantity >= requested.quantity`
- Nếu không đủ → Error `INSUFFICIENT_STOCK_{medicineName}`

#### Bước 3: Tạo Prescription
- Sinh `prescriptionCode`: `RX-YYYYMMDD-XXXXX`
- Tính `totalAmount` = Σ(quantity × salePrice)
- Status mặc định: `DRAFT`

#### Bước 4: Snapshot giá
- Lưu `medicineName`, `unit`, `unitPrice` tại thời điểm kê đơn
- Tránh giá thay đổi sau này ảnh hưởng đơn cũ

#### Bước 5: Trừ kho tự động
- `medicine.quantity -= requested.quantity`
- Tạo record `medicine_exports`:
```json
{
  "medicineId": 1,
  "quantity": 21,
  "reason": "PRESCRIPTION_RX-20251226-00005"
}
```

#### Bước 6: Transaction
- Toàn bộ chạy trong **1 transaction**
- Nếu có lỗi → **rollback tất cả**
- Isolation level: `READ_COMMITTED`

**Error khi thiếu thuốc:**
```json
{
  "success": false,
  "message": "Insufficient medicine stock",
  "error": "INSUFFICIENT_STOCK_Amoxicillin 500mg: Required 100, Available 21"
}
```

### 5.2 Cập nhật đơn thuốc

**Endpoint:** `PUT /api/prescriptions/:id`
**Role:** DOCTOR

**Điều kiện:**
- ✅ Chỉ cập nhật được khi `status = DRAFT`
- ❌ Không thể cập nhật khi `status = LOCKED` (đã thanh toán)
- ✅ Chỉ bác sĩ kê đơn mới được cập nhật

**Quy trình:**
1. Hoàn trả kho (restore stock) - thuốc cũ
2. Xóa chi tiết cũ
3. Áp dụng thuốc mới (validate, trừ kho)
4. Cập nhật totalAmount

### 5.3 Hủy đơn thuốc

**Endpoint:** `POST /api/prescriptions/:id/cancel`
**Role:** DOCTOR

**Điều kiện:**
- ✅ Chỉ hủy được khi `status = DRAFT`
- ❌ Không thể hủy khi `status = LOCKED`

**Quy trình:**
1. Hoàn trả kho (restore stock)
2. Cập nhật `status = CANCELLED`

### 5.4 Xuất đơn thuốc PDF

**Endpoint:** `GET /api/prescriptions/:id/pdf`
**Role:** DOCTOR, PATIENT (chỉ đơn của mình)

**Response:**
- **Content-Type:** `application/pdf`
- **Content-Disposition:** `attachment; filename="Prescription_RX-20251227-00001.pdf"`

**Nội dung PDF bao gồm:**
- Thông tin bác sĩ + chuyên khoa
- Thông tin bệnh nhân
- Chẩn đoán + triệu chứng
- Danh sách thuốc (STT, Tên, SL, Đơn giá, Liều dùng)
- Tổng tiền
- Lời dặn của bác sĩ
- Chữ ký số (Digital Signature)

---

## 6. RESCHEDULE & NOTIFICATION APIs

### 6.1 Preview Reschedule

**Endpoint:** `GET /api/doctor-shifts/:id/reschedule-preview`
**Role:** ADMIN

**Response:**
```json
{
  "success": true,
  "data": {
    "doctorShiftId": 123,
    "affectedAppointments": 5,
    "hasReplacementDoctor": true,
    "replacementDoctorId": 456,
    "canAutoReschedule": true
  }
}
```

### 6.2 Cancel & Reschedule

**Endpoint:** `POST /api/doctor-shifts/:id/cancel-and-reschedule`
**Role:** ADMIN

**Request:**
```json
{
  "cancelReason": "Bác sĩ bị ốm"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã xử lý 5 lịch hẹn. Chuyển thành công 5 lịch.",
  "data": {
    "totalAppointments": 5,
    "rescheduledCount": 5,
    "failedCount": 0
  }
}
```

### 6.3 Notifications

**Get Notifications:**
```http
GET /api/notifications?page=1&limit=10&isRead=false
Authorization: Bearer {token}
```

**Unread Count:**
```http
GET /api/notifications/unread-count
Authorization: Bearer {token}
```

**Mark as Read:**
```http
PUT /api/notifications/:id/mark-read
Authorization: Bearer {token}
```

**Mark All as Read:**
```http
PUT /api/notifications/mark-all-read
Authorization: Bearer {token}
```

---

## 7. TEST SCENARIOS

### Scenario 1: Kê đơn thuốc thành công

**Preconditions:**
- Đăng nhập với `doctor1@example.com`
- Visit ID = 13 chưa có đơn thuốc
- Amoxicillin (ID=1) tồn kho: 5000 viên
- Paracetamol (ID=3) tồn kho: 10000 viên

**Steps:**
1. Login → Lưu token
2. Kê đơn với 21 viên Amoxicillin + 10 viên Paracetamol
3. Verify: prescriptionCode = `RX-YYYYMMDD-XXXXX`
4. Verify: totalAmount = 23,000 VNĐ
5. Verify: Amoxicillin còn 4979, Paracetamol còn 9990
6. Verify: Có record trong `medicine_exports`

### Scenario 2: Kê đơn thất bại - Thiếu thuốc

**Preconditions:**
- Prospan (ID=11) chỉ còn 500 chai

**Steps:**
1. Kê đơn với 1000 chai Prospan
2. Expected: Error 400 `INSUFFICIENT_STOCK_Prospan 100ml`
3. Verify: Kho **không thay đổi** (rollback)

### Scenario 3: Race Condition - 2 bác sĩ kê đồng thời

**Preconditions:**
- Thuốc X còn 100 viên

**Steps:**
1. Doctor A kê 60 viên (thành công → còn 40)
2. Doctor B kê 60 viên (thất bại - thiếu thuốc)
3. Verify: Kho cuối cùng = 40 viên (đúng)

### Scenario 4: Cập nhật đơn thuốc

**Steps:**
1. Tạo đơn: Amoxicillin 21 viên + Paracetamol 10 viên
2. Cập nhật: Giảm Amoxicillin xuống 14 + Thêm Omeprazole 30 viên
3. Verify: Kho Amoxicillin tăng 7, Paracetamol tăng 10, Omeprazole giảm 30

### Scenario 5: Hủy đơn và hoàn trả kho

**Steps:**
1. Tạo đơn có Amoxicillin 14 viên
2. Hủy đơn
3. Verify: Kho Amoxicillin tăng 14
4. Verify: Status = CANCELLED

---

## 8. COMMON ERRORS

### 8.1 Authentication Errors

| Error | HTTP | Giải pháp |
|-------|------|-----------|
| `NO_TOKEN` | 401 | Thiếu Authorization header |
| `INVALID_TOKEN` | 401 | Token sai hoặc hết hạn → Login lại |
| `FORBIDDEN` | 403 | Không có quyền truy cập |

### 8.2 Medicine Errors

| Error | HTTP | Mô tả |
|-------|------|-------|
| `MEDICINE_NOT_FOUND` | 404 | Thuốc không tồn tại |
| `INSUFFICIENT_STOCK_{name}` | 400 | Không đủ tồn kho |
| `CANNOT_REMOVE_MEDICINE_WITH_STOCK` | 400 | Còn tồn kho, không thể xóa |

### 8.3 Prescription Errors

| Error | HTTP | Mô tả |
|-------|------|-------|
| `PRESCRIPTION_NOT_FOUND` | 404 | Đơn thuốc không tồn tại |
| `PRESCRIPTION_ALREADY_EXISTS` | 400 | Visit đã có đơn (1 visit = 1 prescription) |
| `PRESCRIPTION_LOCKED_CANNOT_EDIT` | 400 | Đơn đã khóa, không thể sửa |
| `PRESCRIPTION_LOCKED_CANNOT_CANCEL` | 400 | Đơn đã khóa, không thể hủy |
| `UNAUTHORIZED_VISIT` | 403 | Không phải bác sĩ của visit |

### 8.4 Business Logic Errors

**Bác sĩ không trực:**
```json
{
  "error": "DOCTOR_NOT_AVAILABLE",
  "message": "Bác sĩ không có ca trực vào ngày này"
}
```

**Validation Error:**
```json
{
  "error": "VALIDATION_ERROR",
  "details": [
    { "field": "quantity", "message": "Quantity must be greater than 0" }
  ]
}
```

---

## 9. POSTMAN COLLECTION

### 9.1 Environment Setup

```json
{
  "name": "Healthcare Local",
  "values": [
    { "key": "baseUrl", "value": "http://localhost:3000/api" },
    { "key": "adminToken", "value": "" },
    { "key": "doctorToken", "value": "" },
    { "key": "patientToken", "value": "" }
  ]
}
```

### 9.2 Workflow

1. **Login as Admin/Doctor/Patient** → Token tự động lưu
2. **Test các API** → Requests đã config sẵn Authorization header
3. **Chỉ cần click Send**

---

## 10. CHANGELOG

### Version 3.0.0 (2025-12-26)
- ✅ Gộp 3 file API Test Guide thành 1
- ✅ Thêm Medicine Management module
- ✅ Thêm Prescription Management module
- ✅ Thêm chi tiết Pessimistic Locking
- ✅ Thêm chi tiết Price Snapshot
- ✅ Thêm Audit Trail (medicine_exports)
- ✅ Thêm PDF export feature
- ✅ Cập nhật test scenarios

### Version 2.0.0 (2025-12-25)
- ✅ Reschedule System
- ✅ Notification System

### Version 1.0.0 (2025-12-24)
- ✅ Core features (Patient, Doctor, Appointment)

---

**Happy Testing! 🚀**

Xem thêm:
- [Database Schema](./DATABASE-SCHEMA.md)
- [Reschedule System](./RESCHEDULE-SYSTEM.md)
- [Notification System](./NOTIFICATION-SYSTEM.md)

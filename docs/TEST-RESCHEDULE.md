# 🧪 Test Reschedule System - Debug Guide

## Bước 1: Kiểm tra sample data đã import chưa

```bash
# Login vào MySQL
mysql -u root -p healthcare_db

# Kiểm tra doctor_shifts
SELECT id, doctorId, shiftId, workDate, status FROM doctor_shifts WHERE id = 1;

# Kết quả mong đợi:
# id=1, doctorId=1, shiftId=1, workDate='2025-12-26', status='ACTIVE'

# Kiểm tra appointments của doctor 1 trong shift 1 ngày 26/12
SELECT id, patientId, doctorId, shiftId, date, status
FROM appointments
WHERE doctorId = 1 AND shiftId = 1 AND date = '2025-12-26';

# Kết quả mong đợi: 2 appointments (id=1, id=2)

# Thoát MySQL
exit;
```

---

## Bước 2: Login với ADMIN để lấy token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

**Response mẫu:**
```json
{
  "success": true,
  "message": "LOGIN_SUCCESS",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVJZCI6MSwicGF0aWVudElkIjpudWxsLCJkb2N0b3JJZCI6bnVsbCwiaWF0IjoxNzM1MjA5NjAwLCJleHAiOjE3MzUyMTA1MDB9.xxx",
    "refreshToken": "..."
  },
  "user": {
    "userId": 1,
    "roleId": 1,
    "patientId": null,
    "doctorId": null
  }
}
```

**⚠️ Copy accessToken từ response!**

---

## Bước 3: Test Preview trước (không thực sự hủy)

```bash
# Thay YOUR_ADMIN_TOKEN bằng token từ bước 2
curl -X GET http://localhost:3000/api/doctor-shifts/1/reschedule-preview \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response mẫu (nếu thành công):**
```json
{
  "success": true,
  "data": {
    "doctorShiftId": 1,
    "affectedAppointments": 2,
    "hasReplacementDoctor": true,
    "replacementDoctorId": 5,
    "canAutoReschedule": true,
    "warning": null
  }
}
```

**Nếu thấy lỗi "Không tìm thấy ca làm việc":**
- Kiểm tra lại sample data đã import chưa
- Kiểm tra doctor_shift id=1 có tồn tại không
- Kiểm tra URL có đúng `http://localhost:3000` không (PORT từ .env)

---

## Bước 4: Thực hiện Cancel & Reschedule

```bash
curl -X POST http://localhost:3000/api/doctor-shifts/1/cancel-and-reschedule \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cancelReason": "Bác sĩ nghỉ ốm đột ngột"
  }'
```

**Response mẫu (nếu thành công):**
```json
{
  "success": true,
  "message": "Đã xử lý 2 lịch hẹn. Chuyển thành công 2 lịch. ",
  "data": {
    "success": true,
    "totalAppointments": 2,
    "rescheduledCount": 2,
    "failedCount": 0,
    "details": [
      {
        "appointmentId": 1,
        "patientId": 1,
        "oldDoctorId": 1,
        "newDoctorId": 5,
        "success": true
      },
      {
        "appointmentId": 2,
        "patientId": 2,
        "oldDoctorId": 1,
        "newDoctorId": 5,
        "success": true
      }
    ]
  }
}
```

---

## Bước 5: Kiểm tra kết quả

### 5.1. Kiểm tra doctor_shift đã bị hủy

```bash
curl -X GET "http://localhost:3000/api/doctor-shifts/on-duty?date=2025-12-26&shiftId=1" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 5.2. Kiểm tra appointments đã chuyển sang bác sĩ mới

```bash
# Xem lịch hẹn của bệnh nhân 1
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient1@example.com","password":"password123"}'

# Lấy token patient, sau đó:
curl -X GET http://localhost:3000/api/appointments \
  -H "Authorization: Bearer YOUR_PATIENT_TOKEN"
```

**Kết quả mong đợi:** Appointment id=1 đã chuyển từ `doctorId: 1` → `doctorId: 5`

### 5.3. Kiểm tra notifications đã được tạo

```bash
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_PATIENT_TOKEN"
```

**Kết quả mong đợi:** Có notification mới với type `DOCTOR_CHANGED`

---

## 🔧 Troubleshooting

### Lỗi 1: "Không tìm thấy ca làm việc"

**Nguyên nhân:**
- Doctor shift id=1 không tồn tại trong database
- Sample data chưa import

**Giải pháp:**
```bash
# Kiểm tra trong MySQL
mysql -u root -p healthcare_db
SELECT * FROM doctor_shifts LIMIT 5;

# Nếu rỗng → import lại sample data
# File: docs/sample-data.sql
```

### Lỗi 2: "FORBIDDEN" hoặc 403

**Nguyên nhân:** Không phải ADMIN role

**Giải pháp:** Login với `admin@example.com` và dùng token từ admin

### Lỗi 3: "NO_TOKEN" hoặc 401

**Nguyên nhân:** Thiếu Authorization header

**Giải pháp:** Thêm `-H "Authorization: Bearer YOUR_TOKEN"`

### Lỗi 4: "Không tìm thấy bác sĩ thay thế"

**Nguyên nhân:**
- Không có bác sĩ cùng chuyên khoa trực cùng ca
- Sample data không đầy đủ

**Giải pháp:**
```bash
# Kiểm tra bác sĩ cùng chuyên khoa
SELECT d.id, d.doctorCode, d.specialtyId, s.name
FROM doctors d
JOIN specialties s ON d.specialtyId = s.id
WHERE d.specialtyId = (
  SELECT specialtyId FROM doctors WHERE id = 1
);

# Kiểm tra ai đang trực cùng ca
SELECT ds.id, ds.doctorId, ds.shiftId, ds.workDate, ds.status
FROM doctor_shifts ds
WHERE ds.shiftId = 1 AND ds.workDate = '2025-12-26' AND ds.status = 'ACTIVE';
```

### Lỗi 5: Server không chạy

**Triệu chứng:** `curl: (7) Failed to connect`

**Giải pháp:**
```bash
# Kiểm tra server có chạy không
npm run dev

# Kiểm tra PORT trong .env (mặc định 3000)
# Nếu .env có PORT=5000 thì dùng http://localhost:5000
```

---

## 📋 Checklist Debug

- [ ] Sample data đã import thành công
- [ ] Database có doctor_shifts với id=1
- [ ] Server đang chạy (npm run dev)
- [ ] Đã login với admin@example.com
- [ ] Token được gửi kèm trong header
- [ ] URL đúng với PORT trong .env
- [ ] Có bác sĩ cùng chuyên khoa để thay thế

---

## 🎯 Test với Postman

Nếu dùng Postman, tạo collection như sau:

**1. Login Admin**
```
POST http://localhost:3000/api/auth/login
Body (JSON):
{
  "email": "admin@example.com",
  "password": "password123"
}

→ Save accessToken vào Collection Variable "adminToken"
```

**2. Preview Reschedule**
```
GET http://localhost:3000/api/doctor-shifts/1/reschedule-preview
Headers:
Authorization: Bearer {{adminToken}}
```

**3. Cancel & Reschedule**
```
POST http://localhost:3000/api/doctor-shifts/1/cancel-and-reschedule
Headers:
Authorization: Bearer {{adminToken}}
Content-Type: application/json

Body (JSON):
{
  "cancelReason": "Bác sĩ nghỉ ốm"
}
```

---

**💡 TIP:** Sử dụng Thunder Client (VS Code Extension) để test API nhanh hơn curl!

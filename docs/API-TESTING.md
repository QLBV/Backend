# 🧪 API Testing Guide

## 📋 Mục lục
- [Setup môi trường](#setup-môi-trường)
- [Authentication](#authentication)
- [Core APIs](#core-apis)
- [Common Errors](#common-errors)

---

## 🛠️ Setup môi trường

### **1. Khởi động server**
```bash
npm run dev
# Server: http://localhost:3000
```

### **2. Tools đề xuất**
- **Postman** / **Thunder Client** (VS Code)
- **curl** (command line)

### **3. Tài khoản test**

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `admin123` | Admin |
| `patient1@example.com` | `password123` | Patient |
| `doctor1@example.com` | `doctor123` | Doctor |

---

## 🔐 Authentication

Tất cả API cần JWT token trong header:
```
Authorization: Bearer {your_jwt_token}
```

### **Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": 1, "email": "patient@example.com" }
  }
}
```

---

## 📡 Core APIs

### **1. Doctors**

**Lấy danh sách bác sĩ:**
```http
GET /api/doctors
Authorization: Bearer {token}
```

**Xem bác sĩ trực:**
```http
GET /api/doctor-shifts/on-duty?shiftId=1&workDate=2025-12-26
Authorization: Bearer {token}
```

---

### **2. Appointments**

**Tạo lịch hẹn:**
```http
POST /api/appointments
Authorization: Bearer {patient_token}
Content-Type: application/json

{
  "doctorId": 1,
  "shiftId": 1,
  "date": "2025-12-26",
  "symptomInitial": "Đau đầu"
}
```

**Lấy lịch hẹn của mình:**
```http
GET /api/appointments
Authorization: Bearer {patient_token}
```

**Hủy lịch hẹn:**
```http
DELETE /api/appointments/:id
Authorization: Bearer {patient_token}
```

---

### **3. Reschedule (Admin only)**

**Preview reschedule:**
```http
GET /api/doctor-shifts/:id/reschedule-preview
Authorization: Bearer {admin_token}
```

**Cancel & Reschedule:**
```http
POST /api/doctor-shifts/:id/cancel-and-reschedule
Authorization: Bearer {admin_token}
Content-Type: application/json

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

---

### **4. Notifications**

**Lấy danh sách notifications:**
```http
GET /api/notifications?page=1&limit=10&isRead=false
Authorization: Bearer {token}
```

**Đếm notifications chưa đọc:**
```http
GET /api/notifications/unread-count
Authorization: Bearer {token}
```

**Đánh dấu đã đọc:**
```http
PUT /api/notifications/:id/mark-read
Authorization: Bearer {token}
```

**Đánh dấu tất cả đã đọc:**
```http
PUT /api/notifications/mark-all-read
Authorization: Bearer {token}
```

---

## ❌ Common Errors

### **1. Authentication Errors**

**401 Unauthorized:**
```json
{ "error": "NO_TOKEN" }
```
→ Thiếu Authorization header

**401 Invalid Token:**
```json
{ "error": "INVALID_TOKEN" }
```
→ Token sai hoặc hết hạn → Login lại

---

### **2. Permission Errors**

**403 Forbidden:**
```json
{ "error": "FORBIDDEN" }
```
→ Không có quyền truy cập endpoint này

---

### **3. Validation Errors**

**400 Bad Request:**
```json
{
  "error": "VALIDATION_ERROR",
  "details": [
    { "field": "email", "message": "Email không hợp lệ" }
  ]
}
```

---

### **4. Business Logic Errors**

**Bác sĩ không trực:**
```json
{
  "error": "DOCTOR_NOT_AVAILABLE",
  "message": "Bác sĩ không có ca trực vào ngày này"
}
```

**Không tìm thấy bác sĩ thay thế:**
```json
{
  "warning": "Không tìm thấy bác sĩ thay thế cùng chuyên khoa"
}
```

---

## 🧪 Test Flow hoàn chỉnh

### **Scenario: Bệnh nhân đặt lịch và nhận thông báo**

```bash
# 1. Login patient
POST /api/auth/login
Body: { "email": "patient1@example.com", "password": "password123" }
→ Lưu token

# 2. Xem bác sĩ trực
GET /api/doctor-shifts/on-duty?shiftId=1&workDate=2025-12-26
→ Chọn doctorId

# 3. Đặt lịch
POST /api/appointments
Body: { "doctorId": 1, "shiftId": 1, "date": "2025-12-26", "symptomInitial": "Đau đầu" }
→ Tạo appointment + Email gửi + Notification tạo

# 4. Check notifications
GET /api/notifications/unread-count
→ Response: { "count": 1 }

GET /api/notifications
→ Thấy notification "Lịch khám mới được tạo"

# 5. Mark as read
PUT /api/notifications/1/mark-read
→ isRead = true
```

---

## 📝 Tips

- Dùng Postman Collections để lưu requests
- Tạo Environment variables cho `baseUrl` và `token`
- Check console log server để xem events
- Kiểm tra email inbox sau khi tạo/hủy lịch

---

Xem chi tiết:
- [RESCHEDULE-SYSTEM.md](./RESCHEDULE-SYSTEM.md) - Chi tiết reschedule logic
- [NOTIFICATION-SYSTEM.md](./NOTIFICATION-SYSTEM.md) - Chi tiết notification
- [TEST-RESCHEDULE.md](./TEST-RESCHEDULE.md) - Hướng dẫn test reschedule

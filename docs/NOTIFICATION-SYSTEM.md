# 📧 Hệ thống Notification & Email

## 📋 Mục lục
- [Tổng quan](#tổng-quan)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Email Templates](#email-templates)
- [Event System](#event-system)
- [API Endpoints](#api-endpoints)
- [Cấu hình](#cấu-hình)

---

## 🎯 Tổng quan

Hệ thống Notification cung cấp 2 kênh thông báo cho bệnh nhân:
1. **📧 Email Notification** - Gửi email fancy qua Gmail SMTP
2. **🔔 In-app Notification** - Lưu trong database, hiển thị trong app

### **Tính năng chính**
- ✅ Gửi email tự động khi có sự kiện
- ✅ 3 loại thông báo: Tạo lịch, Hủy lịch, Đổi bác sĩ
- ✅ Email templates responsive, đẹp mắt
- ✅ Event-driven architecture (EventEmitter)
- ✅ Lưu trữ notification trong DB
- ✅ API CRUD đầy đủ (read, mark as read, count)
- ✅ Graceful degradation (skip email nếu không có config)

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                     USER ACTION                         │
│  (Tạo lịch / Hủy lịch / Admin hủy ca bác sĩ)          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              CONTROLLER / SERVICE                       │
│  - createAppointment()                                  │
│  - cancelAppointment()                                  │
│  - cancelDoctorShiftAndReschedule()                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Emit Event
                   ▼
┌─────────────────────────────────────────────────────────┐
│               EVENT EMITTER                             │
│  - appointment:created                                  │
│  - appointment:cancelled                                │
│  - appointment:doctor_changed                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Event Listener
                   ▼
┌─────────────────────────────────────────────────────────┐
│           NOTIFICATION SERVICE                          │
│  1. Fetch appointment data from DB                      │
│  2. Create notification record                          │
│  3. Build email template (HTML)                         │
│  4. Send email via EmailService                         │
│  5. Update emailSent status                             │
└──────────────────┬──────────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
   ┌──────────┐         ┌──────────┐
   │ DATABASE │         │  EMAIL   │
   │ (notify) │         │ (Gmail)  │
   └──────────┘         └──────────┘
         │
         │ API Request
         ▼
   ┌──────────────────────┐
   │  FRONTEND            │
   │  - GET /notifications│
   │  - Badge count       │
   │  - Mark as read      │
   └──────────────────────┘
```

---

## 🎨 Email Templates

### **1. Appointment Confirmation (Xác nhận lịch khám)**

**Trigger**: Khi bệnh nhân tạo lịch hẹn mới

**Nội dung:**
- ✅ Header gradient purple
- Thông tin: Bác sĩ, Chuyên khoa, Ngày khám, Ca, Số thứ tự
- Lưu ý: Đến sớm 15 phút, mang CMND + BHYT

**Function:**
```typescript
emailTemplates.appointmentConfirmation({
  patientName, doctorName, doctorSpecialty,
  appointmentDate, shiftName, slotNumber, appointmentId
});
```

---

### **2. Appointment Cancellation (Thông báo hủy lịch)**

**Trigger**: Khi lịch hẹn bị hủy

**Nội dung:**
- ❌ Header gradient pink-red
- Thông tin lịch đã hủy
- Lý do hủy
- Link đặt lịch mới

**Function:**
```typescript
emailTemplates.appointmentCancellation({
  patientName, doctorName, appointmentDate,
  shiftName, reason, appointmentId
});
```

---

### **3. Doctor Changed (Thông báo đổi bác sĩ)**

**Trigger**: Khi admin hủy ca bác sĩ → reschedule sang bác sĩ mới

**Nội dung:**
- 🔄 Header gradient yellow-orange
- Bác sĩ cũ (gạch ngang)
- Bác sĩ mới ✓ (màu xanh)
- Lý do thay đổi
- Thông báo: Lịch khám giữ nguyên

**Function:**
```typescript
emailTemplates.doctorChanged({
  patientName, oldDoctorName, newDoctorName,
  newDoctorSpecialty, appointmentDate, shiftName,
  slotNumber, reason, appointmentId
});
```

**Chi tiết templates:** [emailTemplates.ts](../src/templates/emailTemplates.ts)

---

## 🎪 Event System

### **Event Emitter Architecture**

```typescript
// File: src/events/appointmentEvents.ts

class AppointmentEventEmitter extends EventEmitter {
  setupListeners() {
    this.on('appointment:created', async (appointmentId) => {
      await sendAppointmentConfirmation(appointmentId);
    });

    this.on('appointment:cancelled', async ({ appointmentId, reason }) => {
      await sendAppointmentCancellation(appointmentId, reason);
    });

    this.on('appointment:doctor_changed', async ({
      appointmentId, oldDoctorId, newDoctorId, reason
    }) => {
      await sendDoctorChangeNotification(
        appointmentId, oldDoctorId, newDoctorId, reason
      );
    });
  }
}
```

### **Cách sử dụng Events**

**1. Tạo lịch hẹn:**
```typescript
const appointment = await createAppointmentService({...});
notifyAppointmentCreated(appointment.id);
```

**2. Hủy lịch hẹn:**
```typescript
await cancelAppointmentService({...});
notifyAppointmentCancelled(appointmentId, "Bệnh nhân hủy");
```

**3. Đổi bác sĩ:**
```typescript
await appointment.update({ doctorId: replacementDoctorId });
notifyDoctorChanged(appointmentId, oldDoctorId, newDoctorId, reason);
```

---

## 📡 API Endpoints

### **1. Lấy danh sách notifications**
```http
GET /api/notifications?page=1&limit=10&isRead=false
Authorization: Bearer {user_token}
```

**Query Parameters:**
- `page` (optional): Trang hiện tại (default: 1)
- `limit` (optional): Số lượng per page (default: 10)
- `isRead` (optional): Filter theo trạng thái đọc (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 10,
      "type": "APPOINTMENT_CREATED",
      "title": "Lịch khám mới được tạo",
      "message": "Bạn có lịch khám với BS. Trần Thị B vào Sáng ngày 2025-12-26",
      "relatedAppointmentId": 123,
      "isRead": false,
      "emailSent": true,
      "createdAt": "2025-12-25T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### **2. Đếm số notifications chưa đọc**
```http
GET /api/notifications/unread-count
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "success": true,
  "count": 5
}
```

**Use case:** Hiển thị badge số thông báo chưa đọc trên icon 🔔

---

### **3. Đánh dấu 1 notification đã đọc**
```http
PUT /api/notifications/:id/mark-read
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã đánh dấu đọc"
}
```

---

### **4. Đánh dấu tất cả đã đọc**
```http
PUT /api/notifications/mark-all-read
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã đánh dấu 5 thông báo",
  "count": 5
}
```

---

## ⚙️ Cấu hình

### **Email Configuration (Gmail SMTP)**

**File `.env`:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**⚠️ Lưu ý:**
- **KHÔNG dùng password Gmail thường**
- Cần tạo **App Password** từ Google Account:
  1. Vào https://myaccount.google.com/security
  2. Bật "2-Step Verification"
  3. Vào "App passwords"
  4. Tạo password mới cho app "Mail"
  5. Copy password 16 ký tự vào `.env`

### **Graceful Degradation**
- Nếu không có email config → Skip gửi email, không crash
- Log warning ra console
- Vẫn tạo notification trong DB

---

## 📊 Database Schema

### **Bảng `notifications`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Primary key |
| `userId` | INT (FK → users) | User nhận thông báo |
| `type` | ENUM | Loại: APPOINTMENT_CREATED, APPOINTMENT_CANCELLED, DOCTOR_CHANGED |
| `title` | VARCHAR(255) | Tiêu đề ngắn gọn |
| `message` | TEXT | Nội dung chi tiết |
| `relatedAppointmentId` | INT (FK → appointments) | ID lịch hẹn liên quan (nullable) |
| `isRead` | BOOLEAN | Đã đọc chưa (default: false) |
| `emailSent` | BOOLEAN | Đã gửi email chưa (default: false) |
| `emailSentAt` | DATETIME | Thời gian gửi email (nullable) |
| `createdAt` | DATETIME | Thời gian tạo |

**Migration file:** `migrations/20251225182320-create-notifications.js`

**Indexes:**
```sql
INDEX idx_user_read (userId, isRead)
INDEX idx_user_created (userId, createdAt)
```

---

## 🔗 Files liên quan

- **Email Service**: [email.service.ts](../src/services/email.service.ts)
- **Email Templates**: [emailTemplates.ts](../src/templates/emailTemplates.ts)
- **Notification Service**: [notification.service.ts](../src/services/notification.service.ts)
- **Notification Model**: [Notification.ts](../src/models/Notification.ts)
- **Event Emitter**: [appointmentEvents.ts](../src/events/appointmentEvents.ts)
- **Controller**: [notification.controller.ts](../src/controllers/notification.controller.ts)
- **Routes**: [notification.routes.ts](../src/routes/notification.routes.ts)

---

## 🎯 Best Practices

### **1. Error Handling**
- Luôn wrap email sending trong try-catch
- Log errors nhưng không throw (tránh crash app)
- Graceful degradation khi email service fail

### **2. Performance**
- Events chạy async, không block response
- Email gửi sau khi transaction commit
- Sử dụng indexes cho query notifications

### **3. Security**
- Verify user ownership trước khi mark as read
- KHÔNG expose email của user khác
- Rate limit cho email sending (tránh spam)

### **4. UX**
- Notification title ngắn gọn, rõ ràng
- Message có đầy đủ thông tin cần thiết
- Email templates responsive cho mobile

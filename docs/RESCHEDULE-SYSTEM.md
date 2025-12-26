# 🔄 Hệ thống Reschedule Tự động

## 📋 Mục lục
- [Tổng quan](#tổng-quan)
- [Luồng hoạt động](#luồng-hoạt-động)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Logic tìm bác sĩ thay thế](#logic-tìm-bác-sĩ-thay-thế)

---

## 🎯 Tổng quan

Hệ thống Reschedule cho phép admin hủy ca làm việc của bác sĩ và **tự động chuyển tất cả lịch hẹn** sang bác sĩ thay thế cùng chuyên khoa.

### **Tính năng chính**
- ✅ Tìm bác sĩ thay thế tự động (cùng chuyên khoa, cùng ca, cùng ngày)
- ✅ Load balancing (chọn bác sĩ có ít lịch nhất)
- ✅ Transaction safety (rollback nếu có lỗi)
- ✅ Tự động gửi email thông báo cho bệnh nhân
- ✅ Preview trước khi thực hiện
- ✅ Khôi phục ca đã hủy

---

## 🔄 Luồng hoạt động

### **1. Admin Preview trước khi hủy**
```
GET /api/doctor-shifts/:id/reschedule-preview
↓
Kiểm tra ca làm việc tồn tại?
↓
Tìm bác sĩ thay thế (nếu có)
↓
Đếm số lịch hẹn bị ảnh hưởng
↓
Trả về thông tin preview
```

### **2. Admin thực hiện hủy ca**
```
POST /api/doctor-shifts/:id/cancel-and-reschedule
↓
START TRANSACTION
↓
1. Kiểm tra ca làm việc (status = ACTIVE?)
2. Tìm bác sĩ thay thế (cùng chuyên khoa, ca, ngày)
3. Lấy tất cả lịch hẹn (status = WAITING/CHECKED_IN)
4. Update doctorId cho từng lịch hẹn
5. Cập nhật DoctorShift status
↓
COMMIT TRANSACTION
↓
6. Emit events "appointment:doctor_changed"
7. Gửi email + tạo notification
```

### **3. Khôi phục ca đã hủy**
```
POST /api/doctor-shifts/:id/restore
↓
Update: status = ACTIVE, replacedBy = null
```

---

## 📡 API Endpoints

### **1. Preview Reschedule**
```http
GET /api/doctor-shifts/:id/reschedule-preview
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "doctorShiftId": 123,
    "affectedAppointments": 5,
    "hasReplacementDoctor": true,
    "replacementDoctorId": 456,
    "canAutoReschedule": true,
    "warning": null
  }
}
```

**Response (Không có bác sĩ thay thế):**
```json
{
  "success": true,
  "data": {
    "hasReplacementDoctor": false,
    "canAutoReschedule": false,
    "warning": "CẢNH BÁO: Không tìm thấy bác sĩ thay thế cùng chuyên khoa."
  }
}
```

---

### **2. Cancel & Reschedule**
```http
POST /api/doctor-shifts/:id/cancel-and-reschedule
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "cancelReason": "Bác sĩ bị ốm đột xuất"
}
```

**Response (Thành công):**
```json
{
  "success": true,
  "message": "Đã xử lý 5 lịch hẹn. Chuyển thành công 5 lịch.",
  "data": {
    "totalAppointments": 5,
    "rescheduledCount": 5,
    "failedCount": 0,
    "details": [
      {
        "appointmentId": 101,
        "patientId": 10,
        "oldDoctorId": 123,
        "newDoctorId": 456,
        "success": true
      }
    ]
  }
}
```

---

### **3. Restore Cancelled Shift**
```http
POST /api/doctor-shifts/:id/restore
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Khôi phục ca làm việc thành công"
}
```

---

## 🗄️ Database Schema

### **Bảng `doctor_shifts` - Thêm 3 cột mới**

| Column | Type | Description |
|--------|------|-------------|
| `status` | ENUM('ACTIVE', 'CANCELLED', 'REPLACED') | Trạng thái ca làm việc |
| `replacedBy` | INT (FK → doctors.id) | ID bác sĩ thay thế (nếu có) |
| `cancelReason` | TEXT | Lý do hủy ca |

**Migration file:** `migrations/20251225175542-add-status-to-doctor-shifts.js`

---

## 🎯 Logic tìm bác sĩ thay thế

### **Điều kiện tìm kiếm**
1. **Cùng chuyên khoa** với bác sĩ nghỉ
2. **Cùng ca làm việc** (shiftId)
3. **Cùng ngày** (workDate)
4. **Status = ACTIVE** (đang hoạt động)
5. **Khác bác sĩ nghỉ** (doctorId != originalDoctorId)

### **Load Balancing**
- Đếm số lịch hẹn hiện tại của mỗi bác sĩ ứng viên
- Sắp xếp theo số lượng lịch hẹn (tăng dần)
- Chọn bác sĩ có **ít lịch hẹn nhất**

### **Thuật toán**
```typescript
1. Lấy chuyên khoa của bác sĩ gốc
2. Tìm bác sĩ cùng chuyên khoa, ACTIVE trong cùng ca
3. Đếm số lịch hẹn của từng bác sĩ ứng viên
4. Sort và chọn bác sĩ có workload thấp nhất
```

**Chi tiết implementation:** [doctorShiftReschedule.controller.ts](../src/controllers/doctorShiftReschedule.controller.ts)

---

## ⚠️ Lưu ý quan trọng

### **1. Transaction Safety**
- Toàn bộ quá trình nằm trong 1 transaction
- Nếu có lỗi bất kỳ → Rollback toàn bộ
- Đảm bảo data consistency

### **2. Event Timing**
- Events chỉ được emit **SAU KHI** transaction commit thành công
- Tránh gửi email nếu transaction rollback

### **3. Status Filter**
- Chỉ chuyển lịch có status: `WAITING` hoặc `CHECKED_IN`
- Không chuyển lịch `CANCELLED` hoặc `COMPLETED`

---

## 🔗 Files liên quan

- **Service**: [appointmentReschedule.service.ts](../src/services/appointmentReschedule.service.ts)
- **Controller**: [doctorShiftReschedule.controller.ts](../src/controllers/doctorShiftReschedule.controller.ts)
- **Routes**: [doctorShift.routes.ts](../src/routes/doctorShift.routes.ts)
- **Model**: [DoctorShift.ts](../src/models/DoctorShift.ts)
- **Migration**: [20251225175542-add-status-to-doctor-shifts.js](../migrations/20251225175542-add-status-to-doctor-shifts.js)
- **Events**: [appointmentEvents.ts](../src/events/appointmentEvents.ts)

---

## 🧪 Testing

Xem hướng dẫn test chi tiết tại: [TEST-RESCHEDULE.md](./TEST-RESCHEDULE.md)

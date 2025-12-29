# 📝 Changelog - Healthcare Management System

Tất cả các thay đổi quan trọng của dự án được ghi lại ở đây.

---

## [2.0.0] - 2025-12-26

### 🎉 Major Release - Medicine & Prescription Management System

#### ✨ Features mới

**Module Medicine Management (Quản lý thuốc):**
- ✅ CRUD đầy đủ cho Medicines
- ✅ Tự động generate mã thuốc (MED-000001, MED-000002, ...)
- ✅ Quản lý tồn kho (quantity, minStockLevel)
- ✅ Nhập kho thuốc (medicine_imports)
- ✅ Lịch sử xuất kho (medicine_exports) - Audit Trail
- ✅ Cảnh báo thuốc sắp hết (lowStock filter)
- ✅ Đánh dấu thuốc hết hạn (status: EXPIRED)
- ✅ Soft delete thuốc (status: REMOVED)
- ✅ Hỗ trợ 6 đơn vị: VIEN, ML, HOP, CHAI, TUYP, GOI

**Module Prescription Management (Kê đơn thuốc):**
- ✅ Bác sĩ kê đơn thuốc cho bệnh nhân
- ✅ Tự động generate mã đơn (RX-YYYYMMDD-XXXXX)
- ✅ **Tự động trừ kho** khi kê đơn
- ✅ **Pessimistic Locking** để tránh race condition
- ✅ **Price Snapshot** - Lưu giá tại thời điểm kê đơn
- ✅ Cập nhật đơn thuốc (chỉ khi DRAFT)
- ✅ Hủy đơn thuốc + Hoàn trả kho tự động
- ✅ Khóa đơn thuốc (status: LOCKED) sau thanh toán
- ✅ Xuất PDF đơn thuốc (với Digital Signature)
- ✅ Transaction safety (rollback nếu lỗi)
- ✅ 1 Visit = 1 Prescription (UNIQUE constraint)

**Module Disease Categories (Danh mục bệnh):**
- ✅ Quản lý danh mục bệnh theo chuẩn ICD-10
- ✅ Link Visit với Disease Category
- ✅ Hỗ trợ chẩn đoán chính xác hơn

#### 📦 Models

**Mới thêm (v2.0):**
- `Medicine` - Thông tin thuốc + Tồn kho
- `MedicineImport` - Lịch sử nhập kho
- `MedicineExport` - Lịch sử xuất kho (Audit Trail)
- `DiseaseCategory` - Danh mục bệnh (ICD-10)
- `Prescription` - Đơn thuốc
- `PrescriptionDetail` - Chi tiết đơn thuốc (with price snapshot)

**Updated:**
- `Visit` - Thêm `symptoms`, `diseaseCategoryId`

#### 🗄️ Database Changes

**New Migrations:**
- `20251226074030-create-medicines.js` - Tạo bảng medicines
- `20251226074417-create-disease-categories.js` - Tạo bảng disease_categories
- `20251226074430-update-visits-add-symptoms-and-category.js` - Cập nhật visits
- `20251226074509-create-prescriptions.js` - Tạo bảng prescriptions
- `20251226074511-create-prescription-details.js` - Tạo bảng prescription_details
- `20251226080000-create-medicine-imports.js` - Tạo bảng medicine_imports
- `20251226080001-create-medicine-exports.js` - Tạo bảng medicine_exports

**New Tables:** 7 tables
**Total Tables:** 19 tables

#### 🔧 Services

**Mới:**
- `medicine.service.ts` - CRUD thuốc, nhập/xuất kho, low stock alert
- `prescription.service.ts` - Kê đơn, cập nhật, hủy, PDF export
- `codeGenerator.ts` - Utility sinh mã tự động
- `digitalSignature.ts` - Chữ ký số cho đơn thuốc
- `pdfGenerator.ts` - Xuất PDF đơn thuốc

#### 🎯 Controllers

**Mới:**
- `medicine.controller.ts` - API endpoints cho Medicine
- `prescription.controller.ts` - API endpoints cho Prescription

#### 🛣️ Routes

**Mới:**
- `GET /api/medicines` - Lấy danh sách thuốc (filter: status, group, lowStock, search)
- `GET /api/medicines/:id` - Xem chi tiết thuốc
- `POST /api/medicines` - Tạo thuốc mới (ADMIN)
- `PUT /api/medicines/:id` - Cập nhật thuốc (ADMIN)
- `DELETE /api/medicines/:id` - Xóa thuốc (ADMIN, soft delete)
- `POST /api/medicines/:id/import` - Nhập kho (ADMIN)
- `GET /api/medicines/:id/imports` - Lịch sử nhập kho (ADMIN)
- `GET /api/medicines/:id/exports` - Lịch sử xuất kho (ADMIN)
- `POST /api/medicines/:id/mark-expired` - Đánh dấu hết hạn (ADMIN)

- `POST /api/prescriptions` - Kê đơn thuốc (DOCTOR)
- `GET /api/prescriptions/:id` - Xem chi tiết đơn (DOCTOR, PATIENT)
- `PUT /api/prescriptions/:id` - Cập nhật đơn (DOCTOR, chỉ DRAFT)
- `POST /api/prescriptions/:id/cancel` - Hủy đơn (DOCTOR, chỉ DRAFT)
- `GET /api/prescriptions/patient/:patientId` - Đơn thuốc theo bệnh nhân
- `GET /api/prescriptions/visit/:visitId` - Đơn thuốc theo visit
- `GET /api/prescriptions/:id/pdf` - Xuất PDF đơn thuốc

#### 🎨 Middlewares

**Mới:**
- `validateMedicine.middlewares.ts` - Validate request cho Medicine
- `validatePrescription.middlewares.ts` - Validate request cho Prescription

#### 📚 Documentation

**Updated:**
- `docs/API-TESTING-GUIDE.md` - Gộp 3 file API test guide + Thêm Medicine & Prescription
- `docs/DATABASE-SCHEMA.md` - Cập nhật với 7 bảng mới
- `docs/README.md` - Cập nhật tổng quan hệ thống

#### 📦 Dependencies

**Không thay đổi** - Sử dụng dependencies hiện có

#### ⚙️ Configuration

**Không cần thêm config** - Tất cả đã có sẵn

---

## 🔄 Breaking Changes (v2.0)

- ❌ **NONE** - Backward compatible với v1.0

---

## 🚀 Migration Guide (v1.0 → v2.0)

```bash
# 1. Pull code mới
git pull origin main

# 2. Cài đặt dependencies (nếu có)
npm install

# 3. Chạy migrations mới
npx sequelize-cli db:migrate

# 4. (Optional) Seed dữ liệu mẫu cho medicines
# Tạo file seeder hoặc import manual
```

---

## [1.0.0] - 2025-12-25

### 🎉 Initial Release

#### ✨ Features mới

**Module Doctor & Shift Management:**
- ✅ CRUD đầy đủ cho Doctors
- ✅ Tự động generate mã bác sĩ (BS000001, BS000002, ...)
- ✅ Quản lý chuyên khoa (Specialties)
- ✅ CRUD ca làm việc (Shifts): Sáng, Chiều, Tối
- ✅ Gán bác sĩ vào ca làm việc (DoctorShifts)
- ✅ API lấy bác sĩ trực trong ngày
- ✅ Validate không trùng lịch trực

**Module Appointment:**
- ✅ Bệnh nhân đặt lịch online
- ✅ Lễ tân đặt lịch offline tại quầy
- ✅ Tự động phân slot (max 40 slots/ca)
- ✅ Validate bác sĩ có trực không
- ✅ Validate slot còn trống
- ✅ Hủy lịch (phải trước 2 giờ)
- ✅ Check-in appointment
- ✅ Quản lý Visit (phiếu khám)

**🔄 Reschedule System (Chức năng 6):**
- ✅ Admin hủy ca bác sĩ
- ✅ Tự động tìm bác sĩ thay thế (cùng chuyên khoa)
- ✅ Load balancing (chọn bác sĩ ít lịch nhất)
- ✅ Tự động chuyển tất cả lịch hẹn
- ✅ Preview trước khi hủy ca
- ✅ Khôi phục ca đã hủy
- ✅ Transaction safety (rollback nếu lỗi)
- ✅ Emit events khi đổi bác sĩ

**📧 Notification System (Chức năng 7):**
- ✅ Email service với Nodemailer + Gmail SMTP
- ✅ 3 fancy email templates (responsive):
  - Xác nhận lịch khám mới
  - Thông báo hủy lịch
  - Thông báo đổi bác sĩ
- ✅ In-app notifications (lưu trong DB)
- ✅ Event-driven architecture (EventEmitter)
- ✅ API CRUD notifications
- ✅ Mark as read / Mark all as read
- ✅ Unread count
- ✅ Graceful degradation (skip email nếu không config)
- ✅ Auto-send email khi có event

#### 📦 Models

**Đã có từ trước:**
- `User` - Người dùng (Admin, Doctor, Patient, Receptionist)
- `Patient` - Thông tin bệnh nhân
- `Doctor` - Thông tin bác sĩ
- `Specialty` - Chuyên khoa
- `Shift` - Ca làm việc
- `DoctorShift` - Lịch trực của bác sĩ
- `Appointment` - Lịch hẹn
- `Visit` - Phiếu khám

**Mới thêm:**
- `Notification` - Thông báo in-app

#### 🗄️ Database Changes

**Migration: `20251225175542-add-status-to-doctor-shifts.js`**
- Thêm `status` ENUM('ACTIVE', 'CANCELLED', 'REPLACED') vào `doctor_shifts`
- Thêm `replacedBy` INT (FK → doctors.id)
- Thêm `cancelReason` TEXT

**Migration: `20251225182320-create-notifications.js`**
- Tạo bảng `notifications` mới
- Các cột: id, userId, type, title, message, relatedAppointmentId, isRead, emailSent, emailSentAt
- Indexes: (userId, isRead), (userId, createdAt)

#### 🔧 Services

**Mới:**
- `appointmentReschedule.service.ts` - Logic reschedule tự động
  - `findReplacementDoctor()` - Tìm bác sĩ thay thế
  - `cancelDoctorShiftAndReschedule()` - Hủy ca + chuyển lịch
  - `restoreCancelledShift()` - Khôi phục ca

- `notification.service.ts` - Logic thông báo
  - `createNotification()` - Tạo notification
  - `sendAppointmentConfirmation()` - Gửi email xác nhận
  - `sendAppointmentCancellation()` - Gửi email hủy lịch
  - `sendDoctorChangeNotification()` - Gửi email đổi bác sĩ
  - `markNotificationAsRead()` - Đánh dấu đã đọc
  - `getUserNotifications()` - Lấy danh sách
  - `getUnreadCount()` - Đếm chưa đọc

- `email.service.ts` - Email wrapper
  - `sendEmail()` - Gửi email qua Nodemailer
  - `verifyConnection()` - Test email connection

#### 🎨 Templates

**Mới:**
- `emailTemplates.ts` - 3 templates fancy:
  - `appointmentConfirmation` - Gradient purple header
  - `appointmentCancellation` - Gradient pink-red header
  - `doctorChanged` - Gradient yellow-orange header
  - Base template với responsive design

#### 🎪 Events

**Mới:**
- `appointmentEvents.ts` - Event emitter system
  - Event: `appointment:created` → sendAppointmentConfirmation()
  - Event: `appointment:cancelled` → sendAppointmentCancellation()
  - Event: `appointment:doctor_changed` → sendDoctorChangeNotification()

#### 🛣️ Routes

**Mới:**
- `GET /api/doctor-shifts/:id/reschedule-preview` - Preview reschedule
- `POST /api/doctor-shifts/:id/cancel-and-reschedule` - Hủy ca + reschedule
- `POST /api/doctor-shifts/:id/restore` - Khôi phục ca
- `GET /api/notifications` - Lấy danh sách notifications
- `GET /api/notifications/unread-count` - Đếm chưa đọc
- `PUT /api/notifications/:id/mark-read` - Đánh dấu đã đọc
- `PUT /api/notifications/mark-all-read` - Đánh dấu tất cả

#### 🎯 Controllers

**Mới:**
- `doctorShiftReschedule.controller.ts`
  - `previewReschedule()` - Preview
  - `cancelShiftAndReschedule()` - Hủy + reschedule
  - `restoreShift()` - Khôi phục

- `notification.controller.ts`
  - `getNotifications()` - GET list
  - `getNotificationUnreadCount()` - GET count
  - `markAsRead()` - PUT mark read
  - `markAllAsRead()` - PUT mark all

#### 🔄 Updated Files

**Controllers:**
- `appointment.controller.ts`
  - Thêm `notifyAppointmentCreated()` khi tạo lịch
  - Thêm `notifyAppointmentCancelled()` khi hủy lịch

**App:**
- `app.ts`
  - Register route `/api/notifications`
  - Register route `/api/shifts`

#### 📚 Documentation

**Mới tạo thư mục `docs/`:**
- `README.md` - Tổng quan hệ thống
- `QUICK-START.md` - Hướng dẫn cài đặt nhanh
- `API-TESTING.md` - Hướng dẫn test API chi tiết
- `RESCHEDULE-SYSTEM.md` - Chi tiết hệ thống Reschedule
- `NOTIFICATION-SYSTEM.md` - Chi tiết hệ thống Notification
- `DATABASE-SCHEMA.md` - Sơ đồ database đầy đủ

#### 📦 Dependencies

**Mới thêm:**
- `nodemailer` - Gửi email
- `@types/nodemailer` - TypeScript types

#### ⚙️ Configuration

**Thêm vào `.env`:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## 📊 Thống kê

### Code Metrics (v2.0)
- **Tổng Models**: 15 (+6 mới)
- **Tổng Services**: 17+ (+2 mới)
- **Tổng Controllers**: 14+ (+2 mới)
- **Tổng Routes**: 10+ (+2 mới)
- **Tổng API Endpoints**: 55+ (+15 mới)
- **Migrations**: 21 (+7 mới)
- **Email Templates**: 3 (fancy, responsive)

### Files Changed (v2.0)
- **Files mới tạo**: 20+ files
  - 6 models (Medicine, MedicineImport, MedicineExport, DiseaseCategory, Prescription, PrescriptionDetail)
  - 2 services (medicine.service, prescription.service)
  - 3 utilities (codeGenerator, digitalSignature, pdfGenerator)
  - 2 controllers (medicine.controller, prescription.controller)
  - 2 routes (medicine.routes, prescription.routes)
  - 2 middlewares (validateMedicine, validatePrescription)
  - 7 migrations
  - 1 associations file

- **Files đã cập nhật**: 10+ files
  - `app.ts` (register routes)
  - `Visit.ts` (model - add symptoms, diseaseCategoryId)
  - `index.ts` (models - import new models)
  - `package.json`
  - `CHANGELOG.md`
  - `docs/API-TESTING-GUIDE.md`
  - `docs/DATABASE-SCHEMA.md`
  - `docs/README.md`

- **Docs updated**: 3 markdown files

### Lines of Code (v2.0 additions)
- **Models**: ~600 lines
- **Services**: ~1200 lines
- **Controllers**: ~600 lines
- **Middlewares**: ~200 lines
- **Utilities**: ~300 lines
- **Routes**: ~100 lines
- **Migrations**: ~350 lines
- **Total**: ~3350 lines of new code

---

## 🎯 Tính năng hoàn thành

### ✅ Checklist chức năng 6 & 7

**Chức năng 6: Reschedule System**
- [x] Model DoctorShift thêm status, replacedBy, cancelReason
- [x] Service tìm bác sĩ thay thế tự động
- [x] Service reschedule với transaction
- [x] API preview reschedule
- [x] API cancel & reschedule
- [x] API restore cancelled shift
- [x] Load balancing (chọn BS ít lịch nhất)
- [x] Emit events khi đổi bác sĩ
- [x] Documentation đầy đủ

**Chức năng 7: Notification System**
- [x] Email service với Nodemailer
- [x] 3 fancy email templates
- [x] Notification model + migration
- [x] Notification service (CRUD)
- [x] Event emitter system
- [x] Auto-send email khi có event
- [x] API CRUD notifications
- [x] Mark as read / unread count
- [x] Integration vào appointment workflow
- [x] Integration vào reschedule workflow
- [x] Documentation đầy đủ

---

## 🐛 Bug Fixes

Không có bugs được fix trong version này (initial release).

---

## 🔄 Breaking Changes

Không có breaking changes (initial release).

---

## 🚀 Performance Improvements

- Thêm indexes cho `notifications` table
- Event-driven architecture (async, non-blocking)
- Transaction cho reschedule (data consistency)
- Load balancing cho replacement doctor

---

## 🔐 Security

- Email credentials không hardcode (dùng .env)
- Graceful degradation khi thiếu email config
- Validate user ownership trước khi mark notification as read
- Transaction safety cho reschedule

---

## 📝 Notes

### Email Setup
- Cần tạo App Password từ Google Account
- Không dùng password Gmail thường
- Email có thể mất 1-3s để gửi (async)

### Database
- Migration `add-status-to-doctor-shifts` cần chạy trước khi start server
- Migration `create-notifications` tạo bảng mới
- Backward compatible (không breaking existing data)

### Events
- Sử dụng Node.js EventEmitter (không cần Redis)
- Có thể upgrade sang Bull Queue sau này nếu cần
- Events chỉ emit sau khi transaction commit

---

## 🎯 Roadmap (Tương lai)

### Version 1.1.0 (Planned)
- [ ] WebSocket cho real-time notifications
- [ ] Push notifications (mobile)
- [ ] SMS notifications (Twilio)
- [ ] Dashboard admin monitoring reschedule activities
- [ ] Audit logs
- [ ] Export reports (PDF, Excel)

### Version 1.2.0 (Planned)
- [ ] Bull Queue + Redis thay EventEmitter
- [ ] Email template builder (admin UI)
- [ ] Notification preferences per user
- [ ] A/B testing email templates
- [ ] Multi-language support

### Version 2.0.0 (Future)
- [ ] Appointment reminder (cron job)
- [ ] Video consultation
- [ ] Payment integration
- [ ] Prescription management
- [ ] Medical records encryption

---

## 👥 Contributors

- Healthcare Management System Team

---

## 📄 License

MIT License - Copyright (c) 2025 Healthcare Management System

---

**Ngày phát hành**: 25/12/2025
**Version**: 1.0.0
**Status**: ✅ Stable

# 📚 Tài liệu Hệ thống Healthcare Management System

## 📖 Mục lục

1. [Tổng quan hệ thống](#tổng-quan-hệ-thống)
2. [Tài liệu theo chức năng](#tài-liệu-theo-chức-năng)
3. [Hướng dẫn cài đặt](#hướng-dẫn-cài-đặt)
4. [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)

---

## 📋 Tổng quan hệ thống

Healthcare Management System là hệ thống quản lý phòng khám toàn diện với các chức năng chính:

### Core Features (v1.0)
- ✅ Quản lý bác sĩ (CRUD + Chuyên khoa + Mã BS000xxx)
- ✅ Quản lý bệnh nhân (Patient profiles + Medical history)
- ✅ Quản lý ca làm việc (Sáng/Chiều/Tối)
- ✅ Gán bác sĩ vào ca làm
- ✅ Đặt lịch khám (Online/Offline)
- ✅ **Tự động chuyển lịch hẹn khi bác sĩ nghỉ (Reschedule System)**
- ✅ **Hệ thống thông báo email + in-app notification**

### New Features (v2.0)
- ✅ **Quản lý thuốc (Medicine Management)**
  - Tồn kho, nhập/xuất kho
  - Cảnh báo thuốc sắp hết
  - Audit trail (lịch sử xuất nhập)
- ✅ **Kê đơn thuốc (Prescription Management)**
  - Tự động trừ kho
  - Pessimistic locking
  - Price snapshot
  - Xuất PDF đơn thuốc
- ✅ **Danh mục bệnh (Disease Categories - ICD-10)**

---

## 📚 Tài liệu theo chức năng

### **🚀 Quick Start**
- [Quick Start Guide](./QUICK-START.md) - Hướng dẫn cài đặt và chạy nhanh (5 phút)

### **📡 API & Testing**
- [API Testing Guide - COMPLETE](./API-TESTING-GUIDE.md) - **Hướng dẫn test API đầy đủ (All modules)**
  - Core APIs (Patient, Doctor, Appointment)
  - Medicine Management APIs
  - Prescription Management APIs
  - Reschedule & Notification APIs
- [Test Reschedule](./TEST-RESCHEDULE.md) - Hướng dẫn test reschedule system chi tiết
- ~[API Testing (Old)](./API-TESTING.md)~ - Deprecated, xem API-TESTING-GUIDE.md

### **🔧 Core Features**
- [Reschedule System](./RESCHEDULE-SYSTEM.md) - Hệ thống reschedule tự động
- [Notification System](./NOTIFICATION-SYSTEM.md) - Hệ thống email + in-app notification

### **🗄️ Database**
- [Database Schema](./DATABASE-SCHEMA.md) - Cấu trúc database đầy đủ (19 tables)

---

## 🚀 Hướng dẫn cài đặt

### **1. Requirements**
- Node.js >= 18.x
- MySQL >= 8.x
- npm hoặc yarn

### **2. Cài đặt Dependencies**
```bash
npm install
```

### **3. Cấu hình Environment**
Tạo file `.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=healthcare_db
DB_USER=root
DB_PASSWORD=root

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Server
PORT=3000
NODE_ENV=development
```

### **4. Chạy Migration**
```bash
npx sequelize-cli db:migrate
```

### **5. Seed dữ liệu mẫu**
```bash
npx sequelize-cli db:seed:all
```

### **6. Khởi động Server**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

---

## 🏗️ Kiến trúc hệ thống

### **Tech Stack**
- **Backend Framework**: Express.js + TypeScript
- **Database**: MySQL + Sequelize ORM
- **Authentication**: JWT
- **Email**: Nodemailer
- **Event System**: Node.js EventEmitter
- **Validation**: Custom middlewares

### **Cấu trúc thư mục**
```
Backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── models/           # Sequelize models
│   ├── routes/           # API routes
│   ├── middlewares/      # Auth, validation, etc.
│   ├── events/           # Event emitters
│   ├── templates/        # Email templates
│   ├── config/           # Configuration files
│   └── constant/         # Constants & enums
├── migrations/           # Database migrations
├── seeders/             # Database seeders
├── docs/                # Documentation
└── uploads/             # File uploads
```

### **Database Schema Overview**
```
users
├── patients
└── doctors
    ├── specialties
    └── doctor_shifts
        └── shifts

appointments
├── patients
├── doctors
└── shifts

notifications
├── users
└── appointments

visits
└── appointments
```

---

## 🎯 Luồng nghiệp vụ chính

### **1. Đặt lịch khám**
```
Bệnh nhân → POST /api/appointments
→ Kiểm tra bác sĩ có trực không
→ Kiểm tra slot còn trống
→ Tạo appointment
→ Emit event "appointment:created"
→ Gửi email xác nhận + Tạo notification
```

### **2. Hủy ca bác sĩ → Tự động reschedule**
```
Admin → POST /api/doctor-shifts/:id/cancel-and-reschedule
→ Tìm bác sĩ thay thế (cùng chuyên khoa, cùng ca)
→ Chuyển tất cả lịch hẹn sang bác sĩ mới
→ Emit event "appointment:doctor_changed" cho mỗi lịch
→ Gửi email thông báo đổi bác sĩ cho tất cả bệnh nhân
```

### **3. Bệnh nhân xem thông báo**
```
Bệnh nhân → GET /api/notifications
→ Lấy danh sách notifications (chưa đọc)
→ PUT /api/notifications/:id/mark-read
```

---

## 📊 Thống kê Dự án

| Metric | Value | Version |
|--------|-------|---------|
| **Tổng số Models** | 15 | v2.0 (+6) |
| **Tổng số API Endpoints** | 55+ | v2.0 (+15) |
| **Tổng số Migrations** | 21 | v2.0 (+7) |
| **Tổng số Services** | 17+ | v2.0 (+2) |
| **Tổng số Controllers** | 14+ | v2.0 (+2) |
| **Tổng số Tables** | 19 | v2.0 (+7) |
| **Email Templates** | 3 (Fancy, Responsive) | v1.0 |
| **Event Listeners** | 3 | v1.0 |

---

## 🔗 Quick Links

### Essential Docs
- 🚀 [Quick Start](./QUICK-START.md) - Bắt đầu nhanh trong 5 phút
- 📘 [API Testing Guide - COMPLETE](./API-TESTING-GUIDE.md) - **Test all APIs** (Core + Medicine + Prescription)
- 🗄️ [Database Schema](./DATABASE-SCHEMA.md) - Cấu trúc 19 tables

### Feature Docs
- 🔄 [Reschedule System](./RESCHEDULE-SYSTEM.md) - Logic reschedule tự động
- 📧 [Notification System](./NOTIFICATION-SYSTEM.md) - Email + in-app notifications

---

## 🎯 Modules

### Core Modules (v1.0)
- Patient Management
- Doctor Management
- Appointment Booking
- Visit Management
- Reschedule System
- Notification System

### New Modules (v2.0)
- **Medicine Management** - Quản lý thuốc + Tồn kho
- **Prescription Management** - Kê đơn thuốc tự động
- **Disease Categories** - Danh mục bệnh ICD-10

---

## 🤝 Đóng góp

Hệ thống được phát triển bởi team Healthcare Management System.

**Phiên bản hiện tại**: **2.0.0** (Major Release)
**Ngày cập nhật**: **26/12/2025**

---

## 📝 License

MIT License - Copyright (c) 2025 Healthcare Management System

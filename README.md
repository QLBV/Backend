# 🏥 Healthcare Management System - Backend

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

---

## 🎯 Tính năng nổi bật

- ✅ **Quản lý bác sĩ** với mã tự động (BS000001, BS000002, ...)
- ✅ **Quản lý ca làm việc** (Sáng/Chiều/Tối)
- ✅ **Đặt lịch khám** online/offline với validation thông minh
- 🔥 **Reschedule tự động** khi bác sĩ nghỉ (tìm bác sĩ thay thế cùng chuyên khoa)
- 📧 **Email notification** fancy với responsive templates
- 🔔 **In-app notifications** real-time
- 🎪 **Event-driven architecture** với EventEmitter
- 🔐 **JWT Authentication** & Role-based access control

---

## 🚀 Quick Start

```bash
# 1. Cài đặt dependencies
npm install

# 2. Tạo database MySQL
mysql -u root -p
CREATE DATABASE healthcare_db;

# 3. Copy và cấu hình .env
cp .env.example .env
# Sửa các biến trong .env

# 4. Chạy migration & seed
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# 5. Khởi động server
npm run dev
# Server chạy tại http://localhost:3000
```

👉 **Chi tiết**: Xem [docs/QUICK-START.md](./docs/QUICK-START.md)

---

## 🛠️ Tech Stack

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| **Node.js** | >= 18.x | Runtime environment |
| **TypeScript** | 5.x | Type safety |
| **Express.js** | 4.x | Web framework |
| **MySQL** | 8.x | Database |
| **Sequelize** | 6.x | ORM |
| **JWT** | - | Authentication |
| **Nodemailer** | - | Email service |
| **EventEmitter** | Node.js built-in | Event system |

---

## 📚 Tài liệu

### **Bắt đầu**
- 📘 [Quick Start Guide](./docs/QUICK-START.md) - Cài đặt trong 5 phút
- 📗 [API Testing](./docs/API-TESTING.md) - Hướng dẫn test API chi tiết

### **Chức năng nâng cao**
- 🔄 [Reschedule System](./docs/RESCHEDULE-SYSTEM.md) - Logic chuyển lịch tự động
- 📧 [Notification System](./docs/NOTIFICATION-SYSTEM.md) - Email & In-app notifications

### **Kỹ thuật**
- 🗄️ [Database Schema](./docs/DATABASE-SCHEMA.md) - Sơ đồ database đầy đủ
- 📝 [Changelog](./CHANGELOG.md) - Lịch sử thay đổi

---

## 📂 Cấu trúc dự án

```
Backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── appointment.controller.ts
│   │   ├── doctorShiftReschedule.controller.ts ⭐
│   │   └── notification.controller.ts ⭐
│   ├── services/             # Business logic
│   │   ├── appointmentReschedule.service.ts ⭐
│   │   ├── notification.service.ts ⭐
│   │   └── email.service.ts ⭐
│   ├── models/               # Sequelize models
│   │   ├── DoctorShift.ts (updated) ⭐
│   │   └── Notification.ts ⭐
│   ├── routes/               # API routes
│   │   ├── doctorShift.routes.ts (updated)
│   │   └── notification.routes.ts ⭐
│   ├── events/               # Event emitters ⭐
│   │   └── appointmentEvents.ts
│   ├── templates/            # Email templates ⭐
│   │   └── emailTemplates.ts
│   ├── middlewares/          # Auth, validation, etc.
│   ├── config/               # Configuration
│   └── constant/             # Constants & enums
├── migrations/               # Database migrations
│   ├── ...existing migrations
│   ├── 20251225175542-add-status-to-doctor-shifts.js ⭐
│   └── 20251225182320-create-notifications.js ⭐
├── seeders/                  # Database seeders
├── docs/                     # Documentation ⭐
│   ├── README.md
│   ├── QUICK-START.md
│   ├── API-TESTING.md
│   ├── RESCHEDULE-SYSTEM.md
│   ├── NOTIFICATION-SYSTEM.md
│   └── DATABASE-SCHEMA.md
└── uploads/                  # File uploads

⭐ = Files mới thêm/sửa đổi trong v1.0.0
```

---

## 🔧 Running the Application

### **Development**
```bash
npm run dev          # Khởi động dev server (nodemon + ts-node)
```

### **Production**
```bash
npm run build        # Build TypeScript → JavaScript
npm start            # Chạy production build
```

### **Database**
```bash
# Migration
npx sequelize-cli db:migrate                # Chạy tất cả migrations
npx sequelize-cli db:migrate:undo           # Rollback 1 migration

# Seeding
npx sequelize-cli db:seed:all               # Chạy tất cả seeders
npx sequelize-cli db:seed:undo:all          # Xóa seed data

# Reset database
npx sequelize-cli db:migrate:undo:all && \
npx sequelize-cli db:migrate && \
npx sequelize-cli db:seed:all
```

### **TypeScript**
```bash
npx tsc --noEmit     # Check TypeScript errors
```

---

## 🧪 Testing

### **Test API với curl**
```bash
# Health check
curl http://localhost:3000

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Test với token
curl http://localhost:3000/api/doctors \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Test với Postman/Thunder Client**
Import collection từ `docs/API-TESTING.md`

---

## 📊 API Endpoints

### **Authentication**
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký

### **Doctors & Shifts**
- `GET /api/doctors` - Lấy danh sách bác sĩ
- `POST /api/doctors` - Tạo bác sĩ (Admin)
- `POST /api/doctor-shifts` - Gán bác sĩ vào ca (Admin)
- `GET /api/doctor-shifts/on-duty` - Xem bác sĩ trực (Public)

### **Reschedule** ⭐ NEW
- `GET /api/doctor-shifts/:id/reschedule-preview` - Preview reschedule
- `POST /api/doctor-shifts/:id/cancel-and-reschedule` - Hủy ca + reschedule
- `POST /api/doctor-shifts/:id/restore` - Khôi phục ca đã hủy

### **Appointments**
- `POST /api/appointments` - Đặt lịch khám
- `GET /api/appointments` - Xem lịch hẹn
- `DELETE /api/appointments/:id` - Hủy lịch hẹn

### **Notifications** ⭐ NEW
- `GET /api/notifications` - Lấy danh sách thông báo
- `GET /api/notifications/unread-count` - Đếm số chưa đọc
- `PUT /api/notifications/:id/mark-read` - Đánh dấu đã đọc
- `PUT /api/notifications/mark-all-read` - Đánh dấu tất cả đã đọc

👉 **Full API docs**: [docs/API-TESTING.md](./docs/API-TESTING.md)

---

## ⚙️ Configuration (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=healthcare_db
DB_USER=root
DB_PASSWORD=root

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Email (Gmail SMTP) ⭐ NEW
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # App Password, không phải password Gmail

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

⚠️ **Lưu ý Email**: Phải tạo App Password từ Google Account, không dùng password thường.

---

## 📧 Email Templates Preview

### **1. Appointment Confirmation**
![Confirmation Email](https://via.placeholder.com/600x400/667eea/ffffff?text=Appointment+Confirmation)
- Gradient purple header
- Info box với chi tiết lịch hẹn
- Responsive design

### **2. Appointment Cancellation**
![Cancellation Email](https://via.placeholder.com/600x400/f5576c/ffffff?text=Appointment+Cancelled)
- Gradient pink-red header
- Warning box
- Lý do hủy

### **3. Doctor Changed**
![Doctor Changed Email](https://via.placeholder.com/600x400/ffa751/ffffff?text=Doctor+Changed)
- Gradient yellow-orange header
- Bác sĩ cũ (gạch ngang) vs Bác sĩ mới (màu xanh)
- Success box: Lịch hẹn vẫn giữ nguyên

---

## 🎯 Use Cases

### **Kịch bản 1: Bệnh nhân đặt lịch khám**
```
1. Bệnh nhân login
2. Xem bác sĩ trực trong ngày
3. Đặt lịch khám
→ ✅ Lịch được tạo
→ 📧 Email xác nhận gửi tự động
→ 🔔 Notification in-app
```

### **Kịch bản 2: Admin hủy ca bác sĩ**
```
1. Admin preview reschedule
2. Admin confirm hủy ca
→ 🔍 Hệ thống tìm bác sĩ thay thế cùng chuyên khoa
→ 🔄 Tự động chuyển TẤT CẢ lịch hẹn sang bác sĩ mới
→ 📧 Gửi email cho TẤT CẢ bệnh nhân bị ảnh hưởng
→ 🔔 Tạo notifications
```

👉 **Chi tiết**: [docs/RESCHEDULE-SYSTEM.md](./docs/RESCHEDULE-SYSTEM.md)

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

MIT License - Copyright (c) 2025 Healthcare Management System

---

## 👥 Team

Healthcare Management System Development Team

---

## 📞 Support

- 📖 Documentation: [./docs](./docs)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📧 Email: support@healthcare.com

---

**Version**: 1.0.0 | **Last Updated**: 25/12/2025 | **Status**: ✅ Production Ready

# Production mode
npm start
```

## Environment Variables

See `.env.example` for all required environment variables

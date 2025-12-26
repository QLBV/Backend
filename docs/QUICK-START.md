# 🚀 Quick Start Guide - Healthcare Management System

## ⚡ Cài đặt nhanh (5 phút)

### **1. Clone & Install**
```bash
cd Backend
npm install
```

### **2. Cấu hình Database**
Tạo database MySQL:
```sql
CREATE DATABASE healthcare_db;
```

Tạo file `.env`:
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

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

### **3. Chạy Migration & Seed**
```bash
# Tạo tables
npx sequelize-cli db:migrate

# Seed dữ liệu mẫu
npx sequelize-cli db:seed:all
```

### **4. Khởi động Server**
```bash
npm run dev
```

Server chạy tại: **http://localhost:3000**

---

## 🧪 Test nhanh

### **1. Health Check**
```bash
curl http://localhost:3000
```

**Response:**
```json
{
  "success": true,
  "message": "Healthcare Management System API",
  "version": "1.0.0"
}
```

### **2. Login để lấy token**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Lưu token từ response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### **3. Test API với token**
```bash
# Lấy danh sách bác sĩ
curl http://localhost:3000/api/doctors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📚 Tài liệu chi tiết

- [📘 README Tổng quan](./README.md)
- [📗 API Testing Guide](./API-TESTING.md)
- [📕 Reschedule System](./RESCHEDULE-SYSTEM.md)
- [📙 Notification System](./NOTIFICATION-SYSTEM.md)
- [📓 Database Schema](./DATABASE-SCHEMA.md)

---

## 🎯 Use Cases quan trọng

### **Use Case 1: Bệnh nhân đặt lịch khám**

**Bước 1: Login bệnh nhân**
```http
POST /api/auth/login
{
  "email": "patient1@example.com",
  "password": "password123"
}
```

**Bước 2: Xem bác sĩ trực**
```http
GET /api/doctor-shifts/on-duty?shiftId=1&workDate=2025-12-26
```

**Bước 3: Đặt lịch**
```http
POST /api/appointments
Authorization: Bearer {patient_token}

{
  "doctorId": 1,
  "shiftId": 1,
  "date": "2025-12-26",
  "symptomInitial": "Đau đầu"
}
```

**Kết quả:**
- ✅ Lịch hẹn được tạo
- 📧 Email xác nhận gửi tự động
- 🔔 Notification in-app

---

### **Use Case 2: Admin hủy ca bác sĩ**

**Bước 1: Login admin**
```http
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Bước 2: Preview reschedule**
```http
GET /api/doctor-shifts/10/reschedule-preview
Authorization: Bearer {admin_token}
```

**Bước 3: Hủy ca và reschedule**
```http
POST /api/doctor-shifts/10/cancel-and-reschedule
Authorization: Bearer {admin_token}

{
  "cancelReason": "Bác sĩ nghỉ ốm"
}
```

**Kết quả:**
- ✅ Tất cả lịch hẹn tự động chuyển sang bác sĩ thay thế
- 📧 Email thông báo gửi cho tất cả bệnh nhân
- 🔔 Notifications tạo cho từng bệnh nhân

---

## 🔑 Accounts mẫu

Sau khi seed database, bạn có thể login với các tài khoản sau:

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `admin123` | Admin |
| `receptionist@example.com` | `receptionist123` | Receptionist |
| `patient1@example.com` | `password123` | Patient |
| `doctor1@example.com` | `doctor123` | Doctor |

---

## 🛠️ Commands hữu ích

### **Development**
```bash
npm run dev          # Khởi động dev server (nodemon)
npm run build        # Build production
npm start            # Chạy production build
```

### **Database**
```bash
# Migration
npx sequelize-cli db:migrate                # Chạy tất cả migrations
npx sequelize-cli db:migrate:undo           # Rollback 1 migration
npx sequelize-cli db:migrate:undo:all       # Rollback tất cả

# Seeding
npx sequelize-cli db:seed:all               # Chạy tất cả seeders
npx sequelize-cli db:seed:undo:all          # Xóa tất cả seed data

# Reset database hoàn toàn
npx sequelize-cli db:migrate:undo:all && \
npx sequelize-cli db:migrate && \
npx sequelize-cli db:seed:all
```

### **TypeScript**
```bash
npx tsc --noEmit     # Check TypeScript errors
```

---

## 🐛 Troubleshooting

### **Lỗi: Cannot connect to database**
```bash
# Kiểm tra MySQL đang chạy
mysql -u root -p

# Tạo lại database
DROP DATABASE IF EXISTS healthcare_db;
CREATE DATABASE healthcare_db;
```

### **Lỗi: Email not sending**
```bash
# Kiểm tra .env có đủ config
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # <-- Phải là App Password, không phải password Gmail

# Hướng dẫn tạo App Password:
# 1. Vào https://myaccount.google.com/security
# 2. Bật "2-Step Verification"
# 3. Vào "App passwords"
# 4. Tạo password mới cho app "Mail"
# 5. Copy 16 ký tự vào .env
```

### **Lỗi: Port 3000 already in use**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Hoặc đổi PORT trong .env
PORT=3001
```

### **Lỗi: JWT token invalid**
```bash
# Token hết hạn → Login lại
# Token sai format → Kiểm tra format: "Bearer {token}"
# JWT_SECRET sai → Kiểm tra .env
```

---

## 📊 API Endpoints Overview

### **Public (Không cần token)**
- `GET /` - Health check
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/doctor-shifts/on-duty` - Xem bác sĩ trực

### **Patient (Cần token Patient)**
- `POST /api/appointments` - Đặt lịch khám
- `GET /api/appointments` - Xem lịch hẹn của mình
- `DELETE /api/appointments/:id` - Hủy lịch hẹn
- `GET /api/notifications` - Xem thông báo
- `PUT /api/notifications/:id/mark-read` - Đánh dấu đã đọc

### **Admin (Cần token Admin)**
- `POST /api/doctors` - Tạo bác sĩ
- `POST /api/doctor-shifts` - Gán bác sĩ vào ca
- `POST /api/doctor-shifts/:id/cancel-and-reschedule` - Hủy ca + reschedule
- `GET /api/doctor-shifts/:id/reschedule-preview` - Preview reschedule
- `POST /api/shifts` - Tạo ca làm việc mới

Full API docs: [API-TESTING.md](./API-TESTING.md)

---

## 🎯 Next Steps

1. ✅ Setup xong? → Đọc [API Testing Guide](./API-TESTING.md)
2. 🤔 Tò mò về Reschedule? → Đọc [Reschedule System](./RESCHEDULE-SYSTEM.md)
3. 📧 Muốn hiểu Notification? → Đọc [Notification System](./NOTIFICATION-SYSTEM.md)
4. 🗄️ Cần xem Database? → Đọc [Database Schema](./DATABASE-SCHEMA.md)

---

## 💡 Tips

- Sử dụng **Postman** hoặc **Thunder Client** để test API
- Bật console log để xem events real-time
- Check email inbox sau khi tạo/hủy lịch
- Dùng `npm run dev` để auto-reload khi code thay đổi
- Xem file `API-TEST-GUIDE.md` trong root folder

---

## 🆘 Cần trợ giúp?

- 📖 Đọc [README.md](./README.md) để hiểu tổng quan
- 🐛 Check [API-TESTING.md](./API-TESTING.md) phần "Common Errors"
- 📧 Liên hệ team nếu gặp vấn đề

**Happy coding! 🚀**

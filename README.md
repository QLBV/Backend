<div align="center">

### HỆ THỐNG QUẢN LÝ PHÒNG KHÁM TƯ HEALTHCARE

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.37-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)

[Tính năng](#-tính-năng) • [Công nghệ](#-công-nghệ) • [Bắt đầu](#-bắt-đầu) • [Cơ sở dữ liệu](#️-cơ-sở-dữ-liệu)

</div>

---

## 📋 Tổng quan

Backend là được xây dựng với Node.js, Express và TypeScript. Nó cung cấp các endpoint toàn diện để quản lý các hoạt động chăm sóc sức khỏe bao gồm hồ sơ bệnh nhân, lịch hẹn, đơn thuốc, hóa đơn, kho thuốc và quản lý nhân viên.

## ✨ Tính năng

### 🔐 Xác thực & Bảo mật
- **Xác thực JWT** với access & refresh token
- **OAuth 2.0** tích hợp (Đăng nhập Google)
- **Kiểm soát truy cập dựa trên vai trò (RBAC)** - Admin, Bác sĩ, Lễ tân, Bệnh nhân
- **Mã hóa mật khẩu** với bcrypt
- **Giới hạn tốc độ** để ngăn chặn lạm dụng
- **Helmet.js** cho security headers
- **Cấu hình CORS**

### 👥 Quản lý người dùng
- Đăng ký & đăng nhập người dùng
- Xác minh email
- Đặt lại mật khẩu qua email
- Quản lý hồ sơ cá nhân
- Quản lý vai trò & quyền hạn

### 📅 Hệ thống lịch hẹn
- Đặt lịch online & offline
- Quản lý trạng thái lịch hẹn
- Kiểm tra lịch trống của bác sĩ
- Nhắc nhở lịch hẹn (cron jobs)
- Theo dõi lượt khám

### 💊 Quản lý đơn thuốc
- Tạo, cập nhật, khóa đơn thuốc
- Tạo đơn thuốc điện tử
- Xuất PDF với chữ ký
- Quy trình trạng thái (Nháp → Đã khóa → Đã cấp phát)

### 💰 Hóa đơn & Thanh toán
- Tạo hóa đơn
- Theo dõi thanh toán (Tiền mặt, Chuyển khoản, QR)
- Hỗ trợ thanh toán từng phần
- Xuất hóa đơn PDF
- Lịch sử thanh toán

### 💊 Nhà thuốc & Kho
- Thao tác CRUD cho thuốc
- Quản lý tồn kho
- Theo dõi nhập/xuất
- Cảnh báo tồn kho thấp
- Theo dõi lô & hạn sử dụng

### 👨‍⚕️ Quản lý bác sĩ & nhân viên
- Hồ sơ bác sĩ & chuyên khoa
- Lập lịch ca trực
- Theo dõi chấm công
- Quản lý lương
- Tính toán tiền lương

### 📊 Báo cáo & Phân tích
- Báo cáo tài chính (PDF/Excel)
- Thống kê lịch hẹn
- Thông tin nhân khẩu học bệnh nhân
- Báo cáo sử dụng thuốc
- Phân tích doanh thu

### 🔔 Thông báo
- Thông báo email (Nodemailer)
- Thông báo trong ứng dụng
- Nhắc nhở lịch hẹn
- Cảnh báo hệ thống

## 🛠 Công nghệ

### Framework cốt lõi
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **Node.js** | 18+ | Môi trường Runtime |
| **Express.js** | 5.2 | Web Framework |
| **TypeScript** | 5.9 | Type Safety |

### Cơ sở dữ liệu & ORM
| Công nghệ | Mục đích |
|-----------|----------|
| **MySQL** | Cơ sở dữ liệu chính |
| **Sequelize** | ORM & Migrations |
| **Redis (ioredis)** | Caching & Sessions |

### Bảo mật
| Công nghệ | Mục đích |
|-----------|----------|
| **JWT** | Xác thực Token |
| **bcrypt** | Mã hóa mật khẩu |
| **Helmet** | Security Headers |
| **express-rate-limit** | Giới hạn tốc độ |
| **Passport.js** | OAuth Strategies |

### Tài liệu & Xuất file
| Công nghệ | Mục đích |
|-----------|----------|
| **PDFKit** | Tạo PDF |
| **ExcelJS** | Xuất Excel |
| **Chart.js** | Tạo biểu đồ |

### Tiện ích
| Công nghệ | Mục đích |
|-----------|----------|
| **Nodemailer** | Dịch vụ Email |
| **Winston** | Logging |
| **Morgan** | HTTP Logging |
| **node-cron** | Scheduled Jobs |
| **Multer** | Upload File |

### Testing
| Công nghệ | Mục đích |
|-----------|----------|
| **Jest** | Testing Framework |
| **Supertest** | HTTP Testing |
| **ts-jest** | TypeScript Support |

## 🚀 Bắt đầu

### Yêu cầu

- **Node.js** >= 18.x
- **MySQL** >= 8.0
- **Redis** (tùy chọn, cho caching)
- **npm** >= 9.x

### Cài đặt

1. **Clone repository**
   ```bash
   git clone https://github.com/QLBV/Backend.git
   cd Backend
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   ```

3. **Thiết lập môi trường**
   
   Sao chép file môi trường mẫu:
   ```bash
   cp .env.example .env
   ```
   
   Cấu hình file `.env`:
   ```env
   # Server
   PORT=5000
   NODE_ENV=development
   
   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=healos_db
   DB_USER=root
   DB_PASSWORD=your_password
   
   # JWT
   JWT_SECRET=your_super_secret_key
   JWT_EXPIRES_IN=1d
   JWT_REFRESH_SECRET=your_refresh_secret
   JWT_REFRESH_EXPIRES_IN=7d
   
   # Email (SMTP)
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USER=your_email@gmail.com
   MAIL_PASS=your_app_password
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Redis (tùy chọn)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

4. **Thiết lập cơ sở dữ liệu**
   
   Tạo database:
   ```bash
   mysql -u root -p -e "CREATE DATABASE healthcare_db;"
   ```
   
   Chạy migrations:
   ```bash
   npx sequelize-cli db:migrate
   ```
   
   Seed dữ liệu ban đầu:
   ```bash
   npx sequelize-cli db:seed:all
   ```
   
   (Tùy chọn) Seed dữ liệu mẫu lớn để test:
   ```bash
   npm run seed:data
   ```

5. **Khởi động Development Server**
   ```bash
   npm run dev
   ```
   
   API sẽ chạy tại `http://localhost:5000`

### Build cho Production

```bash
npm run build
npm start
```

## 📁 Cấu trúc dự án

```
src/
├── config/              # File cấu hình
│   ├── database.ts      # Kết nối database
│   ├── passport.ts      # OAuth strategies
│   └── redis.ts         # Kết nối Redis
├── constant/            # Hằng số ứng dụng
├── controllers/         # Route controllers
│   ├── auth.controller.ts
│   ├── appointment.controller.ts
│   ├── patient.controller.ts
│   └── ...
├── events/              # Event emitters
├── jobs/                # Scheduled cron jobs
├── middlewares/         # Express middlewares
│   ├── auth.middleware.ts
│   ├── validate.middleware.ts
│   └── ...
├── models/              # Sequelize models
│   ├── User.ts
│   ├── Patient.ts
│   ├── Doctor.ts
│   └── ...
├── routes/              # API routes
│   ├── auth.routes.ts
│   ├── patient.routes.ts
│   └── ...
├── services/            # Business logic
│   ├── auth.service.ts
│   ├── email.service.ts
│   ├── reportPDF.service.ts
│   └── ...
├── templates/           # Email templates
├── tests/               # Test files
├── types/               # TypeScript definitions
├── utils/               # Utility functions
├── app.ts               # Express app setup
└── server.ts            # Server entry point

migrations/              # Database migrations
seeders/                 # Database seeders
uploads/                 # Thư mục upload file
logs/                    # Application logs
postman/                 # Postman collections
```

## 🗄️ Cơ sở dữ liệu

### Mối quan hệ thực thể

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│   Patient   │────▶│    Visit    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   ▼
       ▼                   │           ┌─────────────┐
┌─────────────┐            │           │ Prescription│
│   Doctor    │            │           └─────────────┘
└─────────────┘            │                   │
       │                   │                   ▼
       ▼                   │           ┌─────────────┐
┌─────────────┐            └──────────▶│   Invoice   │
│ DoctorShift │                        └─────────────┘
└─────────────┘
```

### Các Model chính
- **User** - Tài khoản người dùng cơ bản
- **Patient** - Hồ sơ bệnh nhân
- **Doctor** - Hồ sơ bác sĩ & chuyên khoa
- **Appointment** - Hồ sơ đặt lịch
- **Visit** - Lượt khám & kiểm tra y tế
- **Prescription** - Đơn thuốc
- **Invoice** - Hóa đơn & thanh toán
- **Medicine** - Kho thuốc
- **DoctorShift** - Lịch trực
- **Attendance** - Chấm công nhân viên
- **Payroll** - Quản lý lương

## 📜 Các lệnh có sẵn

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Khởi động development server (nodemon) |
| `npm run build` | Biên dịch TypeScript |
| `npm start` | Khởi động production server |
| `npm test` | Chạy tất cả tests |
| `npm run test:watch` | Chạy tests ở chế độ watch |
| `npm run test:coverage` | Tạo báo cáo coverage |
| `npm run seed:data` | Seed database với dữ liệu mẫu lớn |

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/tinh-nang-tuyet-voi`)
3. Commit thay đổi (`git commit -m 'feat: Thêm tính năng tuyệt vời'`)
4. Push lên branch (`git push origin feature/tinh-nang-tuyet-voi`)
5. Mở Pull Request

### Quy ước Commit
```
feat: Tính năng mới
fix: Sửa lỗi
docs: Tài liệu
refactor: Tái cấu trúc code
test: Testing
chore: Bảo trì
```

## 📄 Giấy phép

Dự án này là phần mềm độc quyền. Bảo lưu mọi quyền.

## 👥 Đội ngũ

Phát triển với ❤️ bởi Đội ngũ Phát triển HealthCare

---

<div align="center">

**[⬆ Về đầu trang](#-healthcare-backend-api)**

</div>

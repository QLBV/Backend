# 🏥 Healthcare Management System - Backend API

> **Hệ thống quản lý phòng khám Healthcare** - REST API backend với kiến trúc phân tầng, bảo mật cao và đầy đủ tính năng quản lý bệnh viện/phòng khám.

[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql)](https://www.mysql.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.x-52B0E7?logo=sequelize)](https://sequelize.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## 📋 Mục Lục

- [Giới Thiệu Dự Án](#-giới-thiệu-dự-án)
- [Tổng Quan Kiến Trúc](#-tổng-quan-kiến-trúc)
- [Tech Stack](#-tech-stack)
- [Phân Quyền & Role](#-phân-quyền--role)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Setup & Chạy Project](#-setup--chạy-project)
- [Database & Migration](#-database--migration)
- [Authentication Flow](#-authentication-flow)
- [Các Module Chính](#-các-module-chính)
- [Logging & Audit](#-logging--audit)
- [Testing & Demo](#-testing--demo)
- [Tác Giả & Ghi Chú](#-tác-giả--ghi-chú)

---

## 🎯 Giới Thiệu Dự Án

### Tên Hệ Thống

**Healthcare Management System** - Hệ thống quản lý phòng khám tích hợp đầy đủ

### Mục Tiêu

Xây dựng một hệ thống backend REST API hoàn chỉnh để quản lý toàn bộ hoạt động của phòng khám đa chuyên khoa, bao gồm:

- ✅ Quản lý bệnh nhân, bác sĩ, lịch hẹn
- ✅ Quản lý khám bệnh, chẩn đoán, đơn thuốc
- ✅ Quản lý kho thuốc với cơ chế khóa bi quan (pessimistic locking)
- ✅ Quản lý hóa đơn, thanh toán, hoàn tiền
- ✅ Quản lý nhân sự, chấm công, tính lương tự động
- ✅ Báo cáo thống kê, xuất PDF với biểu đồ
- ✅ Hệ thống thông báo đa kênh (in-app, email)
- ✅ Audit log chi tiết với snapshot dữ liệu

### Đối Tượng Sử Dụng

- **Admin**: Quản trị viên hệ thống (full quyền)
- **Lễ tân**: Quản lý đặt lịch, bệnh nhân, hóa đơn
- **Bác sĩ**: Khám bệnh, kê đơn, quản lý ca trực
- **Bệnh nhân**: Đặt lịch khám, xem lịch sử khám, thanh toán

### Phạm Vi

- **Môi trường**: Development/Local testing
- **Mục đích**: Đồ án môn học OOAD/ Demo dự án thực tế
- **Triển khai**: Hỗ trợ cả standalone và distributed deployment (với Redis)

---

## 🏗️ Tổng Quan Kiến Trúc

### Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                      │
│  (Web Frontend / Mobile App / Postman / Third-party Services)   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST API
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                       EXPRESS.JS SERVER                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              MIDDLEWARE LAYER                           │    │
│  │  • CORS • Helmet • Rate Limiting • Morgan Logging       │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           AUTHENTICATION & AUTHORIZATION                │    │
│  │  • JWT Verify • Role Check • Permission Check           │    │
│  │  • Token Blacklist (Redis) • OAuth2 (Google)            │    │
│  └─────────────────────────────────────────────────────────┘    │
│  │                  ROUTES LAYER                           │    │
│  │  22+ Route Modules • 104+ API Endpoints                 │    │
│  └──────────────────────┬──────────────────────────────────┘    │
│                         ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              CONTROLLERS LAYER                          │    │
│  │  • Request Validation (express-validator)               │    │
│  │  • Response Formatting • Error Handling                 │    │
│  └──────────────────────┬──────────────────────────────────┘    │
│                         ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               SERVICES LAYER                            │    │
│  │  • Business Logic • Transaction Management              │    │
│  │  • Data Processing • Complex Calculations               │    │
│  └──────────────────────┬──────────────────────────────────┘    │
│                         ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                MODELS LAYER                             │    │
│  │  • Sequelize ORM • 30+ Models • Associations            │    │
│  └──────────────────────┬──────────────────────────────────┘    │
└──────────────────────── ┼────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴────────────────┐
        ↓                                  ↓
┌───────────────────┐            ┌─────────────────────┐
│   MYSQL DATABASE  │            │   REDIS CACHE       │
│   • 30+ Tables    │            │   • Token Blacklist │
│   • 37 Migrations │            │   • Session Store   │
│   • Indexes       │            │   • TTL Management  │
└───────────────────┘            └─────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                           │
│  • SMTP Email • Google OAuth • PDF Generation • Cron Jobs       │
└─────────────────────────────────────────────────────────────────┘
```

### Luồng Request Chính

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Middleware
    participant Auth
    participant Controller
    participant Service
    participant Model
    participant Database
    participant Redis

    Client->>Middleware: HTTP Request
    Middleware->>Middleware: CORS, Helmet, Rate Limit
    Middleware->>Auth: Verify JWT Token
    Auth->>Redis: Check Token Blacklist
    Redis-->>Auth: Token Valid
    Auth->>Auth: Check Role & Permissions
    Auth->>Controller: Authorized Request
    Controller->>Controller: Validate Input
    Controller->>Service: Execute Business Logic
    Service->>Model: Query/Update Data
    Model->>Database: SQL Query
    Database-->>Model: Result Set
    Model-->>Service: Processed Data
    Service->>Service: Apply Business Rules
    Service-->>Controller: Service Response
    Controller->>Controller: Format Response
    Controller-->>Client: JSON Response
```

### Kiến Trúc Phân Tầng (Layered Architecture)

| Tầng            | Chức Năng                           | Công Nghệ                      |
| --------------- | ----------------------------------- | ------------------------------ |
| **Routes**      | Định nghĩa endpoint, router         | Express Router                 |
| **Middleware**  | Authentication, Validation, Logging | JWT, express-validator, morgan |
| **Controllers** | Xử lý request/response, điều phối   | TypeScript, async/await        |
| **Services**    | Business logic, transaction         | Sequelize Transaction          |
| **Models**      | Data access, ORM                    | Sequelize Models               |
| **Database**    | Persistence layer                   | MySQL 8.x                      |

---

## 🛠️ Tech Stack

### Backend Framework

```typescript
Node.js      >= 18.x      // JavaScript runtime
TypeScript    5.9.x       // Type-safe development
Express.js    5.2.x       // Web framework
```

### Database & ORM

```typescript
MySQL         8.x         // Relational database
Sequelize     6.37.x      // ORM (Object-Relational Mapping)
Redis         Latest      // Token blacklist, caching
```

### Authentication & Security

```typescript
jsonwebtoken   9.0.x      // JWT generation/verification
bcrypt         6.0.x      // Password hashing
passport       0.7.x      // OAuth2 middleware
passport-google-oauth20   // Google login
helmet         8.1.x      // Security headers
cors           2.8.x      // CORS policy
express-rate-limit 8.2.x  // API rate limiting (100 req/15min)
```

### Validation & Processing

```typescript
express-validator  7.3.x  // Input validation
multer            2.0.x   // File upload handling
```

### PDF & Document Generation

```typescript
pdfkit                0.17.x   // PDF generation engine
chart.js              4.5.x    // Chart rendering
chartjs-node-canvas   5.0.x    // Server-side chart to image
node-forge            1.3.x    // Digital signatures
```

### Task Scheduling & Email

```typescript
node-cron     4.2.x      // Scheduled jobs (medicine expiry, alerts)
nodemailer    7.0.x      // Email notifications (SMTP)
```

### Development Tools

```typescript
nodemon       3.1.x      // Auto-restart server
ts-node       10.9.x     // TypeScript execution
sequelize-cli 6.6.x      // Database migration CLI
morgan        1.10.x     // HTTP request logger
```

### Database Configuration

- **Timezone**: UTC+07:00 (Vietnam)
- **Charset**: utf8mb4 (full Unicode, emoji support)
- **Collation**: utf8mb4_unicode_ci
- **Connection Pool**: Max 10 connections, idle timeout 10s

---

## 🔐 Phân Quyền & Role

### Danh Sách Role

| Role ID | Role Code      | Tên Vai Trò   | Mô Tả                                |
| ------- | -------------- | ------------- | ------------------------------------ |
| **1**   | `ADMIN`        | Quản trị viên | Toàn quyền quản trị hệ thống         |
| **2**   | `RECEPTIONIST` | Lễ tân        | Quản lý bệnh nhân, lịch hẹn, hóa đơn |
| **3**   | `PATIENT`      | Bệnh nhân     | Đặt lịch, xem thông tin cá nhân      |
| **4**   | `DOCTOR`       | Bác sĩ        | Khám bệnh, kê đơn, quản lý ca trực   |

### Quyền Của Từng Role

#### 🔴 ADMIN (Superuser)

```yaml
Permissions: ALL
Modules:
  - Users: view, create, edit, delete
  - Roles & Permissions: manage
  - Medicines: full CRUD + import/export
  - Patients: full CRUD
  - Doctors: full CRUD + shift management
  - Appointments: view all, create offline, cancel
  - Prescriptions: view all
  - Invoices: view all, create, edit, payment
  - Payrolls: calculate, approve, pay, view all
  - Reports: all reports + PDF export
  - Dashboard: full analytics
  - Audit Logs: view all activities
```

#### 🟡 RECEPTIONIST (Front Desk)

```yaml
Permissions: Limited management
Modules:
  - Patients: view, create, edit, setup profile
  - Appointments: create, view, cancel
  - Doctors: view only (for booking)
  - Invoices: create, view, payment processing
  - Dashboard: limited stats
  - Notifications: own notifications
```

#### 🟢 PATIENT (End User)

```yaml
Permissions: Self-service only
Modules:
  - Profile: view own, edit own, setup
  - Appointments: create own, view own, cancel own
  - Prescriptions: view own history
  - Invoices: view own, payment
  - Notifications: receive & view own
```

#### 🔵 DOCTOR (Medical Staff)

```yaml
Permissions: Clinical operations
Modules:
  - Visits: create, update, complete
  - Prescriptions: create, view, cancel
  - Diagnoses: create, edit
  - Appointments: view assigned
  - Patients: view assigned
  - Shifts: view own, request changes
  - Payrolls: view own salary
  - Notifications: receive assignments
```

### Cơ Chế Phân Quyền

#### 1. Role-Based Access Control (RBAC)

```typescript
// Middleware: requireRole
app.get(
  "/api/admin/users",
  verifyToken,
  requireRole(["ADMIN"]),
  userController.getAll
);
```

#### 2. Permission-Based Access Control (PBAC)

```typescript
// Middleware: requirePermission
app.post(
  "/api/medicines",
  verifyToken,
  requirePermission("medicines.create"),
  medicineController.create
);

// Multiple permissions (OR logic)
app.get(
  "/api/reports",
  verifyToken,
  requireAnyPermission(["reports.view", "reports.export"]),
  reportController.get
);

// Multiple permissions (AND logic)
app.post(
  "/api/prescriptions",
  verifyToken,
  requireAllPermissions(["prescriptions.create", "medicines.view"]),
  prescriptionController.create
);
```

#### 3. Resource Ownership Check

```typescript
// Trong Service Layer
if (user.roleCode !== "ADMIN" && prescription.doctorId !== user.id) {
  throw new ForbiddenError("Bạn không có quyền xem đơn thuốc này");
}
```

---

## 📁 Cấu Trúc Thư Mục

```
Backend/
├── 📂 src/
│   ├── 📂 config/
│   │   ├── database.ts          # Sequelize config (MySQL + connection pooling)
│   │   ├── redis.ts             # Redis client config (token blacklist)
│   │   ├── passport.ts          # Google OAuth2 strategy
│   │   └── email.ts             # Nodemailer SMTP config
│   │
│   ├── 📂 controllers/          # Request handlers (22+ files)
│   │   ├── auth.controller.ts         # Login, register, refresh token, OAuth
│   │   ├── patient.controller.ts      # Patient CRUD, setup profile
│   │   ├── doctor.controller.ts       # Doctor management, shifts
│   │   ├── appointment.controller.ts  # Booking, cancellation
│   │   ├── visit.controller.ts        # Visit completion, check-in
│   │   ├── medicine.controller.ts     # Inventory, import/export
│   │   ├── prescription.controller.ts # Prescription CRUD, PDF export
│   │   ├── invoice.controller.ts      # Billing, payment, PDF
│   │   ├── payroll.controller.ts      # Salary calculation, PDF
│   │   ├── report.controller.ts       # Analytics, charts, PDF export
│   │   └── ...                        # 13+ other controllers
│   │
│   ├── 📂 services/             # Business logic layer (20+ files)
│   │   ├── auth.service.ts            # JWT generation, password reset
│   │   ├── patient.service.ts         # Patient code generation (BN000001)
│   │   ├── doctor.service.ts          # Doctor code generation (DOC-000001)
│   │   ├── appointment.service.ts     # Slot allocation, conflict check
│   │   ├── medicine.service.ts        # Stock management, pessimistic locking
│   │   ├── prescription.service.ts    # Auto stock deduction, price snapshot
│   │   ├── invoice.service.ts         # Auto invoice generation, payment
│   │   ├── payroll.service.ts         # Complex salary calculation
│   │   ├── notification.service.ts    # Multi-channel notifications
│   │   └── ...                        # Other service files
│   │
│   ├── 📂 models/               # Sequelize ORM models (30+ files)
│   │   ├── User.ts                    # User model with role
│   │   ├── Role.ts                    # Role definitions
│   │   ├── Permission.ts              # Permission system
│   │   ├── Patient.ts                 # Patient entity
│   │   ├── Doctor.ts                  # Doctor entity
│   │   ├── Appointment.ts             # Appointment bookings
│   │   ├── Visit.ts                   # Visit records
│   │   ├── Medicine.ts                # Medicine inventory
│   │   ├── Prescription.ts            # Prescription headers
│   │   ├── PrescriptionDetail.ts      # Prescription line items
│   │   ├── Invoice.ts                 # Invoice headers
│   │   ├── InvoiceItem.ts             # Invoice line items
│   │   ├── Payroll.ts                 # Payroll records
│   │   ├── AuditLog.ts                # Audit trail
│   │   ├── Notification.ts            # Notification system
│   │   └── ...                        # 16+ other models
│   │
│   ├── 📂 routes/               # Express routers (22+ files)
│   │   ├── auth.routes.ts             # 6 endpoints (login, register, OAuth)
│   │   ├── user.routes.ts             # 5 endpoints (CRUD users)
│   │   ├── patient.routes.ts          # 6 endpoints (patient management)
│   │   ├── doctor.routes.ts           # 7 endpoints (doctor + shifts)
│   │   ├── appointment.routes.ts      # 4 endpoints (booking)
│   │   ├── medicine.routes.ts         # 12 endpoints (inventory + alerts)
│   │   ├── prescription.routes.ts     # 7 endpoints (prescriptions + PDF)
│   │   ├── invoice.routes.ts          # 9 endpoints (billing + PDF)
│   │   ├── payroll.routes.ts          # 9 endpoints (salary + PDF)
│   │   ├── report.routes.ts           # 11 endpoints (analytics + PDF)
│   │   ├── dashboard.routes.ts        # 7 endpoints (KPIs, stats)
│   │   └── ...                        # Other route modules
│   │
│   ├── 📂 middleware/           # Middleware functions
│   │   ├── auth.middleware.ts         # verifyToken, requireRole
│   │   ├── permission.middleware.ts   # requirePermission, requireAnyPermission
│   │   ├── validation.middleware.ts   # express-validator schemas
│   │   ├── error.middleware.ts        # Global error handler
│   │   ├── audit.middleware.ts        # Audit logging middleware
│   │   └── upload.middleware.ts       # Multer file upload
│   │
│   ├── 📂 utils/                # Helper utilities
│   │   ├── jwt.util.ts                # JWT sign/verify helpers
│   │   ├── password.util.ts           # bcrypt hash/compare
│   │   ├── pdfGenerator.ts            # Base PDF utilities
│   │   ├── generateInvoicePDF.ts      # Invoice PDF template
│   │   ├── medicalPDFTemplate.ts      # Prescription PDF template
│   │   ├── pdfFontHelper.ts           # Font management for Vietnamese
│   │   ├── codeGenerator.ts           # Auto code generation (BN, DOC, RX, INV)
│   │   └── logger.ts                  # Winston/Morgan logger
│   │
│   ├── 📂 jobs/                 # Scheduled cron jobs
│   │   ├── medicineExpiry.job.ts      # Daily expiry check (00:00)
│   │   ├── lowStockAlert.job.ts       # Daily low stock alert (08:00)
│   │   └── expiringAlert.job.ts       # Daily expiring warning (09:00)
│   │
│   ├── 📂 migrations/           # Database migrations (37 files)
│   │   ├── 20240101-create-users.js
│   │   ├── 20240102-create-roles.js
│   │   ├── 20240103-create-permissions.js
│   │   └── ...                        # 34+ other migrations
│   │
│   ├── 📂 seeders/              # Database seeders
│   │   ├── demo-users.js              # Default users (admin, doctor, patient)
│   │   ├── roles-permissions.js       # Role & permission setup
│   │   └── ...
│   │
│   ├── 📂 tests/                # Test files
│   │   ├── pdf.test.ts                # PDF generation tests
│   │   └── invoice-pdf.test.ts        # Invoice PDF tests
│   │
│   ├── server.ts                # Express app setup + middleware
│   └── index.ts                 # Entry point (start server)
│
├── 📂 uploads/                  # File upload directory
│   ├── avatars/                       # User/patient avatars
│   └── documents/                     # Other uploaded files
│
├── 📂 test-output/              # Test-generated PDFs
│
├── 📂 dist/                     # Compiled TypeScript output
│
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript config
├── nodemon.json                 # Nodemon config
├── README.md                    # This file
└── LICENSE                      # License file
```

### Giải Thích Thư Mục Chính

#### 📂 **controllers/**

- **Chức năng**: Xử lý HTTP request/response
- **Trách nhiệm**: Validate input → Gọi service → Format response
- **Pattern**: Thin controllers (business logic ở service layer)

#### 📂 **services/**

- **Chức năng**: Business logic và transaction management
- **Trách nhiệm**: Complex calculations, database transactions, external API calls
- **Pattern**: Fat services (chứa logic phức tạp)

#### 📂 **models/**

- **Chức năng**: Sequelize ORM models
- **Trách nhiệm**: Database schema, associations, basic CRUD
- **Pattern**: Active Record pattern

#### 📂 **routes/**

- **Chức năng**: API endpoint definitions
- **Trách nhiệm**: Route matching, middleware attachment
- **Pattern**: Router chaining

#### 📂 **middleware/**

- **Chức năng**: Interceptor logic
- **Trách nhiệm**: Authentication, authorization, validation, logging

#### 📂 **utils/**

- **Chức năng**: Reusable helper functions
- **Trách nhiệm**: JWT, password hashing, PDF generation, code generation

---

## 🚀 Setup & Chạy Project

### Yêu Cầu Môi Trường

```bash
Node.js:    >= 18.x
npm:        >= 9.x
MySQL:      >= 8.x
Redis:      Latest (optional for development, required for production)
```

### Bước 1: Clone Repository

```bash
git clone https://github.com/QLBV/Backend.git
cd Backend
```

### Bước 2: Cài Đặt Dependencies

```bash
npm install
```

### Bước 3: Setup Environment Variables

Tạo file `.env` từ template:

```bash
cp .env.example .env
```

Cấu hình các biến môi trường trong `.env`:

```env
# ============ APPLICATION ============
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# ============ DATABASE ============
DB_HOST=localhost
DB_PORT=3306
DB_NAME=healthcare_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# ============ JWT AUTHENTICATION ============
JWT_SECRET=your-super-secret-key-min-64-characters-for-production-security
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key-min-64-characters-for-security
JWT_REFRESH_EXPIRES_IN=7d

# ============ REDIS (Token Blacklist) ============
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============ OAUTH2 - GOOGLE ============
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/oauth/google/callback

# ============ EMAIL (SMTP) ============
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# ============ FILE UPLOAD ============
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# ============ SECURITY ============
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_SALT_ROUNDS=10
```

### Bước 4: Setup Database

Tạo database MySQL:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE healthcare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Bước 5: Chạy Migrations

```bash
npx sequelize-cli db:migrate
```

### Bước 6: (Optional) Seed Data

```bash
npx sequelize-cli db:seed:all
```

### Bước 7: Start Redis Server

```bash
# Ubuntu/Linux
sudo systemctl start redis

# macOS (with Homebrew)
brew services start redis

# Windows (with Redis installer)
redis-server
```

### Bước 8: Chạy Development Server

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

### Bước 9: Build Production

```bash
npm run build
npm start
```

### Test API

Mở trình duyệt hoặc Postman:

```
GET http://localhost:3000/api/health
```

Kết quả mong đợi:

```json
{
  "status": "OK",
  "timestamp": "2024-01-03T10:30:00.000Z"
}
```

---

## 🗄️ Database & Migration

### Database Sử Dụng

**MySQL 8.x** với cấu hình:

- **Charset**: utf8mb4 (hỗ trợ tiếng Việt đầy đủ)
- **Collation**: utf8mb4_unicode_ci
- **Timezone**: UTC+07:00 (Vietnam)
- **Engine**: InnoDB (transaction support)

### Database Schema

Hệ thống có **30+ bảng** được tổ chức theo module:

#### Core System Tables

```sql
users                    -- Người dùng hệ thống
roles                    -- Vai trò (ADMIN, DOCTOR, RECEPTIONIST, PATIENT)
permissions              -- Quyền hạn chi tiết
role_permissions         -- Mapping role ↔ permission
```

#### Patient Module

```sql
patients                 -- Thông tin bệnh nhân
patient_profiles         -- Hồ sơ bệnh nhân chi tiết
```

#### Doctor Module

```sql
doctors                  -- Thông tin bác sĩ
specialties              -- Chuyên khoa
shifts                   -- Ca trực (Sáng/Chiều/Tối)
doctor_shifts            -- Lịch trực của bác sĩ
```

#### Appointment & Visit

```sql
appointments             -- Lịch hẹn khám
visits                   -- Lượt khám thực tế
diagnoses                -- Chẩn đoán
disease_categories       -- Danh mục bệnh (ICD-10)
```

#### Medicine Management

```sql
medicines                -- Kho thuốc
medicine_imports         -- Lịch sử nhập kho
medicine_exports         -- Lịch sử xuất kho
```

#### Prescription & Invoice

```sql
prescriptions            -- Đơn thuốc (header)
prescription_details     -- Chi tiết đơn thuốc (line items)
invoices                 -- Hóa đơn (header)
invoice_items            -- Chi tiết hóa đơn (line items)
payments                 -- Thanh toán
refunds                  -- Hoàn tiền
```

#### HR & Payroll

```sql
payrolls                 -- Bảng lương
attendance               -- Chấm công
```

#### System Tables

```sql
notifications            -- Thông báo
notification_settings    -- Cài đặt thông báo
audit_logs               -- Audit trail (log hệ thống)
```

### Cách Chạy Migration

#### Tạo Migration Mới

```bash
npx sequelize-cli migration:generate --name create-table-name
```

#### Chạy Tất Cả Migrations

```bash
npx sequelize-cli db:migrate
```

#### Rollback Migration Gần Nhất

```bash
npx sequelize-cli db:migrate:undo
```

#### Rollback Tất Cả Migrations

```bash
npx sequelize-cli db:migrate:undo:all
```

#### Kiểm Tra Trạng Thái Migration

```bash
npx sequelize-cli db:migrate:status
```

### Seed Data

#### Chạy Tất Cả Seeders

```bash
npx sequelize-cli db:seed:all
```

#### Chạy Seeder Cụ Thể

```bash
npx sequelize-cli db:seed --seed 20240101-demo-users.js
```

#### Undo Seeder

```bash
npx sequelize-cli db:seed:undo:all
```

### Default Users (Sau Khi Seed)

| Email                        | Password | Role         | Mô Tả         |
| ---------------------------- | -------- | ------------ | ------------- |
| admin@healthcare.com         | 123456   | ADMIN        | Quản trị viên |
| nguyen.van.a@healthcare.com  | 123456   | DOCTOR       | Bác sĩ        |
| receptionist1@healthcare.com | 123456   | RECEPTIONIST | Lễ tân        |
| patient1@gmail.com           | 123456   | PATIENT      | Bệnh nhân     |

---

## 🔑 Authentication Flow

### 1. Registration Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Validator
    participant Service
    participant Database

    User->>API: POST /api/auth/register
    API->>Validator: Validate input (email, password, role)
    Validator->>Service: Create user
    Service->>Service: Hash password (bcrypt, 10 rounds)
    Service->>Database: Save user
    Database-->>Service: User created
    Service->>Service: Generate JWT access + refresh token
    Service-->>API: Return tokens + user info
    API-->>User: 201 Created
```

**Request:**

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass@123",
  "username": "johndoe",
  "fullName": "John Doe",
  "roleCode": "PATIENT"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "roleCode": "PATIENT"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Service
    participant Database
    participant Redis

    User->>API: POST /api/auth/login
    API->>Service: Authenticate (email, password)
    Service->>Database: Find user by email
    Database-->>Service: User found
    Service->>Service: Compare password (bcrypt)
    Service->>Service: Generate JWT tokens
    Service->>Database: Update last login timestamp
    Service->>Redis: Remove old tokens from blacklist (if any)
    Service-->>API: Return tokens + user
    API-->>User: 200 OK
```

**Request:**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass@123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "roleCode": "PATIENT",
      "permissions": ["patients.view", "appointments.create"]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. JWT Access/Refresh Token

#### Token Specification

| Token Type        | Expiry | Purpose            | Secret Key           |
| ----------------- | ------ | ------------------ | -------------------- |
| **Access Token**  | 1 hour | API authentication | `JWT_SECRET`         |
| **Refresh Token** | 7 days | Renew access token | `JWT_REFRESH_SECRET` |

#### JWT Payload

```json
{
  "userId": 1,
  "email": "john.doe@example.com",
  "roleCode": "PATIENT",
  "iat": 1704268800,
  "exp": 1704272400
}
```

#### Refresh Token Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Redis
    participant Service

    Client->>API: POST /api/auth/refresh-token
    Note over Client,API: Header: Authorization Bearer [refresh_token]
    API->>Redis: Check if token blacklisted
    Redis-->>API: Not blacklisted
    API->>Service: Verify refresh token
    Service->>Service: Generate new access + refresh token
    Service->>Redis: Blacklist old refresh token (TTL 7 days)
    Service-->>API: Return new tokens
    API-->>Client: 200 OK
```

**Request:**

```http
POST /api/auth/refresh-token
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Logout Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Redis

    Client->>API: POST /api/auth/logout
    Note over Client,API: Header: Authorization Bearer [token]
    API->>Redis: Add access token to blacklist (TTL 1h)
    API->>Redis: Add refresh token to blacklist (TTL 7d)
    Redis-->>API: Tokens blacklisted
    API-->>Client: 200 OK (Logged out)
```

**Request:**

```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

### 5. Forgot Password Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Service
    participant Database
    participant Email

    User->>API: POST /api/auth/forgot-password
    API->>Service: Request reset (email)
    Service->>Database: Find user by email
    Database-->>Service: User found
    Service->>Service: Generate reset token (JWT, 15min)
    Service->>Database: Save reset token + expiry
    Service->>Email: Send reset email with token
    Email-->>User: Email with reset link
    Service-->>API: Success message
    API-->>User: 200 OK
```

**Request:**

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email đặt lại mật khẩu đã được gửi"
}
```

### 6. Reset Password Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Service
    participant Database

    User->>API: POST /api/auth/reset-password
    API->>Service: Reset password (token, new password)
    Service->>Service: Verify reset token
    Service->>Database: Find user by reset token
    Database-->>Service: User found
    Service->>Service: Check token expiry (max 15 min)
    Service->>Service: Hash new password (bcrypt)
    Service->>Database: Update password + clear reset token
    Service-->>API: Success
    API-->>User: 200 OK
```

**Request:**

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewSecurePass@456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại thành công"
}
```

### 7. OAuth (Google Login) Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Google
    participant Database

    User->>Frontend: Click "Login with Google"
    Frontend->>Backend: GET /api/auth/oauth/google
    Backend->>Google: Redirect to Google OAuth
    Google->>User: Show consent screen
    User->>Google: Grant permission
    Google->>Backend: Callback with authorization code
    Backend->>Google: Exchange code for user info
    Google-->>Backend: User profile (email, name, avatar)
    Backend->>Database: Find or create user
    Database-->>Backend: User record
    Backend->>Backend: Generate JWT tokens
    Backend->>Frontend: Redirect with tokens
    Frontend-->>User: Logged in
```

**Initiate OAuth:**

```http
GET /api/auth/oauth/google
```

**Callback (handled automatically):**

```http
GET /api/auth/oauth/google/callback?code=...
```

**Final Redirect:**

```
http://localhost:5173/auth/callback?token=eyJhbGciOiJI...
```

### Token Blacklist Mechanism

#### Redis Storage

```typescript
// Key format: blacklist:[token_hash]
// Value: userId
// TTL: Token expiry time

await redis.setex(`blacklist:${tokenHash}`, expiryTimeInSeconds, userId);
```

#### Verification Middleware

```typescript
export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  // Check blacklist
  const isBlacklisted = await redis.exists(`blacklist:${hash(token)}`);
  if (isBlacklisted) {
    return res.status(401).json({ message: "Token đã bị thu hồi" });
  }

  // Verify JWT
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
};
```

---

## 📦 Các Module Chính

### 1. 👤 User Management (Quản Lý Người Dùng)

**Chức năng chính:**

- ✅ CRUD users với role assignment
- ✅ Upload avatar (multer + local storage)
- ✅ Soft delete (xóa mềm)
- ✅ Tích hợp OAuth2 (Google)

**API Endpoints:**

```http
GET    /api/users                    # Danh sách users (có phân trang)
GET    /api/users/:id                # Chi tiết user
POST   /api/users                    # Tạo user mới
PUT    /api/users/:id                # Cập nhật user
DELETE /api/users/:id                # Xóa user (soft delete)
```

**Business Logic:**

- Auto-assign default role (PATIENT) nếu không chỉ định
- Validate email unique
- Password phải >= 8 ký tự, chứa chữ hoa, số, ký tự đặc biệt

---

### 2. 🏥 Patient Management (Quản Lý Bệnh Nhân)

**Chức năng chính:**

- ✅ Tạo hồ sơ bệnh nhân với CCCD validation
- ✅ Auto-generate mã bệnh nhân: `BN000001`
- ✅ Upload avatar
- ✅ Liên kết với user account

**API Endpoints:**

```http
POST   /api/patients/setup           # Tạo hồ sơ bệnh nhân lần đầu
GET    /api/patients                 # Danh sách bệnh nhân
GET    /api/patients/:id             # Chi tiết bệnh nhân
PUT    /api/patients/:id             # Cập nhật thông tin
DELETE /api/patients/:id             # Xóa bệnh nhân
POST   /api/patients/:id/avatar      # Upload avatar
```

**Business Logic:**

```typescript
// Tự động sinh mã bệnh nhân
const patientCode = await generatePatientCode(); // "BN000001"

// Validate CCCD (12 số)
if (!/^\d{12}$/.test(cccd)) {
  throw new ValidationError("CCCD phải có 12 số");
}
```

---

### 3. 👨‍⚕️ Doctor Management (Quản Lý Bác Sĩ)

**Chức năng chính:**

- ✅ CRUD bác sĩ với chuyên khoa
- ✅ Auto-generate mã bác sĩ: `DOC-000001`
- ✅ Quản lý ca trực (Morning/Afternoon/Evening)
- ✅ Shift scheduling với conflict detection

**API Endpoints:**

```http
GET    /api/doctors                          # Danh sách bác sĩ
GET    /api/doctors/:id                      # Chi tiết bác sĩ
POST   /api/doctors                          # Tạo bác sĩ mới
PUT    /api/doctors/:id                      # Cập nhật bác sĩ
DELETE /api/doctors/:id                      # Xóa bác sĩ
GET    /api/doctors/specialties              # Danh sách chuyên khoa
GET    /api/doctors/:doctorId/shifts         # Lịch trực của bác sĩ
```

**Business Logic:**

- Một bác sĩ chỉ trực 1 ca/ngày (unique constraint)
- Tự động reschedule appointments khi bác sĩ hủy ca
- Tính commission 5% từ invoices khi tính lương

---

### 4. 📅 Appointment System (Hệ Thống Đặt Lịch)

**Chức năng chính:**

- ✅ Đặt lịch online (bệnh nhân tự đặt)
- ✅ Đặt lịch offline (lễ tân đặt hộ)
- ✅ Tự động phân slot (max 40 lượt/ngày/bác sĩ)
- ✅ Conflict detection (doctor + shift + date + slot unique)
- ✅ Real-time doctor availability check

**API Endpoints:**

```http
POST   /api/appointments                     # Đặt lịch online
POST   /api/appointments/offline             # Đặt lịch offline (lễ tân)
GET    /api/appointments                     # Danh sách lịch hẹn
PUT    /api/appointments/:id/cancel          # Hủy lịch hẹn
```

**Business Logic:**

```typescript
// Tự động tìm slot trống
const nextSlot = await findAvailableSlot(doctorId, shiftId, date);

// Unique constraint
await Appointment.create({
  doctorId,
  shiftId,
  date,
  slotNumber: nextSlot, // 1-40
  status: "WAITING",
});
```

**Appointment States:**

```
WAITING → CHECKED_IN → COMPLETED
   ↓
CANCELLED / NO_SHOW
```

---

### 5. 💊 Medicine & Inventory Management

**Chức năng chính:**

- ✅ Quản lý kho thuốc với stock tracking
- ✅ Pessimistic locking cho concurrent operations
- ✅ Import/Export với audit trail
- ✅ Low stock alert
- ✅ Expiry date tracking
- ✅ Auto-mark expired medicines (cron job)

**API Endpoints:**

```http
GET    /api/medicines                        # Danh sách thuốc
GET    /api/medicines/:id                    # Chi tiết thuốc
POST   /api/medicines                        # Thêm thuốc mới
PUT    /api/medicines/:id                    # Cập nhật thuốc
DELETE /api/medicines/:id                    # Xóa thuốc
POST   /api/medicines/:id/import             # Nhập kho
GET    /api/medicines/low-stock              # Thuốc sắp hết
GET    /api/medicines/expiring               # Thuốc sắp hết hạn
POST   /api/medicines/auto-mark-expired      # Đánh dấu hết hạn (cron)
```

**Pessimistic Locking:**

```typescript
// Khóa row khi deduct stock (tránh race condition)
const transaction = await sequelize.transaction({
  isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
});

const medicine = await Medicine.findByPk(medicineId, {
  lock: transaction.LOCK.UPDATE,
  transaction,
});

medicine.stock -= quantity;
await medicine.save({ transaction });
await transaction.commit();
```

**Units Supported:**

```typescript
enum MedicineUnit {
  VIEN = "VIEN", // Viên
  ML = "ML", // Milliliter
  HOP = "HOP", // Hộp
  CHAI = "CHAI", // Chai
  TUYP = "TUYP", // Tuýp
  GOI = "GOI", // Gói
}
```

---

### 6. 📝 Prescription System (Hệ Thống Đơn Thuốc)

**Chức năng chính:**

- ✅ Bác sĩ kê đơn với line items
- ✅ Auto-generate mã đơn: `RX-20240103-00001`
- ✅ **Automatic stock deduction** với transaction
- ✅ **Price snapshot** (lưu giá tại thời điểm kê đơn)
- ✅ Lock prescription sau khi thanh toán
- ✅ Cancellation với stock restoration
- ✅ PDF export (Vietnamese template)

**API Endpoints:**

```http
POST   /api/prescriptions                    # Tạo đơn thuốc
GET    /api/prescriptions/:id                # Chi tiết đơn
GET    /api/prescriptions/visit/:visitId     # Đơn theo lượt khám
PUT    /api/prescriptions/:id                # Cập nhật đơn
POST   /api/prescriptions/:id/cancel         # Hủy đơn (restore stock)
GET    /api/prescriptions/:id/pdf            # Export PDF
```

**Business Logic:**

```typescript
// Auto stock deduction + price snapshot
for (const item of prescriptionDetails) {
  await Medicine.decrement("stock", {
    by: item.quantity,
    where: { id: item.medicineId },
  });

  item.unitPrice = medicine.sellingPrice; // Price snapshot
}

// Lock sau khi thanh toán
prescription.status = "LOCKED";
prescription.isEditable = false;
```

**Prescription States:**

```
DRAFT → LOCKED → DISPENSED
   ↓
CANCELLED (stock restored)
```

---

### 7. 💰 Invoice & Payment System

**Chức năng chính:**

- ✅ Auto-generate invoice khi hoàn thành visit
- ✅ Mã hóa đơn: `INV-20240103-00001`
- ✅ Partial payment support
- ✅ Multiple payment methods (Cash, Bank, QR Code)
- ✅ Payment history tracking
- ✅ PDF export với itemized details

**API Endpoints:**

```http
POST   /api/invoices                         # Tạo hóa đơn thủ công
GET    /api/invoices                         # Danh sách hóa đơn
GET    /api/invoices/:id                     # Chi tiết hóa đơn
GET    /api/invoices/patient/:patientId      # Hóa đơn của bệnh nhân
POST   /api/invoices/:id/payments            # Thanh toán
GET    /api/invoices/statistics              # Thống kê doanh thu
GET    /api/invoices/:id/pdf                 # Export PDF
```

**Payment Flow:**

```typescript
// Partial payment support
const payment = await Payment.create({
  invoiceId,
  amount: 500000,
  paymentMethod: "CASH",
});

invoice.paidAmount += payment.amount;

if (invoice.paidAmount >= invoice.totalAmount) {
  invoice.status = "PAID";
} else {
  invoice.status = "PARTIALLY_PAID";
}
```

**Payment Methods:**

```typescript
enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  QR_CODE = "QR_CODE",
  CREDIT_CARD = "CREDIT_CARD",
}
```

---

### 8. 💼 Payroll & HR Management

**Chức năng chính:**

- ✅ Complex salary calculation
- ✅ Attendance tracking (check-in/check-out)
- ✅ Auto-generate mã lương: `PAY-202401-00001`
- ✅ Payroll workflow: DRAFT → APPROVED → PAID
- ✅ PDF export với detailed breakdown

**API Endpoints:**

```http
POST   /api/payrolls/calculate               # Tính lương tự động
GET    /api/payrolls                         # Danh sách bảng lương
GET    /api/payrolls/:id                     # Chi tiết bảng lương
PUT    /api/payrolls/:id/approve             # Duyệt lương (ADMIN)
PUT    /api/payrolls/:id/pay                 # Thanh toán lương
GET    /api/payrolls/:id/pdf                 # Export PDF
```

**Salary Calculation Formula:**

```typescript
// Base salary với hệ số theo role
const baseSalary = user.baseSalary * getRoleCoefficient(user.roleCode);

// Phụ cấp kinh nghiệm (200k/năm công tác)
const experienceBonus = yearsOfService * 200000;

// Commission (chỉ cho bác sĩ: 5% tổng hóa đơn)
const commission = user.roleCode === "DOCTOR" ? totalInvoices * 0.05 : 0;

// Phạt (200k/ngày nghỉ quá 2 ngày/tháng)
const penalty = absenceDays > 2 ? (absenceDays - 2) * 200000 : 0;

// Tổng lương
const totalSalary = baseSalary + experienceBonus + commission - penalty;
```

**Attendance Tracking:**

```typescript
// Check-in
await Attendance.create({
  userId,
  date: today,
  checkIn: new Date(),
  status: "PRESENT",
});

// Check-out
attendance.checkOut = new Date();
attendance.workHours = calculateWorkHours(checkIn, checkOut);
```

---

### 9. 📊 Reports & Analytics

**Chức năng chính:**

- ✅ Revenue/Expense/Profit reports với date range
- ✅ Top medicines by prescription volume
- ✅ Patient demographics (gender distribution)
- ✅ Medicine alerts (expiring/low stock)
- ✅ All reports exportable to PDF with charts

**API Endpoints:**

```http
GET    /api/reports/revenue                  # Báo cáo doanh thu
GET    /api/reports/expense                  # Báo cáo chi phí
GET    /api/reports/profit                   # Báo cáo lợi nhuận
GET    /api/reports/top-medicines            # Top thuốc bán chạy
GET    /api/reports/patients-by-gender       # Phân bố bệnh nhân theo giới tính
GET    /api/reports/revenue/pdf              # Export doanh thu PDF (with chart)
GET    /api/reports/profit/pdf               # Export lợi nhuận PDF (with chart)
```

**Chart Generation:**

```typescript
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

// Generate chart as image buffer
const chartBuffer = await chartJSNodeCanvas.renderToBuffer({
  type: "bar",
  data: {
    labels: ["Tháng 1", "Tháng 2", "Tháng 3"],
    datasets: [
      {
        label: "Doanh thu",
        data: [10000000, 15000000, 12000000],
      },
    ],
  },
});

// Embed in PDF
doc.image(chartBuffer, 100, 200, { width: 400 });
```

---

### 10. 🔔 Notification System

**Chức năng chính:**

- ✅ In-app notifications
- ✅ Email notifications (SMTP)
- ✅ Notification types: APPOINTMENT_CREATED, DOCTOR_CHANGED, SYSTEM
- ✅ Notification settings per user
- ✅ Unread count tracking

**API Endpoints:**

```http
GET    /api/notifications                    # Danh sách thông báo
GET    /api/notifications/unread-count       # Số thông báo chưa đọc
PUT    /api/notifications/:id/mark-read      # Đánh dấu đã đọc
PUT    /api/notifications/mark-all-read      # Đánh dấu tất cả đã đọc
```

**Notification Types:**

```typescript
enum NotificationType {
  APPOINTMENT_CREATED = "APPOINTMENT_CREATED",
  APPOINTMENT_CANCELLED = "APPOINTMENT_CANCELLED",
  DOCTOR_CHANGED = "DOCTOR_CHANGED",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  MEDICINE_LOW_STOCK = "MEDICINE_LOW_STOCK",
  SYSTEM = "SYSTEM",
}
```

---

### 11. 📜 Audit Logging

**Chức năng chính:**

- ✅ Comprehensive activity tracking
- ✅ Before/after value snapshots (JSON)
- ✅ IP address + User Agent capture
- ✅ Indexed for fast queries

**API Endpoints:**

```http
GET    /api/audit-logs                       # Danh sách audit logs
GET    /api/audit-logs/user/:userId          # Logs của user
GET    /api/audit-logs/entity/:entityType/:id # Logs của entity
```

**Audit Actions:**

```typescript
enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  VIEW = "VIEW",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  EXPORT = "EXPORT",
}
```

**Auto Logging:**

```typescript
// Middleware tự động log
await AuditLog.create({
  userId: req.user.id,
  action: "UPDATE",
  entityType: "Patient",
  entityId: patientId,
  oldValue: JSON.stringify(oldData),
  newValue: JSON.stringify(newData),
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});
```

---

## 📝 Logging & Audit

### Logging Strategy

#### 1. HTTP Request Logging (Morgan)

```typescript
// Format: :method :url :status :response-time ms
app.use(morgan("combined"));
```

**Output Example:**

```
POST /api/auth/login 200 145ms
GET /api/patients 200 23ms
PUT /api/medicines/5 200 67ms
```

#### 2. Application Logging

```typescript
// Console logging với timestamp
console.log(`[${new Date().toISOString()}] User ${userId} logged in`);
```

#### 3. Error Logging

```typescript
// Global error handler
app.use((error, req, res, next) => {
  console.error(`[ERROR] ${error.message}`, {
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
  });

  res.status(500).json({
    message: "Internal server error",
  });
});
```

### Audit Trail System

#### Tự Động Audit Logging

**Middleware-based:**

```typescript
// Tự động log mọi API call
app.use(auditMiddleware);

// Trong middleware
export const auditMiddleware = async (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Log successful operations
    if (res.statusCode >= 200 && res.statusCode < 300) {
      AuditLog.create({
        userId: req.user?.id,
        action: mapMethodToAction(req.method),
        entityType: extractEntityType(req.url),
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }

    return originalJson.call(this, data);
  };

  next();
};
```

#### Manual Audit Logging

**Cho operations quan trọng:**

```typescript
// Trong service
await AuditLog.create({
  userId: req.user.id,
  action: "DELETE",
  entityType: "Prescription",
  entityId: prescriptionId,
  oldValue: JSON.stringify(prescription),
  newValue: null,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
  description: `Hủy đơn thuốc #${prescription.code}`,
});
```

### Audit Log Schema

```sql
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,                           -- Người thực hiện
  action ENUM('CREATE', 'UPDATE', ...),  -- Hành động
  entityType VARCHAR(50),                -- Loại entity (Patient, Medicine, etc.)
  entityId INT,                          -- ID của entity
  oldValue JSON,                         -- Giá trị cũ (before)
  newValue JSON,                         -- Giá trị mới (after)
  ipAddress VARCHAR(45),                 -- IP address
  userAgent TEXT,                        -- Browser/Client info
  description TEXT,                      -- Mô tả chi tiết
  createdAt DATETIME,

  INDEX idx_user (userId),
  INDEX idx_entity (entityType, entityId),
  INDEX idx_action (action),
  INDEX idx_created (createdAt)
);
```

### Log Retention Policy

**Recommended:**

- **HTTP Logs**: 30 days
- **Audit Logs**: 1 year (for compliance)
- **Error Logs**: 90 days

**Cleanup Script:**

```typescript
// Cron job: Xóa audit logs cũ hơn 1 năm
cron.schedule("0 0 * * 0", async () => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  await AuditLog.destroy({
    where: {
      createdAt: { [Op.lt]: oneYearAgo },
    },
  });

  console.log("Cleaned up old audit logs");
});
```

---

## 🧪 Testing & Demo

### Test Scripts

#### 1. PDF Generation Test

```bash
npm run test:pdf
```

**Kiểm tra:**

- ✅ Prescription PDF generation
- ✅ Invoice PDF generation
- ✅ Payroll PDF generation
- ✅ Report PDF với charts

#### 2. Invoice PDF Test

```bash
npm run test:invoice-pdf
```

**Kiểm tra:**

- ✅ Invoice template rendering
- ✅ Payment history display
- ✅ Currency formatting (VND)

### Manual Testing với Postman

#### Import Postman Collection

Nếu có file `postman/` trong project:

```bash
# Import vào Postman Desktop
File → Import → Select postman/*.json
```

### Test Flow Nghiệp Vụ Hoàn Chỉnh

#### Scenario: Bệnh Nhân Đặt Lịch → Khám → Kê Đơn → Thanh Toán

**Bước 1: Đăng ký bệnh nhân**

```http
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "Test@123",
  "roleCode": "PATIENT"
}
```

**Bước 2: Setup hồ sơ bệnh nhân**

```http
POST /api/patients/setup
Authorization: Bearer <access_token>
{
  "fullName": "Nguyễn Văn A",
  "dateOfBirth": "1990-01-01",
  "gender": "MALE",
  "phone": "0912345678",
  "cccd": "001234567890"
}
```

**Bước 3: Đặt lịch khám**

```http
POST /api/appointments
Authorization: Bearer <access_token>
{
  "doctorId": 1,
  "shiftId": 1,
  "date": "2024-01-10",
  "reason": "Đau đầu kéo dài"
}
```

**Bước 4: Lễ tân check-in**

```http
POST /api/visits/check-in
Authorization: Bearer <receptionist_token>
{
  "appointmentId": 1
}
```

**Bước 5: Bác sĩ khám và kê đơn**

```http
POST /api/prescriptions
Authorization: Bearer <doctor_token>
{
  "visitId": 1,
  "details": [
    {
      "medicineId": 5,
      "quantity": 20,
      "dosage": "2 viên/lần",
      "frequency": "2 lần/ngày",
      "duration": 10
    }
  ]
}
```

**Bước 6: Hoàn thành visit (auto-tạo invoice)**

```http
PUT /api/visits/1/complete
Authorization: Bearer <doctor_token>
{
  "diagnoses": [
    {
      "diseaseCategoryId": 3,
      "symptoms": "Đau đầu, mệt mỏi",
      "treatment": "Nghỉ ngơi, uống thuốc theo đơn"
    }
  ]
}
```

**Bước 7: Thanh toán hóa đơn**

```http
POST /api/invoices/1/payments
Authorization: Bearer <receptionist_token>
{
  "amount": 500000,
  "paymentMethod": "CASH"
}
```

**Bước 8: Export PDF hóa đơn**

```http
GET /api/invoices/1/pdf
Authorization: Bearer <patient_token>
```

**Bước 9: Export PDF đơn thuốc**

```http
GET /api/prescriptions/1/pdf
Authorization: Bearer <patient_token>
```

### Test Scheduled Jobs

#### Medicine Expiry Check (00:00 daily)

```bash
# Manual trigger
curl -X POST http://localhost:3000/api/medicines/auto-mark-expired \
  -H "Authorization: Bearer <admin_token>"
```

#### Low Stock Alert (08:00 daily)

```bash
# Check thuốc sắp hết
curl http://localhost:3000/api/medicines/low-stock \
  -H "Authorization: Bearer <admin_token>"
```

### Test Dashboard & Reports

```bash
# Dashboard stats
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer <token>"

# Revenue report
curl "http://localhost:3000/api/reports/revenue?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>"

# Export revenue PDF
curl "http://localhost:3000/api/reports/revenue/pdf?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <admin_token>" \
  --output revenue_report.pdf
```

## 👨‍💻 Tác Giả & Ghi Chú

### Tác Giả

**Healthcare Management System Backend**

- **Loại dự án**: Đồ án tốt nghiệp / Demo project
- **Mục đích**: Học tập, demo kỹ năng backend development
- **Ngôn ngữ**: TypeScript (Node.js)
- **License**: ISC

### Đóng Góp

Nếu bạn muốn đóng góp cho dự án:

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Mở Pull Request

### Ghi Chú Quan Trọng

#### ⚠️ Bảo Mật

```
🔴 CẢNH BÁO:
- KHÔNG commit file .env lên GitHub
- KHÔNG dùng JWT_SECRET yếu trong production
- KHÔNG để Database exposed ra public
- LUÔN validate input từ client
- LUÔN sanitize SQL queries (Sequelize đã hỗ trợ)
```

#### 📚 Tài Liệu Tham Khảo

- [Express.js Documentation](https://expressjs.com/)
- [Sequelize ORM](https://sequelize.org/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [REST API Design Guide](https://restfulapi.net/)

#### 🔧 Troubleshooting

**1. Database connection error**

```bash
# Kiểm tra MySQL service
sudo systemctl status mysql

# Test connection
mysql -u root -p
```

**2. Redis connection error**

```bash
# Kiểm tra Redis service
redis-cli ping
# Expected: PONG
```

**3. Port already in use**

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# On Windows use:
netstat -ano | findstr :3000
```

**4. Migration error**

```bash
# Reset migrations
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
```

**5. Permission error**

```bash
# Fix node_modules permissions
sudo chown -R $USER:$USER node_modules
```

---

## 📞 Liên Hệ & Hỗ Trợ

### Support Channels

- 📧 Email: 23521340@gm.uit.edu
- 💬 GitHub Issues: [https://github.com/QLBV/Backend/issues](https://github.com/QLBV/Backend/issues)
- 📖 Documentation: [Wiki](https://github.com/QLBV/Backend/wiki)

### Repository

```bash
git clone https://github.com/QLBV/Backend.git
```

---

## 📄 License

```
ISC License

Copyright (c) 2026 Healthcare Management System

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## 🎯 Quick Start Summary

```bash
# 1. Clone & Install
git clone https://github.com/QLBV/Backend.git
cd Backend
npm install

# 2. Setup Environment
cp .env.example .env
# Edit .env với config của bạn

# 3. Setup Database
mysql -u root -p
CREATE DATABASE healthcare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 4. Run Migrations
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# 5. Start Redis
redis-server

# 6. Start Server
npm run dev

# 7. Test API
curl http://localhost:3000/api/health
```

---

<div align="center">

**Built with ❤️ using Node.js + TypeScript + MySQL**

⭐ **Star this repo if you find it helpful!** ⭐

[Report Bug](https://github.com/QLBV/Backend/issues) · [Request Feature](https://github.com/QLBV/Backend/issues) · [Documentation](https://github.com/QLBV/Backend/wiki)

</div>

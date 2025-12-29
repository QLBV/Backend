# 🏥 Healthcare Management System - Backend API

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](./CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

**Hệ thống quản lý phòng khám Healthcare** với quản lý bệnh nhân, bác sĩ, lịch hẹn, kê đơn thuốc, hóa đơn, lương bổng và báo cáo tài chính.

---

## 📚 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## ✨ Features

### 🔐 Authentication & Authorization

- JWT-based authentication with refresh tokens
- OAuth2 integration (Google Login)
- Role-Based Access Control (RBAC): ADMIN, DOCTOR, RECEPTIONIST, PATIENT
- Permission-Based Access Control (PBAC) for granular permissions
- Redis-backed token blacklist for logout
- Secure password hashing with bcrypt

### 👥 User & Patient Management

- Multi-role user system
- Patient profile with CCCD validation
- Multiple contact points (email, phone, address)
- Avatar upload support
- Patient self-registration with profile setup

### 🏥 Doctor & Appointment Management

- Doctor profiles with specialty and degrees
- Shift scheduling system (Morning/Afternoon/Evening)
- Online and offline appointment booking
- Automatic slot assignment (max 40 appointments/day)
- Smart appointment rescheduling when doctor cancels
- Real-time doctor availability check

### 💊 Medicine & Prescription Management

- Comprehensive medicine inventory with auto-generated codes
- Stock management with import/export tracking
- **Pessimistic locking** for concurrent stock operations
- Prescription creation with automatic stock deduction
- Prescription locking after payment to prevent modifications
- Low stock and expiry date alerts
- Scheduled jobs for automatic expiry checks

### 💰 Financial Management

- Auto-generated invoices upon visit completion
- Partial payment support (UNPAID → PARTIALLY_PAID → PAID)
- Multiple payment methods (Cash, Bank Transfer, QR Code)
- Invoice PDF export with itemized details
- Revenue and expense reports with charts
- Profit margin analysis

### 👨‍💼 HR & Payroll

- Complex salary calculation with multiple components:
  - Base salary with role coefficients
  - Experience bonus (200k/year)
  - Commission for doctors (5% of invoices)
  - Penalty for excessive absences (200k/day)
- Attendance tracking
- Payroll workflow: DRAFT → APPROVED → PAID
- Payroll PDF export

### 📊 Reports & Analytics

- Real-time dashboard with KPIs
- Revenue/Expense/Profit reports
- Top medicines by prescription volume
- Patient demographics (gender distribution)
- Medicine alerts (expiring/low stock)
- All reports exportable to PDF with charts

### 🔔 Notifications

- In-app notifications system
- Email notifications for appointments
- System notifications for admins (medicine alerts)
- Notification types: APPOINTMENT_CREATED, APPOINTMENT_CANCELLED, DOCTOR_CHANGED, SYSTEM

---

## 🛠️ Tech Stack

| Technology             | Version | Purpose                     |
| ---------------------- | ------- | --------------------------- |
| **Node.js**            | >= 18.x | JavaScript runtime          |
| **TypeScript**         | 5.x     | Type-safe development       |
| **Express.js**         | 5.x     | Web framework               |
| **MySQL**              | 8.x     | Relational database         |
| **Sequelize**          | 6.x     | ORM for database operations |
| **Redis**              | Latest  | Token blacklist & caching   |
| **JWT**                | Latest  | Authentication tokens       |
| **Passport.js**        | Latest  | OAuth2 (Google)             |
| **bcrypt**             | Latest  | Password hashing            |
| **Helmet**             | Latest  | Security headers            |
| **CORS**               | Latest  | Cross-origin requests       |
| **Morgan**             | Latest  | HTTP request logging        |
| **Nodemailer**         | Latest  | Email notifications         |
| **PDFKit**             | Latest  | PDF generation              |
| **ChartJS**            | Latest  | Chart generation for PDFs   |
| **node-cron**          | Latest  | Scheduled jobs              |
| **express-validator**  | Latest  | Input validation            |
| **express-rate-limit** | Latest  | Rate limiting               |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.x ([Download](https://nodejs.org/))
- **MySQL** >= 8.x ([Download](https://dev.mysql.com/downloads/))
- **Redis** (Optional but recommended) ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/))
- **npm** or **yarn** (comes with Node.js)

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-org/healthcare-backend.git
cd healthcare-backend
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Install global tools (optional)

```bash
npm install -g sequelize-cli nodemon ts-node
```

---

## ⚙️ Configuration

### 1. Create environment file

```bash
cp .env.example .env
```

### 2. Configure `.env` file

Edit `.env` with your actual configuration:

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
DB_PASSWORD=your_database_password

# ============ JWT AUTHENTICATION ============
# Access Token
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-64-chars
JWT_EXPIRES_IN=7d

# Refresh Token
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production-min-64-chars
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# ============ REDIS (for token blacklist) ============
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============ OAUTH2 - GOOGLE ============
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/oauth/google/callback

# ============ EMAIL (Optional - for notifications) ============
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@healthcare.com

# ============ FILE UPLOAD ============
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# ============ CORS ============
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# ============ RATE LIMITING ============
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============ PASSWORD HASHING ============
BCRYPT_SALT_ROUNDS=10

# ============ LOGGING ============
LOG_LEVEL=debug
```

**Important Notes:**

- **Port:** Hệ thống chạy trên port **3000** (mặc định)
- For Gmail SMTP, use **App Password** (not regular password): [Setup Guide](https://support.google.com/accounts/answer/185833)
- For Google OAuth, create credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

---

## 💾 Database Setup

### 1. Create MySQL database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE healthcare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 2. Run migrations

```bash
npx sequelize-cli db:migrate
```

This will create all 24 tables:

- users, roles, permissions, role_permissions
- patients, patient_profiles
- doctors, specialties, shifts, doctor_shifts
- appointments, visits, disease_categories
- medicines, medicine_imports, medicine_exports
- prescriptions, prescription_details
- invoices, invoice_items, payments
- payrolls, attendance
- notifications

### 3. Seed initial data

```bash
npx sequelize-cli db:seed:all
```

This will populate:

- Default roles (ADMIN, DOCTOR, RECEPTIONIST, PATIENT)
- Permissions and role-permission mappings
- Sample specialties (Cardiology, Dermatology, Pediatrics, etc.)
- Sample shifts (Morning: 07:00-12:00, Afternoon: 13:00-17:00, Evening: 17:30-21:00)
- Sample users, doctors, patients
- Sample medicines, appointments (optional)

### 4. Verify database setup

```bash
mysql -u root -p healthcare_db
```

```sql
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM roles;
SELECT COUNT(*) FROM medicines;
```

---

## 🏃 Running the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

Server will start at `http://localhost:3000` with nodemon watching for file changes.

### Production Mode

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

Production server runs compiled code from `dist/` directory.

### Verify server is running

```bash
curl http://localhost:3000
```

Expected response:

```json
{
  "success": true,
  "message": "Healthcare Management System API",
  "version": "1.0.0",
  "timestamp": "2025-12-29T..."
}
```

---

## 📖 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

Most endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### Quick Start: Get JWT Token

```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "roleId": 4
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@healthcare.com",
    "password": "123456"
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": 1, "email": "admin@healthcare.com", "roleId": 1 }
  }
}
```

### API Modules & Endpoints

<details>
<summary><b>🔐 Authentication (4 endpoints)</b></summary>

```bash
POST   /api/auth/register              # Register new user
POST   /api/auth/login                 # Login with email/password
POST   /api/auth/refresh-token         # Refresh JWT token
POST   /api/auth/logout                # Logout (blacklist token)
GET    /api/auth/oauth/google          # Google OAuth login
GET    /api/auth/oauth/google/callback # Google OAuth callback
```

</details>

<details>
<summary><b>👥 Users (5 endpoints)</b></summary>

```bash
GET    /api/users              # List all users (ADMIN)
GET    /api/users/:id          # Get user by ID (ADMIN)
POST   /api/users              # Create user (ADMIN)
PUT    /api/users/:id          # Update user (ADMIN)
DELETE /api/users/:id          # Delete user (ADMIN)
```

</details>

<details>
<summary><b>🏥 Patients (6 endpoints)</b></summary>

```bash
POST   /api/patients/setup             # Setup patient profile (PATIENT)
GET    /api/patients                   # List patients (ADMIN/DOCTOR/RECEPTIONIST)
GET    /api/patients/:id               # Get patient by ID
PUT    /api/patients/:id               # Update patient
DELETE /api/patients/:id               # Delete patient
POST   /api/patients/:id/avatar        # Upload avatar (PATIENT self)
```

</details>

<details>
<summary><b>👨‍⚕️ Doctors (7 endpoints)</b></summary>

```bash
GET    /api/doctors                    # List all doctors (ADMIN)
GET    /api/doctors/:id                # Get doctor by ID (ADMIN)
POST   /api/doctors                    # Create doctor (ADMIN)
PUT    /api/doctors/:id                # Update doctor (ADMIN)
DELETE /api/doctors/:id                # Delete doctor (ADMIN)
GET    /api/doctors/specialties        # List specialties (Public)
GET    /api/doctors/:doctorId/shifts   # Get doctor shifts (Public)
```

</details>

<details>
<summary><b>📅 Appointments (4 endpoints)</b></summary>

```bash
POST   /api/appointments               # Book appointment (PATIENT) - rate limited
POST   /api/appointments/offline       # Book offline (RECEPTIONIST)
GET    /api/appointments               # List appointments (all roles)
PUT    /api/appointments/:id/cancel    # Cancel appointment (PATIENT/RECEPTIONIST)
```

</details>

<details>
<summary><b>🩺 Visits (2 endpoints)</b></summary>

```bash
POST   /api/visits/checkin/:appointmentId  # Check-in (RECEPTIONIST)
PUT    /api/visits/:id/complete            # Complete visit (DOCTOR)
```

</details>

<details>
<summary><b>💊 Medicines (12 endpoints)</b></summary>

```bash
GET    /api/medicines                  # List medicines (Public)
GET    /api/medicines/:id              # Get medicine by ID (Public)
POST   /api/medicines                  # Create medicine (ADMIN)
PUT    /api/medicines/:id              # Update medicine (ADMIN)
DELETE /api/medicines/:id              # Remove medicine (ADMIN)
POST   /api/medicines/:id/import       # Import stock (ADMIN)
GET    /api/medicines/low-stock        # Low stock alert (ADMIN)
GET    /api/medicines/expiring         # Expiring medicines (ADMIN)
POST   /api/medicines/auto-mark-expired # Mark expired (ADMIN)
GET    /api/medicines/:id/imports      # Import history (ADMIN)
GET    /api/medicines/:id/exports      # Export history (ADMIN)
POST   /api/medicines/:id/mark-expired # Mark as expired (ADMIN)
```

</details>

<details>
<summary><b>📝 Prescriptions (7 endpoints)</b></summary>

```bash
POST   /api/prescriptions                    # Create prescription (DOCTOR)
GET    /api/prescriptions/:id                # Get prescription
GET    /api/prescriptions/visit/:visitId     # Get by visit (DOCTOR)
GET    /api/prescriptions/patient/:patientId # Get by patient
PUT    /api/prescriptions/:id                # Update prescription (DOCTOR)
POST   /api/prescriptions/:id/cancel         # Cancel prescription (DOCTOR)
GET    /api/prescriptions/:id/pdf            # Export PDF
```

</details>

<details>
<summary><b>💰 Invoices (9 endpoints)</b></summary>

```bash
POST   /api/invoices                   # Create invoice (ADMIN/RECEPTIONIST)
GET    /api/invoices                   # List invoices (ADMIN/RECEPTIONIST)
GET    /api/invoices/:id               # Get invoice by ID
PUT    /api/invoices/:id               # Update invoice (ADMIN/RECEPTIONIST)
GET    /api/invoices/patient/:patientId # Get patient invoices
POST   /api/invoices/:id/payments      # Add payment (ADMIN/RECEPTIONIST)
GET    /api/invoices/:id/payments      # Get invoice payments (ADMIN/RECEPTIONIST)
GET    /api/invoices/statistics        # Revenue statistics (ADMIN)
GET    /api/invoices/:id/pdf           # Export invoice PDF
```

</details>

<details>
<summary><b>💼 Payrolls (9 endpoints)</b></summary>

```bash
POST   /api/payrolls/calculate         # Calculate payroll (ADMIN)
GET    /api/payrolls                   # List payrolls (ADMIN)
GET    /api/payrolls/:id               # Get payroll by ID
GET    /api/payrolls/my                # Get my payrolls (Authenticated)
GET    /api/payrolls/user/:userId      # Get user payroll history
PUT    /api/payrolls/:id/approve       # Approve payroll (ADMIN)
PUT    /api/payrolls/:id/pay           # Mark as paid (ADMIN)
GET    /api/payrolls/statistics        # Payroll statistics (ADMIN)
GET    /api/payrolls/:id/pdf           # Export payroll PDF
```

</details>

<details>
<summary><b>📊 Reports (11 endpoints)</b></summary>

```bash
GET    /api/reports/revenue            # Revenue report (ADMIN)
GET    /api/reports/expense            # Expense report (ADMIN)
GET    /api/reports/profit             # Profit report (ADMIN)
GET    /api/reports/top-medicines      # Top medicines report (ADMIN)
GET    /api/reports/medicine-alerts    # Medicine alerts (ADMIN)
GET    /api/reports/patients-by-gender # Patient demographics (ADMIN)
GET    /api/reports/revenue/pdf        # Revenue PDF (ADMIN)
GET    /api/reports/expense/pdf        # Expense PDF (ADMIN)
GET    /api/reports/profit/pdf         # Profit PDF (ADMIN)
GET    /api/reports/top-medicines/pdf  # Top medicines PDF (ADMIN)
GET    /api/reports/patients-by-gender/pdf # Demographics PDF (ADMIN)
```

</details>

<details>
<summary><b>📈 Dashboard (3 endpoints)</b></summary>

```bash
GET    /api/dashboard                  # Dashboard overview (ADMIN)
GET    /api/dashboard/stats            # Dashboard statistics (ADMIN)
GET    /api/dashboard/appointments/:date # Appointments by date (ADMIN)
```

</details>

<details>
<summary><b>🔔 Notifications (4 endpoints)</b></summary>

```bash
GET    /api/notifications              # Get my notifications
GET    /api/notifications/unread-count # Get unread count
PUT    /api/notifications/:id/mark-read # Mark as read
PUT    /api/notifications/mark-all-read # Mark all as read
```

</details>

<details>
<summary><b>🔑 Permissions (8 endpoints)</b></summary>

```bash
GET    /api/permissions                # List all permissions (ADMIN)
GET    /api/permissions/modules        # Get modules with permissions (ADMIN)
GET    /api/permissions/role/:roleId   # Get role permissions (ADMIN)
POST   /api/permissions                # Create permission (ADMIN)
DELETE /api/permissions/:id            # Delete permission (ADMIN)
POST   /api/permissions/role/:roleId/assign    # Assign permissions (ADMIN)
POST   /api/permissions/role/:roleId/add       # Add permission (ADMIN)
DELETE /api/permissions/role/:roleId/remove/:permissionId # Remove permission (ADMIN)
```

</details>

**Total: 104 API endpoints**

For detailed request/response examples, see [TEST_GUIDE.md](./TEST_GUIDE.md)

---

## 📂 Project Structure

```
Backend/
├── src/
│   ├── app.ts                    # Express app configuration
│   ├── server.ts                 # Server entry point
│   │
│   ├── config/                   # Configuration files
│   │   ├── database.ts           # Sequelize configuration
│   │   ├── redis.config.ts       # Redis client & token blacklist
│   │   ├── oauth.config.ts       # Passport OAuth2 strategy
│   │   └── cors.config.ts        # CORS configuration
│   │
│   ├── models/                   # Sequelize models (24 models)
│   │   ├── User.ts
│   │   ├── Role.ts
│   │   ├── Permission.ts
│   │   ├── Patient.ts
│   │   ├── Doctor.ts
│   │   ├── Appointment.ts
│   │   ├── Visit.ts
│   │   ├── Medicine.ts
│   │   ├── Prescription.ts
│   │   ├── PrescriptionDetail.ts
│   │   ├── Invoice.ts
│   │   ├── InvoiceItem.ts
│   │   ├── Payment.ts
│   │   ├── Payroll.ts
│   │   ├── Attendance.ts
│   │   ├── Notification.ts
│   │   ├── associations.ts       # Model associations
│   │   └── index.ts              # Model exports
│   │
│   ├── routes/                   # API routes (18 modules)
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── patient.routes.ts
│   │   ├── doctor.routes.ts
│   │   ├── appointment.routes.ts
│   │   ├── visit.routes.ts
│   │   ├── medicine.routes.ts
│   │   ├── prescription.routes.ts
│   │   ├── invoice.routes.ts
│   │   ├── payroll.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── report.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── permission.routes.ts
│   │   └── oauth.routes.ts
│   │
│   ├── controllers/              # Request handlers (18 controllers)
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── patient.controller.ts
│   │   ├── doctor.controller.ts
│   │   ├── appointment.controller.ts
│   │   ├── visit.controller.ts
│   │   ├── medicine.controller.ts
│   │   ├── prescription.controller.ts
│   │   ├── invoice.controller.ts
│   │   ├── payroll.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── report.controller.ts
│   │   └── notification.controller.ts
│   │
│   ├── services/                 # Business logic (17 services)
│   │   ├── appointment.service.ts
│   │   ├── appointmentCancel.service.ts
│   │   ├── appointmentReschedule.service.ts
│   │   ├── appointmentQuery.service.ts
│   │   ├── patient.service.ts
│   │   ├── doctor.service.ts
│   │   ├── medicine.service.ts
│   │   ├── medicineNotification.service.ts
│   │   ├── prescription.service.ts
│   │   ├── visit.service.ts
│   │   ├── invoice.service.ts
│   │   ├── payroll.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── report.service.ts
│   │   ├── reportPDF.service.ts
│   │   ├── notification.service.ts
│   │   └── email.service.ts
│   │
│   ├── middlewares/              # Express middlewares
│   │   ├── auth.middlewares.ts           # JWT verification
│   │   ├── permission.middlewares.ts     # Permission checks
│   │   ├── roleCheck.middlewares.ts      # Role-based access
│   │   ├── errorHandler.middlewares.ts   # Global error handler
│   │   ├── rateLimit.middlewares.ts      # Rate limiting
│   │   ├── validatePatient.middlewares.ts
│   │   ├── validateMedicine.middlewares.ts
│   │   ├── validatePrescription.middlewares.ts
│   │   └── validators/                   # Express-validator rules
│   │       └── common.validators.ts
│   │
│   ├── jobs/                     # Scheduled tasks
│   │   └── medicineExpiryCheck.ts        # Cron jobs for medicine alerts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── codeGenerator.ts              # Auto-generate codes
│   │   ├── pdfGenerator.ts               # PDF generation helpers
│   │   └── asyncHandler.ts               # Async error wrapper
│   │
│   ├── types/                    # TypeScript type definitions
│   │   └── auth.ts
│   │
│   └── constant/                 # Constants & enums
│       └── role.ts
│
├── migrations/                   # Database migrations (27 files)
│   ├── 20251224000001-create-roles.js
│   ├── 20251224000002-create-users.js
│   ├── ...
│   └── 20251227100000-add-oauth-fields-to-users.js
│
├── seeders/                      # Database seeders (3 files)
│   ├── 20251227110000-seed-permissions.js
│   ├── 20251227120000-seed-role-permissions.js
│   └── 20251229000001-full-system-seed.js
│
├── uploads/                      # File uploads directory
│
├── .env.example                  # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
├── nodemon.json
├── database_schema.sql           # Full schema SQL
├── README.md                     # This file
├── TEST_GUIDE.md                 # Testing documentation
└── CHECKLIST_REVIEW.md           # Review checklist
```

### Database Migrations

#### Create new migration

```bash
npx sequelize-cli migration:generate --name add-field-to-table
```

#### Run migrations

```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Rollback last migration
npx sequelize-cli db:migrate:undo

# Rollback all migrations
npx sequelize-cli db:migrate:undo:all

# Rollback to specific migration
npx sequelize-cli db:migrate:undo:all --to XXXXXXXXXXXXXX-migration-name.js
```

#### Create new seeder

```bash
npx sequelize-cli seed:generate --name seed-name
```

#### Run seeders

```bash
# Run all seeders
npx sequelize-cli db:seed:all

# Run specific seeder
npx sequelize-cli db:seed --seed XXXXXXXXXXXXXX-seed-name.js

# Undo all seeders
npx sequelize-cli db:seed:undo:all

# Undo specific seeder
npx sequelize-cli db:seed:undo --seed XXXXXXXXXXXXXX-seed-name.js
```

### TypeScript Compilation

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Build for production
npm run build
```

---

## 🧪 Testing

See [TEST_GUIDE.md](./TEST_GUIDE.md) for comprehensive testing documentation.

### Quick Test Commands

```bash
# Run all tests (when implemented)
npm test

# Run specific test file
npm test -- appointment.test.ts

# Run with coverage
npm run test:coverage
```

### Manual API Testing

```bash
# Test health endpoint
curl http://localhost:3000

# Test with authentication
curl http://localhost:3000/api/doctors \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Environment Variables

### Complete `.env` Reference

| Variable                  | Required | Default          | Description                            |
| ------------------------- | -------- | ---------------- | -------------------------------------- |
| **APPLICATION**           |          |                  |                                        |
| `NODE_ENV`                | Yes      | `development`    | Environment (development/production)   |
| `PORT`                    | Yes      | `3000`           | Server port                            |
| `FRONTEND_URL`            | Yes      | -                | Frontend URL for CORS                  |
| **DATABASE**              |          |                  |                                        |
| `DB_HOST`                 | Yes      | `localhost`      | MySQL host                             |
| `DB_PORT`                 | Yes      | `3306`           | MySQL port                             |
| `DB_NAME`                 | Yes      | `healthcare_db`  | Database name                          |
| `DB_USER`                 | Yes      | `root`           | Database user                          |
| `DB_PASSWORD`             | Yes      | -                | Database password                      |
| **JWT AUTHENTICATION**    |          |                  |                                        |
| `JWT_SECRET`              | Yes      | -                | Access token signing secret            |
| `JWT_EXPIRES_IN`          | Yes      | `7d`             | Access token expiration                |
| `JWT_REFRESH_SECRET`      | Yes      | -                | Refresh token signing secret           |
| `JWT_ACCESS_EXPIRES_IN`   | Yes      | `1h`             | Access token expiration (short)        |
| `JWT_REFRESH_EXPIRES_IN`  | Yes      | `7d`             | Refresh token expiration               |
| **REDIS**                 |          |                  |                                        |
| `REDIS_HOST`              | No       | `localhost`      | Redis host                             |
| `REDIS_PORT`              | No       | `6379`           | Redis port                             |
| `REDIS_PASSWORD`          | No       | -                | Redis password                         |
| **OAUTH2 - GOOGLE**       |          |                  |                                        |
| `GOOGLE_CLIENT_ID`        | No       | -                | OAuth Google Client ID                 |
| `GOOGLE_CLIENT_SECRET`    | No       | -                | OAuth Google Secret                    |
| `GOOGLE_CALLBACK_URL`     | No       | -                | OAuth callback URL                     |
| **EMAIL**                 |          |                  |                                        |
| `SMTP_HOST`               | No       | `smtp.gmail.com` | SMTP server host                       |
| `SMTP_PORT`               | No       | `587`            | SMTP server port                       |
| `SMTP_USER`               | No       | -                | SMTP username                          |
| `SMTP_PASSWORD`           | No       | -                | SMTP password (App Password)           |
| `EMAIL_FROM`              | No       | -                | From email address                     |
| **FILE UPLOAD**           |          |                  |                                        |
| `MAX_FILE_SIZE`           | No       | `5242880`        | Max file size in bytes (5MB)           |
| `UPLOAD_PATH`             | No       | `./uploads`      | Upload directory path                  |
| **CORS**                  |          |                  |                                        |
| `CORS_ORIGIN`             | Yes      | `*`              | Allowed CORS origins (comma-separated) |
| **RATE LIMITING**         |          |                  |                                        |
| `RATE_LIMIT_WINDOW_MS`    | No       | `900000`         | Rate limit window (15 min)             |
| `RATE_LIMIT_MAX_REQUESTS` | No       | `100`            | Max requests per window                |
| **PASSWORD HASHING**      |          |                  |                                        |
| `BCRYPT_SALT_ROUNDS`      | No       | `10`             | Bcrypt salt rounds                     |
| **LOGGING**               |          |                  |                                        |
| `LOG_LEVEL`               | No       | `debug`          | Logging level (debug/info/warn/error)  |

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error:** `SequelizeConnectionError: Access denied for user`

**Solution:**

- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `.env`
- Grant permissions:
  ```sql
  GRANT ALL PRIVILEGES ON healthcare_db.* TO 'your_user'@'localhost';
  FLUSH PRIVILEGES;
  ```

#### 2. Redis Connection Failed

**Error:** `Error connecting to Redis`

**Solution:**

- Check Redis is running: `redis-cli ping` (should return `PONG`)
- Start Redis: `redis-server` or `sudo systemctl start redis`
- Verify `REDIS_HOST` and `REDIS_PORT` in `.env`

#### 3. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**

```bash
# Find process using port 3000
lsof -i :3000
# On Windows use:
netstat -ano | findstr :3000

# Kill the process
kill -9 <PID>
# On Windows use:
taskkill /PID <PID> /F

# Or change PORT in .env to another port (e.g., 3001, 8000)
```

#### 4. Migration Fails

**Error:** `SequelizeDatabaseError: Table already exists`

**Solution:**

```bash
# Rollback migrations
npx sequelize-cli db:migrate:undo:all

# Re-run migrations
npx sequelize-cli db:migrate
```

#### 5. Email Not Sending

**Error:** `Invalid login: 535-5.7.8 Username and Password not accepted`

**Solution:**

- For Gmail, use **App Password**: [Setup Guide](https://support.google.com/accounts/answer/185833)
- Enable "Less secure app access" (not recommended)
- Check SMTP credentials in `.env`

#### 6. CORS Errors

**Error:** `Access to fetch at ... from origin ... has been blocked by CORS`

**Solution:**

- Add frontend URL to `CORS_ORIGIN` in `.env`:
  ```env
  CORS_ORIGIN=http://localhost:3000,http://localhost:4200
  ```
- Or allow all (development only):
  ```env
  CORS_ORIGIN=*
  ```

#### 7. TypeScript Errors

**Error:** `Cannot find module ... or its corresponding type declarations`

**Solution:**

```bash
# Install missing types
npm install --save-dev @types/module-name

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/healthcare-backend.git
cd healthcare-backend
git remote add upstream https://github.com/original-org/healthcare-backend.git
```

### 2. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Follow code conventions
- Write tests for new features
- Update documentation

### 4. Test Your Changes

```bash
npm run dev
npm test
npx tsc --noEmit
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

**Commit Message Convention:**

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build/tooling changes

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Documentation:** [./docs](./docs)
- **Issues:** [GitHub Issues](https://github.com/your-org/healthcare-backend/issues)
- **Email:** 23521340@gm.uit.edu.vn

---

## 👥 Team

Healthcare Management System Development Team

---

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

---

## 🙏 Acknowledgments

- Express.js community
- Sequelize ORM team
- Node.js ecosystem contributors

---

**Version:** 3.0.0 | **Last Updated:** 2025-12-29

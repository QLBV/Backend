<div align="center">

# 🏥 HEALOS Backend API
<div align="center">

# 🏥 HEALOS Backend API

### Enterprise Healthcare Management REST API
### Enterprise Healthcare Management REST API

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.37-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)

<p align="center">
  <strong>A robust, scalable REST API powering the HEALOS Healthcare Management System.</strong>
</p>

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Reference](#-api-reference) • [Database](#-database)

</div>

---

## 📋 Overview

HEALOS Backend is a **production-ready REST API** built with Node.js, Express, and TypeScript. It provides comprehensive endpoints for managing healthcare operations including patient records, appointments, prescriptions, invoices, pharmacy inventory, and employee management.

## ✨ Features

### 🔐 Authentication & Security
- **JWT Authentication** with access & refresh tokens
- **OAuth 2.0** integration (Google Sign-In)
- **Role-Based Access Control (RBAC)** - Admin, Doctor, Receptionist, Patient
- **Password Hashing** with bcrypt
- **Rate Limiting** to prevent abuse
- **Helmet.js** for security headers
- **CORS** configuration

### 👥 User Management
- User registration & login
- Email verification
- Password reset via email
- Profile management
- Role & permission management

### 🗓️ Appointment System
- Online & offline booking
- Appointment status management
- Doctor availability checking
- Appointment reminders (cron jobs)
- Visit tracking

### 💊 Prescription Management
- Create, update, lock prescriptions
- Digital prescription generation
- PDF export with signatures
- Status workflow (Draft → Locked → Dispensed)

### 💰 Invoice & Payments
- Invoice generation
- Payment tracking (Cash, Bank Transfer, QR)
- Partial payment support
- PDF invoice export
- Payment history

### 💊 Pharmacy & Inventory
- Medicine CRUD operations
- Stock management
- Import/Export tracking
- Low stock alerts
- Batch & expiry tracking

### 👨‍⚕️ Doctor & Staff Management
- Doctor profiles & specialties
- Shift scheduling
- Attendance tracking
- Payroll management
- Salary calculation

### 📊 Reports & Analytics
- Financial reports (PDF/Excel)
- Appointment statistics
- Patient demographics
- Medicine usage reports
- Revenue analytics

### 📧 Notifications
- Email notifications (Nodemailer)
- In-app notifications
- Appointment reminders
- System alerts

## 🛠 Tech Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime Environment |
| **Express.js** | 5.2 | Web Framework |
| **TypeScript** | 5.9 | Type Safety |
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.37-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)

<p align="center">
  <strong>A robust, scalable REST API powering the HEALOS Healthcare Management System.</strong>
</p>

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Reference](#-api-reference) • [Database](#-database)

</div>

---

## 📋 Overview

HEALOS Backend is a **production-ready REST API** built with Node.js, Express, and TypeScript. It provides comprehensive endpoints for managing healthcare operations including patient records, appointments, prescriptions, invoices, pharmacy inventory, and employee management.

## ✨ Features

### 🔐 Authentication & Security
- **JWT Authentication** with access & refresh tokens
- **OAuth 2.0** integration (Google Sign-In)
- **Role-Based Access Control (RBAC)** - Admin, Doctor, Receptionist, Patient
- **Password Hashing** with bcrypt
- **Rate Limiting** to prevent abuse
- **Helmet.js** for security headers
- **CORS** configuration

### 👥 User Management
- User registration & login
- Email verification
- Password reset via email
- Profile management
- Role & permission management

### 🗓️ Appointment System
- Online & offline booking
- Appointment status management
- Doctor availability checking
- Appointment reminders (cron jobs)
- Visit tracking

### 💊 Prescription Management
- Create, update, lock prescriptions
- Digital prescription generation
- PDF export with signatures
- Status workflow (Draft → Locked → Dispensed)

### 💰 Invoice & Payments
- Invoice generation
- Payment tracking (Cash, Bank Transfer, QR)
- Partial payment support
- PDF invoice export
- Payment history

### 💊 Pharmacy & Inventory
- Medicine CRUD operations
- Stock management
- Import/Export tracking
- Low stock alerts
- Batch & expiry tracking

### 👨‍⚕️ Doctor & Staff Management
- Doctor profiles & specialties
- Shift scheduling
- Attendance tracking
- Payroll management
- Salary calculation

### 📊 Reports & Analytics
- Financial reports (PDF/Excel)
- Appointment statistics
- Patient demographics
- Medicine usage reports
- Revenue analytics

### 📧 Notifications
- Email notifications (Nodemailer)
- In-app notifications
- Appointment reminders
- System alerts

## 🛠 Tech Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime Environment |
| **Express.js** | 5.2 | Web Framework |
| **TypeScript** | 5.9 | Type Safety |

### Database & ORM
| Technology | Purpose |
|------------|---------|
| **MySQL** | Primary Database |
| **Sequelize** | ORM & Migrations |
| **Redis (ioredis)** | Caching & Sessions |

### Security
| Technology | Purpose |
|------------|---------|
| **JWT** | Token Authentication |
| **bcrypt** | Password Hashing |
| **Helmet** | Security Headers |
| **express-rate-limit** | Rate Limiting |
| **Passport.js** | OAuth Strategies |

### Documentation & Export
| Technology | Purpose |
|------------|---------|
| **PDFKit** | PDF Generation |
| **ExcelJS** | Excel Export |
| **Chart.js** | Chart Generation |

### Utilities
| Technology | Purpose |
|------------|---------|
| **Nodemailer** | Email Service |
| **Winston** | Logging |
| **Morgan** | HTTP Logging |
| **node-cron** | Scheduled Jobs |
| **Multer** | File Uploads |

### Testing
| Technology | Purpose |
|------------|---------|
| **Jest** | Testing Framework |
| **Supertest** | HTTP Testing |
| **ts-jest** | TypeScript Support |

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **MySQL** >= 8.0
- **Redis** (optional, for caching)
- **npm** >= 9.x

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/QLBV/Backend.git
   cd Backend
   ```
| Technology | Purpose |
|------------|---------|
| **MySQL** | Primary Database |
| **Sequelize** | ORM & Migrations |
| **Redis (ioredis)** | Caching & Sessions |

### Security
| Technology | Purpose |
|------------|---------|
| **JWT** | Token Authentication |
| **bcrypt** | Password Hashing |
| **Helmet** | Security Headers |
| **express-rate-limit** | Rate Limiting |
| **Passport.js** | OAuth Strategies |

### Documentation & Export
| Technology | Purpose |
|------------|---------|
| **PDFKit** | PDF Generation |
| **ExcelJS** | Excel Export |
| **Chart.js** | Chart Generation |

### Utilities
| Technology | Purpose |
|------------|---------|
| **Nodemailer** | Email Service |
| **Winston** | Logging |
| **Morgan** | HTTP Logging |
| **node-cron** | Scheduled Jobs |
| **Multer** | File Uploads |

### Testing
| Technology | Purpose |
|------------|---------|
| **Jest** | Testing Framework |
| **Supertest** | HTTP Testing |
| **ts-jest** | TypeScript Support |

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **MySQL** >= 8.0
- **Redis** (optional, for caching)
- **npm** >= 9.x

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/QLBV/Backend.git
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   # Server
   PORT=3000
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
   
   # Redis (optional)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

4. **Database Setup**
   
   Create the database:
   ```bash
   mysql -u root -p -e "CREATE DATABASE healos_db;"
   ```
   
   Run migrations:
   ```bash
   npx sequelize-cli db:migrate
   ```
   
   Seed initial data:
   ```bash
   npx sequelize-cli db:seed:all
   ```
   
   (Optional) Seed large sample data for testing:
   ```bash
   npm run seed:data
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The API will be available at `http://localhost:3000`

### Build for Production
### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── config/              # Configuration files
│   ├── database.ts      # Database connection
│   ├── passport.ts      # OAuth strategies
│   └── redis.ts         # Redis connection
├── constant/            # Application constants
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
uploads/                 # File uploads directory
logs/                    # Application logs
postman/                 # Postman collections
```

## 📡 API Reference

### Base URL
```
http://localhost:3000/api
## 📁 Project Structure

```
src/
├── config/              # Configuration files
│   ├── database.ts      # Database connection
│   ├── passport.ts      # OAuth strategies
│   └── redis.ts         # Redis connection
├── constant/            # Application constants
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
uploads/                 # File uploads directory
logs/                    # Application logs
postman/                 # Postman collections
```

## 📡 API Reference

### Base URL
```
http://localhost:3000/api
```

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | User login |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/forgot-password` | Request password reset |
| `POST` | `/auth/reset-password` | Reset password |
| `GET` | `/oauth/google` | Google OAuth login |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | Get all users |
| `GET` | `/users/:id` | Get user by ID |
| `POST` | `/users` | Create user |
| `PUT` | `/users/:id` | Update user |
| `DELETE` | `/users/:id` | Delete user |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/patients` | Get all patients |
| `GET` | `/patients/:id` | Get patient by ID |
| `GET` | `/patients/:id/visits` | Get patient visits |
| `GET` | `/patients/:id/prescriptions` | Get patient prescriptions |
| `PUT` | `/patients/:id` | Update patient |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/appointments` | Get all appointments |
| `GET` | `/appointments/:id` | Get appointment by ID |
| `POST` | `/appointments` | Create appointment |
| `PUT` | `/appointments/:id` | Update appointment |
| `PATCH` | `/appointments/:id/status` | Update status |
| `DELETE` | `/appointments/:id` | Cancel appointment |

### Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/prescriptions` | Get all prescriptions |
| `GET` | `/prescriptions/:id` | Get prescription by ID |
| `POST` | `/prescriptions` | Create prescription |
| `PUT` | `/prescriptions/:id` | Update prescription |
| `POST` | `/prescriptions/:id/lock` | Lock prescription |
| `GET` | `/prescriptions/:id/pdf` | Export as PDF |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/invoices` | Get all invoices |
| `GET` | `/invoices/:id` | Get invoice by ID |
| `POST` | `/invoices` | Create invoice |
| `PUT` | `/invoices/:id` | Update invoice |
| `POST` | `/invoices/:id/payments` | Add payment |
| `GET` | `/invoices/:id/pdf` | Export as PDF |

### Medicines
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/medicines` | Get all medicines |
| `GET` | `/medicines/:id` | Get medicine by ID |
| `POST` | `/medicines` | Create medicine |
| `PUT` | `/medicines/:id` | Update medicine |
| `DELETE` | `/medicines/:id` | Delete medicine |
| `GET` | `/medicines/low-stock` | Get low stock items |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/financial` | Financial report |
| `GET` | `/reports/financial/pdf` | Export PDF |
| `GET` | `/reports/financial/excel` | Export Excel |
| `GET` | `/reports/appointments` | Appointment stats |
| `GET` | `/reports/patient-statistics` | Patient demographics |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard/admin` | Admin dashboard data |
| `GET` | `/dashboard/doctor` | Doctor dashboard data |
| `GET` | `/dashboard/receptionist` | Receptionist data |

## 🗄️ Database

### Entity Relationship

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
### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | User login |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/forgot-password` | Request password reset |
| `POST` | `/auth/reset-password` | Reset password |
| `GET` | `/oauth/google` | Google OAuth login |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | Get all users |
| `GET` | `/users/:id` | Get user by ID |
| `POST` | `/users` | Create user |
| `PUT` | `/users/:id` | Update user |
| `DELETE` | `/users/:id` | Delete user |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/patients` | Get all patients |
| `GET` | `/patients/:id` | Get patient by ID |
| `GET` | `/patients/:id/visits` | Get patient visits |
| `GET` | `/patients/:id/prescriptions` | Get patient prescriptions |
| `PUT` | `/patients/:id` | Update patient |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/appointments` | Get all appointments |
| `GET` | `/appointments/:id` | Get appointment by ID |
| `POST` | `/appointments` | Create appointment |
| `PUT` | `/appointments/:id` | Update appointment |
| `PATCH` | `/appointments/:id/status` | Update status |
| `DELETE` | `/appointments/:id` | Cancel appointment |

### Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/prescriptions` | Get all prescriptions |
| `GET` | `/prescriptions/:id` | Get prescription by ID |
| `POST` | `/prescriptions` | Create prescription |
| `PUT` | `/prescriptions/:id` | Update prescription |
| `POST` | `/prescriptions/:id/lock` | Lock prescription |
| `GET` | `/prescriptions/:id/pdf` | Export as PDF |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/invoices` | Get all invoices |
| `GET` | `/invoices/:id` | Get invoice by ID |
| `POST` | `/invoices` | Create invoice |
| `PUT` | `/invoices/:id` | Update invoice |
| `POST` | `/invoices/:id/payments` | Add payment |
| `GET` | `/invoices/:id/pdf` | Export as PDF |

### Medicines
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/medicines` | Get all medicines |
| `GET` | `/medicines/:id` | Get medicine by ID |
| `POST` | `/medicines` | Create medicine |
| `PUT` | `/medicines/:id` | Update medicine |
| `DELETE` | `/medicines/:id` | Delete medicine |
| `GET` | `/medicines/low-stock` | Get low stock items |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports/financial` | Financial report |
| `GET` | `/reports/financial/pdf` | Export PDF |
| `GET` | `/reports/financial/excel` | Export Excel |
| `GET` | `/reports/appointments` | Appointment stats |
| `GET` | `/reports/patient-statistics` | Patient demographics |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard/admin` | Admin dashboard data |
| `GET` | `/dashboard/doctor` | Doctor dashboard data |
| `GET` | `/dashboard/receptionist` | Receptionist data |

## 🗄️ Database

### Entity Relationship

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

### Main Models
- **User** - Base user account
- **Patient** - Patient profiles
- **Doctor** - Doctor profiles & specialties
- **Appointment** - Booking records
- **Visit** - Medical visits & examinations
- **Prescription** - Medicine prescriptions
- **Invoice** - Billing & payments
- **Medicine** - Pharmacy inventory
- **DoctorShift** - Scheduling
- **Attendance** - Employee attendance
- **Payroll** - Salary management

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (nodemon) |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run seed:data` | Seed database with large sample data (Warning: Truncates existing data) |

## 🔒 Security Best Practices

- ✅ JWT tokens with expiration
- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ Rate limiting on sensitive endpoints
- ✅ CORS whitelist configuration
- ✅ Helmet.js security headers
- ✅ Input validation with express-validator
- ✅ SQL injection prevention via Sequelize ORM
- ✅ Environment variables for secrets

## 📝 Logging

Winston logger with multiple transports:
- Console (development)
- File rotation (production)
- Error-specific log files

Log files location: `./logs/`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Commit Convention
```
feat: New feature
fix: Bug fix
docs: Documentation
refactor: Code refactoring
test: Testing
chore: Maintenance
```
### Commit Convention
```
feat: New feature
fix: Bug fix
docs: Documentation
refactor: Code refactoring
test: Testing
chore: Maintenance
```

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Team

Developed with ❤️ by the HEALOS Development Team
This project is proprietary software. All rights reserved.

## 👥 Team

Developed with ❤️ by the HEALOS Development Team

---

<div align="center">

**[⬆ Back to Top](#-healos-backend-api)**
**[⬆ Back to Top](#-healos-backend-api)**

</div>

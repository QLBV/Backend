# 🧪 Healthcare Management System - Testing Guide

**Comprehensive Testing Documentation for API Testing, Database Validation, Security Testing & Quality Assurance**

Version: 3.1.0 | Last Updated: 2025-12-29

---

## ⚠️ IMPORTANT: Test Data Updated

**This guide uses REAL seed data from `20251229000001-full-system-seed.js`**

All test credentials, user IDs, patient codes, medicine codes, and prices are accurate and match the actual seeded database. No more placeholder or incorrect test data!

**Key Changes:**

- ✅ All user emails updated (e.g., `admin@healthcare.com` instead of `admin@test.com`)
- ✅ All passwords are now `123456` (bcrypt hashed)
- ✅ Correct medicine prices (Paracetamol: 500 VNĐ, Amoxicillin: 2000 VNĐ)
- ✅ Accurate role coefficients (ADMIN: 3.0, DOCTOR: 2.5, RECEPTIONIST: 1.2)
- ✅ Role IDs fixed (PATIENT is roleId 3, not 4)
- ✅ Real patient codes (BN001-BN005) and CCCD numbers

---

## 📚 Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Data Management](#test-data-management)
4. [Authentication & Authorization Testing](#authentication--authorization-testing)
5. [API Testing by Module](#api-testing-by-module)
6. [Database Testing](#database-testing)
7. [Security Testing](#security-testing)
8. [Performance Testing](#performance-testing)
9. [Edge Cases & Error Handling](#edge-cases--error-handling)
10. [Automated Testing](#automated-testing)
11. [Postman Collection Guide](#postman-collection-guide)
12. [Newman CLI Testing](#newman-cli-testing)

---

## 🎯 Testing Strategy

### Test Pyramid

```
        /\
       /  \        E2E Tests (10%)
      /____\       - Critical user flows
     /      \      - End-to-end scenarios
    /________\
   /          \    Integration Tests (30%)
  /____________\   - API endpoint testing
 /              \  - Database validation
/________________\ Unit Tests (60%)
                   - Service layer logic
                   - Utility functions
                   - Business rules
```

### Test Levels

#### 1. Unit Tests (Service Layer)

- **Tools:** Jest + Supertest
- **Coverage:** Business logic, calculations, validations
- **Target:** 80%+ code coverage
- **Files:** `__tests__/services/*.test.ts`

#### 2. Integration Tests (API Layer)

- **Tools:** Postman/Newman, Jest + Supertest
- **Coverage:** All 104 API endpoints
- **Target:** 100% endpoint coverage
- **Files:** `__tests__/integration/*.test.ts`

#### 3. E2E Tests (User Flows)

- **Tools:** Postman Collections
- **Coverage:** Critical business flows
- **Scenarios:**
  - Patient booking → check-in → visit → prescription → invoice → payment
  - Doctor shift cancellation → auto-reschedule
  - Medicine stock management → prescription → deduction
  - Payroll calculation → approval → payment

#### 4. Database Tests

- **Tools:** MySQL queries, Sequelize ORM
- **Coverage:** Data integrity, foreign keys, constraints
- **Target:** All CRUD operations validated

#### 5. Security Tests

- **Tools:** Manual + OWASP ZAP
- **Coverage:** Authentication, authorization, injection attacks
- **Target:** Zero critical vulnerabilities

---

## 🔧 Test Environment Setup

### 1. Create Test Database

```bash
mysql -u root -p
```

```sql
-- Create test database
CREATE DATABASE healthcare_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions
GRANT ALL PRIVILEGES ON healthcare_test.* TO 'test_user'@'localhost' IDENTIFIED BY 'test_password';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Configure Test Environment

Create `.env.test`:

```env
# Test Environment Configuration
NODE_ENV=test
PORT=5001

# Test Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=healthcare_test
DB_USER=test_user
DB_PASSWORD=test_password

# Test JWT
JWT_SECRET=test-jwt-secret-for-testing-only
JWT_EXPIRES_IN=1h

# Test Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Disable Email in Tests
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=

# CORS
CORS_ORIGIN=*

# Rate Limiting (relaxed for testing)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 3. Run Migrations for Test DB

```bash
# Load test environment
export NODE_ENV=test

# Run migrations
npx sequelize-cli db:migrate --env test

# Seed test data
npx sequelize-cli db:seed:all --env test
```

### 4. Start Test Server

```bash
# Terminal 1: Start test server
NODE_ENV=test npm run dev

# Verify server is running
curl http://localhost:5001
```

---

## 📊 Test Data Management

### Default Test Users

After running seeders (`20251229000001-full-system-seed.js`), these users are available:

| Role         | Email                        | Password | User ID | User Code | Full Name        |
| ------------ | ---------------------------- | -------- | ------- | --------- | ---------------- |
| ADMIN        | admin@healthcare.com         | 123456   | 1       | ADM001    | Quản Trị Viên    |
| DOCTOR       | nguyen.van.a@healthcare.com  | 123456   | 2       | DOC001    | BS. Nguyễn Văn A |
| DOCTOR       | tran.thi.b@healthcare.com    | 123456   | 3       | DOC002    | BS. Trần Thị B   |
| DOCTOR       | le.van.c@healthcare.com      | 123456   | 4       | DOC003    | BS. Lê Văn C     |
| DOCTOR       | pham.thi.d@healthcare.com    | 123456   | 5       | DOC004    | BS. Phạm Thị D   |
| PATIENT      | patient1@gmail.com           | 123456   | 6       | PAT001    | Ngô Văn K        |
| PATIENT      | patient2@gmail.com           | 123456   | 7       | PAT002    | Đỗ Thị L         |
| PATIENT      | patient3@gmail.com           | 123456   | 8       | PAT003    | Bùi Văn M        |
| PATIENT      | patient4@gmail.com           | 123456   | 9       | PAT004    | Vũ Thị N         |
| PATIENT      | patient5@gmail.com           | 123456   | 10      | PAT005    | Đặng Văn O       |
| RECEPTIONIST | receptionist1@healthcare.com | 123456   | 11      | REC001    | Nguyễn Thị E     |
| RECEPTIONIST | receptionist2@healthcare.com | 123456   | 12      | REC002    | Trần Văn F       |

**Note:** All passwords are hashed with bcrypt (10 rounds)

### Seeded Test Data Overview

The `20251229000001-full-system-seed.js` creates the following data:

**Specialties (6):**

- Nội khoa, Ngoại khoa, Nhi khoa, Sản phụ khoa, Tim mạch, Tai Mũi Họng

**Doctors (4) with Shifts:**

- BS001: Nguyễn Văn A (Nội khoa - Trưởng khoa)
- BS002: Trần Thị B (Nhi khoa - Phó khoa)
- BS003: Lê Văn C (Tim mạch)
- BS004: Phạm Thị D (Ngoại khoa)

**Patients (5) with Profiles:**

- BN001: Ngô Văn K (CCCD: 001090001234)
- BN002: Đỗ Thị L (CCCD: 001085005678)
- BN003: Bùi Văn M (CCCD: 001015009876)
- BN004: Vũ Thị N (CCCD: 001078004321)
- BN005: Đặng Văn O (CCCD: 001095008765)

**Medicines (10):**

- MED001: Paracetamol 500mg (1000 viên, 200/500 VNĐ)
- MED002: Amoxicillin 500mg (500 viên, 1000/2000 VNĐ)
- MED003: Vitamin C 500mg (2000 viên, 300/800 VNĐ)
- MED004: Omeprazole 20mg (300 viên, 1500/3000 VNĐ)
- MED005: Cefixime 200mg (400 viên, 2000/4000 VNĐ)
- MED006: Cetirizine 10mg (800 viên, 500/1000 VNĐ)
- MED007: Dextromethorphan Syrup (150 chai, 15000/25000 VNĐ)
- MED008: Ibuprofen 400mg (600 viên, 800/1500 VNĐ)
- MED009: Metformin 500mg (700 viên, 400/900 VNĐ)
- MED010: Amlodipine 5mg (500 viên, 600/1200 VNĐ)

**Appointments:**

- 5 upcoming appointments (tomorrow)
- 2 completed appointments (yesterday) with visits, prescriptions, and invoices

**Completed Transactions:**

- 2 visits with prescriptions (DT001, DT002)
- 2 invoices fully paid (HD001: 215,000 VNĐ, HD002: 235,400 VNĐ)

### Run Seeders

```bash
# Run all seeders (recommended - includes full system seed)
npx sequelize-cli db:seed:all

# Or run specific full system seed
npx sequelize-cli db:seed --seed 20251229000001-full-system-seed.js
```

### Quick Reference: Seed Data Cheat Sheet

**Login Credentials (All passwords: `123456`):**

```
Admin:        admin@healthcare.com
Doctor 1:     nguyen.van.a@healthcare.com (BS001 - Nội khoa)
Doctor 2:     tran.thi.b@healthcare.com (BS002 - Nhi khoa)
Receptionist: receptionist1@healthcare.com
Patient 1:    patient1@gmail.com (BN001)
```

**Medicine Prices for Testing:**

```
MED001: Paracetamol 500mg    → 500 VNĐ (qty: 1000)
MED002: Amoxicillin 500mg    → 2000 VNĐ (qty: 500)
MED003: Vitamin C 500mg      → 800 VNĐ (qty: 2000)
MED004: Omeprazole 20mg      → 3000 VNĐ (qty: 300)
MED006: Cetirizine 10mg      → 1000 VNĐ (qty: 800)
```

**Payroll Coefficients:**

```
ADMIN (roleId: 1)        → 3.0
DOCTOR (roleId: 2)       → 2.5
PATIENT (roleId: 3)      → N/A
RECEPTIONIST (roleId: 4) → 1.2
```

**Existing Data for Testing:**

```
Completed Visits: 2 (visitId: 1, 2)
Prescriptions: 2 (DT001, DT002)
Paid Invoices: 2 (HD001: 215,000 VNĐ, HD002: 235,400 VNĐ)
Upcoming Appointments: 5 (tomorrow)
```

---

## 🔐 Authentication & Authorization Testing

### Test Case AUTH-001: User Registration

**Objective:** Verify new user can register successfully

**Endpoint:** `POST /api/auth/register`

**Request:**

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "SecurePass123!",
    "fullName": "New Test User",
    "roleId": 4
  }'
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 5,
      "email": "newuser@test.com",
      "fullName": "New Test User",
      "roleId": 4,
      "isActive": true
    }
  }
}
```

**Database Validation:**

```sql
SELECT * FROM users WHERE email = 'newuser@test.com';
-- Verify: password is hashed (bcrypt), isActive = true, roleId = 4
```

**Edge Cases:**

- Duplicate email → 400 "Email already exists"
- Invalid email format → 400 "Invalid email"
- Weak password → 400 "Password too weak"
- Invalid roleId → 400 "Invalid role"

---

### Test Case AUTH-002: User Login

**Objective:** Verify user can login and receive JWT token

**Endpoint:** `POST /api/auth/login`

**Request:**

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@healthcare.com",
    "password": "123456"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@healthcare.com",
      "fullName": "Quản Trị Viên",
      "userCode": "ADM001",
      "roleId": 1
    }
  }
}
```

**Token Validation:**

```bash
# Decode JWT at https://jwt.io
# Verify payload contains: userId, email, roleId, iat, exp
```

**Edge Cases:**

- Wrong password → 401 "Invalid credentials"
- Non-existent email → 401 "Invalid credentials"
- Inactive user → 403 "Account disabled"

---

### Test Case AUTH-003: Token Verification

**Objective:** Verify JWT token grants access to protected routes

**Endpoint:** `GET /api/users` (ADMIN only)

**Request:**

```bash
curl -X GET http://localhost:5001/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 4
    }
  }
}
```

**Edge Cases:**

- No token → 401 "NO_TOKEN"
- Invalid token → 401 "INVALID_TOKEN"
- Expired token → 401 "INVALID_TOKEN"
- Wrong role (PATIENT token) → 403 "Access denied"

---

### Test Case AUTH-004: Logout & Token Blacklist

**Objective:** Verify logout invalidates token via Redis blacklist

**Endpoint:** `POST /api/auth/logout`

**Request:**

```bash
curl -X POST http://localhost:5001/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Verification:**

```bash
# Try using same token again
curl -X GET http://localhost:5001/api/users \
  -H "Authorization: Bearer SAME_TOKEN"

# Expected: 401 "TOKEN_REVOKED"
```

**Redis Validation:**

```bash
redis-cli
> KEYS blacklist:*
> GET "blacklist:YOUR_TOKEN"
# Should return "1" or "true"
```

---

### Test Case AUTH-005: Role-Based Access Control

**Test Matrix:**

| Endpoint                       | ADMIN | DOCTOR | RECEPTIONIST | PATIENT |
| ------------------------------ | ----- | ------ | ------------ | ------- |
| GET /api/users                 | ✅    | ❌     | ❌           | ❌      |
| POST /api/appointments         | ❌    | ❌     | ❌           | ✅      |
| POST /api/appointments/offline | ❌    | ❌     | ✅           | ❌      |
| POST /api/prescriptions        | ❌    | ✅     | ❌           | ❌      |
| POST /api/medicines            | ✅    | ❌     | ❌           | ❌      |

**Test Procedure:**

1. Login as each role
2. Attempt to access endpoint
3. Verify expected status code (200 or 403)

---

### Test Case AUTH-006: Permission-Based Access Control

**Objective:** Verify granular permission checks

**Endpoint:** `GET /api/permissions/role/1`

**Setup:**

```sql
-- Verify admin role has permissions
SELECT r.name AS role, p.name AS permission
FROM roles r
JOIN role_permissions rp ON r.id = rp.roleId
JOIN permissions p ON rp.permissionId = p.id
WHERE r.id = 1;
```

**Request:**

```bash
curl -X GET http://localhost:5001/api/permissions/role/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "role": "ADMIN",
    "permissions": [
      "users.view",
      "users.create",
      "medicines.view",
      "medicines.create",
      ...
    ]
  }
}
```

---

## 📋 API Testing by Module

### Module 1: Patient Management

#### Test Case PAT-001: Setup Patient Profile

**Objective:** Patient completes profile after registration

**Prerequisites:**

- User registered with roleId = 3 (PATIENT)
- User logged in (has token)

**Endpoint:** `POST /api/patients/setup`

**Request:**

```bash
curl -X POST http://localhost:5001/api/patients/setup \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyen Van A",
    "gender": "MALE",
    "dateOfBirth": "1990-05-15",
    "cccd": "001090001234",
    "profiles": [
      {
        "type": "email",
        "value": "nguyenvana@gmail.com",
        "isPrimary": true
      },
      {
        "type": "phone",
        "value": "0901234567",
        "isPrimary": true
      },
      {
        "type": "address",
        "value": "123 Nguyen Trai",
        "ward": "Phuong 1",
        "city": "Ho Chi Minh",
        "isPrimary": true
      }
    ]
  }'
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Patient profile created successfully",
  "data": {
    "patient": {
      "id": 1,
      "patientCode": "BN000001",
      "fullName": "Nguyen Van A",
      "gender": "MALE",
      "dateOfBirth": "1990-05-15",
      "cccd": "001090001234",
      "userId": 4,
      "isActive": true
    }
  }
}
```

**Database Validation:**

```sql
-- Check patient created
SELECT * FROM patients WHERE userId = 4;

-- Check profiles created
SELECT * FROM patient_profiles WHERE patient_id = 1;
-- Expected: 3 rows (email, phone, address)

-- Verify CCCD uniqueness
SELECT COUNT(*) FROM patients WHERE cccd = '001090001234';
-- Expected: 1
```

**Edge Cases:**

- CCCD not 12 digits → 400 "CCCD must be 12 digits"
- Duplicate CCCD → 400 "CCCD already exists"
- Future dateOfBirth → 400 "DOB cannot be future"
- Already setup → 400 "Patient profile already exists"

---

#### Test Case PAT-002: Update Patient Profile

**Objective:** Update patient information

**Endpoint:** `PUT /api/patients/:id`

**Request:**

```bash
curl -X PUT http://localhost:5001/api/patients/1 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyen Van A (Updated)",
    "gender": "MALE",
    "dateOfBirth": "1990-05-15",
    "cccd": "001090001234",
    "profiles": [
      {
        "type": "phone",
        "value": "0912345678",
        "isPrimary": true
      }
    ]
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Patient updated successfully",
  "data": {
    "patient": {
      "id": 1,
      "fullName": "Nguyen Van A (Updated)",
      "gender": "MALE",
      ...
    }
  }
}
```

**Database Validation:**

```sql
-- Old profiles should be deleted, new ones created
SELECT * FROM patient_profiles WHERE patient_id = 1;
-- Expected: Only new phone number exists

-- Verify transaction worked (all or nothing)
SELECT COUNT(*) FROM patient_profiles WHERE patient_id= 1;
-- Expected: 1 (not partial update)
```

---

### Module 2: Appointment Booking

#### Test Case APT-001: Book Appointment (Patient)

**Objective:** Patient books online appointment

**Prerequisites:**

- Patient profile setup (patientCode exists)
- Doctor assigned to shift for target date
- Slots available (< 40 appointments that day)

**Endpoint:** `POST /api/appointments`

**Setup:**

```sql
-- Assign doctor to shift
INSERT INTO doctor_shifts (doctorId, shiftId, workDate, status, createdAt, updatedAt)
VALUES (1, 1, '2025-12-30', 'ACTIVE', NOW(), NOW());

-- Verify no conflicts
SELECT COUNT(*) FROM appointments
WHERE doctorId = 1 AND shiftId = 1 AND date = '2025-12-30';
-- Expected: 0 (fresh start)
```

**Request:**

```bash
curl -X POST http://localhost:5001/api/appointments \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": 1,
    "shiftId": 1,
    "date": "2025-12-30",
    "symptomInitial": "Headache and fever for 3 days"
  }'
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "appointment": {
      "id": 1,
      "patientId": 1,
      "doctorId": 1,
      "shiftId": 1,
      "date": "2025-12-30",
      "slotNumber": 1,
      "bookingType": "ONLINE",
      "bookedBy": "PATIENT",
      "symptomInitial": "Headache and fever for 3 days",
      "status": "WAITING"
    }
  }
}
```

**Database Validation:**

```sql
-- Check appointment created
SELECT * FROM appointments WHERE id = 1;

-- Verify slot assignment
SELECT slotNumber FROM appointments
WHERE doctorId = 1 AND shiftId = 1 AND date = '2025-12-30'
ORDER BY slotNumber;
-- Expected: 1 (first slot)

-- Check notification created
SELECT * FROM notifications WHERE userId = 4 AND type = 'APPOINTMENT_CREATED';
-- Expected: 1 row
```

**Concurrency Test:**

```bash
# Run 5 parallel bookings (simulate race condition)
for i in {1..5}; do
  curl -X POST http://localhost:5001/api/appointments \
    -H "Authorization: Bearer PATIENT_TOKEN_$i" \
    -H "Content-Type: application/json" \
    -d '{
      "doctorId": 1,
      "shiftId": 1,
      "date": "2025-12-30",
      "symptomInitial": "Test concurrent booking"
    }' &
done
wait

# Verify slots: 1, 2, 3, 4, 5 (no duplicates)
SELECT slotNumber FROM appointments
WHERE doctorId = 1 AND shiftId = 1 AND date = '2025-12-30'
ORDER BY slotNumber;
-- Expected: Sequential slots with no gaps or duplicates
```

**Edge Cases:**

- Doctor not on duty → 400 "DOCTOR_NOT_ON_DUTY"
- 40 appointments already → 400 "DAY_FULL"
- Shift full (10 slots) → 400 "SHIFT_FULL"
- Past date → 400 "Cannot book past date"

---

#### Test Case APT-002: Cancel Appointment

**Objective:** Patient cancels appointment before deadline

**Endpoint:** `PUT /api/appointments/:id/cancel`

**Business Rule:** Must cancel at least 2 hours before appointment time

**Calculation:**

```
Appointment time = date + shift.startTime + (slotNumber - 1) * slotDuration
Deadline = appointmentTime - 2 hours
```

**Test Scenario 1: Cancel within deadline (Success)**

```bash
# Appointment: 2025-12-30 07:00 (shift starts)
# Slot 1: 07:00 (assuming 15 min/slot)
# Deadline: 05:00
# Current time: 2025-12-29 23:00 (OK)

curl -X PUT http://localhost:5001/api/appointments/1/cancel \
  -H "Authorization: Bearer PATIENT_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "data": {
    "appointment": {
      "id": 1,
      "status": "CANCELLED"
    }
  }
}
```

**Database Validation:**

```sql
SELECT status FROM appointments WHERE id = 1;
-- Expected: CANCELLED

SELECT * FROM notifications
WHERE relatedAppointmentId = 1 AND type = 'APPOINTMENT_CANCELLED';
-- Expected: 1 row (notification sent)
```

**Test Scenario 2: Cancel too late (Failure)**

```bash
# Current time: 2025-12-30 06:00 (1 hour before)
# Expected: Error

curl -X PUT http://localhost:5001/api/appointments/1/cancel \
  -H "Authorization: Bearer PATIENT_TOKEN"
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Cannot cancel appointment less than 2 hours before scheduled time"
}
```

**Edge Cases:**

- Already cancelled → 400 "Appointment already cancelled"
- Already checked in → 400 "Cannot cancel checked-in appointment"
- Wrong patient → 403 "Not your appointment"

---

### Module 3: Doctor Shift Management

#### Test Case SHF-001: Cancel Doctor Shift with Auto-Reschedule

**Objective:** Admin cancels doctor shift, system finds replacement and moves all appointments

**Prerequisites:**

- Doctor A has shift on 2025-12-30, shift 1 (Morning)
- Doctor A has 5 appointments booked
- Doctor B (same specialty) is available same shift/date

**Setup:**

```sql
-- Doctor A shift (will be cancelled)
INSERT INTO doctor_shifts (doctorId, shiftId, workDate, status, createdAt, updatedAt)
VALUES (1, 1, '2025-12-30', 'ACTIVE', NOW(), NOW());

-- Doctor B shift (replacement)
INSERT INTO doctor_shifts (doctorId, shiftId, workDate, status, createdAt, updatedAt)
VALUES (2, 1, '2025-12-30', 'ACTIVE', NOW(), NOW());

-- 5 appointments for Doctor A
INSERT INTO appointments (patientId, doctorId, shiftId, date, slotNumber, bookingType, bookedBy, status, createdAt, updatedAt) VALUES
(1, 1, 1, '2025-12-30', 1, 'ONLINE', 'PATIENT', 'WAITING', NOW(), NOW()),
(2, 1, 1, '2025-12-30', 2, 'ONLINE', 'PATIENT', 'WAITING', NOW(), NOW()),
(3, 1, 1, '2025-12-30', 3, 'ONLINE', 'PATIENT', 'WAITING', NOW(), NOW()),
(4, 1, 1, '2025-12-30', 4, 'ONLINE', 'PATIENT', 'WAITING', NOW(), NOW()),
(5, 1, 1, '2025-12-30', 5, 'ONLINE', 'PATIENT', 'WAITING', NOW(), NOW());
```

**Endpoint:** `POST /api/doctor-shifts/:id/cancel-and-reschedule`

**Request:**

```bash
# Get doctor_shift ID
DOCTOR_SHIFT_ID=$(mysql -u test_user -p healthcare_test -se \
  "SELECT id FROM doctor_shifts WHERE doctorId = 1 AND workDate = '2025-12-30'")

curl -X POST http://localhost:5001/api/doctor-shifts/$DOCTOR_SHIFT_ID/cancel-and-reschedule \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workDate":"2025-12-30",
    "cancelReason": "Doctor A is sick"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Shift cancelled and appointments rescheduled",
  "data": {
    "originalDoctor": { "id": 1, "name": "Dr. John Doe" },
    "replacementDoctor": { "id": 2, "name": "Dr. Jane Smith" },
    "affectedAppointments": 5,
    "rescheduledAppointments": 5,
    "failedAppointments": 0,
    "details": [
      { "appointmentId": 1, "success": true },
      { "appointmentId": 2, "success": true },
      { "appointmentId": 3, "success": true },
      { "appointmentId": 4, "success": true },
      { "appointmentId": 5, "success": true }
    ]
  }
}
```

**Database Validation:**

```sql
-- Check doctor shift status
SELECT status, replacedBy FROM doctor_shifts WHERE id = $DOCTOR_SHIFT_ID;
-- Expected: status = REPLACED, replacedBy = 2

-- Check all appointments moved to Doctor B
SELECT doctorId, COUNT(*)
FROM appointments
WHERE shiftId = 1 AND date = '2025-12-30'
GROUP BY doctorId;
-- Expected: doctorId = 2, count = 5 (all moved)

-- Check notifications sent to all 5 patients
SELECT COUNT(*) FROM notifications
WHERE type = 'DOCTOR_CHANGED'
AND relatedAppointmentId IN (1, 2, 3, 4, 5);
-- Expected: 5 (one per patient)

-- Verify email sent flag
SELECT COUNT(*) FROM notifications
WHERE type = 'DOCTOR_CHANGED'
AND emailSent = TRUE;
-- Expected: 5 (if SMTP configured)
```

**Test Scenario 2: No Replacement Available**

```sql
-- Remove Doctor B's shift (no replacement)
DELETE FROM doctor_shifts WHERE doctorId = 2 AND workDate = '2025-12-30';
```

**Request:** Same as above

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Shift cancelled but no replacement found",
  "data": {
    "originalDoctor": { "id": 1, "name": "Dr. John Doe" },
    "replacementDoctor": null,
    "affectedAppointments": 5,
    "rescheduledAppointments": 0,
    "failedAppointments": 5,
    "details": [
      { "appointmentId": 1, "success": false, "reason": "No replacement doctor available" },
      ...
    ]
  }
}
```

**Database Validation:**

```sql
-- Shift marked as CANCELLED (not REPLACED)
SELECT status, replacedBy FROM doctor_shifts WHERE id = $DOCTOR_SHIFT_ID;
-- Expected: status = CANCELLED, replacedBy = NULL

-- Appointments still assigned to Doctor A (no change)
SELECT doctorId FROM appointments WHERE id IN (1, 2, 3, 4, 5);
-- Expected: doctorId = 1 (unchanged)

-- Notifications still sent (warning patients)
SELECT COUNT(*) FROM notifications WHERE type = 'APPOINTMENT_CANCELLED';
-- Expected: 5
```

---

### Module 4: Prescription & Medicine Management

#### Test Case PRX-001: Create Prescription with Stock Deduction

**Objective:** Doctor creates prescription, stock automatically deducted

**Prerequisites:**

- Visit completed (status = COMPLETED)
- Medicines available with sufficient stock

**Setup:**

```sql
-- Create completed visit
INSERT INTO visits (appointmentId, patientId, doctorId, checkInTime, symptoms, diagnosis, status, createdAt, updatedAt)
VALUES (1, 1, 1, NOW(), 'Fever', 'Common cold', 'COMPLETED', NOW(), NOW());

-- Check medicine stock before (from seed data)
SELECT medicineCode, name, quantity, importPrice, salePrice FROM medicines WHERE id IN (1, 2);
-- Expected:
-- MED001 | Paracetamol 500mg | 1000 | 200 | 500
-- MED002 | Amoxicillin 500mg | 500 | 1000 | 2000
```

**Endpoint:** `POST /api/prescriptions`

**Request:**

```bash
curl -X POST http://localhost:5001/api/prescriptions \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "visitId": 1,
    "note": "Take medicine after meals",
    "medicines": [
      {
        "medicineId": 1,
        "quantity": 20,
        "dosageMorning": 1,
        "dosageNoon": 0,
        "dosageAfternoon": 0,
        "dosageEvening": 1,
        "instruction": "Take 1 tablet in morning and evening"
      },
      {
        "medicineId": 2,
        "quantity": 12,
        "dosageMorning": 1,
        "dosageNoon": 1,
        "dosageAfternoon": 1,
        "dosageEvening": 0,
        "instruction": "Take 3 times daily for 4 days"
      }
    ]
  }'
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Prescription created successfully",
  "data": {
    "prescription": {
      "id": 1,
      "prescriptionCode": "RX000001",
      "visitId": 1,
      "doctorId": 1,
      "patientId": 1,
      "totalAmount": 34000.0,
      "status": "DRAFT",
      "details": [
        {
          "id": 1,
          "medicineId": 1,
          "medicineName": "Paracetamol 500mg",
          "quantity": 20,
          "unitPrice": 500.0,
          "dosageMorning": 1,
          "dosageEvening": 1,
          "instruction": "Take 1 tablet in morning and evening"
        },
        {
          "id": 2,
          "medicineId": 2,
          "medicineName": "Amoxicillin 500mg",
          "quantity": 12,
          "unitPrice": 2000.0,
          "dosageMorning": 1,
          "dosageNoon": 1,
          "dosageAfternoon": 1,
          "instruction": "Take 3 times daily for 4 days"
        }
      ]
    }
  }
}
```

**Database Validation:**

```sql
-- 1. Check prescription created
SELECT * FROM prescriptions WHERE id = 1;
-- Verify: prescriptionCode, visitId, totalAmount = 34000 (20*500 + 12*2000)

-- 2. Check prescription details
SELECT * FROM prescription_details WHERE prescriptionId = 1;
-- Expected: 2 rows

-- 3. CRITICAL: Check stock deducted
SELECT medicineCode, name, quantity FROM medicines WHERE id IN (1, 2);
-- Expected:
-- MED001 | Paracetamol 500mg | 980 (was 1000, -20)
-- MED002 | Amoxicillin 500mg | 488 (was 500, -12)

-- 4. Check medicine export audit trail
SELECT * FROM medicine_exports
WHERE medicineId IN (1, 2)
ORDER BY id DESC LIMIT 2;
-- Expected: 2 rows with reason = 'PRESCRIPTION_RX000001'

-- 5. Verify transaction integrity
SELECT COUNT(*) FROM prescription_details WHERE prescriptionId = 1;
-- If = 2, transaction succeeded (all or nothing)
```

**Price Snapshot Verification:**

```sql
-- Check that unitPrice is saved at prescription time
SELECT medicineId, unitPrice FROM prescription_details WHERE prescriptionId = 1;

-- Now change medicine price
UPDATE medicines SET salePrice = 1000.00 WHERE id = 1;

-- Re-check prescription detail
SELECT medicineId, unitPrice FROM prescription_details WHERE prescriptionId = 1;
-- Expected: unitPrice still 500.00 (snapshot, not affected by price change)
```

**Edge Cases:**

**Test: Insufficient Stock**

```bash
curl -X POST http://localhost:5001/api/prescriptions \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "visitId": 1,
    "medicines": [
      {
        "medicineId": 1,
        "quantity": 2000
      }
    ]
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "INSUFFICIENT_STOCK_Aspirin 100mg_Available:980_Requested:2000"
}
```

**Database Check:**

```sql
-- Stock should NOT be deducted (transaction rollback)
SELECT quantity FROM medicines WHERE id = 1;
-- Expected: 1000 (unchanged - rollback happened)

-- Prescription should NOT be created
SELECT COUNT(*) FROM prescriptions WHERE visitId = 1;
-- Expected: 1 (only the first successful one)
```

---

#### Test Case PRX-002: Update Prescription (Stock Restore & Re-deduct)

**Objective:** Doctor edits prescription, old stock restored, new stock deducted

**Setup:**

```sql
-- Current state after PRX-001:
-- Medicine 1 (Aspirin): quantity = 980
-- Medicine 2 (Amoxicillin): quantity = 488
-- Prescription has: 20 Aspirin + 12 Amoxicillin
```

**Endpoint:** `PUT /api/prescriptions/:id`

**Request:**

```bash
# Change to: 30 Aspirin (was 20) + 5 Amoxicillin (was 12)
curl -X PUT http://localhost:5001/api/prescriptions/1 \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Updated prescription",
    "medicines": [
      {
        "medicineId": 1,
        "quantity": 30,
        "dosageMorning": 1,
        "dosageEvening": 1,
        "instruction": "Take 1 tablet morning and evening"
      },
      {
        "medicineId": 2,
        "quantity": 5,
        "dosageMorning": 1,
        "dosageNoon": 0,
        "dosageAfternoon": 0,
        "dosageEvening": 0,
        "instruction": "Take 1 daily for 5 days"
      }
    ]
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Prescription updated successfully",
  "data": {
    "prescription": {
      "id": 1,
      "totalAmount": 60000.00,
      "details": [...]
    }
  }
}
```

**Database Validation:**

```sql
-- CRITICAL: Stock changes calculation
-- Medicine 1 (Aspirin):
--   Before update: 980
--   Restore old: 980 + 20 = 1000
--   Deduct new: 1000 - 30 = 970
-- Medicine 2 (Amoxicillin):
--   Before update: 488
--   Restore old: 488 + 12 = 500
--   Deduct new: 500 - 5 = 495

SELECT medicineCode, quantity FROM medicines WHERE id IN (1, 2);
-- Expected:
-- MED000001 | 970 (correct)
-- MED000002 | 495 (correct)

-- Check updated details
SELECT medicineId, quantity FROM prescription_details WHERE prescriptionId = 1;
-- Expected:
-- medicineId 1, quantity 30
-- medicineId 2, quantity 5

-- Check total amount recalculated
SELECT totalAmount FROM prescriptions WHERE id = 1;
-- Expected: 30 * 1500 + 5 * 3000 = 45000 + 15000 = 60000
```

---

#### Test Case PRX-003: Cancel Prescription (Stock Restore)

**Objective:** Doctor cancels prescription, stock fully restored

**Setup:**

```sql
-- Current state:
-- Medicine 1: 970
-- Medicine 2: 495
-- Prescription has: 30 Aspirin + 5 Amoxicillin
```

**Endpoint:** `POST /api/prescriptions/:id/cancel`

**Request:**

```bash
curl -X POST http://localhost:5001/api/prescriptions/1/cancel \
  -H "Authorization: Bearer DOCTOR_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Prescription cancelled and stock restored",
  "data": {
    "prescription": {
      "id": 1,
      "status": "CANCELLED"
    }
  }
}
```

**Database Validation:**

```sql
-- Stock restored
SELECT medicineCode, quantity FROM medicines WHERE id IN (1, 2);
-- Expected:
-- MED000001 | 1000 (970 + 30)
-- MED000002 | 500 (495 + 5)

-- Status changed
SELECT status FROM prescriptions WHERE id = 1;
-- Expected: CANCELLED
```

**Edge Case: Cannot Edit Locked Prescription**

```sql
-- Lock prescription (simulates payment completed)
UPDATE prescriptions SET status = 'LOCKED' WHERE id = 1;
```

```bash
curl -X PUT http://localhost:5001/api/prescriptions/1 \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "medicines": [...] }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Cannot edit locked prescription"
}
```

---

### Module 5: Invoice & Payment Management

#### Test Case INV-001: Auto-Generate Invoice on Visit Complete

**Objective:** When visit is completed, invoice is auto-created

**Setup:**

```sql
-- Visit with prescription (from PRX-001)
-- Prescription total: 34000 (20*500 + 12*2000)
-- Examination fee: 200000 (will be provided)
```

**Endpoint:** `PUT /api/visits/:id/complete`

**Request:**

```bash
curl -X PUT http://localhost:5001/api/visits/1/complete \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diagnosis": "Common cold, mild fever",
    "examinationFee": 200000,
    "note": "Rest for 3 days"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Visit completed and invoice created",
  "data": {
    "visit": {
      "id": 1,
      "status": "COMPLETED",
      "diagnosis": "Common cold, mild fever"
    },
    "invoice": {
      "id": 1,
      "invoiceCode": "INV000001",
      "visitId": 1,
      "examinationFee": 200000.0,
      "medicineTotalAmount": 34000.0,
      "totalAmount": 234000.0,
      "paymentStatus": "UNPAID",
      "paidAmount": 0.0
    }
  }
}
```

**Database Validation:**

```sql
-- 1. Visit status
SELECT status FROM visits WHERE id = 1;
-- Expected: COMPLETED

-- 2. Invoice created
SELECT * FROM invoices WHERE visitId = 1;
-- Verify: invoiceCode, totalAmount = 234000, paymentStatus = UNPAID

-- 3. Invoice items breakdown
SELECT itemType, description, quantity, unitPrice, subtotal
FROM invoice_items WHERE invoiceId = 1;
-- Expected: 3 rows
-- EXAMINATION | "Examination fee" | 1 | 200000 | 200000
-- MEDICINE | (Paracetamol) | 20 | 500 | 10000
-- MEDICINE | (Amoxicillin) | 12 | 2000 | 24000

-- 4. Verify prescription locked after invoice
SELECT status FROM prescriptions WHERE visitId = 1;
-- Expected: LOCKED (cannot edit after invoice created)
```

---

#### Test Case INV-002: Add Partial Payment

**Objective:** Patient pays part of invoice

**Endpoint:** `POST /api/invoices/:id/payments`

**Request (Payment 1: 150,000):**

```bash
curl -X POST http://localhost:5001/api/invoices/1/payments \
  -H "Authorization: Bearer RECEPTIONIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150000,
    "paymentMethod": "CASH",
    "reference": "CASH-001",
    "note": "First payment"
  }'
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "payment": {
      "id": 1,
      "invoiceId": 1,
      "amount": 150000.0,
      "paymentMethod": "CASH",
      "paymentDate": "2025-12-29T..."
    },
    "invoice": {
      "id": 1,
      "totalAmount": 234000.0,
      "paidAmount": 150000.0,
      "paymentStatus": "PARTIALLY_PAID",
      "remainingAmount": 84000.0
    }
  }
}
```

**Database Validation:**

```sql
-- Payment record created
SELECT * FROM payments WHERE invoiceId = 1;
-- Expected: 1 row, amount = 150000

-- Invoice updated
SELECT paidAmount, paymentStatus FROM invoices WHERE id = 1;
-- Expected: paidAmount = 150000, paymentStatus = PARTIALLY_PAID
```

**Request (Payment 2: 84,000 - Full payment):**

```bash
curl -X POST http://localhost:5001/api/invoices/1/payments \
  -H "Authorization: Bearer RECEPTIONIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 84000,
    "paymentMethod": "BANK_TRANSFER",
    "reference": "TXN-ABC123",
    "note": "Final payment via bank"
  }'
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Payment recorded successfully - Invoice fully paid",
  "data": {
    "payment": { "id": 2, "amount": 84000.0 },
    "invoice": {
      "totalAmount": 234000.0,
      "paidAmount": 234000.0,
      "paymentStatus": "PAID",
      "remainingAmount": 0.0
    }
  }
}
```

**Database Validation:**

```sql
-- 2 payments
SELECT SUM(amount) FROM payments WHERE invoiceId = 1;
-- Expected: 234000

-- Invoice fully paid
SELECT paymentStatus, paidAmount FROM invoices WHERE id = 1;
-- Expected: PAID, 234000.00
```

**Edge Case: Overpayment**

```bash
curl -X POST http://localhost:5001/api/invoices/1/payments \
  -H "Authorization: Bearer RECEPTIONIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000000,
    "paymentMethod": "CASH"
  }'
```

**Expected Response (400):**

```json
{
  "success": false,
  "message": "Payment amount (1000000) exceeds remaining balance (0)"
}
```

---

### Module 6: Payroll Management

#### Test Case PAY-001: Calculate Payroll for Doctor

**Objective:** Calculate complex payroll with all components

**Business Rules:**

```
baseSalary = 2,500,000
roleCoefficient:
  - ADMIN (roleId 1) = 3.0
  - DOCTOR (roleId 2) = 2.5
  - PATIENT (roleId 3) = N/A (không tính lương)
  - RECEPTIONIST (roleId 4) = 1.2

roleSalary = baseSalary * roleCoefficient

yearsOfService = 2025 - userCreatedYear
experienceBonus = yearsOfService * 250,000

commission (DOCTORS ONLY - roleId 2) = totalInvoices * 5%
  where totalInvoices = SUM of PAID invoices for doctor in month

penaltyDaysOff = MAX(0, daysOff - allowedDaysOff)
penaltyAmount = penaltyDaysOff * 200,000

grossSalary = roleSalary + experienceBonus + commission
netSalary = grossSalary - penaltyAmount
```

**Setup:**

```sql
-- Doctor user created 3 years ago
UPDATE users SET createdAt = '2022-01-01' WHERE id = 2;

-- Create invoices for doctor (month = 12, year = 2025)
INSERT INTO invoices (invoiceCode, visitId, patientId, doctorId, examinationFee, medicineTotalAmount, totalAmount, paymentStatus, paidAmount, createdBy, createdAt, updatedAt) VALUES
('INV001', 1, 1, 1, 200000, 50000, 250000, 'PAID', 250000, 3, '2025-12-15', '2025-12-15'),
('INV002', 2, 2, 1, 200000, 100000, 300000, 'PAID', 300000, 3, '2025-12-20', '2025-12-20'),
('INV003', 3, 3, 1, 200000, 0, 200000, 'PARTIALLY_PAID', 100000, 3, '2025-12-22', '2025-12-22');

-- Total PAID = 250000 + 300000 = 550,000 (INV003 not counted - not fully paid)

-- Attendance: 3 days absent in December
INSERT INTO attendance (userId, date, status, createdAt, updatedAt) VALUES
(2, '2025-12-05', 'ABSENT', NOW(), NOW()),
(2, '2025-12-12', 'ABSENT', NOW(), NOW()),
(2, '2025-12-18', 'LEAVE', NOW(), NOW());
-- Total days off = 3
```

**Expected Calculation:**

```
yearsOfService = 2025 - 2022 = 3
roleSalary = 2,500,000 * 2.5 = 6,250,000
experienceBonus = 3 * 250,000 = 750,000
commission = 550,000 * 5% = 27,500
penaltyDaysOff = 3 - 2 = 1
penaltyAmount = 1 * 200,000 = 200,000

grossSalary = 6,250,000 + 750,000 + 27,500 = 7,027,500
netSalary = 7,027,500 - 200,000 = 6,827,500
```

**Endpoint:** `POST /api/payrolls/calculate`

**Request:**

```bash
curl -X POST http://localhost:5001/api/payrolls/calculate \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "month": 12,
    "year": 2025
  }'
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Payroll calculated successfully",
  "data": {
    "payroll": {
      "id": 1,
      "payrollCode": "PAY202512-000001",
      "userId": 2,
      "month": 12,
      "year": 2025,
      "baseSalary": 2500000.0,
      "roleCoefficient": 2.5,
      "roleSalary": 6250000.0,
      "yearsOfService": 3,
      "experienceBonus": 750000.0,
      "totalInvoices": 550000.0,
      "commissionRate": 0.05,
      "commission": 27500.0,
      "daysOff": 3,
      "allowedDaysOff": 2,
      "penaltyDaysOff": 1,
      "penaltyAmount": 200000.0,
      "grossSalary": 7027500.0,
      "netSalary": 6827500.0,
      "status": "DRAFT"
    }
  }
}
```

**Database Validation:**

```sql
SELECT * FROM payrolls WHERE userId = 2 AND month = 12 AND year = 2025;
-- Verify all fields match expected calculation

-- Check cannot create duplicate
SELECT COUNT(*) FROM payrolls WHERE userId = 2 AND month = 12 AND year = 2025;
-- Expected: 1 (uniqueness constraint)
```

**Edge Case: Non-Doctor User (No Commission)**

```sql
-- Calculate for receptionist
```

**Expected:**

```
roleSalary = 2,500,000 * 1.2 = 3,000,000
commission = 0 (not a doctor)
experienceBonus = yearsOfService * 250,000
...
```

---

#### Test Case PAY-002: Approve Payroll

**Objective:** Admin approves payroll

**Endpoint:** `PUT /api/payrolls/:id/approve`

**Request:**

```bash
curl -X PUT http://localhost:5001/api/payrolls/1/approve \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Payroll approved successfully",
  "data": {
    "payroll": {
      "id": 1,
      "status": "APPROVED",
      "approvedBy": 1,
      "approvedAt": "2025-12-29T..."
    }
  }
}
```

**Database Validation:**

```sql
SELECT status, approvedBy, approvedAt FROM payrolls WHERE id = 1;
-- Expected: APPROVED, 1 (admin ID), timestamp
```

---

#### Test Case PAY-003: Pay Payroll

**Objective:** Mark payroll as paid

**Endpoint:** `PUT /api/payrolls/:id/pay`

**Request:**

```bash
curl -X PUT http://localhost:5001/api/payrolls/1/pay \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Payroll marked as paid",
  "data": {
    "payroll": {
      "id": 1,
      "status": "PAID",
      "paidAt": "2025-12-29T..."
    }
  }
}
```

**Database Validation:**

```sql
SELECT status, paidAt FROM payrolls WHERE id = 1;
-- Expected: PAID, timestamp

-- Verify workflow: DRAFT → APPROVED → PAID
```

---

## 🗄️ Database Testing

### Test Case DB-001: Foreign Key Constraints

**Objective:** Verify cascading deletes and restrictions

**Test 1: Cannot delete user with invoices (RESTRICT)**

```sql
-- Try to delete user who created invoices
DELETE FROM users WHERE id = 3;
-- Expected: ERROR 1451 (23000): Cannot delete or update a parent row: a foreign key constraint fails
```

**Test 2: Cascade delete patient profiles**

```sql
-- Delete patient
DELETE FROM patients WHERE id = 1;

-- Check profiles deleted
SELECT COUNT(*) FROM patient_profiles WHERE patientId = 1;
-- Expected: 0 (cascaded)
```

**Test 3: SET NULL on optional FK**

```sql
-- Delete disease category
DELETE FROM disease_categories WHERE id = 1;

-- Check visits
SELECT diseaseCategoryId FROM visits WHERE diseaseCategoryId = 1;
-- Expected: NULL (set null on delete)
```

---

### Test Case DB-002: Unique Constraints

**Test unique violations:**

```sql
-- 1. Duplicate email
INSERT INTO users (email, password, fullName, roleId, createdAt, updatedAt)
VALUES ('admin@test.com', 'hash', 'Duplicate', 1, NOW(), NOW());
-- Expected: ERROR 1062 (23000): Duplicate entry 'admin@test.com' for key 'users_email_unique'

-- 2. Duplicate CCCD
INSERT INTO patients (cccd, fullName, gender, dateOfBirth, isActive, createdAt, updatedAt)
VALUES ('001090001234', 'Duplicate', 'MALE', '1990-01-01', TRUE, NOW(), NOW());
-- Expected: ERROR 1062: Duplicate entry '001090001234'

-- 3. Duplicate appointment slot
INSERT INTO appointments (patientId, doctorId, shiftId, date, slotNumber, bookingType, bookedBy, status, createdAt, updatedAt)
VALUES (1, 1, 1, '2025-12-30', 1, 'ONLINE', 'PATIENT', 'WAITING', NOW(), NOW());
-- Expected: ERROR 1062: Duplicate entry for 'appointments_slot_unique'
```

---

### Test Case DB-003: Transaction Rollback

**Objective:** Verify transaction atomicity

**Test: Prescription creation rollback on stock error**

```sql
START TRANSACTION;

-- Insert prescription
INSERT INTO prescriptions (prescriptionCode, visitId, doctorId, patientId, totalAmount, status, createdAt, updatedAt)
VALUES ('RX999', 99, 1, 1, 10000, 'DRAFT', NOW(), NOW());

-- Insert detail (this will fail - insufficient stock)
INSERT INTO prescription_details (prescriptionId, medicineId, medicineName, quantity, unit, unitPrice, createdAt, updatedAt)
VALUES (LAST_INSERT_ID(), 1, 'Aspirin', 9999999, 'VIEN', 1500, NOW(), NOW());

-- Try to deduct stock (will fail)
UPDATE medicines SET quantity = quantity - 9999999 WHERE id = 1 AND quantity >= 9999999;

-- Check affected rows
SELECT ROW_COUNT();
-- Expected: 0 (update failed)

ROLLBACK;

-- Verify prescription NOT created
SELECT COUNT(*) FROM prescriptions WHERE prescriptionCode = 'RX999';
-- Expected: 0
```

---

## 🔒 Security Testing

### Test Case SEC-001: SQL Injection

**Test injection in various parameters:**

```bash
# 1. Login - SQL injection attempt
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "\" OR \"1\"=\"1"
  }'

# Expected: 401 Invalid credentials (not bypassed)

# 2. Search patients - injection in query
curl -X GET "http://localhost:5001/api/patients?cccd=001090001234' OR '1'='1" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: No results or error (parameterized query)

# 3. ID parameter injection
curl -X GET "http://localhost:5001/api/patients/1 OR 1=1" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: 400 Invalid ID or 404 (not SQL error)
```

**Verify Sequelize ORM prevents SQL injection:**

- All queries use parameterized statements
- User input is escaped
- No raw SQL with string concatenation

---

### Test Case SEC-002: Authentication Bypass

**Test access without token:**

```bash
curl -X GET http://localhost:5001/api/users
# Expected: 401 NO_TOKEN
```

**Test with invalid token:**

```bash
curl -X GET http://localhost:5001/api/users \
  -H "Authorization: Bearer fake.invalid.token"
# Expected: 401 INVALID_TOKEN
```

**Test with expired token:**

```bash
# Create token with 1-second expiration
# Wait 2 seconds
# Use token
# Expected: 401 INVALID_TOKEN
```

---

### Test Case SEC-003: Authorization Bypass

**Test horizontal privilege escalation:**

```bash
# Patient A tries to access Patient B's data
curl -X GET http://localhost:5001/api/patients/2 \
  -H "Authorization: Bearer PATIENT_A_TOKEN"

# Expected: 403 Forbidden (if implemented) or filtered results
```

**Test vertical privilege escalation:**

```bash
# Patient tries to access admin endpoint
curl -X GET http://localhost:5001/api/users \
  -H "Authorization: Bearer PATIENT_TOKEN"

# Expected: 403 Access denied
```

---

### Test Case SEC-004: Rate Limiting

**Test global rate limit:**

```bash
# Send 101 requests rapidly (limit is 100/15min)
for i in {1..101}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    http://localhost:5001/api/medicines
done

# Expected: First 100 return 200, 101st returns 429
```

**Test appointment booking rate limit:**

```bash
# Rapid booking attempts (custom rate limit)
for i in {1..10}; do
  curl -X POST http://localhost:5001/api/appointments \
    -H "Authorization: Bearer PATIENT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "doctorId": 1, "shiftId": 1, "date": "2025-12-30" }' &
done

# Expected: Some requests blocked with 429
```

---

### Test Case SEC-005: Input Validation

**Test XSS in text fields:**

```bash
curl -X POST http://localhost:5001/api/patients/setup \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "<script>alert(\"XSS\")</script>",
    "gender": "MALE",
    "dateOfBirth": "1990-01-01",
    "cccd": "001090001234"
  }'

# Expected: Input sanitized or rejected
```

**Database check:**

```sql
SELECT fullName FROM patients WHERE id = LAST_INSERT_ID();
-- Expected: Escaped or sanitized (not executable script)
```

---

## ⚡ Performance Testing

### Test Case PERF-001: Concurrent Appointment Booking

**Objective:** Test race condition handling with pessimistic locking

**Tool:** Apache Bench or custom script

```bash
# Create 50 concurrent requests
ab -n 50 -c 10 -T 'application/json' \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -p appointment-payload.json \
  http://localhost:5001/api/appointments
```

**Verification:**

```sql
-- Check for slot conflicts
SELECT slotNumber, COUNT(*)
FROM appointments
WHERE doctorId = 1 AND shiftId = 1 AND date = '2025-12-30'
GROUP BY slotNumber
HAVING COUNT(*) > 1;
-- Expected: 0 rows (no duplicates)

-- Verify sequential slots
SELECT slotNumber FROM appointments
WHERE doctorId = 1 AND shiftId = 1 AND date = '2025-12-30'
ORDER BY slotNumber;
-- Expected: 1, 2, 3, 4, ... (sequential, no gaps due to retry logic)
```

---

### Test Case PERF-002: Medicine Stock Concurrency

**Objective:** Test pessimistic locking prevents overselling

```bash
# 10 prescriptions requesting same medicine simultaneously
for i in {1..10}; do
  curl -X POST http://localhost:5001/api/prescriptions \
    -H "Authorization: Bearer DOCTOR_${i}_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "visitId": '$i',
      "medicines": [{ "medicineId": 1, "quantity": 100 }]
    }' &
done
wait
```

**Verification:**

```sql
-- Check medicine quantity
SELECT quantity FROM medicines WHERE id = 1;
-- Expected: original_quantity - (successful_prescriptions * 100)
-- NOT negative (stock protected)

-- Count successful prescriptions
SELECT COUNT(*) FROM prescription_details WHERE medicineId = 1;
-- Should match stock deduction
```

---

### Test Case PERF-003: Pagination Performance

**Test large dataset pagination:**

```bash
# Page 1
time curl "http://localhost:5001/api/patients?page=1&limit=50" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Page 10
time curl "http://localhost:5001/api/patients?page=10&limit=50" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Page 100
time curl "http://localhost:5001/api/patients?page=100&limit=50" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: Response time < 500ms for all pages
```

**Database indexing check:**

```sql
EXPLAIN SELECT * FROM patients
ORDER BY createdAt DESC
LIMIT 50 OFFSET 5000;

-- Check if index is used (avoid full table scan)
```

---

## 🔍 Edge Cases & Error Handling

### Test Case EDGE-001: Boundary Values

**Test 1: CCCD validation**

```bash
# Too short (11 digits)
curl -X POST http://localhost:5001/api/patients/setup \
  -d '{ "cccd": "00109000123" }'
# Expected: 400 "CCCD must be 12 digits"

# Too long (13 digits)
curl -X POST http://localhost:5001/api/patients/setup \
  -d '{ "cccd": "0010900012345" }'
# Expected: 400 "CCCD must be 12 digits"

# Exactly 12 digits
curl -X POST http://localhost:5001/api/patients/setup \
  -d '{ "cccd": "001090001234" }'
# Expected: 200 Success
```

**Test 2: Appointment limit (40/day)**

```sql
-- Create 39 appointments
-- Next appointment should succeed (total 40)
-- 41st appointment should fail with "DAY_FULL"
```

**Test 3: Pagination limits**

```bash
# Page 0 (invalid)
curl "http://localhost:5001/api/patients?page=0&limit=10"
# Expected: 400 or default to page 1

# Limit too large (> 100)
curl "http://localhost:5001/api/patients?page=1&limit=1000"
# Expected: Capped at 100 or 400 error
```

---

### Test Case EDGE-002: Null/Empty Values

```bash
# Empty prescription medicines array
curl -X POST http://localhost:5001/api/prescriptions \
  -d '{ "visitId": 1, "medicines": [] }'
# Expected: 400 "Medicines cannot be empty"

# Null symptom
curl -X POST http://localhost:5001/api/appointments \
  -d '{ "doctorId": 1, "shiftId": 1, "date": "2025-12-30", "symptomInitial": null }'
# Expected: 200 (symptom is optional)
```

---

### Test Case EDGE-003: Special Characters

```bash
# Unicode in patient name
curl -X POST http://localhost:5001/api/patients/setup \
  -d '{ "fullName": "Nguyễn Văn Đức Anh 阮文德英" }'
# Expected: 200 (UTF-8 support)

# Special chars in medicine name
curl -X POST http://localhost:5001/api/medicines \
  -d '{ "name": "Vitamin C 500mg (90 viên/hộp)" }'
# Expected: 200 (special chars allowed)
```

---

## 🤖 Automated Testing

### Jest + Supertest Setup

**Install dependencies:**

```bash
npm install --save-dev jest supertest @types/jest @types/supertest ts-jest
```

**Configure `jest.config.js`:**

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/types/**"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

**Sample test file: `__tests__/auth.test.ts`**

```typescript
import request from "supertest";
import app from "../app";
import { sequelize } from "../models";

describe("Authentication API", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    // Seed test data
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe("POST /api/auth/register", () => {
    it("should register new user successfully", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "Password123!",
        fullName: "Test User",
        roleId: 4,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("test@example.com");
    });

    it("should reject duplicate email", async () => {
      // First registration
      await request(app).post("/api/auth/register").send({
        email: "duplicate@test.com",
        password: "Pass123!",
        fullName: "User 1",
        roleId: 4,
      });

      // Duplicate
      const res = await request(app).post("/api/auth/register").send({
        email: "duplicate@test.com",
        password: "Pass123!",
        fullName: "User 2",
        roleId: 4,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login and return JWT token", async () => {
      // Register first
      await request(app).post("/api/auth/register").send({
        email: "login@test.com",
        password: "Pass123!",
        fullName: "Login User",
        roleId: 4,
      });

      // Login
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@test.com", password: "Pass123!" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(typeof res.body.data.accessToken).toBe("string");
    });

    it("should reject wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@test.com", password: "WrongPass123!" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
```

**Run tests:**

```bash
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
npm test -- auth.test.ts    # Specific file
```

---

## 📮 Postman Collection Guide

### Collection Structure

```
Healthcare Management API/
├── 🔐 Auth/
│   ├── Register
│   ├── Login
│   ├── Refresh Token
│   └── Logout
├── 👥 Users/
│   ├── List Users
│   ├── Get User
│   ├── Create User
│   ├── Update User
│   └── Delete User
├── 🏥 Patients/
│   ├── Setup Profile
│   ├── List Patients
│   ├── Get Patient
│   ├── Update Patient
│   ├── Upload Avatar
│   └── Delete Patient
├── 📅 Appointments/
│   ├── Book Appointment
│   ├── Book Offline
│   ├── List Appointments
│   └── Cancel Appointment
├── 💊 Medicines/
│   ├── List Medicines
│   ├── Create Medicine
│   ├── Update Medicine
│   ├── Import Stock
│   ├── Low Stock Alert
│   └── Expiring Medicines
├── 📝 Prescriptions/
│   ├── Create Prescription
│   ├── Update Prescription
│   ├── Cancel Prescription
│   └── Export PDF
├── 💰 Invoices/
│   ├── Create Invoice
│   ├── Add Payment
│   ├── List Invoices
│   └── Export PDF
├── 💼 Payrolls/
│   ├── Calculate Payroll
│   ├── Approve Payroll
│   ├── Pay Payroll
│   └── Export PDF
└── 📊 Reports/
    ├── Revenue Report
    ├── Expense Report
    ├── Profit Report
    └── Top Medicines
```

### Environment Variables

**Create Postman environment "Healthcare - Test":**

```json
{
  "name": "Healthcare - Test",
  "values": [
    { "key": "base_url", "value": "http://localhost:5001", "enabled": true },
    { "key": "admin_token", "value": "", "enabled": true },
    { "key": "doctor_token", "value": "", "enabled": true },
    { "key": "patient_token", "value": "", "enabled": true },
    { "key": "receptionist_token", "value": "", "enabled": true },
    { "key": "current_patient_id", "value": "1", "enabled": true },
    { "key": "current_doctor_id", "value": "1", "enabled": true },
    { "key": "current_appointment_id", "value": "", "enabled": true },
    { "key": "current_prescription_id", "value": "", "enabled": true },
    { "key": "current_invoice_id", "value": "", "enabled": true }
  ]
}
```

### Pre-request Scripts

**Global pre-request (Collection level):**

```javascript
// Auto-refresh token if expired
const token = pm.environment.get("admin_token");
if (token) {
  const payload = JSON.parse(atob(token.split(".")[1]));
  const exp = payload.exp * 1000; // Convert to ms
  const now = Date.now();

  if (exp < now) {
    console.log("Token expired, refreshing...");
    // Trigger refresh token request
  }
}
```

### Test Scripts

**Login request test script:**

```javascript
// Save token to environment
if (pm.response.code === 200) {
  const responseJson = pm.response.json();
  const token = responseJson.data.accessToken;
  const user = responseJson.data.user;

  // Save to appropriate variable based on role
  if (user.roleId === 1) {
    pm.environment.set("admin_token", token);
  } else if (user.roleId === 2) {
    pm.environment.set("doctor_token", token);
  } else if (user.roleId === 3) {
    pm.environment.set("receptionist_token", token);
  } else if (user.roleId === 4) {
    pm.environment.set("patient_token", token);
  }

  console.log(`Saved ${user.email} token for roleId ${user.roleId}`);
}

// Test assertions
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has accessToken", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData.data.accessToken).to.be.a("string");
});
```

**Create appointment test script:**

```javascript
// Save appointment ID for later use
if (pm.response.code === 201) {
  const responseJson = pm.response.json();
  pm.environment.set(
    "current_appointment_id",
    responseJson.data.appointment.id
  );
}

// Assertions
pm.test("Appointment created successfully", function () {
  pm.response.to.have.status(201);
  const jsonData = pm.response.json();
  pm.expect(jsonData.data.appointment.status).to.equal("WAITING");
  pm.expect(jsonData.data.appointment.slotNumber).to.be.a("number");
});
```

---

## 🚀 Newman CLI Testing

### Installation

```bash
npm install -g newman
npm install -g newman-reporter-htmlextra
```

### Export Collection & Environment

1. In Postman, click Collection → Export → Collection v2.1
2. Save as `healthcare-api.postman_collection.json`
3. Export Environment as `healthcare-test.postman_environment.json`

### Run Collection

```bash
# Basic run
newman run healthcare-api.postman_collection.json \
  -e healthcare-test.postman_environment.json

# With HTML report
newman run healthcare-api.postman_collection.json \
  -e healthcare-test.postman_environment.json \
  -r htmlextra \
  --reporter-htmlextra-export ./reports/test-report.html

# Run specific folder
newman run healthcare-api.postman_collection.json \
  -e healthcare-test.postman_environment.json \
  --folder "Auth"

# With delays (avoid rate limiting)
newman run healthcare-api.postman_collection.json \
  -e healthcare-test.postman_environment.json \
  --delay-request 100

# Iterations (stress test)
newman run healthcare-api.postman_collection.json \
  -e healthcare-test.postman_environment.json \
  -n 10
```

### CI/CD Integration

**GitHub Actions workflow: `.github/workflows/api-test.yml`**

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8
        env:
          MYSQL_ROOT_PASSWORD: test_password
          MYSQL_DATABASE: healthcare_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd "mysqladmin ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npx sequelize-cli db:migrate
        env:
          NODE_ENV: test
          DB_HOST: 127.0.0.1
          DB_NAME: healthcare_test
          DB_USER: root
          DB_PASSWORD: test_password

      - name: Start server
        run: npm run dev &
        env:
          NODE_ENV: test

      - name: Wait for server
        run: npx wait-on http://localhost:5001

      - name: Install Newman
        run: npm install -g newman newman-reporter-htmlextra

      - name: Run API tests
        run: |
          newman run tests/healthcare-api.postman_collection.json \
            -e tests/healthcare-test.postman_environment.json \
            -r cli,htmlextra \
            --reporter-htmlextra-export ./reports/test-report.html

      - name: Upload test report
        uses: actions/upload-artifact@v2
        if: always()
        with:
          name: newman-report
          path: ./reports/test-report.html
```

---

## 📊 Test Coverage Goals

| Test Type               | Target        | Current | Priority |
| ----------------------- | ------------- | ------- | -------- |
| Unit Tests (Services)   | 80%           | -       | High     |
| Integration Tests (API) | 100%          | -       | Critical |
| E2E Tests (Flows)       | 90%           | -       | High     |
| Security Tests          | 100%          | -       | Critical |
| Performance Tests       | Key endpoints | -       | Medium   |

---

## 🎯 Critical Test Scenarios (Must Pass)

### Priority 1: Critical Business Flows

1. **Complete Patient Journey**

   - Register → Setup profile → Book appointment → Check-in → Visit → Prescription → Invoice → Payment
   - All steps must succeed sequentially
   - Database consistency verified at each step

2. **Prescription & Inventory**

   - Create prescription → Stock deducted
   - Edit prescription → Old stock restored, new stock deducted
   - Cancel prescription → Stock fully restored
   - Concurrent prescriptions → No overselling (pessimistic locking)

3. **Doctor Shift Reschedule**

   - Doctor cancels → System finds replacement (same specialty)
   - All appointments automatically moved
   - All patients notified via email and in-app

4. **Invoice & Payment**

   - Visit complete → Invoice auto-created
   - Partial payments → Status transitions (UNPAID → PARTIALLY_PAID → PAID)
   - Payment total = invoice total

5. **Payroll Calculation**
   - Complex formula with all components (base, coefficient, experience, commission, penalty)
   - Workflow: DRAFT → APPROVED → PAID
   - Commission only for doctors with PAID invoices

### Priority 2: Security & Authorization

1. **Authentication**

   - Login → JWT token issued
   - Token verification → Access granted
   - Logout → Token blacklisted in Redis
   - Blacklisted token → Access denied

2. **Role-Based Access**

   - ADMIN access to admin endpoints ✅
   - DOCTOR access to doctor endpoints ✅
   - PATIENT access to patient endpoints ✅
   - Cross-role access denied ✅

3. **Permission-Based Access**
   - Granular permissions per module
   - Role-permission mapping in database
   - Permission checks in middleware

### Priority 3: Data Integrity

1. **Foreign Key Constraints**

   - Cannot delete user with active invoices
   - Cascading deletes (patient → profiles)
   - SET NULL on optional FKs

2. **Unique Constraints**

   - No duplicate emails, CCCD, appointment slots
   - Unique codes (patient, doctor, medicine, prescription, invoice, payroll)

3. **Transaction Rollback**
   - Failed prescription → No stock deduction
   - Failed invoice → No payment records
   - All-or-nothing consistency

---

## 📝 Test Execution Checklist

### Before Testing

- [ ] Test database created and migrated
- [ ] Test data seeded (users, doctors, patients, medicines)
- [ ] Test server running on port 5001
- [ ] Redis running (for token blacklist)
- [ ] Postman collection imported
- [ ] Environment variables configured

### During Testing

- [ ] Authentication tests passed (login, logout, token verification)
- [ ] Patient management tests passed (setup, update, CCCD validation)
- [ ] Appointment tests passed (booking, cancellation, concurrency)
- [ ] Doctor shift tests passed (reschedule, replacement logic)
- [ ] Prescription tests passed (create, update, cancel, stock management)
- [ ] Invoice tests passed (auto-generation, partial payment, status transitions)
- [ ] Payroll tests passed (calculation, approval, payment)
- [ ] Security tests passed (SQL injection, auth bypass, rate limiting)
- [ ] Database tests passed (FK constraints, unique constraints, transactions)
- [ ] Performance tests passed (concurrency, pagination)

### After Testing

- [ ] All test results documented
- [ ] Bugs logged in issue tracker
- [ ] Coverage report generated
- [ ] Database cleaned (or reset for next run)
- [ ] Test artifacts archived (logs, reports, screenshots)

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **Email Testing**

   - Requires SMTP configuration
   - Use Mailhog/Mailtrap for testing in development

2. **Redis Dependency**

   - Token blacklist requires Redis
   - System works without Redis (warning logged)

3. **Scheduled Jobs**

   - Medicine expiry check runs daily at 00:00
   - Cannot manually trigger (except via direct function call)

4. **File Upload**

   - Avatar upload only (no prescription/invoice file attachments)
   - Max size: 10MB (configurable)

5. **Pagination**
   - No cursor-based pagination (offset/limit only)
   - Large offsets may be slow

---

## 📞 Support & Resources

- **API Documentation:** See [README.md](./README.md)
- **Architecture Review:** See [CHECKLIST_REVIEW.md](./CHECKLIST_REVIEW.md)
- **Issue Tracker:** [GitHub Issues](https://github.com/your-org/healthcare-backend/issues)
- **Postman Collection:** Contact team for latest export

---

**Version:** 3.1.0 | **Last Updated:** 2025-12-29 | **Maintained By:** QA Team

---

## ✅ Verification Checklist: Ensure Test Data Accuracy

Before you start testing, verify seed data is loaded correctly:

```sql
-- 1. Check users seeded correctly
SELECT id, email, userCode, roleId FROM users ORDER BY id;
-- Expected: 12 users (1 admin, 4 doctors, 5 patients, 2 receptionists)

-- 2. Check medicine prices
SELECT id, medicineCode, name, salePrice FROM medicines WHERE id <= 6;
-- Expected: MED001=500, MED002=2000, MED003=800, MED004=3000, MED006=1000

-- 3. Check role coefficients (if stored in DB)
SELECT id, name FROM roles;
-- Expected: 1=ADMIN, 2=DOCTOR, 3=PATIENT, 4=RECEPTIONIST

-- 4. Check existing completed transactions
SELECT invoiceCode, totalAmount, paymentStatus FROM invoices;
-- Expected: HD001 (215000, PAID), HD002 (235400, PAID)

-- 5. Verify password hash (test login)
-- Try: admin@healthcare.com / 123456
-- Should succeed and return JWT token
```

**If any data is incorrect, re-run seeders:**

```bash
# Reset and re-seed
npx sequelize-cli db:seed:undo:all
npx sequelize-cli db:seed:all
```

---

**Happy Testing! 🧪✨**

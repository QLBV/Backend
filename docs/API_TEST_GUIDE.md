# 📋 HƯỚNG DẪN KIỂM THỬ API CHI TIẾT

> **Dự án**: Hệ thống Quản lý Phóng khám tư Healthcare (Healthcare Management System)

---

## 📑 MỤC LỤC

1. [Giới thiệu](#-giới-thiệu)
2. [Chuẩn bị môi trường test](#-chuẩn-bị-môi-trường-test)
3. [Công cụ kiểm thử](#️-công-cụ-kiểm-thử)
4. [Hướng dẫn sử dụng Postman](#-hướng-dẫn-sử-dụng-postman)
5. [Kiểm thử các API Module](#-kiểm-thử-các-api-module)
   - [Authentication](#1-authentication-xác-thực)
   - [User Management](#2-user-management-quản-lý-người-dùng)
   - [Patient Management](#3-patient-management-quản-lý-bệnh-nhân)
   - [Doctor Management](#4-doctor-management-quản-lý-bác-sĩ)
   - [Appointment Management](#5-appointment-management-quản-lý-lịch-hẹn)
   - [Visit Management](#6-visit-management-quản-lý-khám-bệnh)
   - [Prescription Management](#7-prescription-management-quản-lý-đơn-thuốc)
   - [Invoice Management](#8-invoice-management-quản-lý-hóa-đơn)
   - [Medicine Management](#9-medicine-management-quản-lý-thuốc)
   - [Dashboard](#10-dashboard-bảng-điều-khiển)
   - [Reports](#11-reports-báo-cáo)
6. [Test Cases chi tiết](#-test-cases-chi-tiết)
7. [Xử lý lỗi phổ biến](#-xử-lý-lỗi-phổ-biến)
8. [Checklist kiểm thử](#-checklist-kiểm-thử)

---

## 🎯 GIỚI THIỆU

### Mục đích

Tài liệu này hướng dẫn chi tiết cách kiểm thử tất cả các API endpoints của hệ thống quản lý bệnh viện, đảm bảo hệ thống hoạt động đúng và ổn định.

### Phạm vi kiểm thử

- ✅ Kiểm thử chức năng (Functional Testing)
- ✅ Kiểm thử xác thực (Authentication & Authorization)
- ✅ Kiểm thử validation dữ liệu
- ✅ Kiểm thử xử lý lỗi
- ✅ Kiểm thử phân quyền (Role-based Access Control)

---

## 🔧 CHUẨN BỊ MÔI TRƯỜNG TEST

### 1. Cài đặt và khởi động dự án

```bash
# Clone project (nếu chưa có)
git clone <repository-url>
cd Backend

# Cài đặt dependencies
npm install

# Cấu hình file .env
cp .env.example .env
# Chỉnh sửa các thông tin trong .env
```

### 2. Cấu hình Database

```bash
# Tạo database
mysql -u root -p
CREATE DATABASE healthcare_db;
USE healthcare_db;

# Chạy migrations
npx sequelize-cli db:migrate

# Seed dữ liệu mẫu (nếu có)
npx sequelize-cli db:seed:all
```

### 3. Khởi động server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### 4. Kiểm tra server đã chạy

```bash
# Server mặc định chạy tại: http://localhost:3000
curl http://localhost:3000
```

---

## 🛠️ CÔNG CỤ KIỂM THỬ

### Các công cụ khuyên dùng:

**Postman** ⭐ (Khuyên dùng)

- Download: https://www.postman.com/downloads/
- Hỗ trợ collection, environment variables
- Dễ sử dụng, giao diện trực quan

---

## 📮 HƯỚNG DẪN SỬ DỤNG POSTMAN

### 1. Tạo Collection mới

1. Mở Postman
2. Click **New** → **Collection**
3. Đặt tên: `Healthcare Management API`

### 2. Thiết lập Environment Variables

1. Click **Environments** → **New Environment**
2. Đặt tên: `Local Development`
3. Thêm các biến:

```
BASE_URL: http://localhost:3000/api
ACCESS_TOKEN: (sẽ được set sau khi login)
REFRESH_TOKEN: (sẽ được set sau khi login)
USER_ID: (sẽ được set sau khi login)
PATIENT_ID: (sẽ được set khi test)
DOCTOR_ID: (sẽ được set khi test)
APPOINTMENT_ID: (sẽ được set khi test)
```

### 3. Tạo Pre-request Script cho Authorization

Tại Collection Settings → Pre-request Scripts:

```javascript
if (pm.environment.get("ACCESS_TOKEN")) {
  pm.request.headers.add({
    key: "Authorization",
    value: "Bearer " + pm.environment.get("ACCESS_TOKEN"),
  });
}
```

### 4. Auto-save token sau khi login

Trong tab **Tests** của request Login:

```javascript
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("ACCESS_TOKEN", jsonData.data.accessToken);
  pm.environment.set("REFRESH_TOKEN", jsonData.data.refreshToken);
  pm.environment.set("USER_ID", jsonData.data.user.id);
}
```

---

## 🧪 KIỂM THỬ CÁC API MODULE

---

## 1️⃣ AUTHENTICATION (Xác thực)

**Base URL:** `{{BASE_URL}}/auth`

### 1.1. Đăng ký tài khoản (Register)

**Endpoint:** `POST /auth/register`

**Request Body:**

```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "fullName": "Nguyễn Văn Test",
  "phoneNumber": "0123456789",
  "roleCode": "PATIENT"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "testuser@example.com",
      "fullName": "Nguyễn Văn Test",
      "roleCode": "PATIENT",
      "isActive": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Test Cases:**

| Test Case                | Input                         | Expected Result                 |
| ------------------------ | ----------------------------- | ------------------------------- |
| ✅ Đăng ký hợp lệ        | Dữ liệu đầy đủ và đúng format | 200, trả về token               |
| ❌ Email đã tồn tại      | Email trùng trong DB          | 400, "Email đã được sử dụng"    |
| ❌ Username đã tồn tại   | Username trùng trong DB       | 400, "Username đã được sử dụng" |
| ❌ Password không khớp   | confirmPassword khác password | 400, "Mật khẩu không khớp"      |
| ❌ Email không hợp lệ    | Email sai format              | 400, "Email không hợp lệ"       |
| ❌ Password yếu          | Password < 8 ký tự            | 400, "Mật khẩu quá yếu"         |
| ❌ Thiếu trường bắt buộc | Bỏ qua username, email        | 400, "Thiếu thông tin bắt buộc" |

---

### 1.2. Đăng nhập (Login)

**Endpoint:** `POST /auth/login`

**Request Body:**

```json
{
  "username": "testuser",
  "password": "Password123!"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "testuser@example.com",
      "fullName": "Nguyễn Văn Test",
      "roleCode": "PATIENT"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Test Cases:**

| Test Case                 | Input                      | Expected Result                |
| ------------------------- | -------------------------- | ------------------------------ |
| ✅ Đăng nhập thành công   | Username và password đúng  | 200, trả về token              |
| ❌ Sai mật khẩu           | Password sai               | 401, "Mật khẩu không đúng"     |
| ❌ Username không tồn tại | Username không có trong DB | 404, "Tài khoản không tồn tại" |
| ❌ Tài khoản bị khóa      | isActive = false           | 403, "Tài khoản đã bị khóa"    |
| ❌ Thiếu thông tin        | Không gửi password         | 400, "Thiếu thông tin"         |

---

### 1.3. Làm mới token (Refresh Token)

**Endpoint:** `POST /auth/refresh-token`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Làm mới token thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Test Cases:**

| Test Case              | Input                 | Expected Result            |
| ---------------------- | --------------------- | -------------------------- |
| ✅ Refresh thành công  | Refresh token hợp lệ  | 200, trả về token mới      |
| ❌ Token không hợp lệ  | Token sai format      | 401, "Token không hợp lệ"  |
| ❌ Token đã hết hạn    | Token expired         | 401, "Token đã hết hạn"    |
| ❌ Token đã bị thu hồi | Token trong blacklist | 401, "Token đã bị thu hồi" |

---

### 1.4. Đăng xuất (Logout)

**Endpoint:** `POST /auth/logout`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

**Test Cases:**

| Test Case               | Input            | Expected Result           |
| ----------------------- | ---------------- | ------------------------- |
| ✅ Đăng xuất thành công | Token hợp lệ     | 200, token bị thu hồi     |
| ❌ Không có token       | Không gửi header | 401, "Unauthorized"       |
| ❌ Token không hợp lệ   | Token sai        | 401, "Token không hợp lệ" |

---

### 1.5. Quên mật khẩu (Forgot Password)

**Endpoint:** `POST /auth/forgot-password`

**Request Body:**

```json
{
  "email": "testuser@example.com"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Email khôi phục mật khẩu đã được gửi"
}
```

**Test Cases:**

| Test Case               | Input                | Expected Result            |
| ----------------------- | -------------------- | -------------------------- |
| ✅ Gửi email thành công | Email tồn tại        | 200, gửi email reset       |
| ❌ Email không tồn tại  | Email không trong DB | 404, "Email không tồn tại" |
| ❌ Email không hợp lệ   | Email sai format     | 400, "Email không hợp lệ"  |

---

### 1.6. Đặt lại mật khẩu (Reset Password)

**Endpoint:** `POST /auth/reset-password`

**Request Body:**

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Đặt lại mật khẩu thành công"
}
```

**Test Cases:**

| Test Case              | Input                       | Expected Result             |
| ---------------------- | --------------------------- | --------------------------- |
| ✅ Reset thành công    | Token hợp lệ, password khớp | 200, password được cập nhật |
| ❌ Token không hợp lệ  | Token sai                   | 400, "Token không hợp lệ"   |
| ❌ Token hết hạn       | Token quá 1 giờ             | 400, "Token đã hết hạn"     |
| ❌ Password không khớp | confirmPassword khác        | 400, "Mật khẩu không khớp"  |

---

## 2️⃣ USER MANAGEMENT (Quản lý người dùng)

**Base URL:** `{{BASE_URL}}/users`
**Required Role:** ADMIN (trừ /me endpoints)

### 2.1. Lấy danh sách người dùng

**Endpoint:** `GET /users?page=1&limit=10&search=&roleCode=`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Query Parameters:**

| Parameter | Type   | Required | Description                                         |
| --------- | ------ | -------- | --------------------------------------------------- |
| page      | number | No       | Trang hiện tại (default: 1)                         |
| limit     | number | No       | Số lượng/trang (default: 10)                        |
| search    | string | No       | Tìm kiếm theo tên, email, username                  |
| roleCode  | string | No       | Lọc theo role: ADMIN, DOCTOR, PATIENT, RECEPTIONIST |

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công",
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "fullName": "Quản trị viên",
        "phoneNumber": "0123456789",
        "roleCode": "ADMIN",
        "isActive": true,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

**Test Cases:**

| Test Case                           | Input           | Expected Result                |
| ----------------------------------- | --------------- | ------------------------------ |
| ✅ Lấy danh sách thành công (ADMIN) | Token ADMIN     | 200, trả về danh sách          |
| ❌ Không có quyền (PATIENT)         | Token PATIENT   | 403, "Không có quyền truy cập" |
| ✅ Tìm kiếm theo tên                | search="Nguyễn" | 200, trả về kết quả lọc        |
| ✅ Lọc theo role                    | roleCode=DOCTOR | 200, chỉ trả về DOCTOR         |
| ✅ Phân trang                       | page=2, limit=5 | 200, trả về đúng trang         |

---

### 2.2. Lấy thông tin người dùng theo ID

**Endpoint:** `GET /users/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Lấy thông tin người dùng thành công",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "fullName": "Quản trị viên",
    "phoneNumber": "0123456789",
    "roleCode": "ADMIN",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Test Cases:**

| Test Case                   | Input         | Expected Result                 |
| --------------------------- | ------------- | ------------------------------- |
| ✅ Lấy thông tin thành công | ID hợp lệ     | 200, trả về user                |
| ❌ ID không tồn tại         | ID = 999999   | 404, "Người dùng không tồn tại" |
| ❌ ID không hợp lệ          | ID = "abc"    | 400, "ID không hợp lệ"          |
| ❌ Không có quyền           | Token PATIENT | 403, "Không có quyền"           |

---

### 2.3. Tạo người dùng mới

**Endpoint:** `POST /users`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Request Body:**

```json
{
  "username": "newdoctor",
  "email": "doctor@example.com",
  "password": "Password123!",
  "fullName": "Bác sĩ Nguyễn Văn A",
  "phoneNumber": "0987654321",
  "roleCode": "DOCTOR"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Tạo người dùng thành công",
  "data": {
    "id": 10,
    "username": "newdoctor",
    "email": "doctor@example.com",
    "fullName": "Bác sĩ Nguyễn Văn A",
    "roleCode": "DOCTOR",
    "isActive": true
  }
}
```

**Test Cases:**

| Test Case              | Input              | Expected Result                 |
| ---------------------- | ------------------ | ------------------------------- |
| ✅ Tạo thành công      | Dữ liệu hợp lệ     | 201, user được tạo              |
| ❌ Email đã tồn tại    | Email trùng        | 400, "Email đã được sử dụng"    |
| ❌ Username đã tồn tại | Username trùng     | 400, "Username đã được sử dụng" |
| ❌ Role không hợp lệ   | roleCode="INVALID" | 400, "Role không hợp lệ"        |
| ❌ Không có quyền      | Token DOCTOR       | 403, "Không có quyền"           |

---

### 2.4. Cập nhật thông tin người dùng

**Endpoint:** `PUT /users/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Request Body:**

```json
{
  "fullName": "Bác sĩ Nguyễn Văn B",
  "phoneNumber": "0912345678",
  "email": "newdoctor@example.com"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Cập nhật người dùng thành công",
  "data": {
    "id": 10,
    "username": "newdoctor",
    "email": "newdoctor@example.com",
    "fullName": "Bác sĩ Nguyễn Văn B",
    "phoneNumber": "0912345678"
  }
}
```

---

### 2.5. Kích hoạt người dùng

**Endpoint:** `PUT /users/:id/activate`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Kích hoạt người dùng thành công"
}
```

---

### 2.6. Vô hiệu hóa người dùng

**Endpoint:** `PUT /users/:id/deactivate`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Vô hiệu hóa người dùng thành công"
}
```

---

### 2.7. Thay đổi role người dùng

**Endpoint:** `PUT /users/:id/role`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Request Body:**

```json
{
  "roleCode": "DOCTOR"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Thay đổi role thành công"
}
```

---

### 2.8. Xóa người dùng

**Endpoint:** `DELETE /users/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Xóa người dùng thành công"
}
```

---

### 2.9. Lấy cài đặt thông báo của tôi

**Endpoint:** `GET /users/me/notification-settings`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "emailNotifications": true,
    "smsNotifications": false,
    "pushNotifications": true
  }
}
```

---

### 2.10. Cập nhật cài đặt thông báo

**Endpoint:** `PUT /users/me/notification-settings`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Request Body:**

```json
{
  "emailNotifications": true,
  "smsNotifications": true,
  "pushNotifications": false
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Cập nhật cài đặt thành công"
}
```

---

## 3️⃣ PATIENT MANAGEMENT (Quản lý bệnh nhân)

**Base URL:** `{{BASE_URL}}/patients`

### 3.1. Thiết lập hồ sơ bệnh nhân (Dành cho user role PATIENT)

**Endpoint:** `POST /patients/setup`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Request Body:**

```json
{
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "emergencyContact": "0912345678",
  "bloodType": "O+",
  "allergies": "Penicillin",
  "medicalHistory": "Tiền sử cao huyết áp"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Thiết lập hồ sơ bệnh nhân thành công",
  "data": {
    "id": 1,
    "userId": 5,
    "dateOfBirth": "1990-05-15",
    "gender": "male",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "bloodType": "O+",
    "createdAt": "2025-01-03T00:00:00.000Z"
  }
}
```

**Test Cases:**

| Test Case                 | Input                       | Expected Result                   |
| ------------------------- | --------------------------- | --------------------------------- |
| ✅ Setup thành công       | Dữ liệu đầy đủ              | 201, hồ sơ được tạo               |
| ❌ Đã có hồ sơ            | User đã setup               | 400, "Hồ sơ đã tồn tại"           |
| ❌ Không phải PATIENT     | Token DOCTOR                | 403, "Chỉ PATIENT mới setup được" |
| ❌ Ngày sinh không hợp lệ | dateOfBirth trong tương lai | 400, "Ngày sinh không hợp lệ"     |
| ❌ Gender không hợp lệ    | gender="unknown"            | 400, "Giới tính không hợp lệ"     |

---

### 3.2. Lấy danh sách bệnh nhân

**Endpoint:** `GET /patients?page=1&limit=10&search=&gender=&bloodType=`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN, DOCTOR, RECEPTIONIST

**Query Parameters:**

| Parameter | Type   | Description                                         |
| --------- | ------ | --------------------------------------------------- |
| page      | number | Trang hiện tại                                      |
| limit     | number | Số lượng/trang                                      |
| search    | string | Tìm theo tên, SĐT                                   |
| gender    | string | Lọc theo giới tính: male, female, other             |
| bloodType | string | Lọc theo nhóm máu: A+, A-, B+, B-, O+, O-, AB+, AB- |

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "id": 1,
        "userId": 5,
        "user": {
          "fullName": "Nguyễn Văn A",
          "email": "patient@example.com",
          "phoneNumber": "0123456789"
        },
        "dateOfBirth": "1990-05-15",
        "gender": "male",
        "bloodType": "O+",
        "address": "123 Đường ABC",
        "avatarUrl": null
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

---

### 3.3. Lấy thông tin bệnh nhân theo ID

**Endpoint:** `GET /patients/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN, DOCTOR, RECEPTIONIST

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 5,
    "user": {
      "id": 5,
      "fullName": "Nguyễn Văn A",
      "email": "patient@example.com",
      "phoneNumber": "0123456789"
    },
    "dateOfBirth": "1990-05-15",
    "gender": "male",
    "bloodType": "O+",
    "address": "123 Đường ABC",
    "emergencyContact": "0912345678",
    "allergies": "Penicillin",
    "medicalHistory": "Tiền sử cao huyết áp"
  }
}
```

---

### 3.4. Cập nhật thông tin bệnh nhân

**Endpoint:** `PUT /patients/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Request Body:**

```json
{
  "address": "456 Đường XYZ, Quận 2",
  "emergencyContact": "0987654321",
  "allergies": "Penicillin, Sulfa",
  "medicalHistory": "Tiền sử cao huyết áp, tiểu đường"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Cập nhật thông tin bệnh nhân thành công"
}
```

---

### 3.5. Lấy lịch sử khám bệnh

**Endpoint:** `GET /patients/:id/medical-history`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN, DOCTOR, PATIENT (chỉ xem của mình)

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "visits": [
      {
        "id": 10,
        "appointmentId": 5,
        "doctorId": 2,
        "doctor": {
          "fullName": "BS. Trần Thị B"
        },
        "visitDate": "2025-01-02T09:00:00.000Z",
        "diagnosis": "Cảm cúm",
        "treatment": "Nghỉ ngơi, uống thuốc",
        "notes": "Tái khám sau 3 ngày",
        "status": "completed"
      }
    ]
  }
}
```

---

### 3.6. Lấy danh sách đơn thuốc

**Endpoint:** `GET /patients/:id/prescriptions`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN, DOCTOR, PATIENT (chỉ xem của mình)

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": 20,
        "visitId": 10,
        "doctorId": 2,
        "diagnosis": "Cảm cúm",
        "prescriptionDate": "2025-01-02",
        "status": "active",
        "medicines": [
          {
            "medicineId": 15,
            "medicineName": "Paracetamol 500mg",
            "dosage": "1 viên",
            "frequency": "3 lần/ngày",
            "duration": "5 ngày"
          }
        ]
      }
    ]
  }
}
```

---

### 3.7. Upload avatar bệnh nhân

**Endpoint:** `POST /patients/:id/avatar`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: multipart/form-data
```

**Form Data:**

- `avatar`: File (image/jpeg, image/png, max 5MB)

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Upload avatar thành công",
  "data": {
    "avatarUrl": "/uploads/patients/avatar-123456.jpg"
  }
}
```

**Test Cases:**

| Test Case                        | Input                         | Expected Result            |
| -------------------------------- | ----------------------------- | -------------------------- |
| ✅ Upload thành công             | File JPG < 5MB                | 200, trả về URL            |
| ❌ File quá lớn                  | File > 5MB                    | 400, "File quá lớn"        |
| ❌ Định dạng không hỗ trợ        | File PDF                      | 400, "Chỉ hỗ trợ JPG, PNG" |
| ❌ Không phải bệnh nhân của mình | PATIENT upload cho người khác | 403, "Không có quyền"      |

---

### 3.8. Xóa bệnh nhân

**Endpoint:** `DELETE /patients/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN, DOCTOR, RECEPTIONIST

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Xóa bệnh nhân thành công"
}
```

---

## 4️⃣ DOCTOR MANAGEMENT (Quản lý bác sĩ)

**Base URL:** `{{BASE_URL}}/doctors`
**Required Role:** ADMIN

### 4.1. Lấy danh sách bác sĩ

**Endpoint:** `GET /doctors`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "id": 1,
        "userId": 3,
        "user": {
          "fullName": "BS. Nguyễn Văn A",
          "email": "doctor@example.com",
          "phoneNumber": "0123456789"
        },
        "specialtyId": 1,
        "specialty": {
          "name": "Nội khoa",
          "description": "Chuyên khoa nội tổng quát"
        },
        "licenseNumber": "BS-12345",
        "experience": 10,
        "education": "Đại học Y Hà Nội",
        "isAvailable": true
      }
    ]
  }
}
```

---

### 4.2. Lấy thông tin bác sĩ theo ID

**Endpoint:** `GET /doctors/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 3,
    "user": {
      "fullName": "BS. Nguyễn Văn A",
      "email": "doctor@example.com",
      "phoneNumber": "0123456789"
    },
    "specialtyId": 1,
    "specialty": {
      "id": 1,
      "name": "Nội khoa",
      "description": "Chuyên khoa nội tổng quát"
    },
    "licenseNumber": "BS-12345",
    "experience": 10,
    "education": "Đại học Y Hà Nội",
    "bio": "Bác sĩ chuyên về nội khoa",
    "isAvailable": true
  }
}
```

---

### 4.3. Tạo bác sĩ mới

**Endpoint:** `POST /doctors`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Request Body:**

```json
{
  "userId": 10,
  "specialtyId": 1,
  "licenseNumber": "BS-67890",
  "experience": 5,
  "education": "Đại học Y Dược TP.HCM",
  "bio": "Chuyên điều trị các bệnh về tim mạch"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Tạo bác sĩ thành công",
  "data": {
    "id": 5,
    "userId": 10,
    "specialtyId": 1,
    "licenseNumber": "BS-67890"
  }
}
```

**Test Cases:**

| Test Case                  | Input                          | Expected Result                     |
| -------------------------- | ------------------------------ | ----------------------------------- |
| ✅ Tạo thành công          | Dữ liệu hợp lệ                 | 201, bác sĩ được tạo                |
| ❌ User không phải DOCTOR  | userId có roleCode khác DOCTOR | 400, "User phải có role DOCTOR"     |
| ❌ User đã là bác sĩ       | userId đã có trong doctors     | 400, "Bác sĩ đã tồn tại"            |
| ❌ Specialty không tồn tại | specialtyId không hợp lệ       | 404, "Chuyên khoa không tồn tại"    |
| ❌ License trùng           | licenseNumber đã tồn tại       | 400, "Số giấy phép đã được sử dụng" |

---

### 4.4. Cập nhật thông tin bác sĩ

**Endpoint:** `PUT /doctors/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Request Body:**

```json
{
  "specialtyId": 2,
  "experience": 6,
  "bio": "Chuyên điều trị các bệnh về tim mạch và hô hấp"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Cập nhật bác sĩ thành công"
}
```

---

### 4.5. Lấy lịch làm việc của bác sĩ

**Endpoint:** `GET /doctors/:doctorId/shifts`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "shifts": [
      {
        "id": 1,
        "doctorId": 1,
        "shiftId": 2,
        "shift": {
          "name": "Ca sáng",
          "startTime": "08:00:00",
          "endTime": "12:00:00"
        },
        "date": "2025-01-05",
        "isAvailable": true
      }
    ]
  }
}
```

---

### 4.6. Xóa bác sĩ

**Endpoint:** `DELETE /doctors/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Xóa bác sĩ thành công"
}
```

---

## 5️⃣ APPOINTMENT MANAGEMENT (Quản lý lịch hẹn)

**Base URL:** `{{BASE_URL}}/appointments`

### 5.1. Đặt lịch hẹn (Online - PATIENT)

**Endpoint:** `POST /appointments`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** PATIENT

**Request Body:**

```json
{
  "doctorId": 1,
  "appointmentDate": "2025-01-10",
  "shiftId": 1,
  "reason": "Khám tổng quát",
  "notes": "Đau đầu kéo dài 3 ngày"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Đặt lịch hẹn thành công",
  "data": {
    "id": 100,
    "patientId": 5,
    "doctorId": 1,
    "appointmentDate": "2025-01-10",
    "shiftId": 1,
    "status": "pending",
    "reason": "Khám tổng quát",
    "bookingType": "online"
  }
}
```

**Test Cases:**

| Test Case                     | Input                         | Expected Result                   |
| ----------------------------- | ----------------------------- | --------------------------------- |
| ✅ Đặt lịch thành công        | Dữ liệu hợp lệ                | 201, lịch được tạo                |
| ❌ Ngày đã qua                | appointmentDate trong quá khứ | 400, "Không thể đặt lịch quá khứ" |
| ❌ Bác sĩ không khả dụng      | doctorId không available      | 400, "Bác sĩ không làm việc"      |
| ❌ Trùng lịch                 | Đã có lịch cùng thời gian     | 400, "Bác sĩ đã có lịch"          |
| ❌ Quá nhiều lần đặt          | Rate limit 5 lần/15 phút      | 429, "Vượt quá giới hạn"          |
| ❌ PATIENT chưa setup profile | Chưa có patient record        | 400, "Vui lòng hoàn thiện hồ sơ"  |

---

### 5.2. Đặt lịch hẹn (Offline - RECEPTIONIST)

**Endpoint:** `POST /appointments/offline`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** RECEPTIONIST

**Request Body:**

```json
{
  "patientId": 5,
  "doctorId": 1,
  "appointmentDate": "2025-01-10",
  "shiftId": 1,
  "reason": "Khám tim mạch",
  "notes": "Bệnh nhân walk-in"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Đặt lịch hẹn thành công",
  "data": {
    "id": 101,
    "patientId": 5,
    "doctorId": 1,
    "appointmentDate": "2025-01-10",
    "bookingType": "offline",
    "status": "pending"
  }
}
```

---

### 5.3. Lấy danh sách lịch hẹn

**Endpoint:** `GET /appointments?page=1&limit=10&status=&doctorId=&patientId=&date=`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Query Parameters:**

| Parameter | Type   | Description                                                            |
| --------- | ------ | ---------------------------------------------------------------------- |
| page      | number | Trang hiện tại                                                         |
| limit     | number | Số lượng/trang                                                         |
| status    | string | Lọc theo trạng thái: pending, confirmed, cancelled, completed, no_show |
| doctorId  | number | Lọc theo bác sĩ                                                        |
| patientId | number | Lọc theo bệnh nhân                                                     |
| date      | string | Lọc theo ngày (YYYY-MM-DD)                                             |

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": 100,
        "patient": {
          "id": 5,
          "fullName": "Nguyễn Văn A"
        },
        "doctor": {
          "id": 1,
          "fullName": "BS. Trần Thị B"
        },
        "appointmentDate": "2025-01-10",
        "shift": {
          "name": "Ca sáng",
          "startTime": "08:00",
          "endTime": "12:00"
        },
        "status": "pending",
        "reason": "Khám tổng quát",
        "bookingType": "online"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

**Authorization Logic:**

- PATIENT: Chỉ xem lịch hẹn của mình
- DOCTOR: Xem lịch hẹn có doctorId = mình
- ADMIN, RECEPTIONIST: Xem tất cả

---

### 5.4. Lấy lịch hẹn của tôi

**Endpoint:** `GET /appointments/my`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** PATIENT, DOCTOR

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": 100,
        "appointmentDate": "2025-01-10",
        "status": "pending",
        "reason": "Khám tổng quát"
      }
    ]
  }
}
```

---

### 5.5. Lấy lịch hẹn sắp tới

**Endpoint:** `GET /appointments/upcoming`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": 102,
        "appointmentDate": "2025-01-05",
        "shift": {
          "name": "Ca chiều",
          "startTime": "13:00"
        },
        "patient": {
          "fullName": "Nguyễn Văn C"
        },
        "doctor": {
          "fullName": "BS. Trần Thị D"
        }
      }
    ]
  }
}
```

---

### 5.6. Lấy thông tin lịch hẹn theo ID

**Endpoint:** `GET /appointments/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 100,
    "patientId": 5,
    "patient": {
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0123456789",
      "dateOfBirth": "1990-05-15"
    },
    "doctorId": 1,
    "doctor": {
      "fullName": "BS. Trần Thị B",
      "specialty": {
        "name": "Nội khoa"
      }
    },
    "appointmentDate": "2025-01-10",
    "shift": {
      "name": "Ca sáng",
      "startTime": "08:00:00",
      "endTime": "12:00:00"
    },
    "status": "pending",
    "reason": "Khám tổng quát",
    "notes": "Đau đầu kéo dài 3 ngày",
    "bookingType": "online",
    "createdAt": "2025-01-03T10:00:00.000Z"
  }
}
```

---

### 5.7. Cập nhật lịch hẹn (Reschedule)

**Endpoint:** `PUT /appointments/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** PATIENT, RECEPTIONIST, ADMIN

**Request Body:**

```json
{
  "appointmentDate": "2025-01-12",
  "shiftId": 2,
  "reason": "Khám tổng quát và xét nghiệm"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Cập nhật lịch hẹn thành công"
}
```

**Test Cases:**

| Test Case                   | Input                       | Expected Result                         |
| --------------------------- | --------------------------- | --------------------------------------- |
| ✅ Reschedule thành công    | Ngày mới hợp lệ             | 200, lịch được cập nhật                 |
| ❌ Lịch đã completed        | status = completed          | 400, "Không thể sửa lịch đã hoàn thành" |
| ❌ Lịch đã cancelled        | status = cancelled          | 400, "Không thể sửa lịch đã hủy"        |
| ❌ Không phải lịch của mình | PATIENT sửa lịch người khác | 403, "Không có quyền"                   |

---

### 5.8. Hủy lịch hẹn

**Endpoint:** `PUT /appointments/:id/cancel`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** PATIENT, RECEPTIONIST

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Hủy lịch hẹn thành công"
}
```

**Business Rules:**

- Phải hủy trước ít nhất 2 giờ
- PATIENT chỉ hủy được lịch của mình
- RECEPTIONIST hủy được tất cả

**Test Cases:**

| Test Case                   | Input                       | Expected Result             |
| --------------------------- | --------------------------- | --------------------------- |
| ✅ Hủy thành công           | Hủy trước > 2h              | 200, status = cancelled     |
| ❌ Hủy muộn                 | Hủy trước < 2h              | 400, "Phải hủy trước 2 giờ" |
| ❌ Lịch đã hoàn thành       | status = completed          | 400, "Không thể hủy"        |
| ❌ Không phải lịch của mình | PATIENT hủy lịch người khác | 403, "Không có quyền"       |

---

### 5.9. Đánh dấu không đến (No-show)

**Endpoint:** `PUT /appointments/:id/no-show`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN, RECEPTIONIST

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Đánh dấu no-show thành công"
}
```

---

## 6️⃣ VISIT MANAGEMENT (Quản lý khám bệnh)

**Base URL:** `{{BASE_URL}}/visits`

### 6.1. Check-in lịch hẹn

**Endpoint:** `POST /visits/checkin/:appointmentId`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** RECEPTIONIST

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Check-in thành công",
  "data": {
    "id": 50,
    "appointmentId": 100,
    "patientId": 5,
    "doctorId": 1,
    "visitDate": "2025-01-10T08:30:00.000Z",
    "status": "in_progress"
  }
}
```

**Test Cases:**

| Test Case                    | Input                     | Expected Result               |
| ---------------------------- | ------------------------- | ----------------------------- |
| ✅ Check-in thành công       | Appointment hợp lệ        | 201, visit được tạo           |
| ❌ Appointment không tồn tại | ID không hợp lệ           | 404, "Lịch hẹn không tồn tại" |
| ❌ Đã check-in rồi           | Appointment đã có visit   | 400, "Đã check-in"            |
| ❌ Appointment đã hủy        | status = cancelled        | 400, "Lịch đã bị hủy"         |
| ❌ Chưa đến ngày             | appointmentDate > hôm nay | 400, "Chưa đến ngày khám"     |

---

### 6.2. Hoàn thành khám bệnh

**Endpoint:** `PUT /visits/:id/complete`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** DOCTOR

**Request Body:**

```json
{
  "diagnosis": "Viêm họng cấp",
  "treatment": "Uống thuốc kháng sinh, nghỉ ngơi",
  "notes": "Tái khám sau 5 ngày",
  "vitalSigns": {
    "temperature": 37.5,
    "bloodPressure": "120/80",
    "heartRate": 75,
    "weight": 65
  }
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Hoàn thành khám bệnh",
  "data": {
    "id": 50,
    "status": "completed",
    "diagnosis": "Viêm họng cấp",
    "completedAt": "2025-01-10T09:30:00.000Z"
  }
}
```

**Test Cases:**

| Test Case                      | Input              | Expected Result                |
| ------------------------------ | ------------------ | ------------------------------ |
| ✅ Hoàn thành thành công       | Dữ liệu đầy đủ     | 200, status = completed        |
| ❌ Visit không tồn tại         | ID không hợp lệ    | 404, "Lượt khám không tồn tại" |
| ❌ Không phải bác sĩ phụ trách | doctorId khác      | 403, "Không có quyền"          |
| ❌ Visit đã hoàn thành         | status = completed | 400, "Đã hoàn thành"           |
| ❌ Thiếu thông tin bắt buộc    | Không có diagnosis | 400, "Thiếu chẩn đoán"         |

---

### 6.3. Lấy danh sách lượt khám

**Endpoint:** `GET /visits?page=1&limit=10&status=&doctorId=&patientId=&startDate=&endDate=`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Query Parameters:**

| Parameter | Type   | Description                                            |
| --------- | ------ | ------------------------------------------------------ |
| status    | string | Lọc theo trạng thái: in_progress, completed, cancelled |
| doctorId  | number | Lọc theo bác sĩ                                        |
| patientId | number | Lọc theo bệnh nhân                                     |
| startDate | string | Từ ngày (YYYY-MM-DD)                                   |
| endDate   | string | Đến ngày (YYYY-MM-DD)                                  |

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "visits": [
      {
        "id": 50,
        "patient": {
          "fullName": "Nguyễn Văn A"
        },
        "doctor": {
          "fullName": "BS. Trần Thị B"
        },
        "visitDate": "2025-01-10T08:30:00.000Z",
        "diagnosis": "Viêm họng cấp",
        "status": "completed"
      }
    ],
    "pagination": {
      "total": 200,
      "page": 1,
      "limit": 10,
      "totalPages": 20
    }
  }
}
```

---

### 6.4. Lấy thông tin lượt khám theo ID

**Endpoint:** `GET /visits/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 50,
    "appointmentId": 100,
    "patient": {
      "id": 5,
      "fullName": "Nguyễn Văn A",
      "dateOfBirth": "1990-05-15",
      "gender": "male"
    },
    "doctor": {
      "id": 1,
      "fullName": "BS. Trần Thị B",
      "specialty": {
        "name": "Nội khoa"
      }
    },
    "visitDate": "2025-01-10T08:30:00.000Z",
    "diagnosis": "Viêm họng cấp",
    "treatment": "Uống thuốc kháng sinh",
    "notes": "Tái khám sau 5 ngày",
    "vitalSigns": {
      "temperature": 37.5,
      "bloodPressure": "120/80",
      "heartRate": 75
    },
    "status": "completed",
    "completedAt": "2025-01-10T09:30:00.000Z"
  }
}
```

---

### 6.5. Lấy lịch sử khám của bệnh nhân

**Endpoint:** `GET /visits/patient/:patientId`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "visits": [
      {
        "id": 50,
        "visitDate": "2025-01-10",
        "doctor": {
          "fullName": "BS. Trần Thị B"
        },
        "diagnosis": "Viêm họng cấp",
        "status": "completed"
      },
      {
        "id": 45,
        "visitDate": "2024-12-20",
        "doctor": {
          "fullName": "BS. Nguyễn Văn C"
        },
        "diagnosis": "Cảm cúm",
        "status": "completed"
      }
    ]
  }
}
```

---

## 7️⃣ PRESCRIPTION MANAGEMENT (Quản lý đơn thuốc)

**Base URL:** `{{BASE_URL}}/prescriptions`

### 7.1. Tạo đơn thuốc

**Endpoint:** `POST /prescriptions`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** DOCTOR

**Request Body:**

```json
{
  "visitId": 50,
  "patientId": 5,
  "diagnosis": "Viêm họng cấp",
  "notes": "Uống thuốc sau ăn",
  "medicines": [
    {
      "medicineId": 15,
      "dosage": "1 viên",
      "frequency": "3 lần/ngày",
      "duration": "5 ngày",
      "instructions": "Uống sau ăn",
      "quantity": 15
    },
    {
      "medicineId": 20,
      "dosage": "2 viên",
      "frequency": "2 lần/ngày",
      "duration": "7 ngày",
      "instructions": "Uống trước ăn 30 phút",
      "quantity": 28
    }
  ]
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Tạo đơn thuốc thành công",
  "data": {
    "id": 100,
    "visitId": 50,
    "patientId": 5,
    "doctorId": 1,
    "diagnosis": "Viêm họng cấp",
    "prescriptionDate": "2025-01-10",
    "status": "active",
    "medicines": [
      {
        "id": 1,
        "medicineId": 15,
        "medicineName": "Paracetamol 500mg",
        "dosage": "1 viên",
        "frequency": "3 lần/ngày",
        "duration": "5 ngày",
        "quantity": 15
      }
    ]
  }
}
```

**Test Cases:**

| Test Case                      | Input                    | Expected Result                |
| ------------------------------ | ------------------------ | ------------------------------ |
| ✅ Tạo thành công              | Dữ liệu hợp lệ           | 201, đơn thuốc được tạo        |
| ❌ Visit không tồn tại         | visitId không hợp lệ     | 404, "Lượt khám không tồn tại" |
| ❌ Thuốc không tồn tại         | medicineId không hợp lệ  | 404, "Thuốc không tồn tại"     |
| ❌ Thuốc hết hàng              | stock < quantity         | 400, "Thuốc không đủ"          |
| ❌ Không phải bác sĩ phụ trách | doctorId của visit khác  | 403, "Không có quyền"          |
| ❌ Đơn thuốc đã tồn tại        | Visit đã có prescription | 400, "Đã có đơn thuốc"         |

---

### 7.2. Lấy thông tin đơn thuốc theo ID

**Endpoint:** `GET /prescriptions/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 100,
    "patient": {
      "fullName": "Nguyễn Văn A",
      "dateOfBirth": "1990-05-15"
    },
    "doctor": {
      "fullName": "BS. Trần Thị B",
      "licenseNumber": "BS-12345"
    },
    "visit": {
      "visitDate": "2025-01-10"
    },
    "diagnosis": "Viêm họng cấp",
    "prescriptionDate": "2025-01-10",
    "status": "active",
    "notes": "Uống thuốc sau ăn",
    "medicines": [
      {
        "medicineId": 15,
        "medicineName": "Paracetamol 500mg",
        "dosage": "1 viên",
        "frequency": "3 lần/ngày",
        "duration": "5 ngày",
        "quantity": 15,
        "instructions": "Uống sau ăn"
      }
    ],
    "isDispensed": false,
    "dispensedAt": null
  }
}
```

---

### 7.3. Lấy đơn thuốc theo visitId

**Endpoint:** `GET /prescriptions/visit/:visitId`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** DOCTOR

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 100,
    "diagnosis": "Viêm họng cấp",
    "medicines": [...]
  }
}
```

---

### 7.4. Lấy đơn thuốc theo bệnh nhân

**Endpoint:** `GET /prescriptions/patient/:patientId`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": 100,
        "prescriptionDate": "2025-01-10",
        "doctor": {
          "fullName": "BS. Trần Thị B"
        },
        "diagnosis": "Viêm họng cấp",
        "status": "active",
        "isDispensed": false
      },
      {
        "id": 95,
        "prescriptionDate": "2024-12-20",
        "doctor": {
          "fullName": "BS. Nguyễn Văn C"
        },
        "diagnosis": "Cảm cúm",
        "status": "completed",
        "isDispensed": true
      }
    ]
  }
}
```

---

### 7.5. Cập nhật đơn thuốc

**Endpoint:** `PUT /prescriptions/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** DOCTOR

**Request Body:**

```json
{
  "diagnosis": "Viêm họng cấp có biến chứng",
  "notes": "Uống thuốc đúng giờ",
  "medicines": [
    {
      "medicineId": 15,
      "dosage": "2 viên",
      "frequency": "3 lần/ngày",
      "duration": "7 ngày",
      "quantity": 42
    }
  ]
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Cập nhật đơn thuốc thành công"
}
```

---

### 7.6. Hủy đơn thuốc

**Endpoint:** `POST /prescriptions/:id/cancel`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** DOCTOR

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Hủy đơn thuốc thành công"
}
```

**Test Cases:**

| Test Case                | Input              | Expected Result                      |
| ------------------------ | ------------------ | ------------------------------------ |
| ✅ Hủy thành công        | Đơn chưa cấp phát  | 200, status = cancelled              |
| ❌ Đã cấp phát           | isDispensed = true | 400, "Đơn đã cấp phát không thể hủy" |
| ❌ Không phải bác sĩ tạo | doctorId khác      | 403, "Không có quyền"                |

---

### 7.7. Cấp phát đơn thuốc

**Endpoint:** `PUT /prescriptions/:id/dispense`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN, RECEPTIONIST

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Cấp phát đơn thuốc thành công",
  "data": {
    "isDispensed": true,
    "dispensedAt": "2025-01-10T10:00:00.000Z"
  }
}
```

**Test Cases:**

| Test Case              | Input              | Expected Result         |
| ---------------------- | ------------------ | ----------------------- |
| ✅ Cấp phát thành công | Đơn chưa cấp phát  | 200, isDispensed = true |
| ❌ Đã cấp phát rồi     | isDispensed = true | 400, "Đã cấp phát"      |
| ❌ Đơn đã hủy          | status = cancelled | 400, "Đơn đã hủy"       |
| ❌ Thuốc không đủ      | stock < quantity   | 400, "Không đủ thuốc"   |

---

### 7.8. Xuất PDF đơn thuốc

**Endpoint:** `GET /prescriptions/:id/pdf`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

- Content-Type: `application/pdf`
- File PDF được download

**Test Cases:**

| Test Case              | Input                      | Expected Result                |
| ---------------------- | -------------------------- | ------------------------------ |
| ✅ Xuất PDF thành công | ID hợp lệ                  | 200, file PDF                  |
| ❌ Đơn không tồn tại   | ID không hợp lệ            | 404, "Đơn thuốc không tồn tại" |
| ❌ Không có quyền      | PATIENT xem đơn người khác | 403, "Không có quyền"          |

---

## 8️⃣ INVOICE MANAGEMENT (Quản lý hóa đơn)

**Base URL:** `{{BASE_URL}}/invoices`

### 8.1. Tạo hóa đơn

**Endpoint:** `POST /invoices`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN, RECEPTIONIST

**Request Body:**

```json
{
  "visitId": 50,
  "patientId": 5,
  "items": [
    {
      "description": "Phí khám bệnh",
      "quantity": 1,
      "unitPrice": 200000,
      "amount": 200000
    },
    {
      "description": "Thuốc Paracetamol 500mg",
      "quantity": 15,
      "unitPrice": 1000,
      "amount": 15000
    }
  ],
  "subtotal": 215000,
  "discount": 15000,
  "tax": 0,
  "totalAmount": 200000,
  "notes": "Giảm giá 15.000đ cho bệnh nhân thân thiết"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Tạo hóa đơn thành công",
  "data": {
    "id": 500,
    "invoiceNumber": "INV-2025-0500",
    "visitId": 50,
    "patientId": 5,
    "invoiceDate": "2025-01-10",
    "subtotal": 215000,
    "discount": 15000,
    "tax": 0,
    "totalAmount": 200000,
    "paidAmount": 0,
    "status": "unpaid",
    "items": [...]
  }
}
```

**Test Cases:**

| Test Case              | Input                              | Expected Result                |
| ---------------------- | ---------------------------------- | ------------------------------ |
| ✅ Tạo thành công      | Dữ liệu hợp lệ                     | 201, hóa đơn được tạo          |
| ❌ Visit không tồn tại | visitId không hợp lệ               | 404, "Lượt khám không tồn tại" |
| ❌ Đã có hóa đơn       | Visit đã có invoice                | 400, "Hóa đơn đã tồn tại"      |
| ❌ Số tiền không khớp  | subtotal - discount != totalAmount | 400, "Số tiền không khớp"      |
| ❌ Items rỗng          | items = []                         | 400, "Phải có ít nhất 1 item"  |

---

### 8.2. Lấy danh sách hóa đơn

**Endpoint:** `GET /invoices?page=1&limit=10&status=&patientId=&startDate=&endDate=`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN, RECEPTIONIST

**Query Parameters:**

| Parameter | Type   | Description                                           |
| --------- | ------ | ----------------------------------------------------- |
| status    | string | Lọc theo trạng thái: unpaid, partial, paid, cancelled |
| patientId | number | Lọc theo bệnh nhân                                    |
| startDate | string | Từ ngày (YYYY-MM-DD)                                  |
| endDate   | string | Đến ngày (YYYY-MM-DD)                                 |

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": 500,
        "invoiceNumber": "INV-2025-0500",
        "patient": {
          "fullName": "Nguyễn Văn A"
        },
        "invoiceDate": "2025-01-10",
        "totalAmount": 200000,
        "paidAmount": 200000,
        "status": "paid"
      }
    ],
    "pagination": {
      "total": 300,
      "page": 1,
      "limit": 10,
      "totalPages": 30
    }
  }
}
```

---

### 8.3. Lấy hóa đơn chưa thanh toán

**Endpoint:** `GET /invoices/unpaid`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN, RECEPTIONIST

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": 505,
        "invoiceNumber": "INV-2025-0505",
        "patient": {
          "fullName": "Trần Thị B"
        },
        "invoiceDate": "2025-01-10",
        "totalAmount": 500000,
        "paidAmount": 0,
        "status": "unpaid",
        "daysOverdue": 0
      }
    ]
  }
}
```

---

### 8.4. Lấy hóa đơn theo bệnh nhân

**Endpoint:** `GET /invoices/patient/:patientId`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": 500,
        "invoiceNumber": "INV-2025-0500",
        "invoiceDate": "2025-01-10",
        "totalAmount": 200000,
        "paidAmount": 200000,
        "status": "paid"
      }
    ]
  }
}
```

**Authorization:**

- PATIENT: Chỉ xem hóa đơn của mình
- ADMIN, RECEPTIONIST: Xem tất cả

---

### 8.5. Lấy thông tin hóa đơn theo ID

**Endpoint:** `GET /invoices/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 500,
    "invoiceNumber": "INV-2025-0500",
    "patient": {
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0123456789"
    },
    "visit": {
      "visitDate": "2025-01-10",
      "doctor": {
        "fullName": "BS. Trần Thị B"
      }
    },
    "invoiceDate": "2025-01-10",
    "items": [
      {
        "description": "Phí khám bệnh",
        "quantity": 1,
        "unitPrice": 200000,
        "amount": 200000
      }
    ],
    "subtotal": 215000,
    "discount": 15000,
    "tax": 0,
    "totalAmount": 200000,
    "paidAmount": 200000,
    "status": "paid",
    "notes": "Giảm giá cho bệnh nhân thân thiết"
  }
}
```

---

### 8.6. Cập nhật hóa đơn

**Endpoint:** `PUT /invoices/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN, RECEPTIONIST

**Request Body:**

```json
{
  "discount": 20000,
  "notes": "Giảm thêm 5.000đ"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Cập nhật hóa đơn thành công"
}
```

**Test Cases:**

| Test Case                | Input              | Expected Result                            |
| ------------------------ | ------------------ | ------------------------------------------ |
| ✅ Cập nhật thành công   | Dữ liệu hợp lệ     | 200, hóa đơn được cập nhật                 |
| ❌ Hóa đơn đã thanh toán | status = paid      | 400, "Không thể sửa hóa đơn đã thanh toán" |
| ❌ Hóa đơn đã hủy        | status = cancelled | 400, "Không thể sửa hóa đơn đã hủy"        |

---

### 8.7. Thêm thanh toán

**Endpoint:** `POST /invoices/:id/payments`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN, RECEPTIONIST

**Request Body:**

```json
{
  "amount": 200000,
  "paymentMethod": "cash",
  "notes": "Thanh toán đầy đủ"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Thêm thanh toán thành công",
  "data": {
    "id": 100,
    "invoiceId": 500,
    "amount": 200000,
    "paymentMethod": "cash",
    "paymentDate": "2025-01-10T11:00:00.000Z",
    "notes": "Thanh toán đầy đủ"
  }
}
```

**Payment Methods:** cash, card, transfer, insurance

**Test Cases:**

| Test Case                      | Input                             | Expected Result                 |
| ------------------------------ | --------------------------------- | ------------------------------- |
| ✅ Thanh toán đủ               | amount = totalAmount - paidAmount | 201, status = paid              |
| ✅ Thanh toán một phần         | amount < còn lại                  | 201, status = partial           |
| ❌ Thanh toán vượt             | amount > còn lại                  | 400, "Số tiền vượt quá"         |
| ❌ Hóa đơn đã thanh toán đủ    | status = paid                     | 400, "Đã thanh toán đủ"         |
| ❌ Payment method không hợp lệ | method = "invalid"                | 400, "Phương thức không hợp lệ" |

---

### 8.8. Lấy lịch sử thanh toán

**Endpoint:** `GET /invoices/:id/payments`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN, RECEPTIONIST

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": 100,
        "amount": 100000,
        "paymentMethod": "cash",
        "paymentDate": "2025-01-10T10:00:00.000Z",
        "notes": "Thanh toán lần 1"
      },
      {
        "id": 101,
        "amount": 100000,
        "paymentMethod": "card",
        "paymentDate": "2025-01-10T11:00:00.000Z",
        "notes": "Thanh toán lần 2"
      }
    ],
    "summary": {
      "totalPaid": 200000,
      "totalInvoice": 200000,
      "remaining": 0
    }
  }
}
```

---

### 8.9. Xuất PDF hóa đơn

**Endpoint:** `GET /invoices/:id/pdf`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

- Content-Type: `application/pdf`
- File PDF được download

---

### 8.10. Thống kê hóa đơn

**Endpoint:** `GET /invoices/statistics?year=2025&month=1`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "totalInvoices": 150,
    "totalRevenue": 50000000,
    "totalPaid": 45000000,
    "totalUnpaid": 5000000,
    "byStatus": {
      "paid": 120,
      "partial": 20,
      "unpaid": 10
    },
    "byPaymentMethod": {
      "cash": 30000000,
      "card": 10000000,
      "transfer": 5000000
    }
  }
}
```

---

## 9️⃣ MEDICINE MANAGEMENT (Quản lý thuốc)

**Base URL:** `{{BASE_URL}}/medicines`

### 9.1. Tạo thuốc mới

**Endpoint:** `POST /medicines`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN

**Request Body:**

```json
{
  "name": "Paracetamol 500mg",
  "description": "Thuốc giảm đau, hạ sốt",
  "activeIngredient": "Paracetamol",
  "dosageForm": "Viên nén",
  "strength": "500mg",
  "manufacturer": "Công ty Dược ABC",
  "unitPrice": 1000,
  "stock": 500,
  "minStockLevel": 50,
  "expiryDate": "2026-12-31",
  "prescriptionRequired": false
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Tạo thuốc thành công",
  "data": {
    "id": 15,
    "name": "Paracetamol 500mg",
    "activeIngredient": "Paracetamol",
    "unitPrice": 1000,
    "stock": 500,
    "status": "available"
  }
}
```

**Test Cases:**

| Test Case                     | Input                | Expected Result                  |
| ----------------------------- | -------------------- | -------------------------------- |
| ✅ Tạo thành công             | Dữ liệu hợp lệ       | 201, thuốc được tạo              |
| ❌ Tên đã tồn tại             | name trùng           | 400, "Thuốc đã tồn tại"          |
| ❌ Giá không hợp lệ           | unitPrice < 0        | 400, "Giá không hợp lệ"          |
| ❌ Ngày hết hạn trong quá khứ | expiryDate < hôm nay | 400, "Ngày hết hạn không hợp lệ" |
| ❌ Stock âm                   | stock < 0            | 400, "Số lượng không hợp lệ"     |

---

### 9.2. Lấy danh sách thuốc

**Endpoint:** `GET /medicines?page=1&limit=10&search=&status=&prescriptionRequired=`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Query Parameters:**

| Parameter            | Type    | Description                                           |
| -------------------- | ------- | ----------------------------------------------------- |
| search               | string  | Tìm theo tên, hoạt chất                               |
| status               | string  | Lọc theo: available, low_stock, out_of_stock, expired |
| prescriptionRequired | boolean | Lọc thuốc kê đơn                                      |

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "medicines": [
      {
        "id": 15,
        "name": "Paracetamol 500mg",
        "activeIngredient": "Paracetamol",
        "dosageForm": "Viên nén",
        "strength": "500mg",
        "unitPrice": 1000,
        "stock": 500,
        "minStockLevel": 50,
        "status": "available",
        "expiryDate": "2026-12-31"
      }
    ],
    "pagination": {
      "total": 200,
      "page": 1,
      "limit": 10,
      "totalPages": 20
    }
  }
}
```

---

### 9.3. Lấy thuốc sắp hết

**Endpoint:** `GET /medicines/low-stock?page=1&limit=10`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "medicines": [
      {
        "id": 20,
        "name": "Amoxicillin 500mg",
        "stock": 30,
        "minStockLevel": 50,
        "deficit": 20,
        "status": "low_stock"
      }
    ]
  }
}
```

---

### 9.4. Lấy thuốc sắp hết hạn

**Endpoint:** `GET /medicines/expiring?days=30&page=1&limit=10`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN

**Query Parameters:**

- `days`: Số ngày cảnh báo trước (default: 30)

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "medicines": [
      {
        "id": 25,
        "name": "Vitamin C 1000mg",
        "expiryDate": "2025-02-15",
        "daysUntilExpiry": 42,
        "stock": 100
      }
    ]
  }
}
```

---

### 9.5. Lấy thông tin thuốc theo ID

**Endpoint:** `GET /medicines/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 15,
    "name": "Paracetamol 500mg",
    "description": "Thuốc giảm đau, hạ sốt",
    "activeIngredient": "Paracetamol",
    "dosageForm": "Viên nén",
    "strength": "500mg",
    "manufacturer": "Công ty Dược ABC",
    "unitPrice": 1000,
    "stock": 500,
    "minStockLevel": 50,
    "expiryDate": "2026-12-31",
    "prescriptionRequired": false,
    "status": "available",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### 9.6. Cập nhật thông tin thuốc

**Endpoint:** `PUT /medicines/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN

**Request Body:**

```json
{
  "unitPrice": 1200,
  "minStockLevel": 60,
  "description": "Thuốc giảm đau, hạ sốt (cập nhật)"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Cập nhật thuốc thành công"
}
```

---

### 9.7. Nhập thuốc

**Endpoint:** `POST /medicines/:id/import`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN

**Request Body:**

```json
{
  "quantity": 100,
  "lotNumber": "LOT-2025-001",
  "expiryDate": "2027-12-31",
  "importPrice": 800,
  "supplier": "Nhà cung cấp XYZ",
  "notes": "Lô hàng tháng 1/2025"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Nhập thuốc thành công",
  "data": {
    "medicineId": 15,
    "quantity": 100,
    "newStock": 600,
    "importDate": "2025-01-10T10:00:00.000Z"
  }
}
```

**Test Cases:**

| Test Case               | Input                | Expected Result                  |
| ----------------------- | -------------------- | -------------------------------- |
| ✅ Nhập thành công      | Dữ liệu hợp lệ       | 200, stock tăng                  |
| ❌ Số lượng <= 0        | quantity = 0         | 400, "Số lượng không hợp lệ"     |
| ❌ Ngày hết hạn quá khứ | expiryDate < hôm nay | 400, "Ngày hết hạn không hợp lệ" |

---

### 9.8. Lịch sử nhập thuốc

**Endpoint:** `GET /medicines/:id/imports`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "imports": [
      {
        "id": 50,
        "quantity": 100,
        "lotNumber": "LOT-2025-001",
        "expiryDate": "2027-12-31",
        "importPrice": 800,
        "supplier": "Nhà cung cấp XYZ",
        "importDate": "2025-01-10T10:00:00.000Z",
        "importedBy": {
          "fullName": "Admin User"
        }
      }
    ]
  }
}
```

---

### 9.9. Lịch sử xuất thuốc

**Endpoint:** `GET /medicines/:id/exports`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "exports": [
      {
        "id": 100,
        "quantity": 15,
        "prescriptionId": 100,
        "exportDate": "2025-01-10T11:00:00.000Z",
        "patient": {
          "fullName": "Nguyễn Văn A"
        }
      }
    ]
  }
}
```

---

### 9.10. Đánh dấu thuốc hết hạn

**Endpoint:** `POST /medicines/:id/mark-expired`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Đánh dấu thuốc hết hạn thành công"
}
```

---

### 9.11. Tự động đánh dấu thuốc hết hạn

**Endpoint:** `POST /medicines/auto-mark-expired`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Tự động đánh dấu thuốc hết hạn thành công",
  "data": {
    "markedCount": 5
  }
}
```

---

### 9.12. Xóa thuốc

**Endpoint:** `DELETE /medicines/:id`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Required Role:** ADMIN

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Xóa thuốc thành công"
}
```

**Test Cases:**

| Test Case                  | Input                        | Expected Result                      |
| -------------------------- | ---------------------------- | ------------------------------------ |
| ✅ Xóa thành công          | Thuốc không có trong đơn     | 200, thuốc bị xóa                    |
| ❌ Thuốc đang được sử dụng | Có trong prescription active | 400, "Không thể xóa thuốc đang dùng" |

---

## 🔟 DASHBOARD (Bảng điều khiển)

**Base URL:** `{{BASE_URL}}/dashboard`
**Required Role:** ADMIN

### 10.1. Lấy dữ liệu tổng quan dashboard

**Endpoint:** `GET /dashboard`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalPatients": 1500,
      "totalDoctors": 25,
      "todayAppointments": 30,
      "pendingAppointments": 15
    },
    "revenue": {
      "today": 5000000,
      "thisMonth": 150000000,
      "thisYear": 1800000000
    },
    "recentActivities": [...],
    "upcomingAppointments": [...]
  }
}
```

---

### 10.2. Lấy thống kê chi tiết

**Endpoint:** `GET /dashboard/stats`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "patients": {
      "total": 1500,
      "newThisMonth": 50,
      "byGender": {
        "male": 700,
        "female": 800
      }
    },
    "appointments": {
      "total": 3000,
      "thisMonth": 250,
      "byStatus": {
        "pending": 15,
        "confirmed": 100,
        "completed": 2800,
        "cancelled": 85
      }
    },
    "revenue": {
      "thisMonth": 150000000,
      "lastMonth": 140000000,
      "growth": 7.14
    }
  }
}
```

---

### 10.3. Lấy lịch hẹn theo ngày

**Endpoint:** `GET /dashboard/appointments/:date`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Example:** `GET /dashboard/appointments/2025-01-10`

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "date": "2025-01-10",
    "appointments": [
      {
        "id": 100,
        "time": "08:00",
        "patient": {
          "fullName": "Nguyễn Văn A"
        },
        "doctor": {
          "fullName": "BS. Trần Thị B"
        },
        "status": "confirmed"
      }
    ],
    "summary": {
      "total": 25,
      "pending": 5,
      "confirmed": 15,
      "completed": 5
    }
  }
}
```

---

### 10.4. Lấy tổng quan

**Endpoint:** `GET /dashboard/overview`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "totalPatients": 1500,
    "totalDoctors": 25,
    "totalAppointmentsToday": 30,
    "pendingAppointments": 15,
    "revenueToday": 5000000,
    "lowStockMedicines": 3,
    "expiringMedicines": 2
  }
}
```

---

### 10.5. Lấy hoạt động gần đây

**Endpoint:** `GET /dashboard/recent-activities`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": 1,
        "type": "appointment_created",
        "description": "Nguyễn Văn A đặt lịch khám",
        "timestamp": "2025-01-10T10:00:00.000Z"
      },
      {
        "id": 2,
        "type": "payment_received",
        "description": "Nhận thanh toán 200.000đ từ Trần Thị B",
        "timestamp": "2025-01-10T09:30:00.000Z"
      }
    ]
  }
}
```

---

### 10.6. Lấy thống kê nhanh

**Endpoint:** `GET /dashboard/quick-stats`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "todayStats": {
      "appointments": 30,
      "completedVisits": 20,
      "revenue": 5000000,
      "newPatients": 3
    },
    "thisWeekStats": {
      "appointments": 150,
      "revenue": 25000000
    }
  }
}
```

---

### 10.7. Lấy cảnh báo hệ thống

**Endpoint:** `GET /dashboard/alerts`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "type": "low_stock",
        "severity": "warning",
        "message": "3 loại thuốc sắp hết",
        "actionUrl": "/medicines/low-stock"
      },
      {
        "type": "expiring_medicines",
        "severity": "info",
        "message": "2 loại thuốc sắp hết hạn trong 30 ngày",
        "actionUrl": "/medicines/expiring"
      },
      {
        "type": "unpaid_invoices",
        "severity": "warning",
        "message": "15 hóa đơn chưa thanh toán",
        "actionUrl": "/invoices/unpaid"
      }
    ]
  }
}
```

---

## 1️⃣1️⃣ REPORTS (Báo cáo)

**Base URL:** `{{BASE_URL}}/reports`
**Required Role:** ADMIN

### 11.1. Báo cáo doanh thu

**Endpoint:** `GET /reports/revenue?year=2025&month=1`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "period": {
      "year": 2025,
      "month": 1
    },
    "totalRevenue": 150000000,
    "totalInvoices": 500,
    "averageInvoiceValue": 300000,
    "byDay": [
      {
        "date": "2025-01-01",
        "revenue": 5000000,
        "invoices": 15
      }
    ],
    "byPaymentMethod": {
      "cash": 80000000,
      "card": 50000000,
      "transfer": 20000000
    }
  }
}
```

---

### 11.2. Báo cáo chi phí

**Endpoint:** `GET /reports/expense?year=2025&month=1`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "period": {
      "year": 2025,
      "month": 1
    },
    "totalExpense": 50000000,
    "byCategory": {
      "medicines": 30000000,
      "salaries": 15000000,
      "equipment": 3000000,
      "utilities": 2000000
    }
  }
}
```

---

### 11.3. Báo cáo lợi nhuận

**Endpoint:** `GET /reports/profit?year=2025&month=1`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "period": {
      "year": 2025,
      "month": 1
    },
    "totalRevenue": 150000000,
    "totalExpense": 50000000,
    "profit": 100000000,
    "profitMargin": 66.67
  }
}
```

---

### 11.4. Báo cáo thuốc bán chạy

**Endpoint:** `GET /reports/top-medicines?year=2025&month=1&limit=10`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "period": {
      "year": 2025,
      "month": 1
    },
    "medicines": [
      {
        "rank": 1,
        "medicineId": 15,
        "medicineName": "Paracetamol 500mg",
        "quantitySold": 500,
        "revenue": 500000
      },
      {
        "rank": 2,
        "medicineId": 20,
        "medicineName": "Amoxicillin 500mg",
        "quantitySold": 300,
        "revenue": 900000
      }
    ]
  }
}
```

---

### 11.5. Báo cáo cảnh báo thuốc

**Endpoint:** `GET /reports/medicine-alerts?daysUntilExpiry=30&minStock=10`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "lowStock": [
      {
        "id": 20,
        "name": "Amoxicillin 500mg",
        "stock": 8,
        "minStockLevel": 50
      }
    ],
    "expiring": [
      {
        "id": 25,
        "name": "Vitamin C 1000mg",
        "expiryDate": "2025-02-15",
        "daysUntilExpiry": 42
      }
    ],
    "expired": []
  }
}
```

---

### 11.6. Báo cáo bệnh nhân theo giới tính

**Endpoint:** `GET /reports/patients-by-gender`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "total": 1500,
    "byGender": {
      "male": 700,
      "female": 800,
      "other": 0
    },
    "percentages": {
      "male": 46.67,
      "female": 53.33,
      "other": 0
    }
  }
}
```

---

### 11.7. Báo cáo lịch hẹn

**Endpoint:** `GET /reports/appointments?year=2025&month=1`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "period": {
      "year": 2025,
      "month": 1
    },
    "totalAppointments": 250,
    "byStatus": {
      "pending": 15,
      "confirmed": 100,
      "completed": 120,
      "cancelled": 10,
      "no_show": 5
    },
    "byDoctor": [
      {
        "doctorId": 1,
        "doctorName": "BS. Trần Thị B",
        "appointments": 50
      }
    ],
    "cancelRate": 4.0,
    "noShowRate": 2.0
  }
}
```

---

### 11.8. Thống kê bệnh nhân

**Endpoint:** `GET /reports/patient-statistics`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "total": 1500,
    "newThisMonth": 50,
    "newThisYear": 300,
    "byAgeGroup": {
      "0-18": 200,
      "19-35": 500,
      "36-50": 400,
      "51-65": 300,
      "65+": 100
    },
    "byBloodType": {
      "A+": 300,
      "A-": 50,
      "B+": 250,
      "B-": 40,
      "O+": 400,
      "O-": 60,
      "AB+": 200,
      "AB-": 30
    }
  }
}
```

---

### 11.9. Xuất PDF báo cáo doanh thu

**Endpoint:** `GET /reports/revenue/pdf?year=2025&month=1`

**Headers:**

```
Authorization: Bearer {ACCESS_TOKEN}
```

**Expected Response (200):**

- Content-Type: `application/pdf`
- File PDF được download

---

### 11.10. Xuất PDF các báo cáo khác

Tương tự, các endpoint sau cũng xuất PDF:

- `GET /reports/expense/pdf?year=2025&month=1`
- `GET /reports/profit/pdf?year=2025&month=1`
- `GET /reports/top-medicines/pdf?year=2025&month=1&limit=10`
- `GET /reports/patients-by-gender/pdf`

---

## 📊 TEST CASES CHI TIẾT

### Test Case Template

```
ID: TC-XXX
Module: [Tên module]
Feature: [Tính năng]
Test Case: [Mô tả test case]

Pre-conditions:
- Điều kiện 1
- Điều kiện 2

Test Steps:
1. Bước 1
2. Bước 2

Test Data:
- Data 1
- Data 2

Expected Result:
- Kết quả mong đợi

Actual Result:
- [Ghi kết quả thực tế]

Status: [PASS/FAIL]
```

### Ví dụ Test Cases chi tiết

#### TC-001: Đăng ký tài khoản thành công

**Pre-conditions:**

- Server đang chạy
- Database đã được setup
- Email chưa tồn tại trong hệ thống

**Test Steps:**

1. Gửi POST request đến `/api/auth/register`
2. Với body chứa thông tin hợp lệ
3. Kiểm tra response status code
4. Kiểm tra response body

**Test Data:**

```json
{
  "username": "testuser001",
  "email": "testuser001@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "fullName": "Test User 001",
  "phoneNumber": "0123456789",
  "roleCode": "PATIENT"
}
```

**Expected Result:**

- Status code: 200
- Response chứa: user object, accessToken, refreshToken
- User được tạo trong database
- Token hợp lệ và có thể sử dụng

**Status:** [PASS/FAIL]

---

#### TC-002: Đăng nhập với sai mật khẩu

**Pre-conditions:**

- User đã tồn tại: username="testuser001"
- Mật khẩu đúng: "Password123!"

**Test Steps:**

1. Gửi POST request đến `/api/auth/login`
2. Với password sai
3. Kiểm tra response

**Test Data:**

```json
{
  "username": "testuser001",
  "password": "WrongPassword123!"
}
```

**Expected Result:**

- Status code: 401
- Response message: "Mật khẩu không đúng"
- Không trả về token

**Status:** [PASS/FAIL]

---

## 🚨 XỬ LÝ LỖI PHỔ BIẾN

### 1. Lỗi Authentication (401)

**Nguyên nhân:**

- Token không được gửi
- Token không hợp lệ
- Token đã hết hạn
- Token đã bị thu hồi

**Giải pháp:**

```javascript
// Kiểm tra token trong Postman Environment
console.log(pm.environment.get("ACCESS_TOKEN"));

// Đăng nhập lại để lấy token mới
// Hoặc dùng refresh token
```

---

### 2. Lỗi Authorization (403)

**Nguyên nhân:**

- Không có quyền truy cập endpoint
- Role không phù hợp
- Cố truy cập tài nguyên của người khác

**Giải pháp:**

- Đăng nhập bằng user có role phù hợp
- ADMIN: Full access
- DOCTOR: Quản lý bệnh nhân, đơn thuốc
- PATIENT: Chỉ xem/sửa thông tin của mình
- RECEPTIONIST: Quản lý lịch hẹn, hóa đơn

---

### 3. Lỗi Validation (400)

**Nguyên nhân:**

- Dữ liệu thiếu trường bắt buộc
- Dữ liệu sai format
- Dữ liệu không hợp lệ

**Giải pháp:**

- Kiểm tra lại request body
- Đảm bảo đúng data type
- Email phải đúng format
- Phone number phải đúng format
- Date phải format YYYY-MM-DD

---

### 4. Lỗi Not Found (404)

**Nguyên nhân:**

- Resource không tồn tại
- ID không hợp lệ

**Giải pháp:**

- Kiểm tra lại ID
- Đảm bảo resource đã được tạo
- Sử dụng endpoint GET list để lấy ID hợp lệ

---

### 5. Lỗi Server (500)

**Nguyên nhân:**

- Lỗi code
- Database connection error
- Unhandled exception

**Giải pháp:**

- Kiểm tra server logs
- Kiểm tra database connection
- Báo cáo bug cho dev team

---

### 6. Lỗi Rate Limit (429)

**Nguyên nhân:**

- Gửi quá nhiều request trong thời gian ngắn
- Vượt quá giới hạn: 5 booking requests / 15 phút

**Giải pháp:**

- Đợi một lúc trước khi gửi tiếp
- Giảm tần suất request

---

## ✅ CHECKLIST KIỂM THỬ

### Authentication Module

- [ ] Đăng ký với dữ liệu hợp lệ
- [ ] Đăng ký với email đã tồn tại
- [ ] Đăng ký với username đã tồn tại
- [ ] Đăng ký với password không khớp
- [ ] Đăng nhập thành công
- [ ] Đăng nhập với sai password
- [ ] Đăng nhập với username không tồn tại
- [ ] Refresh token thành công
- [ ] Refresh token với token hết hạn
- [ ] Đăng xuất thành công
- [ ] Quên mật khẩu
- [ ] Reset mật khẩu

### User Management Module

- [ ] Lấy danh sách users (ADMIN)
- [ ] Lấy danh sách users (PATIENT) - Expect 403
- [ ] Tìm kiếm users
- [ ] Lọc users theo role
- [ ] Phân trang
- [ ] Lấy user by ID
- [ ] Tạo user mới
- [ ] Cập nhật user
- [ ] Activate user
- [ ] Deactivate user
- [ ] Thay đổi role
- [ ] Xóa user

### Patient Management Module

- [ ] Setup patient profile
- [ ] Setup khi đã có profile - Expect 400
- [ ] Lấy danh sách patients
- [ ] Lọc patients theo gender
- [ ] Lọc patients theo blood type
- [ ] Lấy patient by ID
- [ ] Cập nhật patient
- [ ] Upload avatar
- [ ] Upload file quá lớn - Expect 400
- [ ] Lấy medical history
- [ ] Lấy prescriptions
- [ ] Xóa patient

### Doctor Management Module

- [ ] Lấy danh sách doctors
- [ ] Lấy doctor by ID
- [ ] Tạo doctor mới
- [ ] Tạo doctor cho user không phải DOCTOR role - Expect 400
- [ ] Cập nhật doctor
- [ ] Lấy shifts của doctor
- [ ] Xóa doctor

### Appointment Management Module

- [ ] Đặt lịch online (PATIENT)
- [ ] Đặt lịch offline (RECEPTIONIST)
- [ ] Đặt lịch với ngày quá khứ - Expect 400
- [ ] Đặt lịch khi bác sĩ không available - Expect 400
- [ ] Lấy danh sách appointments
- [ ] Lấy my appointments
- [ ] Lấy upcoming appointments
- [ ] Lấy appointment by ID
- [ ] Cập nhật appointment
- [ ] Hủy appointment (trước 2h)
- [ ] Hủy appointment (< 2h) - Expect 400
- [ ] Mark no-show

### Visit Management Module

- [ ] Check-in appointment
- [ ] Check-in appointment đã check-in - Expect 400
- [ ] Hoàn thành visit
- [ ] Hoàn thành visit không phải bác sĩ phụ trách - Expect 403
- [ ] Lấy danh sách visits
- [ ] Lọc visits theo status
- [ ] Lấy visit by ID
- [ ] Lấy visits của patient

### Prescription Management Module

- [ ] Tạo prescription
- [ ] Tạo prescription khi thuốc không đủ - Expect 400
- [ ] Lấy prescription by ID
- [ ] Lấy prescription by visit
- [ ] Lấy prescriptions by patient
- [ ] Cập nhật prescription
- [ ] Hủy prescription
- [ ] Hủy prescription đã cấp phát - Expect 400
- [ ] Cấp phát prescription
- [ ] Xuất PDF prescription

### Invoice Management Module

- [ ] Tạo invoice
- [ ] Tạo invoice cho visit đã có invoice - Expect 400
- [ ] Lấy danh sách invoices
- [ ] Lấy unpaid invoices
- [ ] Lấy invoices by patient
- [ ] Lấy invoice by ID
- [ ] Cập nhật invoice
- [ ] Thêm payment
- [ ] Thêm payment vượt số tiền - Expect 400
- [ ] Lấy payment history
- [ ] Xuất PDF invoice
- [ ] Thống kê invoice

### Medicine Management Module

- [ ] Tạo medicine
- [ ] Tạo medicine với tên trùng - Expect 400
- [ ] Lấy danh sách medicines
- [ ] Lấy low stock medicines
- [ ] Lấy expiring medicines
- [ ] Lấy medicine by ID
- [ ] Cập nhật medicine
- [ ] Nhập medicine
- [ ] Nhập medicine với expiry date quá khứ - Expect 400
- [ ] Lấy import history
- [ ] Lấy export history
- [ ] Mark medicine expired
- [ ] Auto mark expired
- [ ] Xóa medicine

### Dashboard Module

- [ ] Lấy dashboard data
- [ ] Lấy stats
- [ ] Lấy appointments by date
- [ ] Lấy overview
- [ ] Lấy recent activities
- [ ] Lấy quick stats
- [ ] Lấy system alerts
- [ ] Tất cả endpoints chỉ cho ADMIN

### Reports Module

- [ ] Revenue report
- [ ] Expense report
- [ ] Profit report
- [ ] Top medicines report
- [ ] Medicine alerts report
- [ ] Patients by gender report
- [ ] Appointment report
- [ ] Patient statistics
- [ ] Xuất PDF các reports
- [ ] Tất cả endpoints chỉ cho ADMIN

---

## 📝 GHI CHÚ QUAN TRỌNG

### 1. Thứ tự test

**Nên test theo thứ tự:**

1. Authentication (để lấy token)
2. User Management (tạo users với các roles khác nhau)
3. Patient/Doctor Management
4. Appointment → Visit → Prescription → Invoice
5. Medicine Management
6. Dashboard & Reports

### 2. Test Data Management

- Sử dụng data riêng cho mỗi test case
- Dùng timestamp để tạo unique data
- Clean up data sau khi test (nếu cần)

**Ví dụ:**

```javascript
// Pre-request Script trong Postman
const timestamp = Date.now();
pm.environment.set("UNIQUE_EMAIL", `test${timestamp}@example.com`);
pm.environment.set("UNIQUE_USERNAME", `user${timestamp}`);
```

### 3. Environment Variables

Luôn sử dụng environment variables cho:

- BASE_URL
- Tokens
- IDs được tạo trong quá trình test
- Test data động

### 4. Logging và Debugging

Trong Postman Tests tab:

```javascript
// Log response để debug
console.log("Response:", pm.response.json());

// Log environment variables
console.log("Token:", pm.environment.get("ACCESS_TOKEN"));

// Assert để tự động kiểm tra
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has accessToken", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.data).to.have.property("accessToken");
});
```

---

## 🎓 KẾT LUẬN

Tài liệu này cung cấp hướng dẫn chi tiết để kiểm thử toàn bộ API của hệ thống quản lý Phòng khám Healthcare.

**Để bắt đầu:**

1. Setup môi trường theo hướng dẫn
2. Import Postman collection (nếu có)
3. Thiết lập environment variables
4. Bắt đầu test từ Authentication module
5. Tiến hành test các modules khác
6. Ghi lại kết quả và báo cáo bugs

---

**Phiên bản:** 1.0.0
**Ngày cập nhật:** 03/01/2026

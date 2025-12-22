import { Router } from "express";
import { login, register, refreshToken } from "../controllers/auth.controller";

const router = Router();

// POST: Register new user
// POST /api/auth/register
// Body: {
//   "email": "user@example.com",
//   "password": "Password123",
//   "fullName": "Nguyễn Văn A",
//   "roleId": 1 (optional, default: PATIENT)
// }
// Response: {
//   "success": true,
//   "message": "Registration successful",
//   "user": {
//     "id": 1,
//     "email": "user@example.com",
//     "fullName": "Nguyễn Văn A",
//     "role": "PATIENT"
//   }
// }
router.post("/register", register);

// POST: Login user
// POST /api/auth/login
// Body: {
//   "email": "user@example.com",
//   "password": "Password123"
// }
// Response: {
//   "success": true,
//   "message": "Login successful",
//   "tokens": {
//     "accessToken": "eyJhbGc...",
//     "refreshToken": "eyJhbGc..."
//   },
//   "user": {
//     "id": 1,
//     "email": "user@example.com",
//     "fullName": "Nguyễn Văn A",
//     "role": "PATIENT"
//   }
// }
router.post("/login", login);

// POST: Refresh access token
// POST /api/auth/refresh-token
// Body: {
//   "refreshToken": "eyJhbGc..."
// }
// Response: {
//   "success": true,
//   "message": "Token refreshed successfully",
//   "accessToken": "eyJhbGc..."
// }
router.post("/refresh-token", refreshToken);

export default router;

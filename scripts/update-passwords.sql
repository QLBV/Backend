-- ===============================================
-- UPDATE PASSWORDS - Healthcare Management System
-- ===============================================
-- Run this AFTER importing sample-data.sql
-- This will set password = "password123" for all users
-- ===============================================

USE healthcare_db;

-- Generate hash bằng lệnh:
-- node docs/generate-password.js
-- Hoặc: node -e "console.log(require('bcrypt').hashSync('password123', 10))"

-- Example hash (password: "password123")
-- REPLACE THIS with your actual hash from generate-password.js
SET @password_hash = '$2b$10$rB6jG9xOJVvXvJWYqXJ5C.8vK2HdXyQN3JqBR5bvP8nF9KqvH1L7W';

-- Update tất cả users với password giống nhau
UPDATE users SET password = @password_hash WHERE id IN (1,2,3,4,5,6,7,8,9,10,11,12,13);

-- Verify
SELECT
  id,
  email,
  fullName,
  roleId,
  CASE
    WHEN roleId = 1 THEN 'Admin'
    WHEN roleId = 2 THEN 'Receptionist'
    WHEN roleId = 3 THEN 'Patient'
    WHEN roleId = 4 THEN 'Doctor'
  END as role,
  LEFT(password, 20) as password_preview
FROM users
ORDER BY id;

SELECT '=== PASSWORD UPDATED ===' as status;
SELECT 'Password for all users: password123' as note;

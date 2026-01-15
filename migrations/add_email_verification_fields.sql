-- Migration: Add Email Verification Fields to Users Table
-- Created: 2026-01-15

ALTER TABLE users
  ADD COLUMN emailVerificationToken VARCHAR(255) NULL,
  ADD COLUMN emailVerificationExpires DATETIME NULL,
  ADD COLUMN isEmailVerified BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX idx_email_verification_token ON users(emailVerificationToken);

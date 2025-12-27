# Database Design

## 1. Purpose

This document explains **database design decisions**, including **OTP handling for email verification and password reset**, along with booking, users, and vendor schema.

---

## 2. Database Choice

- **PostgreSQL**: ACID-compliant, transactional, secure, scalable.

---

## 3. Core Tables Overview

users
vendors
resources
bookings
payments
otp_tokens
roles

---

## 4. Users Table

**Columns**

- id (UUID, PK)
- email (unique)
- password_hash
- is_email_verified (boolean)
- role
- status
- created_at
- updated_at

**Indexes**

- Unique index on `email`

**Relationships**

- One User → Many Bookings
- One User → Many OTP Tokens

---

## 5. OTP Tokens Table

**Purpose**: Handle email verification & forgot password securely.

**Columns**

- id (UUID, PK)
- user_id (FK → users.id)
- otp_hash (hashed, bcrypt/argon2)
- purpose (EMAIL_VERIFICATION / PASSWORD_RESET)
- expires_at (timestamp)
- consumed_at (timestamp, nullable)
- created_at (timestamp)

**Security**

- OTP hashed, single-use, short expiry
- Stored separately from user table for security & audit
- Background job cleans expired OTPs

**Flow**

- Signup → OTP generated → sent to email → hashed stored in DB → validated → consumed
- Forgot Password → OTP generated → validated → password reset → OTP consumed

---

## 6. Vendor Table

**Columns**

- id (UUID, PK)
- name
- vendor_type
- status
- created_at
- updated_at

**Relationships**

- One Vendor → Many Resources

---

## 7. Resource Table

**Columns**

- id (UUID, PK)
- vendor_id (FK → vendors.id)
- type
- name
- price
- is_active
- created_at
- updated_at

**Indexes**

- vendor_id, type

---

## 8. Booking Table

**Columns**

- id (UUID, PK)
- user_id (FK → users.id)
- resource_id (FK → resources.id)
- start_time
- end_time
- status
- created_at
- updated_at

**Constraints**

- No overlapping bookings for same resource
- Handled with transactions + application locks

**Indexes**

- Composite `(resource_id, start_time, end_time)`
- Index on `user_id`

---

## 9. Payment Table

**Columns**

- id (UUID, PK)
- booking_id (FK → bookings.id)
- amount
- currency
- provider
- status
- created_at

---

## 10. Transactions & Isolation

- Critical flows: booking creation, OTP verification, payment confirmation
- Isolation level: `READ COMMITTED` + app-level locking

---

## 11. Summary

This database design now **fully integrates OTP flows** for:

- Email verification
- Password reset

It remains **scalable, secure, and production-ready**, supporting resource-based bookings, vendors, and payments.

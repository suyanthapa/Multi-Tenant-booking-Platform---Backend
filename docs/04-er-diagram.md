# ER Diagram

## 1. Purpose

This document describes the **Entity Relationship (ER) model** for the resource-based booking system, including **OTP handling for email verification and password reset**.

---

## 2. Core Design Principle

> Bookings are **resource-centric**, not vendor-centric.

- Vendors own resources
- Users book resources
- OTPs are used for **email verification** and **forgot password flows**

---

## 3. Entities Overview

### 3.1 User

Represents an end user who books resources.

**Attributes**

- id (PK)
- email (unique)
- password_hash
- is_email_verified (boolean)
- role (USER / VENDOR / ADMIN)
- status
- created_at
- updated_at

**Relationships**

- One User → Many Bookings
- One User → Many OTP Tokens

---

### 3.2 OTP Token

Represents OTPs sent to users.

**Attributes**

- id (PK)
- user_id (FK → users.id)
- otp_hash
- purpose (EMAIL_VERIFICATION / PASSWORD_RESET)
- expires_at
- consumed_at
- created_at

**Relationships**

- Many OTPs → One User

---

### 3.3 Vendor

**Attributes**

- id (PK)
- name
- vendor_type
- status
- created_at
- updated_at

**Relationships**

- One Vendor → Many Resources

---

### 3.4 Resource

**Attributes**

- id (PK)
- vendor_id (FK → vendors.id)
- type
- name
- price
- is_active
- created_at
- updated_at

**Relationships**

- One Resource → Many Bookings
- One Resource → One Vendor

---

### 3.5 Booking

**Attributes**

- id (PK)
- user_id (FK → users.id)
- resource_id (FK → resources.id)
- start_time
- end_time
- status
- created_at
- updated_at

**Relationships**

- Many Bookings → One User
- Many Bookings → One Resource
- One Booking → One Payment

---

### 3.6 Payment

**Attributes**

- id (PK)
- booking_id (FK → bookings.id)
- amount
- currency
- provider
- status
- created_at

---

## 4. Relationships Summary

User 1 ────< Booking >──── 1 Resource >──── 1 Vendor
│
└───< OTP Token
|
└──── 1 Payment

---

## 5. Key Constraints

- OTPs are hashed, expire in 5–10 minutes, and single-use
- Booking overlaps prevented by resource locking
- Referential integrity enforced via foreign keys

---

## 6. Summary

The updated ER model now fully supports **OTP-based verification**, in addition to resource-centric bookings and payments.  
This ensures **secure authentication**, **password recovery**, and **audit-ready design**.

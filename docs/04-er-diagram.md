# ER Diagram

## 1. Purpose

This document describes the **Entity Relationship (ER) model** for the resource-based booking system, including **OTP handling for email verification and password reset**.

---

## 2. Core Design Principles

> Bookings are **resource-centric**, not vendor-centric.

- **Vendors** (users with VENDOR role) own **one business** (1:1 relationship)
- **Businesses** own **many resources** (1:N relationship)
- **Users** book **resources** (not businesses directly)
- **OTPs** are used for **email verification** and **forgot password flows**

This design enables:

- Clear ownership hierarchy
- Flexible resource management
- Scalable booking system
- Prevents vendor account sprawl

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

### 3.3 Business

**Purpose**: Represents a business owned by a vendor user.

**Attributes**

- id (PK)
- owner_id (FK → users.id, UNIQUE)
- name
- description
- type (HOTEL, CLINIC, SALON, CO_WORKING, OTHER)
- address
- phone
- email
- status (PENDING, ACTIVE, INACTIVE, SUSPENDED, DELETED)
- is_verified
- created_at
- updated_at

**Relationships**

- One Business → One User (vendor)
- One Business → Many Resources

**Constraint**

- **UNIQUE constraint on `owner_id`**: A vendor can own only ONE business
- Enforced at both database and application level

---

### 3.4 Resource

**Purpose**: Represents bookable items within a business.

**Attributes**

- id (PK)
- business_id (FK → businesses.id)
- name
- type (HOTEL_ROOM, DOCTOR_SLOT, SALON_CHAIR, DESK, OTHER)
- description
- price (Decimal 10,2)
- currency
- is_active
- created_at
- updated_at

**Relationships**

- Many Resources → One Business
- One Resource → Many Bookings

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

```
User (VENDOR) 1 ──── 1 Business
     |
     1
     |
     < Booking >──── 1 Resource
     |                      |
     < OTP Token            |
     |                      Many
     1                      |
     |                      1
  Payment              Business
```

**Key Points:**

- **One-to-One**: User (with VENDOR role) → Business (unique constraint)
- **One-to-Many**: Business → Resources
- **One-to-Many**: User → Bookings
- **One-to-Many**: User → OTP Tokens
- **Many-to-One**: Bookings → Resource
- **One-to-One**: Booking → Payment

---

## 5. Key Constraints

- **One business per vendor**: UNIQUE constraint on `businesses.owner_id`
- **OTPs**: Hashed, expire in 5–10 minutes, single-use
- **Booking overlaps**: Prevented by resource locking and time validation
- **Referential integrity**: Enforced via foreign keys
- **Soft deletes**: Business status includes DELETED state
- **Decimal precision**: Price stored as Decimal(10,2) for currency accuracy

---

## 6. Summary

The ER model supports:

- **OTP-based verification** for email and password reset
- **Resource-centric bookings** with business ownership
- **One-to-one vendor-business relationship** enforced at database level
- **Multi-type resources** (hotels, clinics, salons, co-working)
- **Secure authentication** with role-based access control
- **Audit-ready design** with timestamps and status tracking

This design ensures **data integrity, scalability, and business rule enforcement** at the database layer.

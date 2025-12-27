# ER Diagram

## 1. Purpose

This document describes the **Entity Relationship (ER) model** for the resource-based booking system.

The ER design focuses on:

- Data normalization
- Clear ownership boundaries
- Preventing double bookings
- Supporting multiple vendor and resource types
- Scalability and future extensibility

---

## 2. Core Design Principle

> **Bookings are resource-centric, not vendor-centric**

- Vendors own **resources**
- Users book **resources**
- Booking logic remains generic regardless of vendor type

This allows the system to support hotels, clinics, salons, and future services using the same schema.

---

## 3. Entities Overview

### 3.1 User

Represents an end user who books resources.

**Attributes**

- id (PK)
- email (unique)
- passwordHash
- role (USER / VENDOR / ADMIN)
- status (ACTIVE / SUSPENDED)
- createdAt
- updatedAt

**Relationships**

- One User → Many Bookings

---

### 3.2 Vendor

Represents a business entity that owns resources.

**Attributes**

- id (PK)
- name
- vendorType (HOTEL, CLINIC, SALON, etc.)
- status (PENDING / APPROVED / SUSPENDED)
- createdAt
- updatedAt

**Relationships**

- One Vendor → Many Resources

---

### 3.3 Resource

Represents any bookable entity.

Examples:

- Hotel room
- Doctor appointment slot
- Salon chair
- Co-working desk

**Attributes**

- id (PK)
- vendorId (FK → Vendor.id)
- type (HOTEL_ROOM, DOCTOR_SLOT, DESK, etc.)
- name
- description
- price
- isActive
- createdAt
- updatedAt

**Relationships**

- One Resource → Many Bookings
- One Resource → One Vendor

---

### 3.4 Booking

Represents a reservation made by a user for a resource.

**Attributes**

- id (PK)
- userId (FK → User.id)
- resourceId (FK → Resource.id)
- startTime
- endTime
- status (PENDING / CONFIRMED / CANCELLED / FAILED)
- createdAt
- updatedAt

**Relationships**

- Many Bookings → One User
- Many Bookings → One Resource

---

### 3.5 Payment

Represents payment information linked to a booking.

**Attributes**

- id (PK)
- bookingId (FK → Booking.id)
- amount
- currency
- provider
- status (INITIATED / SUCCESS / FAILED / REFUNDED)
- createdAt

**Relationships**

- One Booking → One Payment

---

### 3.6 Role (Optional – for RBAC)

Defines system roles and permissions.

**Attributes**

- id (PK)
- name (USER, VENDOR, ADMIN)

---

## 4. Relationships Summary

User 1 ────< Booking >──── 1 Resource >──── 1 Vendor
|
└──── 1 Payment

---

## 5. Key Constraints

### 5.1 Booking Constraints

- A resource **cannot have overlapping bookings**
- `(resourceId, startTime, endTime)` must not overlap
- Enforced via:
  - Database constraints
  - Transactions
  - Application-level locking

---

### 5.2 Referential Integrity

- Booking must reference a valid User and Resource
- Resource must reference a valid Vendor
- Deleting vendors/resources is restricted (soft delete preferred)

---

## 6. Why This ER Design Works

### 6.1 Generic & Extensible

- No vendor-specific tables
- New vendor/resource types require **no schema changes**

### 6.2 Data Consistency

- Clear ownership
- Strong foreign key relationships
- Supports transactional booking creation

### 6.3 Scalable

- Indexable relationships
- Optimized for availability queries
- Easy to shard by resource or vendor in the future

---

## 7. Notes on Soft Deletes

- Records are marked inactive instead of hard deletion
- Preserves booking history
- Supports audit and compliance requirements

---

## 8. Visual Diagram

A visual ER diagram is provided below for reference:

![ER Diagram](./diagrams/er-diagram.png)

---

## 9. Summary

This ER model supports a **single, unified backend** capable of handling bookings across multiple business domains while maintaining data integrity, scalability, and clean separation of responsibilities.

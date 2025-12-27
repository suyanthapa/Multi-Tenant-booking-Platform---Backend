# Business Workflow

## 1. Purpose

This document explains **how the business operates** from a backend perspective, focusing on **booking workflows**, failure handling, and lifecycle management.

---

## 2. Actors

- **User** – Books resources
- **Vendor** – Owns resources
- **Admin** – Oversees system operations
- **System** – Backend services

---

## 3. High-Level User Journey

User Login
↓
Browse Resources
↓
Check Availability
↓
Create Booking
↓
Make Payment
↓

---

## 4. Booking Workflow (Detailed)

### Step 1: Authentication

- User logs in
- JWT access token issued
- Role verified (USER)

---

### Step 2: Resource Discovery

- User searches resources by:
  - Resource type (HOTEL, CLINIC, etc.)
  - Location
  - Date/time
  - Price range

---

### Step 3: Availability Check

- System checks for overlapping bookings
- Availability is calculated using:
  - Existing bookings
  - Resource availability rules

---

### Step 4: Booking Creation

- Booking request validated
- Resource lock applied
- Booking created with status `PENDING`
- Operation wrapped in a transaction

---

### Step 5: Payment Processing

- Payment intent created
- User completes payment
- Payment gateway callback received

---

### Step 6: Booking Confirmation

- Payment verified
- Booking status updated to `CONFIRMED`
- Resource lock released
- Confirmation notifications sent

---

## 5. Cancellation Flow

### User-Initiated Cancellation

- Cancellation request validated
- Refund eligibility checked
- Booking status updated to `CANCELLED`
- Resource availability restored
- Refund processed (if applicable)

---

## 6. Failure Scenarios

### Payment Failure

- Booking marked as `FAILED`
- Resource lock released
- User notified

---

### Concurrent Booking Attempt

- Lock prevents double booking
- One request succeeds
- Other requests fail gracefully

---

### System Crash During Booking

- Transaction rollback ensures consistency
- No partial bookings stored

---

## 7. Vendor Perspective

- Vendors define resources and availability
- Vendors receive booking notifications
- Vendors do not control booking logic

---

## 8. Admin Workflow

- Monitor bookings
- Resolve disputes
- Manage vendors
- View audit logs

---

## 9. Key Business Rules

- One resource cannot be booked twice for overlapping time
- One user can have multiple bookings
- One vendor can own multiple resources
- Bookings are resource-centric, not vendor-centric

---

## 10. Summary

The business workflow is designed to ensure consistency, prevent conflicts, and provide a unified booking experience across all resource types while keeping the backend logic generic and extensible.

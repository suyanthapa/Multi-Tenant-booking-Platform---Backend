# Business Workflow

## 1. Overview

This document explains the **end-to-end business workflows** of the resource-based booking platform.

It focuses on:

- User interactions
- Service-to-service communication
- Success and failure scenarios
- Clear separation of responsibilities across microservices

---

## 2. Actors

### Primary Actors

- **User** – End customer making a booking
- **Vendor** – Owner of bookable resources (hotel, clinic, etc.)
- **System** – Backend services

### Backend Services

- API Gateway
- Auth Service
- Booking Service
- Resource Service
- Payment Service
- Notification Service

---

## 3. User Registration & Authentication Flow

### 3.1 User Registration (Email + OTP)

1. User submits registration request
2. API Gateway forwards request to **Auth Service**
3. Auth Service:
   - Creates user (unverified)
   - Generates OTP
   - Stores OTP hash with expiry
4. Auth Service emits `UserOTPGenerated` event
5. Notification Service sends OTP email
6. User verifies OTP
7. Auth Service marks email as verified

**Communication**

- Sync: API Gateway → Auth Service
- Async: Auth Service → Notification Service

---

## 4. Booking Creation Flow (Core Workflow)

### 4.1 Successful Booking Flow

1. User sends booking request

# Business Workflow

## 1. Overview

This document explains the **end-to-end business workflows** of the resource-based booking platform.

It focuses on:

- User interactions
- Service-to-service communication
- Success and failure scenarios
- Clear separation of responsibilities across microservices

---

## 2. Actors

### Primary Actors

- **User** – End customer making a booking
- **Vendor** – Owner of bookable resources (hotel, clinic, etc.)
- **System** – Backend services

### Backend Services

- API Gateway
- Auth Service
- Booking Service
- Resource Service
- Payment Service
- Notification Service

---

## 3. User Registration & Authentication Flow

### 3.1 User Registration (Email + OTP)

1. User submits registration request
2. API Gateway forwards request to **Auth Service**
3. Auth Service:
   - Creates user (unverified)
   - Generates OTP
   - Stores OTP hash with expiry
4. Auth Service emits `UserOTPGenerated` event
5. Notification Service sends OTP email
6. User verifies OTP
7. Auth Service marks email as verified

**Communication**

- Sync: API Gateway → Auth Service
- Async: Auth Service → Notification Service

---

## 4. Booking Creation Flow (Core Workflow)

### 4.1 Successful Booking Flow

1. User sends booking request

POST /bookings

2. API Gateway:

- Validates JWT
- Applies rate limits
- Forwards request to Booking Service

3. Booking Service:

- Validates input
- Checks resource availability via Resource Service (sync)
- Applies booking rules (overlap prevention)

4. Booking Service creates booking with status `PENDING`
5. Booking Service calls Payment Service to create payment intent
6. Payment Service responds with payment session
7. User completes payment
8. Payment Service emits `PaymentCompleted` event
9. Booking Service updates booking status to `CONFIRMED`
10. Booking Service emits `BookingConfirmed` event
11. Notification Service sends confirmation email

---

## 5. Booking Cancellation Flow

### 5.1 User-Initiated Cancellation

1. User sends cancellation request
2. API Gateway authenticates request
3. Booking Service:

- Validates ownership
- Checks cancellation policy

4. Booking status updated to `CANCELLED`
5. Booking Service emits `BookingCancelled` event
6. Payment Service processes refund (if applicable)
7. Notification Service sends cancellation email

---

## 6. Failure Scenarios

### 6.1 Resource Not Available

- Resource Service returns unavailable
- Booking Service rejects request
- No payment initiated

---

### 6.2 Payment Failure

- Payment Service emits `PaymentFailed`
- Booking Service marks booking as `FAILED`
- Booking slot is released
- User is notified

---

### 6.3 OTP Expired / Invalid

- Auth Service rejects verification
- User must request new OTP
- Rate limiting applies

---

## 7. Communication Summary

### Synchronous (HTTP)

Used for:

- Authentication
- Booking creation
- Availability checks
- Payment initiation

### Asynchronous (Events / Jobs)

Used for:

- Email notifications
- OTP delivery
- Payment confirmations
- Cleanup of expired bookings

---

## 8. Data Consistency Strategy

- Strong consistency within a service
- Eventual consistency across services
- No shared databases
- Idempotency enforced for booking and payment APIs

---

## 9. Key Business Rules

- A user can create multiple bookings
- A booking references exactly one resource
- A resource can have multiple bookings (non-overlapping)
- Vendors own resources, not bookings
- Booking logic is independent of vendor type

---

## 10. Summary

The business workflows are designed to ensure:

- Clear service ownership
- Reliable booking creation
- Fault tolerance via async processing
- Scalability through service isolation

This workflow reflects real-world production systems and supports future expansion without architectural changes.

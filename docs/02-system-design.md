# System Design

## 1. Purpose

This document describes the high-level system design of a **generic, resource-based booking platform**.  
The backend supports booking across multiple vendor types (hotels, clinics, salons, etc.) using a **single unified architecture**.

The design prioritizes:

- Scalability
- Security
- Reusability
- Clean separation of concerns
- Production readiness

---

## 2. Architectural Style

### 2.1 Chosen Architecture

- **Modular Monolith**
- Clean Architecture principles
- Domain-driven design (DDD) inspired

### 2.2 Why Modular Monolith First

- Reduced operational complexity
- Easier debugging and deployment
- Clear domain boundaries
- Ready for future microservice extraction

---

## 3. High-Level Architecture

Client (Web / Mobile)
|
v
REST API Layer
|
v
Application Layer (Use Cases)
|
v
Domain Layer (Business Rules)
|
v
Infrastructure Layer
├─ PostgreSQL (Primary DB)
├─ Redis (Cache & Locks)
├─ Queue (Background Jobs)

---

## 4. Core Modules

### 4.1 Authentication Module

Responsibilities:

- User authentication (JWT access & refresh tokens)
- OAuth (Google)
- Role-based access control (RBAC)
- Token rotation & revocation

---

### 4.2 User Module

Responsibilities:

- User profile management
- Booking history access
- Account status handling

---

### 4.3 Vendor Module

Responsibilities:

- Vendor onboarding & verification
- Vendor profile management
- Ownership of resources

> Vendors do not manage bookings directly.

---

### 4.4 Resource Module (Core Abstraction)

A **resource** is any bookable entity.

Examples:

- Hotel room
- Doctor appointment slot
- Salon chair
- Co-working desk

Responsibilities:

- Availability configuration
- Pricing rules
- Vendor ownership
- Resource classification

---

### 4.5 Booking Module (Critical)

Responsibilities:

- Availability checks
- Prevent overlapping bookings
- Booking lifecycle management
- Cancellation & refund rules
- Idempotency handling

---

### 4.6 Payment Module

Responsibilities:

- Payment intent creation
- Payment confirmation
- Failure & retry handling
- Refund processing

---

### 4.7 Notification Module

Responsibilities:

- Booking confirmations
- Cancellation notifications
- Payment status updates
- Async processing via background jobs

---

## 5. Communication Patterns

- **Synchronous**: REST APIs for core workflows
- **Asynchronous**:
  - Emails
  - Payment callbacks
  - Cleanup jobs (expired bookings)

---

## 6. Key Design Decisions

### 6.1 Resource-Based Booking

- Booking references `resourceId`
- Booking logic is independent of vendor type
- New resource types require no booking logic changes

---

### 6.2 Data Consistency

- Database transactions for booking creation
- Locking to prevent double booking
- Idempotency keys for payment APIs

---

## 7. Scalability Considerations

- Stateless API servers
- Horizontal scaling
- Redis for caching & locks
- Indexed database queries

---

## 8. Security Overview

- Input validation at API boundaries
- Auth middleware for protected routes
- RBAC enforcement
- Rate limiting on sensitive endpoints

---

## 9. Summary

This design provides a flexible and scalable backend that supports multiple vendor types while keeping business logic generic, reusable, and production-ready.

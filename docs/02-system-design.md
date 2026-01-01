# System Design

## 1. Purpose

This document describes the high-level system design of a **generic, resource-based booking platform** built using a **microservices architecture**.

The platform enables users to book different types of vendor resources (hotels, clinics, salons, etc.) through a unified backend while allowing independent scaling, deployment, and ownership of core domains.

The design prioritizes:

- Independent scalability
- Fault isolation
- Security
- Domain ownership
- Production readiness

---

## 2. Architectural Style

### 2.1 Microservices Architecture

The system is designed as a set of **independently deployable services**, where each service:

- Owns its business logic
- Owns its database
- Exposes functionality via APIs or events
- Communicates with other services using well-defined contracts

This avoids tight coupling and shared state between services.

---

## 3. Core Services Overview

Client (Web / Mobile)
|
v
API Gateway
|
v
| Auth | Booking | Vendor | Payment | Notify |
|
v

---

## 4. Core Services & Responsibilities

### 4.1 Authentication Service

Responsibilities:

- User registration and login
- Email verification via OTP
- Forgot password via OTP
- JWT access & refresh token issuance
- OAuth (Google)
- Role-based access control (RBAC)

Database ownership:

- Users
- OTP tokens
- Auth sessions

---

### 4.2 Vendor Service

Responsibilities:

- Vendor onboarding and verification
- Vendor profile management
- Ownership of bookable resources

Database ownership:

- Vendors
- Vendor metadata

---

### 4.3 Resource Service

A **resource** represents any bookable entity.

Examples:

- Hotel room
- Clinic appointment slot
- Salon chair

Responsibilities:

- Resource configuration
- Availability rules
- Pricing logic
- Vendor ownership

Database ownership:

- Resources
- Availability schedules

---

### 4.4 Booking Service (Critical Domain)

Responsibilities:

- Booking creation and lifecycle management
- Availability validation
- Overlapping booking prevention
- Cancellation handling
- Idempotency enforcement

Database ownership:

- Bookings
- Booking state transitions

---

### 4.5 Payment Service

Responsibilities:

- Payment intent creation
- Payment confirmation
- Retry and failure handling
- Refund processing

Database ownership:

- Payments
- Transactions

---

### 4.6 Notification Service

Responsibilities:

- Email notifications
- Booking confirmations
- Payment status updates
- Async message processing

Database ownership:

- Notification logs (optional)

---

## 5. Communication Patterns

The system uses **both synchronous and asynchronous communication**, each chosen based on consistency and reliability requirements.

---

### 5.1 Synchronous Communication (REST)

Used when **immediate response and strong consistency** are required.

Examples:

- Booking Service → Auth Service (JWT validation)
- Booking Service → Resource Service (availability check)
- Booking Service → Payment Service (payment initiation)

Reasons:

- User-facing workflows require immediate feedback
- Ensures strong consistency for critical actions
- Simpler request-response model

---

### 5.2 Asynchronous Communication (Events / Queues)

Used for **side effects and non-blocking operations**.

Examples:

- User registered → send verification email
- Booking confirmed → send confirmation email
- Payment completed → update booking status
- Expired bookings → cleanup jobs

Reasons:

- Loose coupling between services
- Improved fault tolerance
- Better scalability under high load
- No cascading failures

---

## 6. Data Consistency Strategy

- Each service owns its database
- No cross-service joins
- No shared database access
- Strong consistency within a service
- Eventual consistency across services

Critical flows (booking + payment):

- Transactional consistency within the service
- Event-driven updates across services

---

## 7. Scalability Considerations

- Stateless service instances
- Horizontal scaling per service
- Independent database scaling
- Redis for caching and distributed locks
- Message broker for async workloads

---

## 8. Security Overview

- Centralized authentication via Auth Service
- JWT-based service-to-service trust
- RBAC enforced at service boundaries
- Input validation and sanitization
- Rate limiting on auth and booking APIs
- Secure OTP handling and expiration

---

## 9. Summary

This microservices-based design enables independent development, deployment, and scaling of core domains while maintaining strong consistency for user-facing workflows and high reliability through asynchronous event processing.

The hybrid communication model ensures both **correctness and scalability**, reflecting real-world production systems.

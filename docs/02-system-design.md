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
| Auth | Booking | Business | Resource | Payment | Notify |
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

### 4.2 Business Service

Responsibilities:

- Business registration and profile management
- Business verification by admin
- Business status management (PENDING, ACTIVE, INACTIVE, SUSPENDED, DELETED)
- Business type categorization (HOTEL, CLINIC, SALON, CO_WORKING, OTHER)
- **One-to-one relationship**: Each vendor (user with VENDOR role) can only own ONE business

Database ownership:

- Businesses
- Business metadata

Key Constraint:

- `ownerId` has a UNIQUE constraint ensuring one business per vendor
- Enforced at both application and database level

---

### 4.3 Resource Service

A **resource** represents any bookable entity within a business.

Examples:

- Hotel room (HOTEL_ROOM)
- Doctor appointment slot (DOCTOR_SLOT)
- Salon chair (SALON_CHAIR)
- Co-working desk (DESK)

Responsibilities:

- Resource creation and configuration
- Resource type management
- Pricing logic (decimal precision for currency)
- Active/inactive status management
- Business-resource relationship management

Database ownership:

- Resources
- Resource types and metadata

Key Relationships:

- Many Resources → One Business (via `businessId` foreign key)
- Resources cannot exist without a parent Business

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

### Current Implementation Status

**⚠️ Note**: The system currently uses an **API Gateway routing pattern** without inter-service communication.

- **API Gateway**: Proxies requests to individual services based on route prefixes
- **No Service-to-Service Communication**: Services operate independently
- **Each service**: Has its own database and handles requests in isolation

### Planned Communication Patterns

The system is designed to support **both synchronous and asynchronous communication** as the platform scales.

---

### 5.1 Synchronous Communication (REST) - Planned

To be implemented when **immediate cross-service validation** is required.

Planned examples:

- Booking Service → Auth Service (user validation)
- Booking Service → Resource Service (availability check + business validation)
- Resource Service → Business Service (verify business ownership)
- Booking Service → Payment Service (payment initiation)

Reasons:

- User-facing workflows require immediate feedback
- Ensures strong consistency for critical actions
- Prevents invalid bookings (non-existent users/resources)

---

### 5.2 Asynchronous Communication (Events / Queues) - Planned

To be implemented for **side effects and non-blocking operations**.

Planned examples:

- User registered → send verification email
- Booking confirmed → send confirmation email
- Payment completed → update booking status
- Business verified → notify vendor
- Expired bookings → cleanup jobs

Reasons:

- Loose coupling between services
- Improved fault tolerance
- Better scalability under high load
- No cascading failures

**Technologies to consider**: RabbitMQ, Kafka, Redis Streams, or AWS SQS/SNS

---

## 6. Data Consistency Strategy

### Current Implementation

- **Database per service**: Each microservice has its own PostgreSQL database
- **Strong consistency within service**: ACID transactions via Prisma
- **No cross-service dependencies**: Services currently operate independently
- **Connection pooling**: Each service uses singleton pattern with pg connection pool

### Service-Database Mapping

- **Auth Service**: `auth_db` (users, OTP tokens, sessions)
- **Business Service**: `business_db` (businesses with unique owner constraint)
- **Resource Service**: `resource_db` (resources linked to businesses via businessId)
- **Booking Service**: `booking_db` (bookings, booking states)

### Planned Consistency Model

As inter-service communication is implemented:

- **Strong consistency within service**: Maintained via database transactions
- **Eventual consistency across services**: Via event-driven updates
- **Idempotency**: To handle duplicate events/retries
- **Saga pattern**: For distributed transactions (e.g., booking + payment)

Critical flows (booking + payment):

- Transactional consistency within the service
- Event-driven updates across services
- Compensating transactions for rollbacks

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

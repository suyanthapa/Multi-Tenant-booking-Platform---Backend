# System Design

## 1. Purpose

This document describes the high-level system design of a **multi-tenant, resource-based booking platform** built using a **microservices architecture** with an **API Gateway** pattern.

The platform enables users to book different types of vendor resources (hotels, clinics, salons, etc.) through a unified backend while allowing independent scaling, deployment, and ownership of core domains.

The design prioritizes:

- Independent scalability and service isolation
- Fault tolerance and resilience
- Security and tenant isolation
- Domain ownership and clear boundaries
- Production readiness and maintainability
- Clean architecture with Repository Pattern

---

## 2. Architectural Style

### 2.1 Microservices Architecture

The system is designed as a set of **independently deployable services**, where each service:

- Owns its business logic and domain
- Owns its database (database-per-service pattern)
- Exposes functionality via RESTful APIs
- Implements Repository Pattern for data access abstraction
- Uses Prisma ORM with connection pooling for optimal performance
- Communicates via API Gateway for centralized routing

This architecture ensures:

- No tight coupling or shared database
- Independent scaling and deployment
- Clear service boundaries
- Easier testing and maintenance

---

## 3. System Architecture Overview

```
Client (Web / Mobile)
         |
         v
   API Gateway (Port 3000)
   - Request Routing
   - JWT Authentication
   - Load Balancing
   - Service Discovery
         |
    ┌────┴────┬────────┬──────────┐
    v         v        v          v
  Auth    Business  Resource   Booking
 (3001)    (3003)   (3004)     (3002)
    |         |        |          |
    v         v        v          v
 Auth DB  Business  Resource  Booking
          DB        DB        DB
```

### Architecture Highlights:

- **Centralized API Gateway**: Single entry point for all client requests
- **Service Isolation**: Each service runs independently with its own database
- **Database-per-Service**: Complete data isolation and independent schema evolution
- **Connection Pooling**: Optimized database connections via Prisma
- **Repository Pattern**: Clean data access layer in each service

---

## 4. Core Services & Responsibilities

### 4.0 API Gateway (Port 3000)

**Purpose**: Centralized entry point for all client requests

Responsibilities:

- Request routing to appropriate microservices
- JWT token validation and authentication
- Service proxy with authentication middleware
- Request/response transformation
- Health monitoring
- Environment-based service discovery

Technology Stack:

- Express.js with TypeScript
- HTTP proxy for service communication
- Cookie parser for token management
- Helmet for security headers
- Morgan for request logging

Service Configuration:

- Auth Service: http://localhost:3001
- Booking Service: http://localhost:3002
- Business Service: http://localhost:3003
- Resource Service: http://localhost:3004

---

### 4.1 Authentication Service (Port 3001)

Responsibilities:

- User registration with username and email
- Email verification via OTP (6-digit code with expiry)
- JWT access & refresh token issuance
- Token refresh and revocation
- Forgot password via OTP
- Password reset functionality
- Role-based access control (CUSTOMER, VENDOR, ADMIN)
- User status management (ACTIVE, SUSPENDED, PENDING_VERIFICATION, DELETED)

Database ownership:

- Users (with passwordHash, isEmailVerified, role, status)
- OTP tokens (with purpose: EMAIL_VERIFICATION, PASSWORD_RESET, TWO_FACTOR_AUTH)
- Refresh tokens (with revocation support)

Architecture:

- Repository Pattern for data access
- Service layer for business logic
- Controller layer for request handling
- Prisma ORM with connection pooling

Security Features:

- Bcrypt password hashing
- OTP hashing for secure storage
- Token expiry and revocation
- Single-use OTP validation
- Background job for OTP cleanup

---

### 4.2 Business Service (Port 3003)

Responsibilities:

- Business registration and profile management
- Business verification by admin
- Business status management (PENDING, ACTIVE, INACTIVE, SUSPENDED, DELETED)
- Business type categorization (HOTEL, CLINIC, SALON, CO_WORKING, OTHER)
- **One-to-one relationship**: Each vendor (user with VENDOR role) can only own ONE business
- Business filtering by type and status
- Ownership transfer prevention logic

Database ownership:

- Businesses (with unique ownerId constraint)
- Business metadata

Key Constraint:

- `ownerId` has a **UNIQUE constraint** ensuring one business per vendor
- Enforced at both application and database level
- Prevents vendor account sprawl

Architecture:

- Repository Pattern for business data access
- Service layer with validation logic
- Middleware for ownership verification
- Prisma ORM with PostgreSQL

Business Types Supported:

- HOTEL (rooms, suites)
- CLINIC (appointment slots, wards)
- SALON (chairs, services)
- CO_WORKING (desks, meeting rooms)
- OTHER (extensible for new types)

---

### 4.3 Resource Service (Port 3004)

A **resource** represents any bookable entity within a business.

Examples:

- Hotel room (HOTEL_ROOM)
- Doctor appointment slot (DOCTOR_SLOT)
- Salon chair (SALON_CHAIR)
- Co-working desk (DESK)

Responsibilities:

- Resource creation and management
- Resource categorization (e.g., "Deluxe Room", "Presidential Suite")
- Flexible metadata storage for resource-specific attributes
- Resource type and status management
- Price and currency handling
- Resource filtering and statistics
- Business-specific resource queries

Database ownership:

- Resources (with businessId foreign key)
- ResourceCategory (with unique constraint per business)

Architecture:

- Repository Pattern for data abstraction
- Service layer for business rules
- Type-safe interfaces for metadata
- Prisma ORM with connection pooling

Resource Features:

- Flexible JSON metadata for custom attributes
- Category management (unique per business)
- Status: ACTIVE, INACTIVE, MAINTENANCE, DELETED
- Decimal precision for pricing
- Multi-currency support

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

### 4.4 Booking Service (Port 3002)

**Purpose**: Core domain for managing resource bookings

Responsibilities:

- Booking creation and lifecycle management
- Time-based booking with start/end time
- Availability validation and conflict detection
- Overlapping booking prevention
- Booking status transitions (PENDING → CONFIRMED → IN_PROGRESS → COMPLETED)
- Cancellation handling with reason tracking
- Snapshot storage of resource and business data at booking time

Database ownership:

- Bookings (with multiple foreign keys: userId, vendorId, businessId, resourceId)
- Booking state history

Architecture:

- Repository Pattern for booking operations
- Service layer for validation and business rules
- Complex indexing for overlap detection
- Prisma ORM with optimized queries

Booking Features:

- **Data Snapshot**: Stores business and resource names/prices at booking time
- **Overlap Prevention**: Indexed queries on (resourceId, startTime, endTime)
- **Status Management**: PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
- **Cancellation Tracking**: Timestamp and reason for cancellations
- Decimal precision for booking prices

Key Indexes:

- Combined index on (resourceId, startTime, endTime) for overlap checks
- Individual indexes on userId, vendorId, businessId, resourceId, status
- Date-based index for efficient date queries

---

## 5. Architecture Patterns & Best Practices

### 5.1 Repository Pattern Implementation

**Purpose**: Abstract database operations and ensure clean separation of concerns

All services implement a consistent Repository Pattern:

```typescript
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(where?: any): Promise<T[]>;
  create(data: any): Promise<T>;
  update(id: string, data: any): Promise<T>;
  delete(id: string): Promise<T>;
}
```

**Benefits**:

- **Testability**: Easy to mock repositories in unit tests
- **Maintainability**: Business logic independent of data access
- **Flexibility**: Can switch ORMs without changing service layer
- **Clean Architecture**: Clear separation between layers (Controller → Service → Repository)

**Implementation Example** (Auth Service):

- **UserRepository**: Handles all user-related database operations
  - findByEmail, findByUsername, findByRole, etc.
- **OTPRepository**: Manages OTP token operations
  - createOTP, validateOTP, consumeOTP
- **RefreshTokenRepository**: Manages token lifecycle
  - createToken, revokeToken, findValidToken

Each repository:

- Extends the base IRepository interface
- Uses dependency injection (PrismaClient injected)
- Provides domain-specific query methods
- Handles Prisma-specific types and error handling
- Encapsulates all SQL/ORM logic

---

### 5.2 Connection Pooling with Prisma

**Purpose**: Optimize database connections and handle concurrent requests efficiently

**Configuration** (per service):

```typescript
// Prisma connection pooling is automatic
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});
```

**Pooling Strategy**:

- Prisma automatically manages connection pooling via PgBouncer
- Connection reuse across requests
- Automatic connection lifecycle management
- Singleton pattern for PrismaClient instance

**Pool Configuration**:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?connection_limit=10"
```

**Benefits**:

- **Performance**: Reduced connection overhead (no new connection per request)
- **Scalability**: Efficient handling of concurrent requests
- **Resource Management**: Prevents database connection exhaustion
- **Multi-Tenancy Ready**: Can scale to handle multiple tenant databases

**Best Practices Implemented**:

- Single PrismaClient instance per service (module-level singleton)
- Proper connection cleanup on service shutdown
- Environment-based connection string configuration
- Connection timeout and retry logic
- Graceful degradation on connection failures

---

### 5.3 Dependency Injection Pattern

**Purpose**: Loose coupling and enhanced testability

All services use constructor-based dependency injection:

```typescript
class UserService {
  constructor(
    private userRepository: UserRepository,
    private otpRepository: OTPRepository,
  ) {}
}
```

**Benefits**:

- Easy to mock dependencies in tests
- Flexible service composition
- Clear dependency declarations

---

## 6. Communication Patterns

### Current Implementation: API Gateway Pattern

**Architecture**:

```typescript
// API Gateway routes all client requests
app.use("/api/auth", createServiceProxy(SERVICES.AUTH));
app.use("/api/businesses", authenticate, createServiceProxy(SERVICES.BUSINESS));
app.use("/api/resources", authenticate, createServiceProxy(SERVICES.RESOURCE));
app.use("/api/bookings", authenticate, createServiceProxy(SERVICES.BOOKING));
```

**How it Works**:

1. Client sends request to API Gateway (port 3000)
2. Gateway validates JWT token (if required)
3. Gateway proxies request to appropriate service
4. Service processes request independently
5. Response flows back through gateway to client

**Current State**:

- ✅ **API Gateway Routing**: Centralized entry point
- ✅ **JWT Authentication**: Token validation at gateway
- ✅ **Service Isolation**: Each service has its own database
- ⏳ **No Inter-Service Communication**: Services don't call each other yet

---

### 6.1 Planned: Synchronous Communication (REST)

To be implemented when **immediate cross-service validation** is required.

Planned examples:

- Booking Service → Resource Service (availability check + business validation)
- Resource Service → Business Service (verify business ownership)

Reasons:

- User-facing workflows require immediate feedback
- Ensures strong consistency for critical actions
- Prevents invalid bookings (non-existent resources/businesses)

---

### 6.2 Planned: Asynchronous Communication (Events)

To be implemented for **side effects and non-blocking operations**.

Planned examples:

- User registered → send verification email
- Booking confirmed → send confirmation email
- Booking completed → trigger payment processing

Reasons:

- Loose coupling between services
- Improved fault tolerance
- Better scalability under high load
- No cascading failures

---

## 7. Data Consistency Strategy

### Current Implementation

- **Database-per-Service Pattern**: Complete data isolation
- **Strong consistency within service**: ACID transactions via Prisma
- **Connection Pooling**: Singleton PrismaClient with automatic pooling
- **No cross-service dependencies**: Services currently operate independently

### Service-Database Mapping

| Service  | Port | Database    | Key Models                   |
| -------- | ---- | ----------- | ---------------------------- |
| Auth     | 3001 | auth_db     | User, OTPToken, RefreshToken |
| Business | 3003 | business_db | Business (unique ownerId)    |
| Resource | 3004 | resource_db | Resource, ResourceCategory   |
| Booking  | 3002 | booking_db  | Booking                      |

### Database Schema Highlights

**Auth Service**:

- Unique constraints on email and username
- Indexed fields for fast lookups (userId, expiresAt)
- Cascade delete for related OTP and refresh tokens

**Business Service**:

- **UNIQUE constraint on ownerId**: Enforces one business per vendor
- Indexes on type and status for filtering
- Soft delete support via DELETED status

**Resource Service**:

- Foreign key to businessId (no database-level FK, managed in code)
- Unique constraint on (businessId, categoryName)
- JSON metadata field for flexible resource attributes
- Decimal type for precise price handling

**Booking Service**:

- Composite index on (resourceId, startTime, endTime) for overlap detection
- Snapshot fields preserve business/resource data at booking time
- Multiple foreign keys (userId, vendorId, businessId, resourceId)
- Cancellation tracking with timestamp and reason

### Planned Consistency Model

As inter-service communication is implemented:

- **Strong consistency within service**: Maintained via database transactions
- **Eventual consistency across services**: Via event-driven updates
- **Idempotency**: To handle duplicate events/retries
- **Saga pattern**: For distributed transactions (e.g., booking + payment)

---

## 8. Scalability Considerations

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

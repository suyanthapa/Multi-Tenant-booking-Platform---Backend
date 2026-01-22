# Database Design

## 1. Purpose

This document explains **database design decisions** for the multi-tenant, microservices-based booking platform, including:

- Database-per-service pattern
- Repository Pattern implementation
- Connection pooling with Prisma
- OTP handling for email verification and password reset
- Cross-service data relationships

---

## 2. Database Architecture

### 2.1 Database-per-Service Pattern

Each microservice owns its own PostgreSQL database:

| Service  | Database    | Port | Tables                            |
| -------- | ----------- | ---- | --------------------------------- |
| Auth     | auth_db     | 3001 | users, otp_tokens, refresh_tokens |
| Business | business_db | 3003 | businesses                        |
| Resource | resource_db | 3004 | resources, resource_categories    |
| Booking  | booking_db  | 3002 | bookings                          |

**Benefits**:

- Complete data isolation
- Independent schema evolution
- Service-level scaling
- No shared database bottlenecks
- Fault isolation

---

### 2.2 Technology Stack

- **Database**: PostgreSQL (ACID-compliant, transactional, scalable)
- **ORM**: Prisma (type-safe, connection pooling, migrations)
- **Pattern**: Repository Pattern for data access abstraction
- **Pooling**: Automatic connection pooling via Prisma

---

## 3. Connection Pooling Strategy

### 3.1 Prisma Connection Pooling

**Configuration** (per service):

```typescript
// Singleton PrismaClient instance
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

export default prisma;
```

**Environment Configuration**:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/auth_db?connection_limit=10"
```

**Pooling Behavior**:

- Prisma maintains a connection pool (default: 10 connections)
- Connections reused across requests
- Automatic connection lifecycle management
- Graceful shutdown on service termination

**Benefits**:

- Reduced connection overhead (no new connection per request)
- Efficient handling of concurrent requests
- Prevents database connection exhaustion
- Optimized for serverless and containerized deployments

---

### 3.2 Best Practices Implemented

✅ **Singleton Pattern**: One PrismaClient instance per service
✅ **Connection Reuse**: Same connection used for multiple queries
✅ **Graceful Shutdown**: Proper cleanup via `prisma.$disconnect()`
✅ **Environment-based Configuration**: Different pools for dev/prod
✅ **Query Logging**: Monitor slow queries and performance

---

## 4. Repository Pattern Implementation

### 4.1 Purpose

Abstract database operations and ensure clean separation of concerns.

**Layers**:

```
Controller → Service → Repository → Database
```

### 4.2 Base Repository Interface

```typescript
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(where?: any): Promise<T[]>;
  create(data: any): Promise<T>;
  update(id: string, data: any): Promise<T>;
  delete(id: string): Promise<T>;
}
```

### 4.3 Example: UserRepository (Auth Service)

```typescript
export class UserRepository implements IRepository<User> {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }
}
```

**Benefits**:

- Easy to mock for unit testing
- Business logic independent of data access
- Can switch ORMs without changing service layer
- Clear separation between layers

---

## 5. Auth Service Database (auth_db)

### 5.1 Users Table

**Columns**

- id (UUID, PK)
- email (unique)
- username (unique)
- password_hash (bcrypt hashed)
- first_name (varchar, nullable)
- last_name (varchar, nullable)
- phone (varchar, nullable)
- role (enum: CUSTOMER, VENDOR, ADMIN)
- status (enum: ACTIVE, SUSPENDED, PENDING_VERIFICATION, DELETED)
- is_email_verified (boolean, default: false)
- last_login_at (timestamp, nullable)
- created_at (timestamp, default: now())
- updated_at (timestamp, auto-update)

**Indexes**

- Unique index on `email`
- Unique index on `username`
- Index on `role`
- Index on `status`

**Relationships**

- One User → Many OTPTokens (CASCADE DELETE)
- One User → Many RefreshTokens (CASCADE DELETE)

**Repository Methods**:

- findById, findByEmail, findByUsername, findByEmailOrUsername
- findByRole, findMany, create, update, delete

---

### 5.2 OTP Tokens Table

**Purpose**: Handle email verification & forgot password securely.

**Columns**

- id (UUID, PK)
- user_id (FK → users.id, CASCADE DELETE)
- otp_hash (bcrypt hashed)
- purpose (enum: EMAIL_VERIFICATION, PASSWORD_RESET, TWO_FACTOR_AUTH)
- expires_at (timestamp)
- consumed_at (timestamp, nullable)
- created_at (timestamp)

**Indexes**

- Index on `user_id`
- Index on `expires_at` (for cleanup jobs)

**Security**

- OTP hashed with bcrypt before storage
- Single-use: `consumed_at` marks as used
- Short expiry: 10 minutes
- Background job cleans expired OTPs

**Flow**

1. Generate 6-digit OTP
2. Hash and store in database
3. Send plain OTP to user email
4. Validate: compare hashed stored OTP with provided OTP
5. Mark consumed: set `consumed_at` timestamp

**Repository Methods**:

- create, findValidOTP, markConsumed, deleteExpired

---

### 5.3 Refresh Tokens Table

**Purpose**: Enable JWT token refresh and revocation.

**Columns**

- id (UUID, PK)
- user_id (FK → users.id, CASCADE DELETE)
- token (text, unique)
- expires_at (timestamp)
- revoked_at (timestamp, nullable)
- created_at (timestamp)

**Indexes**

- Unique index on `token`
- Index on `user_id`
- Index on `expires_at`

**Purpose**

- Long-lived tokens (7 days)
- Database-backed for revocation support
- Token rotation on refresh
- All tokens revoked on password reset

**Repository Methods**:

- create, findByToken, revokeToken, revokeAllForUser, deleteExpired

---

## 6. Business Service Database (business_db)

### 6.1 Businesses Table

**Purpose**: Represents a business owned by a vendor. Each vendor can own only ONE business.

**Columns**

- id (UUID, PK)
- owner_id (UUID, **UNIQUE**, references Auth Service user)
- name (varchar)
- description (text, nullable)
- type (enum: HOTEL, CLINIC, SALON, CO_WORKING, OTHER)
- address (varchar, nullable)
- phone (varchar, nullable)
- email (varchar, nullable)
- status (enum: PENDING, ACTIVE, INACTIVE, SUSPENDED, DELETED)
- is_verified (boolean, default: false)
- created_at (timestamp)
- updated_at (timestamp)

**Unique Constraint**

- **UNIQUE on `owner_id`**: Enforces one business per vendor
- Prevents vendor from creating multiple businesses
- Database-level constraint + application-level validation

**Indexes**

- Unique index on `owner_id`
- Index on `type` (for filtering by business type)
- Index on `status` (for active business queries)

**Cross-Service Reference**

- `owner_id` references User.id from Auth Service
- No database-level foreign key (managed at application level)

**Repository Methods**:

- findById, findByOwnerId, findByType, findMany, create, update, delete

---

## 7. Resource Service Database (resource_db)

### 7.1 Resources Table

**Purpose**: Represents any bookable entity within a business.

**Columns**

- id (UUID, PK)
- business_id (UUID, references Business Service)
- name (varchar)
- type (enum: HOTEL_ROOM, DOCTOR_SLOT, SALON_CHAIR, DESK, OTHER)
- description (text, nullable)
- category_id (UUID, FK → resource_categories.id, nullable)
- metadata (JSON, default: {}) - Flexible custom attributes
- price (DECIMAL(10,2))
- currency (varchar, default: "USD")
- status (enum: ACTIVE, INACTIVE, MAINTENANCE, DELETED)
- created_at (timestamp)
- updated_at (timestamp)

**Indexes**

- Index on `business_id`
- Index on `type`
- Index on `status`
- Index on `category_id`

**Metadata Examples**:

```json
{
  "bedType": "King",
  "capacity": 2,
  "amenities": ["WiFi", "TV", "AC"],
  "floorNumber": 3,
  "viewType": "Mountain"
}
```

**Cross-Service Reference**

- `business_id` references Business.id from Business Service
- No database-level foreign key

**Repository Methods**:

- findById, findByBusiness, findByType, findMany, create, update, delete, getStats

---

### 7.2 Resource Categories Table

**Purpose**: Organize resources within a business (e.g., "Deluxe Room", "Standard Room").

**Columns**

- id (UUID, PK)
- business_id (UUID, references Business Service)
- name (varchar)
- created_at (timestamp)
- updated_at (timestamp)

**Unique Constraint**

- **UNIQUE on (business_id, name)**: Same business can't have duplicate category names

**Indexes**

- Unique index on `(business_id, name)`
- Index on `business_id`

**Relationships**

- One ResourceCategory → Many Resources
- Many ResourceCategories → One Business (cross-service)

**Repository Methods**:

- findById, findByBusinessAndName, findByBusiness, create, update, delete

---

## 8. Booking Service Database (booking_db)

### 8.1 Bookings Table

**Purpose**: Represents a user booking for a resource.

**Columns**

- id (UUID, PK)
- user_id (UUID, references Auth Service)
- vendor_id (UUID, references Auth Service)
- business_id (UUID, references Business Service)
- resource_id (UUID, references Resource Service)
- business_name (varchar, **snapshot**)
- resource_name (varchar, **snapshot**)
- resource_type (varchar, **snapshot**)
- price_at_booking (DECIMAL(10,2), **snapshot**)
- currency (varchar)
- booking_date (date)
- start_time (timestamp)
- end_time (timestamp)
- status (enum: PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
- notes (text, nullable)
- cancelled_at (timestamp, nullable)
- cancel_reason (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)

**Indexes**

- Index on `user_id`
- Index on `vendor_id`
- Index on `business_id`
- Index on `resource_id`
- Index on `booking_date`
- Index on `status`
- **Composite index on (resource_id, start_time, end_time)** for overlap detection

**Snapshot Fields Explanation**

**Why?**

- Preserve business and resource data at booking time
- Prevents historical data corruption if resource is updated/deleted
- Ensures audit trail and invoice accuracy

**Example**:

- User books "Deluxe Room 101" for $150
- Later, vendor renames it to "Premium Room 101" and changes price to $200
- Historical booking still shows "Deluxe Room 101" at $150

**Cross-Service References**

- `user_id`, `vendor_id` reference Auth Service users
- `business_id` references Business Service
- `resource_id` references Resource Service
- All managed at application level (no database FK)

**Repository Methods**:

- findById, findByUser, findByVendor, findByResource, findOverlapping
- create, update, cancel, delete

---

## 9. Overlap Detection Query

### 9.1 Preventing Double Bookings

**Requirement**: Ensure no overlapping bookings for the same resource.

**Query** (via Repository):

```typescript
async findOverlapping(
  resourceId: string,
  startTime: Date,
  endTime: Date
): Promise<Booking[]> {
  return this.prisma.booking.findMany({
    where: {
      resourceId,
      status: {
        notIn: ['CANCELLED', 'NO_SHOW']
      },
      OR: [
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } }
          ]
        }
      ]
    }
  });
}
```

**Composite Index**:

```sql
CREATE INDEX idx_resource_time ON bookings(resource_id, start_time, end_time);
```

**Performance**:

- Index scan instead of full table scan
- Fast lookup even with millions of bookings
- Critical for high-concurrency booking systems

---

## 10. Data Consistency Strategies

### 10.1 Within-Service Consistency

- **ACID Transactions**: Prisma supports database transactions
- **Atomic Operations**: Create user + OTP in single transaction
- **Cascade Deletes**: OTP and refresh tokens deleted with user

**Example Transaction**:

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const otp = await tx.otpToken.create({ data: otpData });
  return { user, otp };
});
```

---

### 10.2 Cross-Service Consistency

**Current State**: No inter-service calls yet

**Future Approach**:

- **Strong Consistency**: Synchronous REST calls for critical operations
- **Eventual Consistency**: Event-driven updates for non-critical flows
- **Idempotency**: Handle duplicate requests/events safely
- **Saga Pattern**: For distributed transactions (booking + payment)

---

## 11. Database Schema Evolution

### 11.1 Prisma Migrations

**Workflow**:

1. Update Prisma schema (schema.prisma)
2. Generate migration: `prisma migrate dev --name add_metadata_field`
3. Apply to production: `prisma migrate deploy`

**Benefits**:

- Version-controlled schema changes
- Automatic rollback support
- Type-safe generated client

---

## 12. Security Considerations

### 12.1 Password Security

- Bcrypt hashing (cost factor: 10)
- Never stored in plain text
- Hashing done in service layer, not repository

### 12.2 OTP Security

- Hashed with bcrypt before storage
- Single-use (consumed_at flag)
- Short expiry (10 minutes)
- Rate limiting (future: prevent OTP spam)

### 12.3 Token Security

- Refresh tokens stored in database for revocation
- Access tokens short-lived (15 minutes)
- All tokens revoked on password reset
- Token rotation on refresh

### 12.4 SQL Injection Prevention

- Prisma uses parameterized queries
- No raw SQL concatenation
- Type-safe query builder

---

## 13. Performance Optimizations

✅ **Connection Pooling**: Reuse database connections
✅ **Indexes**: On frequently queried fields
✅ **Composite Indexes**: For overlap detection queries
✅ **Pagination**: Limit query results (offset/cursor-based)
✅ **Selective Fields**: Only fetch needed columns
✅ **Query Logging**: Monitor slow queries

---

## 14. Summary

The database design implements a production-ready microservices architecture with:

✅ **Database-per-Service**: Complete isolation and independent scaling
✅ **Repository Pattern**: Clean data access abstraction
✅ **Connection Pooling**: Optimized performance via Prisma
✅ **Unique Constraints**: One business per vendor enforced
✅ **Snapshot Strategy**: Historical data integrity for bookings
✅ **Overlap Prevention**: Composite indexes for fast conflict detection
✅ **Security Best Practices**: Password hashing, OTP security, token revocation
✅ **Schema Evolution**: Version-controlled migrations via Prisma

This design ensures scalability, maintainability, and production readiness for a multi-tenant booking platform.

**Indexes**

- Unique constraint on `owner_id` (automatically creates index)
- Index on `type`
- Index on `status`

**Relationships**

- One User (Vendor role) → One Business
- One Business → Many Resources

**Status Workflow**

- PENDING: Newly created, awaiting admin approval
- ACTIVE: Verified and bookable
- INACTIVE: Temporarily disabled by owner
- SUSPENDED: Blocked by admin
- DELETED: Soft-deleted

---

## 7. Resource Table

**Purpose**: Represents bookable resources owned by a business.

**Columns**

- id (UUID, PK)
- business_id (FK → businesses.id)
- name
- type (HOTEL_ROOM, DOCTOR_SLOT, SALON_CHAIR, DESK, OTHER)
- description (nullable)
- price (Decimal 10,2)
- currency (default "USD")
- is_active (boolean)
- created_at
- updated_at

**Indexes**

- Index on `business_id`
- Index on `type`
- Index on `is_active`

**Relationships**

- Many Resources → One Business
- One Resource → Many Bookings

**Pricing**

- Uses Decimal(10,2) for precise currency handling
- Supports multi-currency (USD default)

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

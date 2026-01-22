# ER Diagram

## 1. Purpose

This document describes the **Entity Relationship (ER) model** for the multi-tenant, resource-based booking system with microservices architecture.

Each service owns its database with the following models:

- **Auth Service**: User, OTPToken, RefreshToken
- **Business Service**: Business
- **Resource Service**: Resource, ResourceCategory
- **Booking Service**: Booking

---

## 2. Core Design Principles

> **Multi-Tenant Architecture**: Each service maintains its own database for complete isolation

> **Bookings are resource-centric**, not vendor-centric.

- **Vendors** (users with VENDOR role) own **one business** (1:1 relationship)
- **Businesses** own **many resources** (1:N relationship)
- **Users** book **resources** (not businesses directly)
- **OTPs** are used for **email verification** and **forgot password** flows
- **Refresh tokens** enable secure token rotation

This design enables:

- Clear ownership hierarchy
- Flexible resource management
- Scalable booking system
- Prevents vendor account sprawl
- Service isolation and independent scaling

---

## 3. Entities Overview (by Service)

### Auth Service Database

#### 3.1 User

Represents any user in the system (customer, vendor, or admin).

**Attributes**

- id (PK, UUID)
- email (unique)
- username (unique)
- passwordHash (bcrypt hashed)
- firstName (optional)
- lastName (optional)
- phone (optional)
- role (CUSTOMER / VENDOR / ADMIN)
- status (ACTIVE / SUSPENDED / PENDING_VERIFICATION / DELETED)
- isEmailVerified (boolean, default: false)
- lastLoginAt (timestamp, nullable)
- createdAt (timestamp)
- updatedAt (timestamp)

**Relationships**

- One User → Many OTPTokens
- One User → Many RefreshTokens
- One User (VENDOR) → One Business (cross-service relationship, no FK)
- One User (CUSTOMER) → Many Bookings (cross-service relationship, no FK)

**Indexes**

- Unique: email, username
- Index: role, status

---

#### 3.2 OTPToken

Represents OTPs sent to users for verification.

**Attributes**

- id (PK, UUID)
- userId (FK → users.id, CASCADE DELETE)
- otpHash (bcrypt hashed OTP)
- purpose (EMAIL_VERIFICATION / PASSWORD_RESET / TWO_FACTOR_AUTH)
- expiresAt (timestamp)
- consumedAt (timestamp, nullable)
- createdAt (timestamp)

**Relationships**

- Many OTPTokens → One User

**Indexes**

- Index: userId, expiresAt

**Security**

- OTP hashed before storage
- Single-use (consumedAt marks it as used)
- Short expiry (10 minutes)
- Background cleanup job for expired OTPs

---

#### 3.3 RefreshToken

Enables JWT token refresh and revocation.

**Attributes**

- id (PK, UUID)
- userId (FK → users.id, CASCADE DELETE)
- token (unique, JWT string)
- expiresAt (timestamp)
- revokedAt (timestamp, nullable)
- createdAt (timestamp)

**Relationships**

- Many RefreshTokens → One User

**Indexes**

- Unique: token
- Index: userId, expiresAt

**Purpose**

- Long-lived tokens (7 days)
- Enables token rotation
- All tokens revoked on password reset
- Database-backed for revocation support

---

### Business Service Database

#### 3.4 Business

**Purpose**: Represents a business owned by a vendor user.

**Attributes**

- id (PK, UUID)
- ownerId (UNIQUE, vendor userId from Auth Service)
- name (string)
- description (text, nullable)
- type (HOTEL / CLINIC / SALON / CO_WORKING / OTHER)
- address (string, nullable)
- phone (string, nullable)
- email (string, nullable)
- status (PENDING / ACTIVE / INACTIVE / SUSPENDED / DELETED)
- isVerified (boolean, default: false)
- createdAt (timestamp)
- updatedAt (timestamp)

**Cross-Service Relationships** (no database FK):

- One Business → One User (VENDOR) via ownerId
- One Business → Many Resources (in Resource Service)

**Unique Constraint**

- **UNIQUE on ownerId**: Enforces one business per vendor
- Prevents vendor from creating multiple businesses
- Enforced at database and application level

**Indexes**

- Unique: ownerId
- Index: type, status

---

### Resource Service Database

#### 3.5 Resource

A **resource** represents any bookable entity within a business.

**Attributes**

- id (PK, UUID)
- businessId (Foreign reference to Business Service, no DB FK)
- name (string)
- type (HOTEL_ROOM / DOCTOR_SLOT / SALON_CHAIR / DESK / OTHER)
- description (text, nullable)
- categoryId (FK → resource_categories.id, nullable)
- metadata (JSON, default: {}) - Flexible custom attributes
- price (Decimal, 10.2 precision)
- currency (string, default: "USD")
- status (ACTIVE / INACTIVE / MAINTENANCE / DELETED)
- createdAt (timestamp)
- updatedAt (timestamp)

**Relationships**

- Many Resources → One ResourceCategory (optional)
- Many Resources → One Business (cross-service, via businessId)

**Indexes**

- Index: businessId, type, status

**Metadata Examples**:

```json
{
  "bedType": "King",
  "capacity": 2,
  "amenities": ["WiFi", "TV", "AC", "Mini-bar"],
  "floorNumber": 3
}
```

---

#### 3.6 ResourceCategory

Categories for organizing resources within a business.

**Attributes**

- id (PK, UUID)
- businessId (Foreign reference to Business Service)
- name (string, e.g., "Deluxe Room", "Presidential Suite")
- createdAt (timestamp)
- updatedAt (timestamp)

**Relationships**

- One ResourceCategory → Many Resources
- Many ResourceCategories → One Business (cross-service)

**Unique Constraint**

- **UNIQUE on (businessId, name)**: Same business can't have duplicate category names

**Purpose**

- Organize resources (e.g., all "Deluxe" rooms)
- Pricing tiers
- Feature grouping

---

### Booking Service Database

#### 3.7 Booking

**Purpose**: Represents a user booking for a resource.

**Attributes**

- id (PK, UUID)
- userId (Foreign reference to Auth Service)
- vendorId (Foreign reference to Auth Service)
- businessId (Foreign reference to Business Service)
- resourceId (Foreign reference to Resource Service)
- businessName (string, snapshot)
- resourceName (string, snapshot)
- resourceType (string, snapshot)
- priceAtBooking (Decimal, 10.2 precision, snapshot)
- currency (string)
- bookingDate (date)
- startTime (timestamp)
- endTime (timestamp)
- status (PENDING / CONFIRMED / IN_PROGRESS / COMPLETED / CANCELLED / NO_SHOW)
- notes (text, nullable)
- cancelledAt (timestamp, nullable)
- cancelReason (text, nullable)
- createdAt (timestamp)
- updatedAt (timestamp)

**Cross-Service Relationships** (no database FK):

- Many Bookings → One User (via userId)
- Many Bookings → One Vendor User (via vendorId)
- Many Bookings → One Business (via businessId)
- Many Bookings → One Resource (via resourceId)

**Indexes**

- Index: userId, vendorId, businessId, resourceId, bookingDate, status
- **Composite index**: (resourceId, startTime, endTime) for overlap detection

**Snapshot Fields**

- businessName, resourceName, resourceType, priceAtBooking
- **Purpose**: Preserve data at booking time even if resource/business is updated/deleted
- Ensures historical accuracy for invoices and reports

---

## 4. Cross-Service Relationships

### 4.1 No Database Foreign Keys Between Services

**Design Decision**: Services reference each other via IDs but without database-level foreign keys.

**Why?**

- Complete database isolation per service
- Independent schema evolution
- No cascading deletes across services
- Services can be deployed/scaled independently

**Managed At Application Level**:

- Business Service stores `ownerId` (userId from Auth Service)
- Resource Service stores `businessId` (from Business Service)
- Booking Service stores `userId`, `vendorId`, `businessId`, `resourceId`

**Validation**:

- Currently: Minimal cross-service validation
- Future: REST calls or events for validation

---

## 5. Complete ER Diagram

```
┌─────────────────────┐
│   AUTH SERVICE DB   │
├─────────────────────┤
│      User           │ ←─┐
│  - id (PK)          │   │
│  - email (unique)   │   │
│  - username (unique)│   │
│  - passwordHash     │   │
│  - role             │   │
│  - isEmailVerified  │   │
│  - status           │   │
└──┬──────────┬───────┘   │
   │          │            │
   │ 1        │ 1          │ Cross-service
   │          │            │ reference
   │ N        │ N          │ (no FK)
   │          │            │
┌──▼──────┐ ┌▼────────┐   │
│OTPToken │ │Refresh  │   │
│         │ │Token    │   │
└─────────┘ └─────────┘   │
                           │
┌──────────────────────────┼────────────┐
│  BUSINESS SERVICE DB     │            │
├──────────────────────────┼────────────┤
│      Business            │            │
│  - id (PK)              ←┼─ownerId   │
│  - ownerId (UNIQUE) ────┘            │
│  - name                               │
│  - type                               │
│  - status                             │
│  - isVerified                         │
└──┬────────────────────────────────────┘
   │ Cross-service
   │ reference
   │ (no FK)
   │ 1
   │
   │ N
   │
┌──▼──────────────────┐
│ RESOURCE SERVICE DB │
├─────────────────────┤
│     Resource        │
│  - id (PK)          │
│  - businessId ──────┼─ (references Business)
│  - name             │
│  - type             │
│  - categoryId ──┐   │
│  - metadata     │   │
│  - price        │   │
│  - status       │   │
└─────────────────┼───┘
                  │ N
                  │
                  │ 1
              ┌───▼──────────────┐
              │ResourceCategory  │
              │  - id (PK)       │
              │  - businessId    │
              │  - name          │
              └──────────────────┘

┌───────────────────────────────────┐
│     BOOKING SERVICE DB            │
├───────────────────────────────────┤
│         Booking                   │
│  - id (PK)                        │
│  - userId ────────────────────────┼─ (references User)
│  - vendorId ──────────────────────┼─ (references User)
│  - businessId ────────────────────┼─ (references Business)
│  - resourceId ────────────────────┼─ (references Resource)
│  - businessName (snapshot)        │
│  - resourceName (snapshot)        │
│  - resourceType (snapshot)        │
│  - priceAtBooking (snapshot)      │
│  - bookingDate                    │
│  - startTime                      │
│  - endTime                        │
│  - status                         │
│  - cancelledAt                    │
│  - cancelReason                   │
└───────────────────────────────────┘
```

---

## 6. Key Constraints Summary

### Auth Service

- ✅ UNIQUE: email, username
- ✅ UNIQUE: RefreshToken.token
- ✅ CASCADE DELETE: OTPTokens and RefreshTokens when user deleted

### Business Service

- ✅ **UNIQUE: ownerId** (one business per vendor)
- ✅ INDEX: type, status

### Resource Service

- ✅ UNIQUE: (businessId, category name) per category
- ✅ INDEX: businessId, type, status
- ✅ OPTIONAL: categoryId (resources can exist without category)

### Booking Service

- ✅ **COMPOSITE INDEX**: (resourceId, startTime, endTime) for overlap prevention
- ✅ INDEX: userId, vendorId, businessId, resourceId, bookingDate, status
- ✅ Snapshot fields for data integrity

---

## 7. Design Benefits

✅ **Service Isolation**: Each service owns its data completely
✅ **Independent Scaling**: Services scale based on their load
✅ **Schema Evolution**: Services can update schemas independently
✅ **No Cascading Failures**: Database issues in one service don't affect others
✅ **Clear Ownership**: Repository pattern enforces data access boundaries
✅ **Multi-Tenancy Ready**: Can easily support tenant-specific databases
✅ **Audit Trail**: Booking snapshots preserve historical data
✅ **One Business Per Vendor**: Prevents vendor account sprawl

This ER design supports a production-ready microservices architecture with clean boundaries and scalability.

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

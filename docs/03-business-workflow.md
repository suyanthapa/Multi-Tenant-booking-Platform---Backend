# Business Workflow

## 1. Overview

This document explains the **end-to-end business workflows** of the multi-tenant, resource-based booking platform using microservices architecture.

It focuses on:

- User interactions and request flows
- API Gateway routing and authentication
- Service responsibilities with Repository Pattern
- Success and failure scenarios
- Clear separation of responsibilities across microservices

---

## 2. System Architecture

### Service Overview

```
Client → API Gateway (Port 3000)
         ↓ (JWT Auth + Routing)
    ┌────┴────┬─────────┬──────────┐
    ↓         ↓         ↓          ↓
  Auth    Business  Resource   Booking
 (3001)    (3003)   (3004)     (3002)
    ↓         ↓         ↓          ↓
 Auth DB  Business  Resource  Booking
          DB        DB        DB
```

### Backend Services

- **API Gateway** (Port 3000): Request routing, JWT authentication, service proxy
- **Auth Service** (Port 3001): User management, JWT tokens, OTP verification
- **Business Service** (Port 3003): Business management (one business per vendor)
- **Resource Service** (Port 3004): Resource and category management
- **Booking Service** (Port 3002): Booking lifecycle and overlap validation

---

## 3. User Registration & Authentication Flow

### 3.1 User Registration with OTP Verification

**Step-by-Step Flow**:

1. **Client** → **API Gateway**: POST /api/auth/register
   ```json
   {
     "email": "user@example.com",
     "username": "johndoe",
     "password": "SecurePass123",
     "firstName": "John",
     "lastName": "Doe",
     "role": "CUSTOMER"
   }
   ```

2. **API Gateway** → **Auth Service**: Proxies request to port 3001

3. **Auth Service** (using Repository Pattern):
   - **UserRepository.findByEmail()**: Checks if email exists
   - **UserRepository.findByUsername()**: Checks if username exists
   - Hashes password using bcrypt
   - **UserRepository.create()**: Creates user with:
     - status: `PENDING_VERIFICATION`
     - isEmailVerified: false
   - **OTPRepository.create()**: Generates 6-digit OTP
     - Hashes OTP and stores with:
     - purpose: `EMAIL_VERIFICATION`
     - expiresAt: current time + 10 minutes
   
4. **Future Enhancement**: Emit event to Notification Service for OTP email

5. **Response to Client**:
   ```json
   {
     "success": true,
     "message": "OTP sent to email. Please verify.",
     "userId": "uuid"
   }
   ```

---

### 3.2 Email Verification Flow

1. **Client** → **API Gateway**: POST /api/auth/verify-email
   ```json
   {
     "userId": "uuid",
     "otp": "123456"
   }
   ```

2. **Auth Service**:
   - **OTPRepository.findValidOTP()**: 
     - Finds OTP for user with purpose `EMAIL_VERIFICATION`
     - Checks not expired (expiresAt > now)
     - Checks not consumed (consumedAt is null)
   - Compares hashed OTP with provided OTP using bcrypt
   - **OTPRepository.markConsumed()**: Sets consumedAt timestamp
   - **UserRepository.update()**: Updates user:
     - isEmailVerified: true
     - status: `ACTIVE`

3. **Generate JWT Tokens**:
   - Access token (15 minutes expiry)
   - Refresh token (7 days expiry)
   - **RefreshTokenRepository.create()**: Stores refresh token in database

4. **Response**:
   ```json
   {
     "success": true,
     "accessToken": "jwt...",
     "refreshToken": "jwt...",
     "user": { "id": "uuid", "email": "...", "role": "CUSTOMER" }
   }
   ```

---

### 3.3 Login Flow

1. **Client** → **API Gateway**: POST /api/auth/login
   ```json
   {
     "identifier": "johndoe",  // username or email
     "password": "SecurePass123"
   }
   ```

2. **Auth Service**:
   - **UserRepository.findByEmailOrUsername()**: Finds user
   - Validates password using bcrypt
   - Checks isEmailVerified === true
   - Checks status === `ACTIVE`
   - Generates access + refresh tokens
   - **RefreshTokenRepository.create()**: Stores new refresh token
   - Updates lastLoginAt timestamp

3. Returns JWT tokens and user info

---

### 3.4 Token Refresh Flow

1. **Client** → **API Gateway**: POST /api/auth/refresh-token
   ```json
   {
     "refreshToken": "jwt..."
   }
   ```

2. **Auth Service**:
   - Validates JWT signature
   - **RefreshTokenRepository.findByToken()**: Checks token exists and not revoked
   - Checks expiresAt > now
   - Generates new access token
   - Optionally rotates refresh token
   - Returns new tokens

---

### 3.5 Forgot Password Flow

1. **Client** → **API Gateway**: POST /api/auth/forgot-password
   ```json
   {
     "email": "user@example.com"
   }
   ```

2. **Auth Service**:
   - **UserRepository.findByEmail()**: Finds user
   - **OTPRepository.create()**: Generates OTP with purpose `PASSWORD_RESET`
   - Returns success (don't reveal if email exists for security)

3. **Client** → **API Gateway**: POST /api/auth/reset-password
   ```json
   {
     "email": "user@example.com",
     "otp": "123456",
     "newPassword": "NewSecurePass123"
   }
   ```

4. **Auth Service**:
   - Validates OTP (same process as email verification)
   - Hashes new password
   - **UserRepository.update()**: Updates password
   - **RefreshTokenRepository.revokeAllForUser()**: Revokes all refresh tokens
   - **OTPRepository.markConsumed()**: Marks OTP as consumed

---

## 4. Vendor Business Management Flow

### 4.1 Vendor Business Creation

**Constraint**: Each vendor can own exactly **ONE business** (enforced via unique constraint on ownerId)

1. **Client** (Vendor role) → **API Gateway**: POST /api/businesses
   ```json
   {
     "name": "Grand Hotel Pokhara",
     "description": "Luxury hotel in the heart of Pokhara",
     "type": "HOTEL",
     "address": "Lakeside, Pokhara",
     "phone": "+977-61-123456",
     "email": "info@grandhotel.com"
   }
   ```

2. **API Gateway**:
   - Validates JWT token
   - Extracts userId from token
   - Forwards request to **Business Service**

3. **Business Service**:
   - **BusinessRepository.findByOwnerId()**: Checks if vendor already has a business
   - If exists, returns error: "Vendor can only own one business"
   - **BusinessRepository.create()**: Creates business:
     - ownerId: userId from JWT
     - status: `PENDING`
     - isVerified: false
   - Returns created business

4. **Response**:
   ```json
   {
     "id": "business-uuid",
     "name": "Grand Hotel Pokhara",
     "status": "PENDING",
     "isVerified": false,
     "message": "Business created. Waiting for admin verification."
   }
   ```

---

### 4.2 Admin Business Verification

1. **Client** (Admin role) → **API Gateway**: PATCH /api/businesses/:id/verify

2. **Business Service**:
   - Verifies requester has ADMIN role
   - **BusinessRepository.update()**: 
     - isVerified: true
     - status: `ACTIVE`

3. **Future**: Emit event to notify vendor

---

### 4.3 Business Status Toggle

1. **Vendor** → **API Gateway**: PATCH /api/businesses/:id/status
   ```json
   {
     "status": "INACTIVE"  // Vendor can toggle between ACTIVE/INACTIVE
   }
   ```

2. **Business Service**:
   - Verifies ownership (ownerId === userId from JWT)
   - **BusinessRepository.update()**: Updates status
   - Only allows: ACTIVE ↔ INACTIVE (vendor cannot set SUSPENDED or DELETED)

---

## 5. Resource Management Flow

### 5.1 Create Resource Category

1. **Vendor** → **API Gateway**: POST /api/resources/categories
   ```json
   {
     "businessId": "business-uuid",
     "name": "Deluxe Room"
   }
   ```

2. **Resource Service**:
   - Verifies vendor owns the business (queries businessId)
   - **ResourceCategoryRepository.findByBusinessAndName()**: Checks uniqueness
   - **ResourceCategoryRepository.create()**: Creates category
   - Returns category with ID

---

### 5.2 Create Resource

1. **Vendor** → **API Gateway**: POST /api/resources
   ```json
   {
     "businessId": "business-uuid",
     "name": "Deluxe Room 101",
     "type": "HOTEL_ROOM",
     "categoryId": "category-uuid",
     "description": "Spacious room with mountain view",
     "price": 150.00,
     "currency": "USD",
     "metadata": {
       "bedType": "King",
       "capacity": 2,
       "amenities": ["WiFi", "TV", "AC"]
     }
   }
   ```

2. **Resource Service**:
   - Verifies vendor owns business
   - **ResourceRepository.create()**: Creates resource:
     - status: `ACTIVE` (default)
     - Stores metadata as JSON
   - Returns created resource

---

### 5.3 Get Resources by Business

1. **Client** → **API Gateway**: GET /api/resources?businessId=uuid

2. **Resource Service**:
   - **ResourceRepository.findByBusiness()**: Fetches resources
   - Filters by status (can exclude DELETED)
   - Returns resource list with categories

---

## 6. Booking Creation Flow (Core Workflow)

### 6.1 Successful Booking Flow

**Prerequisites**:
- User authenticated (JWT token)
- Resource exists and is ACTIVE
- Business is ACTIVE and verified

1. **Client** → **API Gateway**: POST /api/bookings
   ```json
   {
     "resourceId": "resource-uuid",
     "bookingDate": "2025-02-15",
     "startTime": "2025-02-15T14:00:00Z",
     "endTime": "2025-02-15T16:00:00Z",
     "notes": "Birthday celebration"
   }
   ```

2. **API Gateway**:
   - Validates JWT token
   - Extracts userId
   - Forwards to **Booking Service**

3. **Booking Service** (Critical Validation):
   
   a. **Fetch Resource Data** (currently from Booking DB or passed in):
      - In future: Call Resource Service to get resource details
      - Get: resourceName, resourceType, price, businessId, vendorId
   
   b. **Overlap Check**:
      - **BookingRepository.findOverlapping()**:
        ```sql
        SELECT * FROM bookings 
        WHERE resourceId = ? 
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
        AND (
          (startTime < ? AND endTime > ?) OR
          (startTime < ? AND endTime > ?)
        )
        ```
      - Uses index on (resourceId, startTime, endTime)
      - If overlap found, return error: "Resource not available"
   
   c. **Create Booking**:
      - **BookingRepository.create()**:
        ```json
        {
          "userId": "user-uuid",
          "vendorId": "vendor-uuid",  // from resource owner
          "businessId": "business-uuid",
          "resourceId": "resource-uuid",
          "businessName": "Grand Hotel Pokhara",  // snapshot
          "resourceName": "Deluxe Room 101",      // snapshot
          "resourceType": "HOTEL_ROOM",           // snapshot
          "priceAtBooking": 150.00,              // snapshot
          "currency": "USD",
          "bookingDate": "2025-02-15",
          "startTime": "2025-02-15T14:00:00Z",
          "endTime": "2025-02-15T16:00:00Z",
          "status": "PENDING",
          "notes": "Birthday celebration"
        }
        ```

4. **Response**:
   ```json
   {
     "id": "booking-uuid",
     "status": "PENDING",
     "resourceName": "Deluxe Room 101",
     "bookingDate": "2025-02-15",
     "totalPrice": 150.00,
     "message": "Booking created successfully"
   }
   ```

---

### 6.2 Booking State Transitions

**Status Flow**:
```
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
   ↓
CANCELLED
```

**Status Updates**:

1. **Confirm Booking**: PENDING → CONFIRMED
   - Vendor/Admin action or automatic after payment

2. **Start Booking**: CONFIRMED → IN_PROGRESS
   - Automated based on startTime or manual check-in

3. **Complete Booking**: IN_PROGRESS → COMPLETED
   - Automated based on endTime or manual check-out

4. **Cancel Booking**: ANY → CANCELLED
   - User or vendor can cancel
   - Records cancelledAt timestamp and cancelReason

---

### 6.3 Get User Bookings

1. **Client** → **API Gateway**: GET /api/bookings?userId=uuid&status=CONFIRMED

2. **Booking Service**:
   - **BookingRepository.findByUser()**: 
     - Filters by userId, status (optional)
     - Orders by bookingDate DESC
   - Returns booking list with snapshot data

---

### 6.4 Cancel Booking

1. **Client** → **API Gateway**: PATCH /api/bookings/:id/cancel
   ```json
   {
     "reason": "Change of plans"
   }
   ```

2. **Booking Service**:
   - Verifies ownership (userId === booking.userId) or ADMIN role
   - Checks cancellation policy (e.g., not already completed)
   - **BookingRepository.update()**:
     - status: `CANCELLED`
     - cancelledAt: current timestamp
     - cancelReason: provided reason
   
3. **Future**: Emit event for refund processing (if paid)

---

## 7. Error Handling & Edge Cases

### 7.1 Authentication Errors

- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Valid token but insufficient permissions (wrong role)
- **User not verified**: Return error if isEmailVerified = false

### 7.2 Business Validation Errors

- **One Business Per Vendor**: Return 409 if vendor already owns business
- **Business Not Verified**: Prevent resource creation if business not verified
- **Invalid Status Transition**: Vendor cannot set status to SUSPENDED

### 7.3 Booking Validation Errors

- **Resource Unavailable**: Overlapping booking exists
- **Invalid Time Range**: endTime <= startTime
- **Past Date Booking**: bookingDate < current date
- **Resource Not Active**: Resource status is INACTIVE or DELETED
- **Business Inactive**: Business status not ACTIVE

### 7.4 Repository Layer Error Handling

```typescript
try {
  const user = await userRepository.findByEmail(email);
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    // Handle unique constraint violations, foreign key errors
  }
  throw new InternalServerError("Database operation failed");
}
```

---

## 8. Security Considerations

### 8.1 JWT Token Security

- Access tokens: Short-lived (15 minutes)
- Refresh tokens: Longer-lived (7 days), stored in database
- Token revocation on password reset
- Token rotation on refresh

### 8.2 OTP Security

- OTPs are hashed before storage
- Single-use (marked consumed after validation)
- Short expiry (10 minutes)
- Background job cleans expired OTPs

### 8.3 Authorization

- **API Gateway**: Validates JWT on protected routes
- **Service Layer**: Verifies ownership before mutations
- **Repository Layer**: No authorization logic (pure data access)

### 8.4 Data Snapshots

- Bookings store resource/business names and prices at booking time
- Prevents historical data corruption if resource is updated/deleted
- Ensures audit trail and invoice accuracy

---

## 9. Future Enhancements

### 9.1 Inter-Service Communication

- Booking Service → Resource Service: Real-time availability check
- Resource Service → Business Service: Ownership verification
- All Services → Notification Service: Event-driven notifications

### 9.2 Event-Driven Architecture

- User registered → Send welcome email
- Business verified → Notify vendor
- Booking confirmed → Send confirmation email
- Booking completed → Request review

### 9.3 Payment Integration

- Payment Service for booking payments
- Khalti/Stripe integration
- Refund processing on cancellations
- Vendor payout management

---

## 10. Summary

The system implements a clean microservices architecture with:

✅ **API Gateway** for centralized routing and authentication
✅ **Repository Pattern** for data access abstraction
✅ **Database-per-Service** for complete isolation
✅ **Connection Pooling** for optimal performance
✅ **JWT Authentication** with refresh token support
✅ **OTP-based verification** for email and password reset
✅ **One Business Per Vendor** enforced at database level
✅ **Resource Categories** for flexible organization
✅ **Overlap Prevention** with indexed queries
✅ **Data Snapshots** for booking integrity
✅ **Clean Architecture** with clear layer separation

This architecture ensures scalability, maintainability, and production readiness.

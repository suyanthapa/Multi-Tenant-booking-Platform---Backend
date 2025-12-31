# Auth Service

A robust, production-ready authentication and authorization microservice built with Node.js, TypeScript, Express, and Prisma ORM. This service provides secure user authentication, email verification, password management, and role-based access control for a multi-tenant SaaS platform.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Authentication Flow](#authentication-flow)
- [Security Measures](#security-measures)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Inter-Service Communication](#inter-service-communication)

---

## Overview

The Auth Service is a critical component of a distributed microservices architecture, responsible for managing user identity, authentication, and authorization across the entire platform. It serves as the single source of truth for user credentials and access control, communicating with other services (Booking, Vendor, Payment) to ensure secure, authorized operations.

---

## Key Features

### 🔐 Authentication & Authorization

- **JWT-based authentication** with access and refresh token mechanism
- **Role-based access control (RBAC)** supporting Customer, Vendor, and Admin roles
- **HTTP-only cookies** for secure token storage
- **Token refresh mechanism** for seamless user experience

### 📧 Email Verification

- **OTP-based email verification** during registration
- **6-digit OTP** with configurable expiration (default: 10 minutes)
- **Resend verification OTP** functionality
- **Secure OTP storage** using SHA-256 hashing

### 🔑 Password Management

- **Secure password hashing** using bcrypt (10 rounds)
- **Forgot password** flow with OTP verification
- **Password reset** with OTP validation
- **Password strength enforcement** (minimum 8 characters, complexity rules)

### 🛡️ Security Features

- **Rate limiting** to prevent brute force attacks
- **Input validation** using Zod schemas
- **Helmet.js** for HTTP security headers
- **CORS** configuration for cross-origin requests
- **SQL injection protection** via Prisma ORM
- **XSS protection** through input sanitization

### 📊 User Management

- User registration with email uniqueness checks
- User profile retrieval
- User status management (Active, Suspended, Pending Verification, Deleted)
- Last login tracking

---

## Technology Stack

| Technology             | Purpose                     |
| ---------------------- | --------------------------- |
| **Node.js**            | Runtime environment         |
| **TypeScript**         | Type-safe development       |
| **Express**            | Web framework               |
| **Prisma ORM**         | Database ORM and migrations |
| **PostgreSQL**         | Primary database            |
| **JWT**                | Token-based authentication  |
| **Bcrypt**             | Password hashing            |
| **Zod**                | Schema validation           |
| **Nodemailer**         | Email sending               |
| **Winston**            | Structured logging          |
| **Helmet**             | Security headers            |
| **Express Rate Limit** | Rate limiting               |

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                  (Web App / Mobile App / API)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTP/HTTPS Requests
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUTH SERVICE (PORT 5001)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │   Routes     │──▶│ Controllers  │──▶│  Services    │        │
│  │              │   │              │   │              │        │
│  │ - /register  │   │ - register() │   │ - Business   │        │
│  │ - /login     │   │ - login()    │   │   Logic      │        │
│  │ - /verify    │   │ - verify()   │   │ - OTP        │        │
│  │ - /forgot-pw │   │ - reset()    │   │ - JWT        │        │
│  └──────────────┘   └──────────────┘   └──────┬───────┘        │
│         ▲                                      │                 │
│         │                                      ▼                 │
│  ┌──────┴───────┐                    ┌──────────────┐           │
│  │ Middlewares  │                    │ Repositories │           │
│  │              │                    │              │           │
│  │ - Auth       │                    │ - User Repo  │           │
│  │ - Validator  │                    │ - OTP Repo   │           │
│  │ - Rate Limit │                    │ - Token Repo │           │
│  └──────────────┘                    └──────┬───────┘           │
│                                              │                   │
└──────────────────────────────────────────────┼───────────────────┘
                                               │
                                               ▼
                                    ┌─────────────────┐
                                    │   PostgreSQL    │
                                    │   Database      │
                                    │                 │
                                    │ - users         │
                                    │ - otp_tokens    │
                                    │ - refresh_tokens│
                                    └─────────────────┘
```

### Service Communication

```
┌──────────────┐        JWT Validation        ┌──────────────┐
│   Booking    │◀────────────────────────────▶│     Auth     │
│   Service    │       User Info Request      │   Service    │
└──────────────┘                               └──────────────┘
                                                      ▲
                                                      │
                                                      │
┌──────────────┐                               ┌─────┴────────┐
│   Vendor     │◀──────────────────────────────│   Payment    │
│   Service    │    Token Verification         │   Service    │
└──────────────┘                               └──────────────┘
```

---

## Database Schema

### User Model

```prisma
model User {
  id              String     @id @default(uuid())
  email           String     @unique
  username        String     @unique
  passwordHash    String
  firstName       String?
  lastName        String?
  phone           String?
  role            UserRole   @default(CUSTOMER)
  status          UserStatus @default(PENDING_VERIFICATION)
  isEmailVerified Boolean    @default(false)
  lastLoginAt     DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  otpTokens       OTPToken[]
  refreshTokens   RefreshToken[]
}
```

**Roles:**

- `CUSTOMER` - Regular platform users
- `VENDOR` - Service providers
- `ADMIN` - Platform administrators

**Status:**

- `ACTIVE` - Fully verified and active
- `SUSPENDED` - Temporarily disabled
- `PENDING_VERIFICATION` - Awaiting email verification
- `DELETED` - Soft-deleted accounts

### OTP Token Model

```prisma
model OTPToken {
  id         String     @id @default(uuid())
  userId     String
  otpHash    String     (SHA-256 hashed)
  purpose    OTPPurpose
  expiresAt  DateTime
  consumedAt DateTime?
  createdAt  DateTime   @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

**OTP Purposes:**

- `EMAIL_VERIFICATION` - Verify email during registration
- `PASSWORD_RESET` - Verify identity for password reset
- `TWO_FACTOR_AUTH` - (Reserved for future 2FA implementation)

### Refresh Token Model

```prisma
model RefreshToken {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

---

## API Endpoints

### Public Endpoints

#### 1. User Registration

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "CUSTOMER",
      "status": "PENDING_VERIFICATION"
    },
    "message": "Registration successful. Please verify your email."
  }
}
```

#### 2. Email Verification

```http
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "Email verified successfully"
  }
}
```

#### 3. Resend Verification OTP

```http
POST /api/v1/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "Verification OTP sent to your email"
  }
}
```

#### 4. User Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
Set-Cookie: accessToken=...; HttpOnly; Secure
Set-Cookie: refreshToken=...; HttpOnly; Secure

{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "CUSTOMER",
      "isEmailVerified": true
    },
    "message": "Login successful"
  }
}
```

#### 5. Refresh Access Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json
Cookie: refreshToken=...

{
  "refreshToken": "..." (optional, if not in cookie)
}

Response: 200 OK
Set-Cookie: accessToken=...; HttpOnly; Secure

{
  "success": true,
  "data": {
    "message": "Token refreshed successfully"
  }
}
```

#### 6. Logout

```http
POST /api/v1/auth/logout
Cookie: refreshToken=...

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

#### 7. Forgot Password

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "Password reset OTP sent to your email"
  }
}
```

#### 8. Reset Password

```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

### Protected Endpoints

#### 9. Get Current User Profile

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
OR
Cookie: accessToken=...

Response: 200 OK
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "isEmailVerified": true,
      "lastLoginAt": "2025-12-31T10:00:00Z",
      "createdAt": "2025-12-01T10:00:00Z"
    }
  }
}
```

---

## Authentication Flow

### 1. Registration & Email Verification Flow

```
┌────────┐                                           ┌────────────┐
│ Client │                                           │ Auth Service│
└───┬────┘                                           └─────┬──────┘
    │                                                      │
    │  1. POST /register                                   │
    │  {email, username, password}                         │
    ├─────────────────────────────────────────────────────▶│
    │                                                      │
    │                                         2. Hash password
    │                                         3. Create user (status: PENDING)
    │                                         4. Generate 6-digit OTP
    │                                         5. Hash and store OTP
    │                                         6. Send OTP email
    │                                                      │
    │  7. 201 Created                                      │
    │  {user, message: "Verify email"}                     │
    │◀─────────────────────────────────────────────────────┤
    │                                                      │
    │  8. POST /verify-email                               │
    │  {email, otp}                                        │
    ├─────────────────────────────────────────────────────▶│
    │                                                      │
    │                                         9. Validate OTP
    │                                        10. Mark user verified
    │                                        11. Update status to ACTIVE
    │                                        12. Mark OTP as consumed
    │                                                      │
    │  13. 200 OK                                          │
    │  {message: "Email verified"}                         │
    │◀─────────────────────────────────────────────────────┤
    │                                                      │
```

### 2. Login & Token Generation Flow

```
┌────────┐                                           ┌────────────┐
│ Client │                                           │ Auth Service│
└───┬────┘                                           └─────┬──────┘
    │                                                      │
    │  1. POST /login                                      │
    │  {email, password}                                   │
    ├─────────────────────────────────────────────────────▶│
    │                                                      │
    │                                         2. Find user by email
    │                                         3. Verify user is ACTIVE
    │                                         4. Compare password hash
    │                                         5. Generate access token (15m)
    │                                         6. Generate refresh token (7d)
    │                                         7. Store refresh token in DB
    │                                         8. Update lastLoginAt
    │                                                      │
    │  9. 200 OK                                           │
    │  Set-Cookie: accessToken (HttpOnly, Secure)          │
    │  Set-Cookie: refreshToken (HttpOnly, Secure)         │
    │  {user}                                              │
    │◀─────────────────────────────────────────────────────┤
    │                                                      │
```

### 3. Token Refresh Flow

```
┌────────┐                                           ┌────────────┐
│ Client │                                           │ Auth Service│
└───┬────┘                                           └─────┬──────┘
    │                                                      │
    │  1. POST /refresh                                    │
    │  Cookie: refreshToken                                │
    ├─────────────────────────────────────────────────────▶│
    │                                                      │
    │                                         2. Extract refresh token
    │                                         3. Verify token signature
    │                                         4. Check if token in DB
    │                                         5. Verify not expired/revoked
    │                                         6. Generate new access token
    │                                                      │
    │  7. 200 OK                                           │
    │  Set-Cookie: accessToken (new)                       │
    │◀─────────────────────────────────────────────────────┤
    │                                                      │
```

### 4. Forgot Password Flow

```
┌────────┐                                           ┌────────────┐
│ Client │                                           │ Auth Service│
└───┬────┘                                           └─────┬──────┘
    │                                                      │
    │  1. POST /forgot-password                            │
    │  {email}                                             │
    ├─────────────────────────────────────────────────────▶│
    │                                                      │
    │                                         2. Find user by email
    │                                         3. Generate 6-digit OTP
    │                                         4. Hash and store OTP
    │                                         5. Send OTP email
    │                                                      │
    │  6. 200 OK                                           │
    │  {message: "OTP sent"}                               │
    │◀─────────────────────────────────────────────────────┤
    │                                                      │
    │  7. POST /reset-password                             │
    │  {email, otp, newPassword}                           │
    ├─────────────────────────────────────────────────────▶│
    │                                                      │
    │                                         8. Validate OTP
    │                                         9. Hash new password
    │                                        10. Update user password
    │                                        11. Revoke all refresh tokens
    │                                        12. Mark OTP as consumed
    │                                                      │
    │  13. 200 OK                                          │
    │  {message: "Password reset"}                         │
    │◀─────────────────────────────────────────────────────┤
    │                                                      │
```

---

## Security Measures

### 🔒 Authentication Security

- **JWT tokens** with short expiration (15 minutes for access, 7 days for refresh)
- **HTTP-only cookies** prevent XSS attacks from stealing tokens
- **Secure cookie flag** ensures transmission only over HTTPS
- **SameSite cookie attribute** protects against CSRF attacks
- **Refresh token rotation** invalidates old tokens on refresh

### 🔐 Password Security

- **Bcrypt hashing** with salt rounds (10 rounds)
- **Password complexity requirements**: minimum 8 characters, uppercase, lowercase, numbers
- **No password storage in logs** or error messages
- **Password reset** requires OTP verification

### 🛡️ OTP Security

- **SHA-256 hashing** of OTP before storage
- **Time-limited validity** (10 minutes)
- **One-time consumption** - OTP marked as consumed after use
- **Rate limiting** on OTP generation and verification
- **Cannot reuse consumed OTPs**

### 🚨 Rate Limiting

- **Login attempts**: 5 requests per 15 minutes per IP
- **OTP generation**: 3 requests per 15 minutes per email
- **Registration**: 3 requests per hour per IP
- **Password reset**: 3 requests per 15 minutes per email

### 🔍 Input Validation

- **Zod schemas** for type-safe validation
- **Email format validation**
- **Username format** (alphanumeric, 3-20 characters)
- **Phone number validation**
- **SQL injection protection** via Prisma parameterized queries
- **XSS prevention** through input sanitization

### 📝 Security Headers (via Helmet)

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy` headers

### 🔄 Token Management

- **Access tokens** stored in HTTP-only cookies
- **Refresh tokens** stored in database with revocation capability
- **Token blacklisting** on logout
- **Automatic cleanup** of expired tokens

---

## Project Structure

```
services/auth/
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   └── migrations/                 # Database migration history
│       └── 20251228144025_auth_schema_created/
│           └── migration.sql
│
├── src/
│   ├── index.ts                    # Application entry point
│   ├── seed.ts                     # Database seeding script
│   │
│   ├── config/
│   │   ├── index.ts                # Configuration aggregator
│   │   └── database.ts             # Database connection config
│   │
│   ├── controllers/
│   │   └── auth.controller.ts      # HTTP request handlers
│   │       - register()            # User registration handler
│   │       - login()               # User login handler
│   │       - verifyEmail()         # Email verification handler
│   │       - forgotPassword()      # Password reset request handler
│   │       - resetPassword()       # Password reset handler
│   │       - refreshToken()        # Token refresh handler
│   │       - logout()              # Logout handler
│   │       - getProfile()          # User profile retrieval
│   │
│   ├── services/
│   │   ├── auth.service.ts         # Authentication business logic
│   │   │   - register()            # User registration logic
│   │   │   - login()               # Authentication logic
│   │   │   - verifyEmail()         # Email verification logic
│   │   │   - generateTokens()      # JWT token generation
│   │   │   - refreshAccessToken()  # Token refresh logic
│   │   ├── email.service.ts        # Email sending service
│   │   │   - sendVerificationOTP() # Send verification email
│   │   │   - sendPasswordResetOTP()# Send password reset email
│   │   └── otp.service.ts          # OTP generation and validation
│   │       - generateOTP()         # Generate 6-digit OTP
│   │       - verifyOTP()           # Validate OTP
│   │       - hashOTP()             # Hash OTP for storage
│   │
│   ├── repositories/
│   │   ├── user.repository.ts      # User data access layer
│   │   │   - create()              # Create new user
│   │   │   - findByEmail()         # Find user by email
│   │   │   - findById()            # Find user by ID
│   │   │   - update()              # Update user details
│   │   ├── otp.repository.ts       # OTP token data access
│   │   │   - create()              # Store OTP token
│   │   │   - findValid()           # Find valid OTP
│   │   │   - markConsumed()        # Mark OTP as used
│   │   │   - cleanup()             # Remove expired OTPs
│   │   └── refreshToken.repository.ts # Refresh token data access
│   │       - create()              # Store refresh token
│   │       - findByToken()         # Find token
│   │       - revoke()              # Revoke token
│   │       - revokeAll()           # Revoke all user tokens
│   │
│   ├── middlewares/
│   │   ├── auth.ts                 # Authentication middleware
│   │   │   - authenticate()        # Verify JWT token
│   │   │   - authorize()           # Role-based authorization
│   │   │   - optionalAuth()        # Optional authentication
│   │   ├── validator.ts            # Request validation middleware
│   │   │   - validate()            # Zod schema validation
│   │   └── errorHandler.ts         # Global error handler
│   │       - errorHandler()        # Centralized error handling
│   │       - notFound()            # 404 handler
│   │
│   ├── routes/
│   │   ├── index.ts                # Route aggregator
│   │   └── auth.routes.ts          # Authentication routes
│   │
│   ├── utils/
│   │   ├── asyncHandler.ts         # Async error wrapper
│   │   ├── crypto.ts               # Cryptographic utilities
│   │   │   - hashPassword()        # Bcrypt password hashing
│   │   │   - comparePassword()     # Password comparison
│   │   │   - hashOTP()             # SHA-256 OTP hashing
│   │   ├── errors.ts               # Custom error classes
│   │   │   - AppError              # Base error class
│   │   │   - ValidationError       # Validation errors
│   │   │   - AuthenticationError   # Auth errors
│   │   │   - AuthorizationError    # Authorization errors
│   │   │   - NotFoundError         # 404 errors
│   │   ├── jwt.ts                  # JWT utilities
│   │   │   - generateAccessToken() # Create access token
│   │   │   - generateRefreshToken()# Create refresh token
│   │   │   - verifyAccessToken()   # Verify access token
│   │   │   - verifyRefreshToken()  # Verify refresh token
│   │   ├── logger.ts               # Winston logger configuration
│   │   └── validators.ts           # Zod validation schemas
│   │       - registerSchema        # Registration validation
│   │       - loginSchema           # Login validation
│   │       - verifyEmailSchema     # Email verification
│   │       - forgotPasswordSchema  # Forgot password
│   │       - resetPasswordSchema   # Reset password
│   │
│   └── generated/                  # Prisma generated client
│       └── prisma/
│
├── logs/                           # Application logs
├── package.json                    # Project dependencies
├── tsconfig.json                   # TypeScript configuration
├── prisma.config.ts               # Prisma configuration
└── README.md                      # This file
```

---

## Environment Variables

Create a `.env` file in the service root:

```env
# Application
NODE_ENV=development
PORT=5001
API_VERSION=v1

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/auth_db

# JWT Secrets
JWT_ACCESS_SECRET=your_access_token_secret_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_key_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cookie Settings
COOKIE_HTTP_ONLY=true
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
COOKIE_MAX_AGE=604800000

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@yourapp.com

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Other Services (for inter-service communication)
BOOKING_SERVICE_URL=http://localhost:5002
VENDOR_SERVICE_URL=http://localhost:5003
PAYMENT_SERVICE_URL=http://localhost:5004
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd services/auth
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**

   ```bash
   npm run prisma:migrate
   ```

5. **Generate Prisma client**

   ```bash
   npm run prisma:generate
   ```

6. **Start development server**

   ```bash
   npm run dev
   ```

   The service will be available at `http://localhost:5001`

### Database Management

```bash
# Create a new migration
npm run prisma:migrate

# Open Prisma Studio (GUI for database)
npm run prisma:studio

# Reset database (development only)
npx prisma migrate reset

# Seed database
npm run seed
```

### Building for Production

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

---

## Inter-Service Communication

The Auth Service acts as the identity provider for the entire microservices ecosystem. Other services communicate with it to validate user identity and authorization.

### How Other Services Use Auth Service

#### 1. Token Validation Pattern

Other services (Booking, Vendor, Payment) receive JWT tokens from clients and need to validate them:

```typescript
// Example: Booking Service validating a token
import jwt from "jsonwebtoken";

function validateToken(token: string) {
  try {
    // Verify token using the same JWT_ACCESS_SECRET
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    return payload; // Contains userId, email, role
  } catch (error) {
    throw new Error("Invalid token");
  }
}
```

#### 2. User Information Retrieval

Services can call Auth Service's `/auth/me` endpoint to get full user details:

```typescript
// Example: Vendor Service getting user details
async function getUserDetails(userId: string) {
  const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
}
```

#### 3. Role-Based Authorization

Each service can implement its own authorization logic using the `role` from JWT payload:

```typescript
// Example: Payment Service checking admin access
function requireAdmin(req, res, next) {
  const { role } = req.user; // Extracted from JWT
  if (role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}
```

#### 4. Shared Secret Configuration

All services must share the same JWT secrets for token validation:

```env
# All services should have these same values
JWT_ACCESS_SECRET=same_secret_across_all_services
JWT_REFRESH_SECRET=same_refresh_secret_across_all_services
```

### Service Communication Flow

```
┌──────────┐      1. Request with JWT      ┌──────────────┐
│  Client  │──────────────────────────────▶│   Booking    │
└──────────┘                                │   Service    │
                                            └──────┬───────┘
                                                   │
                                    2. Validate JWT locally
                                    (using shared secret)
                                                   │
                                            ┌──────▼───────┐
                                            │  JWT Payload │
                                            │  - userId    │
                                            │  - role      │
                                            │  - email     │
                                            └──────────────┘
                                                   │
                          3. (Optional) Get full user details
                                                   │
                                            ┌──────▼───────┐
                                            │     Auth     │
                                            │   Service    │
                                            │  GET /me     │
                                            └──────────────┘
```

### Security Considerations for Inter-Service Communication

1. **Service-to-Service Authentication**: Implement API keys or mTLS for internal service calls
2. **Network Isolation**: Services should communicate over a private network
3. **Rate Limiting**: Apply rate limits on inter-service endpoints
4. **Logging**: Log all inter-service requests for audit trails
5. **Circuit Breakers**: Implement fallback mechanisms if Auth Service is unavailable

### Future: API Gateway Pattern

For production, consider implementing an API Gateway:

```
┌─────────┐
│ Clients │
└────┬────┘
     │
┌────▼──────────────┐
│   API Gateway     │
│  - Auth           │
│  - Rate Limiting  │
│  - Load Balancing │
└────┬──────────────┘
     │
     ├────▶ Auth Service
     ├────▶ Booking Service
     ├────▶ Vendor Service
     └────▶ Payment Service
```

---

## Error Handling

The service implements comprehensive error handling with appropriate HTTP status codes:

| Error Type            | Status Code | Example                    |
| --------------------- | ----------- | -------------------------- |
| Validation Error      | 400         | Invalid email format       |
| Authentication Error  | 401         | Invalid credentials        |
| Authorization Error   | 403         | Insufficient permissions   |
| Not Found Error       | 404         | User not found             |
| Conflict Error        | 409         | Email already exists       |
| Rate Limit Error      | 429         | Too many requests          |
| Internal Server Error | 500         | Database connection failed |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  }
}
```

---

## Logging

Winston-based structured logging with log levels:

- **error**: Critical errors requiring immediate attention
- **warn**: Warning messages for potentially harmful situations
- **info**: General informational messages
- **http**: HTTP request logs
- **debug**: Detailed debugging information

Logs are stored in:

- Console (development)
- `logs/app.log` (all logs)
- `logs/error.log` (errors only)

---

## Contributing

This service follows standard Git workflow:

1. Create a feature branch from `main`
2. Implement changes with tests
3. Ensure all tests pass and code is linted
4. Submit pull request for review

---

## License

ISC

---

## Contact

For questions or support, please contact the development team.

---

## Roadmap

### Planned Features

- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, GitHub, LinkedIn)
- [ ] Account lockout after failed login attempts
- [ ] Password history to prevent reuse
- [ ] Session management dashboard
- [ ] Email change with verification
- [ ] Phone number verification
- [ ] WebAuthn/FIDO2 support
- [ ] Audit logs for sensitive operations
- [ ] GraphQL API endpoint

---

**Built with ❤️ using modern TypeScript and best practices.**

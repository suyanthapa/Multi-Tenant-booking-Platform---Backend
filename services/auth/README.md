# Auth Service

Professional authentication and authorization microservice with comprehensive error handling.

## Features

✅ User registration with email verification
✅ Secure login with JWT tokens
✅ Refresh token mechanism
✅ Password reset with OTP
✅ Role-based access control (RBAC)
✅ Comprehensive error handling
✅ Rate limiting
✅ Request validation with Zod
✅ Database integration with Prisma
✅ Email notifications
✅ Structured logging
✅ Health checks

## Tech Stack

- **Node.js** + **TypeScript**
- **Express.js** - Web framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Zod** - Validation
- **Winston** - Logging
- **Nodemailer** - Email service

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── index.ts      # App configuration
│   └── database.ts   # Database connection
├── controllers/      # Request handlers
│   └── auth.controller.ts
├── middlewares/      # Express middlewares
│   ├── auth.ts       # Authentication middleware
│   ├── validator.ts  # Validation middleware
│   └── errorHandler.ts
├── routes/           # API routes
│   ├── index.ts
│   └── auth.routes.ts
├── services/         # Business logic
│   ├── auth.service.ts
│   ├── otp.service.ts
│   └── email.service.ts
├── utils/            # Utility functions
│   ├── errors.ts     # Custom error classes
│   ├── validators.ts # Zod schemas
│   ├── jwt.ts        # JWT utilities
│   ├── crypto.ts     # Password & OTP hashing
│   ├── logger.ts     # Winston logger
│   └── asyncHandler.ts
└── index.ts          # App entry point
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:4000`

## API Endpoints

### Authentication

| Method | Endpoint                    | Description             | Auth Required |
| ------ | --------------------------- | ----------------------- | ------------- |
| POST   | `/api/auth/register`        | Register new user       | No            |
| POST   | `/api/auth/verify-email`    | Verify email with OTP   | No            |
| POST   | `/api/auth/login`           | Login user              | No            |
| POST   | `/api/auth/refresh`         | Refresh access token    | No            |
| POST   | `/api/auth/logout`          | Logout user             | No            |
| POST   | `/api/auth/forgot-password` | Request password reset  | No            |
| POST   | `/api/auth/reset-password`  | Reset password with OTP | No            |
| GET    | `/api/auth/me`              | Get current user        | Yes           |

### Health Check

| Method | Endpoint  | Description           |
| ------ | --------- | --------------------- |
| GET    | `/health` | Service health status |

## API Usage Examples

### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "Password123!",
  "role": "CUSTOMER"
}
```

### Verify Email

```bash
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "123456"
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Get Profile (Protected)

```bash
GET /api/auth/me
Authorization: Bearer <access_token>
```

## Error Handling

The service uses custom error classes for consistent error responses:

- `ValidationError` (400) - Invalid input
- `AuthenticationError` (401) - Authentication failed
- `AuthorizationError` (403) - Insufficient permissions
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Resource already exists
- `RateLimitError` (429) - Too many requests
- `InternalServerError` (500) - Server error

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "errors": [
      {
        "field": "email",
        "message": "Invalid email address"
      }
    ]
  }
}
```

## Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT with short expiry (15 min access, 7 day refresh)
- ✅ Refresh token rotation
- ✅ Rate limiting (100 req/15min general, 10 req/15min auth)
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Prisma)
- ✅ OTP for email verification and password reset
- ✅ Request logging with correlation IDs

## Database Schema

### Users

- id, email, username, passwordHash
- firstName, lastName, phone
- role (CUSTOMER, VENDOR, ADMIN)
- status (ACTIVE, SUSPENDED, PENDING_VERIFICATION)
- Email verification status
- Timestamps

### OTPTokens

- id, userId, otpHash
- purpose (EMAIL_VERIFICATION, PASSWORD_RESET)
- expiresAt, consumedAt
- Timestamps

### RefreshTokens

- id, userId, token
- expiresAt, revokedAt
- Timestamps

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
```

## Environment Variables

See `.env.example` for all required environment variables.

## Logging

Logs are stored in `logs/` directory:

- `error.log` - Error level logs
- `combined.log` - All logs

Console logging enabled in development mode.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure proper database URL
4. Set up email service (SMTP)
5. Configure CORS allowed origins
6. Set up proper logging infrastructure
7. Enable HTTPS
8. Set up monitoring and alerts

## License

ISC

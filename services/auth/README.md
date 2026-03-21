# Auth Service

## Service Overview

Auth Service is an Express + TypeScript microservice for authentication and identity management in the multi-tenant platform.

It provides:

- user registration (customer and business vendor)
- email verification and OTP flows
- login/logout with access and refresh tokens
- password reset flow
- admin user management
- internal user validation endpoint for other services

Default local port: `3001`

## Tech Stack

- Node.js + TypeScript
- Express 5
- Prisma ORM + PostgreSQL (`@prisma/adapter-pg` + `pg`)
- JWT (`jsonwebtoken`)
- Validation: Zod
- Security/middleware: helmet, cors, cookie-parser, express-rate-limit
- Logging: winston (+ daily rotate), custom request logger
- Email: nodemailer + resend
- Dev tools: ts-node-dev, Prisma CLI

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create env file (from example):

```bash
cp .env.example .env
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run migrations:

```bash
npm run prisma:migrate
```

5. Start service:

```bash
npm run dev
```

Health check:

```bash
GET http://localhost:3001/health
```

## Environment Variables

From `.env.example` and runtime config (`src/config/index.ts`), these variables are used:

- `NODE_ENV` (default: `development`)
- `PORT` (default fallback: `4000`, compose/env commonly uses `3001`)
- `DATABASE_URL` (required)
- `JWT_ACCESS_SECRET` (required)
- `JWT_REFRESH_SECRET` (required)
- `JWT_RESET_SECRET` (required)
- `JWT_ACCESS_EXPIRES_IN` (default: `30m`)
- `JWT_REFRESH_EXPIRES_IN` (default: `7d`)
- `BCRYPT_SALT_ROUNDS` (default: `10`)
- `EMAIL_HOST` (default: `smtp.gmail.com`)
- `EMAIL_PORT` (default: `587`)
- `EMAIL_SECURE` (default: `false`)
- `EMAIL_USER` (required)
- `EMAIL_PASSWORD` (required)
- `EMAIL_FROM` (default: `noreply@booking.com`)
- `RESEND_API_KEY` (required)
- `RATE_LIMIT_WINDOW_MS` (default: `900000`)
- `RATE_LIMIT_MAX` (default: `100`)
- `OTP_EXPIRY_MINUTES` (default: `15`)
- `OTP_LENGTH` (default: `6`)
- `ALLOWED_ORIGINS` (comma-separated for CORS)
- `COOKIE_SAME_SITE` (used in env; cookie policy also depends on `NODE_ENV`)
- `COOKIE_SECURE` (optional override)
- `INTERNAL_SERVICE_SECRET` (required for internal endpoint auth middleware)

## Database & Prisma Usage

Schema file: `prisma/schema.prisma`

### Models

- `User`
  - fields include: `email`, `username`, `passwordHash`, `role`, `status`, `isEmailVerified`
  - relation: one-to-many with `OTPToken` and `RefreshToken`
- `OTPToken`
  - linked to `User` by `userId`
  - stores OTP hash, purpose, expiry, and consumed timestamp
- `RefreshToken`
  - linked to `User` by `userId`
  - stores token lifecycle fields (`expiresAt`, `revokedAt`)

### Enums

- `UserRole`: `CUSTOMER`, `VENDOR`, `ADMIN`
- `UserStatus`: `ACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION`, `DELETED`
- `OTPPurpose`: `EMAIL_VERIFICATION`, `PASSWORD_RESET`, `TWO_FACTOR_AUTH`

### Prisma commands

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

Prisma config: `prisma.config.ts` (includes datasource URL and seed command).

## Seeding Instructions (Manual Only)

Seed file: `prisma/seed.ts`

What it seeds:

- 10 deterministic users (`auth_user_seed_001` ... `auth_user_seed_010`)
- 8 email-verified users
- 2 pending/unverified users

Run manually:

```bash
npx prisma db seed
```

Optional seed password override:

```bash
SEED_PASSWORD=YourPassword123 npx prisma db seed
```

## API Endpoints

Base path: `/api`

### Health

- `GET /health`

### Auth Routes

- `POST /api/auth/register`
- `POST /api/auth/register-business`
- `POST /api/auth/verify-email`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-verification`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me` (requires auth)

### Admin User Routes

- `GET /api/auth/users` (ADMIN)
- `PATCH /api/auth/users/:userId` (ADMIN)
- `DELETE /api/auth/users/:userId` (ADMIN)

### Internal Routes

- `GET /api/internal/:userId/validate` (requires `x-internal-key` header)

## Project Structure

```text
services/auth/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── clients/
│   ├── config/
│   ├── controllers/
│   ├── dtos/
│   ├── interfaces/
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── index.ts
├── Dockerfile
├── prisma.config.ts
└── package.json
```

## Docker Usage

This service is containerized and wired from the repository root compose file.

### Build and run only auth service

```bash
docker compose up --build auth-service
```

### Run in detached mode

```bash
docker compose up -d --build auth-service
```

Current compose mapping for auth:

- container port: `3001`
- host port: `3001`

Container uses:

- `services/auth/Dockerfile`
- env file: `services/auth/.env`

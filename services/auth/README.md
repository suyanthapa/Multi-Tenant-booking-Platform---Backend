# Auth Service

Auth Service is an Express + TypeScript microservice that handles authentication, OTP flows, token lifecycle, and admin user management in the multi-tenant platform.

## Recent Updates

- Added comprehensive unit tests for AuthService methods and auth middleware.
- Migrated API documentation to modular YAML-based OpenAPI files.
- Exposed Swagger UI at `/docs` and OpenAPI JSON at `/docs.json`.
- Added reusable response components for auth and user endpoints.

## Features

- User registration (customer and vendor)
- Email verification and OTP flows
- Login/logout with access + refresh token cookies
- Refresh token rotation
- Forgot/reset password flow
- Admin user management (get/edit/delete users)
- Internal user validation endpoint for inter-service use

## Tech Stack

- Node.js + TypeScript
- Express 5
- Prisma ORM + PostgreSQL
- JWT (`jsonwebtoken`)
- Validation: Zod
- Security/middleware: helmet, cors, cookie-parser
- Logging: winston + daily rotate + request logger
- Email providers: nodemailer + resend
- Testing: Jest + ts-jest

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Create environment file

```bash
cp .env.example .env
```

3. Generate Prisma client

```bash
npm run prisma:generate
```

4. Apply migrations

```bash
npm run prisma:migrate
```

5. Start in development mode

```bash
npm run dev
```

Service URLs (default local setup):

- API root: `http://localhost:3001/`
- Health: `http://localhost:3001/health`
- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs.json`

## NPM Scripts

- `npm run dev`: Start service with ts-node-dev
- `npm run build`: Build TypeScript to `dist`
- `npm run start`: Run compiled build
- `npm run test`: Run unit tests once
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Run tests with coverage
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Create/apply Prisma migration (dev)
- `npm run prisma:studio`: Open Prisma Studio

## Testing

Unit tests are organized by concern:

- `src/tests/unit/services/auth`: AuthService auth-domain methods
- `src/tests/unit/services/user`: AuthService user-management methods
- `src/tests/unit/middleware`: auth middleware tests

Current tested methods include:

- `register`
- `login`
- `verifyEmail`
- `verifyOtp`
- `resendEmailVerificationOTP`
- `refreshToken`
- `forgotPassword`
- `resetPassword`
- `getProfile`
- `getAllUsers`
- `editUser`
- `deleteUser`
- `validateUser`

Run tests:

```bash
npm test
```

## API Documentation (Swagger / OpenAPI)

OpenAPI is loaded from modular YAML files:

- `docs/components/schemas.yaml`
- `docs/components/response.yaml`
- `docs/paths/health.yaml`
- `docs/paths/auth.yaml`
- `docs/paths/user.yaml`

Swagger config entrypoint:

- `src/config/swagger.ts`

Runtime docs endpoints:

- `GET /docs` for Swagger UI
- `GET /docs.json` for raw OpenAPI JSON

## API Endpoints

Base path: `/api`

Health:

- `GET /health`

Auth routes:

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
- `GET /api/auth/me` (authenticated)

User routes (admin only):

- `GET /api/auth/users`
- `PATCH /api/auth/users/:userId`
- `DELETE /api/auth/users/:userId`

Internal routes:

- `GET /api/internal/:userId/validate` (requires `x-internal-key`)

## Environment Variables

Core required variables:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_RESET_SECRET`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `RESEND_API_KEY`
- `INTERNAL_SERVICE_SECRET`

Common optional variables (with defaults in config):

- `NODE_ENV` (default `development`)
- `PORT` (default `4000`)
- `JWT_ACCESS_EXPIRES_IN` (default `30m`)
- `JWT_REFRESH_EXPIRES_IN` (default `7d`)
- `BCRYPT_SALT_ROUNDS` (default `10`)
- `OTP_EXPIRY_MINUTES` (default `15`)
- `OTP_LENGTH` (default `6`)
- `ALLOWED_ORIGINS` (comma-separated)
- `COOKIE_SECURE` (override)

## Database and Seeding

- Prisma schema: `prisma/schema.prisma`
- Seed script: `prisma/seed.ts`

Seed database manually:

```bash
npx prisma db seed
```

Optional seed password override:

```bash
SEED_PASSWORD=YourPassword123 npx prisma db seed
```

## Docker

Run auth service only:

```bash
docker compose up --build auth-service
```

Detached mode:

```bash
docker compose up -d --build auth-service
```

Container mapping (compose):

- host port `3001`
- container port `3001`

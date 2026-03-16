# Booking Service

Booking lifecycle service for the multi-tenant backend.

## Overview

The Booking Service is responsible for creating, retrieving, updating, cancelling, and deleting bookings. It also supports role-aware booking access (user/vendor/admin) and filtered booking queries.

Default local URL: http://localhost:3001

## Responsibilities

- create bookings
- list bookings with filters and pagination
- fetch booking by ID
- update booking details
- cancel booking
- list user bookings
- list vendor bookings
- delete booking (admin)

## Route Map

Routes are mounted under `/api/bookings`.

- Health check: `GET /health`
- Root API prefix: `/api`

### Endpoints

- `POST /api/bookings`
- `GET /api/bookings`
- `GET /api/bookings/:id`
- `PATCH /api/bookings/:id`
- `POST /api/bookings/:id/cancel`
- `GET /api/bookings/user/:userId`
- `GET /api/bookings/vendor/:vendorId`
- `DELETE /api/bookings/:id`

## Auth and Access Control

- Most endpoints require authentication middleware.
- Vendor booking route requires role `VENDOR` or `ADMIN`.
- Delete route requires role `ADMIN`.
- JWT secret must match the auth issuer (`JWT_ACCESS_SECRET`).

## Environment Variables

Copy `.env.example` to `.env` and update values.

```env
PORT=3002
NODE_ENV=development

DATABASE_URL=postgresql://username:password@localhost:5432/booking_db

JWT_ACCESS_SECRET=your-access-secret-key-change-in-production

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

COOKIE_SAME_SITE=strict
COOKIE_MAX_AGE=604800000
```

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Create env file

```powershell
Copy-Item .env.example .env
```

3. Generate Prisma client

```bash
npm run prisma:generate
```

4. Run migrations

```bash
npm run prisma:migrate
```

5. Start development server

```bash
npm run dev
```

6. Verify health

```bash
curl http://localhost:3002/health
```

## Scripts

- `npm run dev` - run with hot reload
- `npm run build` - compile TypeScript
- `npm start` - run compiled build
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - run Prisma migrate dev
- `npm run prisma:studio` - open Prisma Studio
- `npm run lint` - run ESLint on src
- `npm run format` - run Prettier on src
- `npm test` - run tests

## Project Structure

```text
services/booking/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── index.ts
├── logs/
├── .env.example
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── README.md
```

## Common Issues

- Invalid token or 401 responses:
  - confirm `JWT_ACCESS_SECRET` is the same value used by auth/gateway.
- Database connection issues:
  - verify `DATABASE_URL` and database availability.
- Prisma runtime errors after schema changes:
  - run `npm run prisma:generate` and `npm run prisma:migrate`.

## Notes

- Service logs are written with Winston and HTTP requests are logged with Morgan.
- CORS, rate limiting, helmet, and cookie parsing are enabled in app middleware.

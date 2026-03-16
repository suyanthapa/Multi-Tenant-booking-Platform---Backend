# Auth Service

Authentication and authorization service for the multi-tenant backend.

## Overview

Handles user registration, login, email/OTP verification, password reset, token management, and inter-service identity validation.

Base service URL (local): `http://localhost:3001`.

## Key Features

- JWT-based authentication with access & refresh tokens
- OTP/email verification and password reset
- Role-based access control (Customer, Vendor, Admin)
- Internal user validation for other services

## API Routes

Public: `/api/auth/*`  
User management: `/api/auth/users/*`  
Internal: `/api/internal/*`  
Health: `/health`

**Main Endpoints**

- `POST /api/auth/register`, `/login`, `/logout`, `/refresh`
- `POST /api/auth/verify-email`, `/resend-verification`, `/forgot-password`, `/reset-password`
- `GET /api/auth/me`

**Admin Endpoints**

- `GET /api/auth/users`
- `PATCH /api/auth/users/:userId`
- `DELETE /api/auth/users/:userId`

**Internal Endpoint**

- `GET /api/internal/:userId/validate`

## Environment Variables

See `.env.example`. Required: `PORT`, `DATABASE_URL`, JWT secrets, email credentials, OTP settings, rate limits, CORS origins.

## Local Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
curl http://localhost:3001/health
```

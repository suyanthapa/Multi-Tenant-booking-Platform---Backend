# Business Service

Business domain service for vendor onboarding and business management.

## Overview

This service handles:

- business creation by vendors
- business listing, filtering, and detail lookup
- business update/delete/toggle-status operations
- admin verification, approval, and rejection flows
- internal validation endpoints for other services

Default local URL: http://localhost:3003

## Route Map

Routes are mounted under /api.

- Public/protected business routes: /api/businesses/\*
- Internal routes: /api/internal/businesses/\*
- Health check: /health

### Business Endpoints

- POST /api/businesses
- GET /api/businesses
- GET /api/businesses/my-businesses
- POST /api/businesses/search
- GET /api/businesses/type/:type
- GET /api/businesses/:id
- PATCH /api/businesses/:id
- DELETE /api/businesses/:id
- PATCH /api/businesses/:id/toggle-status
- PATCH /api/businesses/:id/approve
- PATCH /api/businesses/:id/reject
- PATCH /api/businesses/:id/verify

### Internal Endpoints

- GET /api/internal/businesses/:id/exists
- GET /api/internal/businesses/:id/validate
- GET /api/internal/businesses/user/:userId/business
- POST /api/internal/businesses/search
- POST /api/internal/businesses
- POST /api/internal/businesses/email-verify

## Environment Variables

Copy .env.example to .env and update values.

```env
PORT=3003
NODE_ENV=development

DATABASE_URL=postgresql://username:password@host:5432/business_db?schema=public

JWT_ACCESS_SECRET=your-access-secret-key-change-in-production

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

COOKIE_SAME_SITE=strict
COOKIE_MAX_AGE=604800000
```

Additional variables used by service config for email and gateway-restricted CORS:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@example.com
EMAIL_SECURE=false
API_GATEWAY_URL=http://localhost:8000
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

3. Generate Prisma client and run migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start development server

```bash
npm run dev
```

5. Verify service health

```bash
curl http://localhost:3003/health
```

## Scripts

- npm run dev
- npm run build
- npm start
- npm run prisma:generate
- npm run prisma:migrate
- npm run prisma:studio
- npm run lint
- npm run format
- npm test

## Notes

- Internal endpoints should be called only by trusted services through internal auth middleware.
- Keep gateway URL and service CORS settings consistent with your deployment setup.

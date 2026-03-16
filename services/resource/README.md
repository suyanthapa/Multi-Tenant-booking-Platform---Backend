# Resource Service

Resource and category management service for tenant businesses.

## Overview

This service handles:

- resource CRUD operations
- bulk resource creation
- resource queries by business and type
- resource stats and status toggling
- category CRUD operations
- internal category/resource verification endpoints

Default local URL: http://localhost:3004

## Route Map

Routes are mounted under /api.

- Resource/category routes: /api/resources/\*
- Internal routes: /api/internal/resources/\*
- Health check: /health

### Resource and Category Endpoints

- GET /api/resources
- POST /api/resources
- POST /api/resources/bulk
- GET /api/resources/business/:businessId
- GET /api/resources/type/:type
- GET /api/resources/stats/:businessId
- GET /api/resources/:id
- PATCH /api/resources/:id
- DELETE /api/resources/:id
- PATCH /api/resources/:id/toggle-status

- GET /api/resources/admin/categories
- GET /api/resources/vendor/categories
- POST /api/resources/categories
- GET /api/resources/categories/:id
- PATCH /api/resources/categories/:id
- DELETE /api/resources/categories/:id

### Internal Endpoints

- POST /api/internal/resources/categories/:categoryId/exists
- POST /api/internal/resources/categories/:categoryId/active-resources
- POST /api/internal/resources/batch-active-categories

## Environment Variables

Copy .env.example to .env and update values.

```env
PORT=3004
NODE_ENV=development

DATABASE_URL=postgresql://username:password@host:5432/resource_db?schema=public

JWT_ACCESS_SECRET=your-access-secret-key-change-in-production

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
curl http://localhost:3004/health
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

- Most endpoints are protected with auth and role middleware.
- Internal endpoints should be restricted to trusted internal callers only.

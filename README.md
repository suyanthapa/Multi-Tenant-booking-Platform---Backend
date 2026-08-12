# Multi-Tenant Resource Booking Platform

A microservices backend for a multi-tenant booking domain, built with Node.js, TypeScript, Express, Prisma, and PostgreSQL.

This root README is the main onboarding guide for running the full backend locally and understanding how the repository is organized.

## Live Site

[slotexapp.me](https://slotexapp.me)

> **Note:** The platform is still under active development. Some flows and pages may be incomplete, unstyled, or subject to change. Please treat this as a work-in-progress preview rather than a finished product.

## What This Repository Contains

- API Gateway for request routing and auth-aware proxying
- Auth service for users, credentials, OTP, and token lifecycle
- Business service for vendor business management and verification
- Resource service for inventory/resource management
- Booking service for booking creation, lifecycle, and availability checks
- Design and architecture docs
- Bruno API collections for manual testing

## High-Level Architecture

Client apps call the API Gateway, and the gateway forwards requests to domain services. Each service owns its own schema and data access layer.

```text
Clients
	|
	v
API Gateway
	|----> Auth Service
	|----> Business Service
	|----> Resource Service
	\----> Booking Service
```

## Service Communication

Services communicate through REST APIs.

- API Gateway routes requests to internal services
- Each service exposes internal HTTP endpoints
- Authentication is validated using JWT tokens issued by the Auth Service

Future improvement: Event-driven communication using message queues.

## Tech Stack

- Runtime: Node.js + TypeScript
- HTTP framework: Express
- ORM: Prisma
- Database: PostgreSQL
- Validation: Zod
- Auth: JWT + refresh token flow

## Repository Structure

```text
tenant-backend/
├── api-gateway/                  # API gateway service
│   ├── src/
│   ├── package.json
│   └── README.md
├── services/
│   ├── auth/
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── .env.example
│   │   └── package.json
│   ├── business/
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── .env.example
│   │   └── package.json
│   ├── booking/
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── .env.example
│   │   └── package.json
│   └── resource/
│       ├── src/
│       ├── prisma/
│       ├── .env.example
│       └── package.json
├── docs/                         # Architecture and design docs
├── Multi Tenant/                 # Bruno API collections
├── docker-compose.yaml
└── README.md
```

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+
- PostgreSQL 15+ (or Docker Desktop)
- Git

Optional but recommended:

- Bruno for API testing using the collection in Multi Tenant/

## Service Port Map

Current service defaults in code and compose are:

- API Gateway: 8000 in code and docker-compose.yaml
- Auth Service: 3001
- Booking Service: 3002
- Business Service: 3003
- Resource Service: 3004

If you run services manually, keep URLs and ports aligned across all env files.

## Environment Setup

### 1) Service env files

Create env files from examples for each domain service:

- services/auth/.env from services/auth/.env.example
- services/business/.env from services/business/.env.example
- services/booking/.env from services/booking/.env.example
- services/resource/.env from services/resource/.env.example

The gateway does not currently include a committed .env.example, so create api-gateway/.env with at least:

```env
AUTH_SERVICE_URL=http://localhost:3001
BOOKING_SERVICE_URL=http://localhost:3002
BUSINESS_SERVICE_URL=http://localhost:3003
RESOURCE_SERVICE_URL=http://localhost:3004
JWT_ACCESS_SECRET=replace_me
ALLOWED_ORIGIN=http://localhost:3000
```

### 2) Database URLs

Each service needs its own DATABASE_URL. You can use different databases in one Postgres instance, for example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/auth_db?schema=public
```

Repeat with service-specific database names for business, booking, and resource.

## Local Development (Manual)

Run this once per service directory:

```bash
npm install
```

For Prisma services, run migrations/generate:

```bash
npx prisma generate
npx prisma migrate dev
```

Start each service in separate terminals:

```bash
# api-gateway/
npm run dev

# services/auth/
npm run dev

# services/business/
npm run dev

# services/booking/
npm run dev

# services/resource/
npm run dev
```

Health checks:

- Gateway: GET /health
- Auth: http://localhost:3001/health
- Business: http://localhost:3003/health
- Booking: http://localhost:3002/health
- Resource: http://localhost:3004/health

## Local Development (Docker Compose)

The repository includes docker-compose.yaml. Run:

```bash
docker compose up --build
```

Notes:

- Current compose expects env files under each service folder.
- Verify that gateway runtime port and compose port mapping are aligned for your local setup.

## CI/CD

Continuous Integration is implemented using GitHub Actions.

Pipeline steps:

1. Install dependencies
2. Generate Prisma client
3. Run database migrations
4. Build services

Workflows are located in:

.github/workflows/

## Build and Quality Commands

Each package has its own scripts in package.json:

- npm run build
- npm run dev
- npm run start

Most services also declare:

- npm run lint
- npm run test

If lint/test fail due to missing project-level config, add ESLint/Jest configuration in each service before enforcing as CI required checks.

## API Testing

Use the Bruno collection in Multi Tenant/.

Suggested order for smoke testing:

1. Auth register/login
2. Business create and fetch
3. Resource create/list
4. Booking create/list/cancel

## Documentation Index

Architecture and design docs are in docs/.

- [docs/00-overview.md](docs/00-overview.md)
- [docs/01business-requirements.md](docs/01business-requirements.md)
- [docs/02-system-design.md](docs/02-system-design.md)
- [docs/03-business-workflow.md](docs/03-business-workflow.md)
- [docs/04-er-diagram.md](docs/04-er-diagram.md)
- [docs/05-datatbase-design.md](docs/05-datatbase-design.md)
- [docs/06-docker-setup-and-communication.md](docs/06-docker-setup-and-communication.md)
- [docs/CHALLENGES.md](docs/CHALLENGES.md)
- [docs/GATEWAY_CHALLENGES.md](docs/GATEWAY_CHALLENGES.md)
- [docs/LEARNINGS.md](docs/LEARNINGS.md)
- [docs/REFACTOR-AUTH.md](docs/REFACTOR-AUTH.md)

## Service Readmes

Detailed per-service behavior and routes are documented in:

- [api-gateway/README.md](api-gateway/README.md)
- [services/auth/README.md](services/auth/README.md)
- [services/business/README.md](services/business/README.md)
- [services/booking/README.md](services/booking/README.md)
- [services/resource/README.md](services/resource/README.md)

## Deployment

Databases are hosted on Neon.

Each service can be deployed independently using container-based deployments.

## Engineering Articles

- [The Hidden Performance Cost of Uncoordinated Prisma Clients](https://medium.com/@suyanthapa07/the-hidden-performance-cost-of-uncoordinated-prisma-clients-84f67d2f496b)  
  Explains how improper Prisma client usage can cause connection issues and how a Singleton pattern improves performance.

- [Decoupling Data: Building Scalable Node.js Backends with the Repository Pattern](https://medium.com/@suyanthapa07/decoupling-data-building-scalable-node-js-backends-with-the-repository-pattern-7df8218dbde9)  
  Demonstrates using the repository pattern to separate data access logic from business logic in Node.js applications.

## Future Improvements

- Event-driven architecture using message queues
- Distributed caching using Redis

## License

Suyan Thapa

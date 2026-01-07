# Multi-Tenant Resource Booking Platform

A microservices-based booking platform built with Node.js, TypeScript, Prisma, and PostgreSQL.

## Architecture

This project follows a microservices architecture with an API Gateway pattern. Each service is independently deployable and maintains its own database.

## Services

- **API Gateway** - Routes requests to appropriate microservices
- **Auth Service** - User authentication, registration, and OTP verification
- **Business Service** - Business registration and management (one business per vendor)
- **Resource Service** - Bookable resource management
- **Booking Service** - Booking lifecycle and availability management

## Documentation

Comprehensive documentation is available in the `/docs` folder:

- [System Design](docs/02-system-design.md)
- [Database Design](docs/05-datatbase-design.md)
- [ER Diagram](docs/04-er-diagram.md)
- [Technical Challenges](docs/CHALLENGES.md)

## Resources

### Architecture Patterns

- [Decoupling Data: Building Scalable Node.js Backends with the Repository Pattern](https://medium.com/@suyanthapa07/decoupling-data-building-scalable-node-js-backends-with-the-repository-pattern-7df8218dbde9) - Learn about the repository pattern implementation used in this project

-[The Hidden Performance Cost of Uncoordinated Prisma Clients](https://medium.com/@suyanthapa07/the-hidden-performance-cost-of-uncoordinated-prisma-clients-84f67d2f496b) - Understand how connection management impacts Prisma performance and learn a robust Singleton-based solution.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod

## Project Structure

```
tenant/
├── api-gateway/          # API Gateway service
├── services/
│   ├── auth/            # Authentication service
│   ├── business/        # Business management service
│   ├── booking/         # Booking service
│   └── resource/        # Resource management service
├── docs/                # Project documentation
└── Multi Tenant/        # API testing (Bruno)
```

## Getting Started

Each service has its own README with specific setup instructions. Generally:

1. Install dependencies: `npm install`
2. Set up environment variables: `.env`
3. Run migrations: `npx prisma migrate dev`
4. Start the service: `npm run dev`

## Key Design Decisions

- **One business per vendor** - Enforced via UNIQUE constraint on `owner_id`
- **Database per service** - Each microservice owns its database
- **Connection pooling** - Singleton pattern with pg connection pool
- **Repository pattern** - Clean separation of data access logic
- **Strong typing** - TypeScript throughout with Prisma-generated types

## License

This project is for educational purposes.

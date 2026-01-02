# Multi-Tenant Booking Platform – Backend

This project is a backend-focused, production-oriented booking platform

The system allows users to book time-based resources owned by vendors, process payments securely, prevent double bookings, and handle asynchronous workflows such as notifications and booking expiry.

This repository follows a documentation-first approach. The initial phase focuses on business requirements and system design before implementation.

## Key Backend Concepts Demonstrated

- Clean Architecture
- Microservices-based design
- Secure authentication & RBAC
- Transaction-safe booking logic
- SQL database design (PostgreSQL + Prisma)
- Background jobs & caching
- Production-ready deployment thinking

## Tech Stack (Planned)

- Node.js + TypeScript
- Express / NestJS
- PostgreSQL
- Prisma ORM
- Redis (caching & queues)

## Documentation

Detailed design and decisions can be found in the `docs/` folder.

## 📝 Architecture & Challenges

This project implements a microservices architecture using an API Gateway.
For a detailed breakdown of the technical challenges faced (such as request stream handling and dynamic path rewriting), see [GATEWAY_CHALLENGES.md](.docs/GATEWAY_CHALLENGES.md).

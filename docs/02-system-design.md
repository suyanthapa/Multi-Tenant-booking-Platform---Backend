# System Design

## Architecture Overview

The system is designed using a **microservice-oriented architecture** with clear service boundaries to improve scalability, security, and maintainability.

## Services

### Auth Service

- Handles authentication and authorization
- Issues JWT tokens
- Manages user roles

### Booking Service

- Manages resources and availability
- Handles booking lifecycle
- Ensures transaction safety and consistency

### Payment Service

- Handles payment initiation and verification
- Calculates platform commission
- Supports idempotent payment operations

### Notification Service

- Sends emails and notifications asynchronously
- Triggered via background jobs

## Communication

- Services communicate via HTTP APIs
- Asynchronous workflows handled using queues
- Redis used for caching and background jobs

## Design Rationale

This separation allows independent scaling, clearer responsibility, and easier reasoning about failures.

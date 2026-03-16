# Docker Setup and Service Communication Guide

This document explains how Docker is set up in this repository, how the root compose file controls all services, and how requests move between services.

## 1. What starts everything

The main entry point is `docker-compose.yaml` at the repository root.

When you run:

```bash
docker compose up --build
```

Compose does the following:

1. Reads service definitions from the root compose file.
2. Builds images for services that use `build:`.
3. Creates a shared Docker network (default network for this project).
4. Starts containers and applies `depends_on` startup order.
5. Maps container ports to your host machine ports.

## 2. Services defined in compose

The compose file currently defines:

- postgres
- api-gateway
- auth-service
- booking-service
- business-service
- resource-service

### Port mapping

- api-gateway: `8000:8000`
- auth-service: `3001:3001`
- booking-service: `3002:3002`
- business-service: `3003:3003`
- resource-service: `3004:3004`
- postgres: `5432:5432`

Left side is host port, right side is container port.

## 3. How each image is built

Each service has its own Dockerfile. The pattern is mostly:

1. `FROM node:20`
2. `WORKDIR /app`
3. `COPY package*.json ./`
4. `RUN npm install`
5. `COPY . .`
6. For domain services: `RUN npm run prisma:generate` and `RUN npm run build`
7. `EXPOSE <service-port>`
8. `CMD ["npm", "run", "dev"]`

Important note: even though TypeScript is built during image build, containers still run with `npm run dev` at runtime.

## 4. Root compose -> service runtime connection

### api-gateway service

In compose, gateway receives these environment variables:

- `AUTH_SERVICE_URL=http://auth-service:3001`
- `BOOKING_SERVICE_URL=http://booking-service:3002`
- `BUSINESS_SERVICE_URL=http://business-service:3003`
- `RESOURCE_SERVICE_URL=http://resource-service:3004`

These are consumed by gateway code in `api-gateway/src/config/service.ts`.

### Why service names matter

Inside Docker, `localhost` means "this same container", not another service.

So:

- `http://localhost:3001` from inside `api-gateway` tries to reach gateway container itself
- `http://auth-service:3001` correctly reaches the auth container over Docker DNS

This is why service-to-service URLs should use compose service names.

## 5. Request flow from client to service

Gateway routing is configured in `api-gateway/src/index.ts`:

- `/api/auth` -> auth service proxy
- `/api/businesses/search` -> business service proxy
- `/api/businesses` -> authenticate first, then business proxy
- `/api/resources` -> authenticate first, then resource proxy
- `/api/bookings` -> authenticate + rate limit, then booking proxy

Proxy behavior is implemented in `api-gateway/src/utils/proxy.ts`.

### What the proxy does

1. Forwards request to the target service URL.
2. Preserves original path using `pathRewrite` to keep the full route.
3. Logs request forwarding for observability.
4. Adds user context headers when request is authenticated:
   - `x-user-id`
   - `x-user-role`
   - `x-user-email`
5. Strips upstream CORS headers so gateway is the single CORS authority.
6. Returns `502 Service Unavailable` if upstream connection fails.

## 6. Authentication propagation between services

Gateway auth middleware in `api-gateway/src/middlewares/auth.middleware.ts`:

1. Removes any incoming spoofed `x-user-*` headers.
2. Reads access token from cookie or Bearer token.
3. Verifies JWT using `JWT_ACCESS_SECRET`.
4. Attaches decoded user data to request.
5. Sets trusted `x-user-*` headers for downstream services.

Downstream services can trust these internal headers when they come from gateway.

## 7. How services communicate with each other

There are two communication layers:

1. External/client layer:
   - Client -> api-gateway (single public entry)
2. Internal/service layer:
   - gateway -> auth/business/resource/booking over Docker network
   - service -> service calls (if implemented) using HTTP and internal URLs

### Internal DNS and network

All compose services join the same default network. Docker provides internal DNS such that:

- `auth-service` resolves to auth container IP
- `booking-service` resolves to booking container IP
- and so on

So internal calls should use `http://<service-name>:<port>`.

## 8. Startup order and readiness

`depends_on` controls startup order only. It does not guarantee an app is fully ready.

Current order:

- gateway waits for domain service containers to start
- each domain service waits for postgres container to start

If you need strict readiness, add healthchecks and condition-based dependencies.

## 9. End-to-end communication sequence

```text
Browser/Postman
   -> http://localhost:3000/api/... (host)
   -> api-gateway container (port 3000)
   -> proxy target (auth-service:3001, etc.)
   -> target service handles request
   -> response returns through gateway
   -> client receives final response
```

## 10. Common communication issues and fixes

### Issue: ECONNREFUSED 127.0.0.1:3001

Cause:

- gateway/service tried to call `localhost` inside container.

Fix:

- use service DNS names in compose/env:
  - `http://auth-service:3001`
  - `http://booking-service:3002`
  - `http://business-service:3003`
  - `http://resource-service:3004`

### Issue: CORS errors in browser

Cause:

- upstream and gateway both setting CORS headers, or wrong allowed origin.

Fix:

- keep CORS at gateway only, configure `ALLOWED_ORIGIN` correctly.

### Issue: service boots before database is really ready

Fix:

- add DB retry logic or compose healthchecks.

## 11. Useful commands

```bash
# Build and start all services
docker compose up --build

# Start in detached mode
docker compose up -d --build

# View live logs
docker compose logs -f

# Restart only gateway
docker compose up -d --build api-gateway

# Validate compose file
docker compose config

# Stop everything
docker compose down
```

## 12. Suggested improvements

1. Remove obsolete `version` field from compose.
2. Add healthchecks for all services and postgres.
3. Standardize all inter-service URLs to service DNS names (not localhost).
4. Consider production Dockerfiles with `npm ci` and `npm run start` instead of `dev`.
5. Add a gateway `.env.example` for consistency.

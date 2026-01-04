# 🛠 API Gateway: Implementation & Engineering Challenges

This document outlines the technical hurdles encountered while building the central API Gateway, the logic used to solve them, and the architectural benefits gained.

---

## 1. Technical Challenges & Solutions

### A. The "Hanging Request" (Stream Consumption)

- **Challenge:** Proxied requests would hang indefinitely or timeout.
- **Cause:** The Gateway was using `express.json()` globally. In Node.js, request bodies are streams. Once the Gateway parsed the JSON, the stream was "consumed," leaving the proxy with no data to send to the target service.
- **Solution:** Removed global body-parsing from the Gateway. The Gateway now acts as a **transparent proxy**, allowing the raw stream to reach the microservices where parsing is actually needed.

### B. Path Slicing & Route Mismatch

- **Challenge:** Services returned `404 Not Found` even when they were running correctly.
- **Cause:** Express's `router.use()` logic "slices" the mount path. A request to `/api/auth/login` arrived at the Auth Service as just `/login`, but the Auth Service expected the full path prefix.
- **Solution:** Developed a dynamic `pathRewrite` utility that reconstructs the required internal path based on the target service's requirements.
  - **Logic:** `pathRewrite: (path) => "/api/auth" + path`

### C. Type-Safe Proxy Lifecycle (Library Evolution)

- **Challenge:** TypeScript errors when implementing proxy event listeners like `onProxyReq`.
- **Cause:** Upgraded to `http-proxy-middleware` v3.0, which moved event listeners from top-level properties to a consolidated `on: {}` object, breaking legacy v2.0 code.
- **Solution:** Refactored the proxy utility to use the modern event-driven syntax, ensuring the Gateway is future-proof and fully type-safe.

### D. Middleware Mount Point Side-Effects

- **Challenge:** Encountered 404 errors due to "Path Stripping" where the Express Gateway consumed the `/api/auth` prefix before proxying.
- **Technical Detail:** By mounting the proxy on a specific path (`app.use('/api/auth', ...)`), the downstream request URI was truncated to `/login`, failing to match the Auth Service's internal `/api/auth/login` route.
- **Solution:** Refactored the mounting strategy to use transparent routing. The proxy now receives the full original URI, ensuring path-parity between the Gateway and the domain-specific microservices.

### E. Identity Propagation (Header Loss)

- **Challenge:** Microservices (like Booking Service) were returning `401 Unauthorized` even after successful Gateway authentication.If a microservice trusts headers blindly, a user could manually send x-user-id: admin in their request to escalate privileges.
- **Cause:** Microservices behind a Gateway are often "internal" and trust headers like x-user-id blindly. Without protection, a malicious user could manually inject these headers into their request to impersonate other users (Identity Spoofing).
- **Solution:** Implemented Explicit Header Sanitization within the Authentication middleware. The Gateway now deletes all incoming x-user-\* headers from the client and only re-injects them after the JWT has been successfully verified. This "Zero Trust" approach ensures that downstream services only receive identity data verified by the Gateway.

---

## 2. Strategic Benefits

By implementing the Gateway correctly, the following architectural benefits were achieved:

| Benefit                        | Description                                                                                        |
| :----------------------------- | :------------------------------------------------------------------------------------------------- |
| **Single Entry Point**         | Clients (Frontend) only need to know one URL (Port 3000), reducing CORS complexity.                |
| **Security via Encapsulation** | Internal microservice ports are hidden from the public; only the Gateway is exposed.               |
| **Centralized Logging**        | Every request across the system is logged at the Gateway, making it easier to track user journeys. |
| **Decoupled Scaling**          | New services can be added by simply updating Gateway routes without changing frontend code.        |

---

## 3. How to Identify Error Sources

To distinguish between Gateway failures and Microservice failures during development, I implemented the following debugging patterns:

1.  **Response Signature:** Added a `X-Served-By: API-Gateway` header to all Gateway responses.
2.  **Visual Log Tracking:** \* **Gateway Terminal:** Shows `[Gateway] Routing to: http://localhost:3001/...`
    - **Auth Service Terminal:** Shows `POST /api/auth/login 200`
3.  **Status Code Mapping:**
    - `502 Bad Gateway`: The target microservice is offline or crashed.
    - `404 Not Found`: The microservice is online, but the path mapping is incorrect.

---

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

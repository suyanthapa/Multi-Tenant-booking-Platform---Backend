# API Gateway

A centralized API Gateway service built with Express.js and TypeScript, providing unified access to microservices with authentication, request proxying, and security features.

## 🚀 Overview

This API Gateway serves as the single entry point for all client requests in a multi-tenant microservices architecture. It handles request routing, authentication, and provides a unified interface to downstream services including Auth, Booking, Resource, and Payment services.

## ✨ Features

- **🔒 Authentication Middleware**: JWT-based authentication for protected routes
- **🔄 Service Proxying**: Intelligent request routing to microservices
- **🛡️ Security**: Helmet.js for HTTP header security
- **🌐 CORS Support**: Configurable cross-origin resource sharing
- **📝 Request Logging**: Morgan logger for development monitoring
- **⚡ Health Checks**: Built-in health check endpoint
- **🚨 Error Handling**: Centralized error handling and 404 responses

## 🏗️ Architecture

```
Client Request
     ↓
API Gateway (Port 8000)
     ↓
  ┌─────────┬──────────┬───────────┬──────────┐
  ↓         ↓          ↓           ↓          ↓
Auth    Booking   Resource    Payment    [Future Services]
:5001     :5002      :5003       :5004
```

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Running microservices (Auth, Booking, etc.)

## 🛠️ Installation

```bash
# Install dependencies
npm install

# or using yarn
yarn install
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
BOOKING_SERVICE_URL=http://localhost:3002
RESOURCE_SERVICE_URL=http://localhost:3004
PAYMENT_SERVICE_URL=http://localhost:5004

# JWT Configuration
JWT_SECRET=your-secret-key-here

# Gateway Configuration
PORT=3000
NODE_ENV=development
```

### Service Configuration

Service URLs are configured in [`src/config/service.ts`](src/config/service.ts). Default values are provided for local development.

## 🚦 Running the Gateway

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

The API Gateway will start on **http://localhost:3000**

## 📡 API Endpoints

### Health Check

```
GET /health
```

Returns the gateway status and service information.

**Response:**

```json
{
  "status": "ok",
  "service": "api-gateway"
}
```

### Auth Service Routes

```
POST   /api/auth/*
```

All authentication-related endpoints are proxied to the Auth service:

- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/auth/refresh-token` - Token refresh
- `/api/auth/verify-email` - Email verification
- `/api/auth/forgot-password` - Password reset request
- And more...

### Booking Service Routes (Protected)

```
*      /api/bookings/*
```

All booking-related endpoints are proxied to the Booking service. **Requires authentication token.**

## 🔐 Authentication

Protected routes require a valid JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

The gateway validates the token before proxying requests to downstream services.

## 📁 Project Structure

```
api-gateway/
├── src/
│   ├── config/
│   │   └── service.ts          # Service URL configuration
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # JWT authentication
│   │   ├── error.middleware.ts # Error handling
│   │   └── notFound.middleware.ts # 404 handler
│   ├── routes/
│   │   ├── auth.proxy.ts       # Auth service proxy
│   │   └── booking.proxy.ts    # Booking service proxy
│   ├── utils/
│   │   ├── jwt.ts              # JWT utilities
│   │   └── proxy.ts            # Proxy helper
│   └── index.ts                # Application entry point
├── package.json
└── README.md
```

## 🔧 Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Proxy**: http-proxy-middleware
- **Security**: Helmet.js
- **Authentication**: JSON Web Tokens (JWT)
- **Logging**: Morgan
- **CORS**: cors middleware

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test
```

## 🐛 Error Handling

The gateway implements centralized error handling:

- **404 Errors**: Handled by the notFound middleware
- **Service Errors**: Proxied from downstream services
- **Gateway Errors**: Caught by the error handler middleware

## 🚀 Deployment

### Docker (Recommended)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t api-gateway .
docker run -p 3000:3000 --env-file .env api-gateway
```

### Docker Compose

Include in your `docker-compose.yml`:

```yaml
services:
  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      - AUTH_SERVICE_URL=http://auth:5001
      - BOOKING_SERVICE_URL=http://booking:5002
      - RESOURCE_SERVICE_URL=http://resource:5003
      - PAYMENT_SERVICE_URL=http://payment:5004
    depends_on:
      - auth
      - booking
```

## 📈 Monitoring & Logging

The gateway uses Morgan for HTTP request logging in development mode. For production, consider integrating:

- **Winston** for structured logging
- **Prometheus** for metrics
- **Grafana** for visualization
- **ELK Stack** for log aggregation

## 🛣️ Roadmap

- [ ] Rate limiting per client
- [ ] Request/Response caching
- [ ] Circuit breaker pattern
- [ ] Service discovery integration
- [ ] GraphQL gateway support
- [ ] WebSocket support
- [ ] API versioning strategy
- [ ] Comprehensive test coverage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC

## 👥 Support

For issues and questions, please open an issue in the repository.

---

**Built with ❤️ for microservices architecture**

# Booking Service

A microservice for managing bookings in a multi-tenant system.

## Features

- ✅ Create, read, update, and delete bookings
- ✅ Time slot availability checking
- ✅ Booking status management (Pending, Confirmed, In Progress, Completed, Cancelled, No Show)
- ✅ Payment status tracking
- ✅ User and vendor booking queries
- ✅ Pagination support
- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ Request validation with Zod
- ✅ Error handling
- ✅ Logging with Winston
- ✅ Rate limiting
- ✅ CORS support
- ✅ Helmet security headers

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Zod
- **Logging**: Winston

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory:

```env
# Server
PORT=4001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/booking_db"

# JWT
JWT_ACCESS_SECRET=your-access-secret-key-change-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Cookie
COOKIE_SAME_SITE=strict
COOKIE_MAX_AGE=604800000
```

3. Generate Prisma Client:

```bash
npm run prisma:generate
```

4. Run database migrations:

```bash
npm run prisma:migrate
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## API Endpoints

### Health Check

- `GET /health` - Check service health

### Bookings

#### Create Booking

- **POST** `/api/bookings`
- **Auth**: Required
- **Body**:

```json
{
  "userId": "uuid",
  "vendorId": "uuid",
  "serviceId": "uuid",
  "bookingDate": "2026-01-15T00:00:00Z",
  "startTime": "2026-01-15T10:00:00Z",
  "endTime": "2026-01-15T11:00:00Z",
  "notes": "Optional notes"
}
```

#### Get All Bookings

- **GET** `/api/bookings?page=1&limit=10&status=PENDING&userId=uuid`
- **Auth**: Required
- **Query Params**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)
  - `status` (optional): Filter by status
  - `userId` (optional): Filter by user ID
  - `vendorId` (optional): Filter by vendor ID
  - `serviceId` (optional): Filter by service ID
  - `startDate` (optional): Filter by start date
  - `endDate` (optional): Filter by end date

#### Get Booking by ID

- **GET** `/api/bookings/:id`
- **Auth**: Required

#### Update Booking

- **PATCH** `/api/bookings/:id`
- **Auth**: Required
- **Body**:

```json
{
  "bookingDate": "2026-01-16T00:00:00Z",
  "startTime": "2026-01-16T10:00:00Z",
  "endTime": "2026-01-16T11:00:00Z",
  "status": "CONFIRMED",
  "notes": "Updated notes"
}
```

#### Cancel Booking

- **POST** `/api/bookings/:id/cancel`
- **Auth**: Required
- **Body**:

```json
{
  "cancelReason": "Customer request"
}
```

#### Update Payment Status

- **PATCH** `/api/bookings/:id/payment-status`
- **Auth**: Required (Admin, Vendor)
- **Body**:

```json
{
  "paymentStatus": "PAID"
}
```

#### Get User Bookings

- **GET** `/api/bookings/user/:userId?page=1&limit=10`
- **Auth**: Required

#### Get Vendor Bookings

- **GET** `/api/bookings/vendor/:vendorId?page=1&limit=10`
- **Auth**: Required (Admin, Vendor)

#### Delete Booking

- **DELETE** `/api/bookings/:id`
- **Auth**: Required (Admin)

## Database Schema

### Booking Model

```prisma
model Booking {
  id            String        @id @default(uuid())
  userId        String
  vendorId      String
  serviceId     String
  bookingDate   DateTime
  startTime     DateTime
  endTime       DateTime
  status        BookingStatus @default(PENDING)
  totalAmount   Decimal
  paymentStatus PaymentStatus @default(PENDING)
  notes         String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  cancelledAt   DateTime?
  cancelReason  String?
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
  FAILED
}
```

## Project Structure

```
booking/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/
│   │   ├── index.ts
│   │   └── database.ts
│   ├── controllers/
│   │   └── booking.controller.ts
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validator.ts
│   ├── repositories/
│   │   ├── index.ts
│   │   └── booking.repository.ts
│   ├── routes/
│   │   ├── index.ts
│   │   └── booking.routes.ts
│   ├── services/
│   │   ├── index.ts
│   │   └── booking.service.ts
│   ├── utils/
│   │   ├── asyncHandler.ts
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   └── validators.ts
│   ├── interfaces/
│   │   └── booking.interface.ts
│   └── index.ts
├── logs/
├── package.json
├── tsconfig.json
├── prisma.config.ts
└── README.md
```

## Error Handling

The service includes comprehensive error handling:

- **ValidationError** (400): Invalid request data
- **AuthenticationError** (401): Missing or invalid authentication
- **AuthorizationError** (403): Insufficient permissions
- **NotFoundError** (404): Resource not found
- **ConflictError** (409): Resource already exists
- **BookingConflictError** (409): Time slot not available
- **InvalidBookingError** (400): Invalid booking details
- **InternalServerError** (500): Server error
- **DatabaseError** (500): Database operation failed

## Authentication

The service uses JWT tokens for authentication. Include the token in:

1. **Cookie** (for web):

   - Cookie name: `accessToken`

2. **Authorization Header** (for API/mobile):
   - Format: `Bearer <token>`

## Authorization

Role-based access control:

- **CUSTOMER**: Can create and manage their own bookings
- **VENDOR**: Can view and manage bookings for their services
- **ADMIN**: Full access to all bookings

## Logging

Logs are stored in the `logs/` directory:

- `error.log`: Error-level logs
- `combined.log`: All logs

In development, logs are also printed to the console.

## Development

Start the development server:

```bash
npm run dev
```

The server will run on `http://localhost:4001` (or your configured PORT).

## Production

Build and start:

```bash
npm run build
npm start
```

## License

ISC

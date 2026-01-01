# Booking Service - Error Handling Guide

## Overview

This document describes the error handling mechanisms implemented in the Booking Service.

## Custom Error Classes

### 1. AppError (Base Class)

- Base class for all application errors
- Properties:
  - `statusCode`: HTTP status code
  - `isOperational`: Whether error is operational (expected)
  - `code`: Error code for client identification
  - `message`: Human-readable error message

### 2. ValidationError (400)

- Used for request validation failures
- Contains array of specific validation errors
- Example: Invalid UUID format, missing required fields

### 3. AuthenticationError (401)

- Missing or invalid authentication token
- Expired tokens

### 4. AuthorizationError (403)

- Insufficient permissions for the requested action
- Role-based access denied

### 5. NotFoundError (404)

- Requested resource doesn't exist
- Example: Booking not found

### 6. ConflictError (409)

- Resource already exists
- Example: Duplicate booking

### 7. BookingConflictError (409)

- Time slot already booked
- Overlapping booking times

### 8. InvalidBookingError (400)

- Invalid booking details
- Example: Start time after end time, past booking date

### 9. InternalServerError (500)

- Unexpected server errors
- Non-operational errors

### 10. DatabaseError (500)

- Database operation failures
- Connection issues

## Error Response Format

All errors return a consistent JSON format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "errors": [
      // Optional, for validation errors
      {
        "field": "fieldName",
        "message": "Validation error message"
      }
    ],
    "stack": "Error stack trace" // Only in development mode
  }
}
```

## Usage Examples

### In Services

```typescript
// Not found error
if (!booking) {
  throw new NotFoundError("Booking not found");
}

// Booking conflict
if (!isAvailable) {
  throw new BookingConflictError(
    "This time slot is not available. Please choose another time."
  );
}

// Invalid booking
if (startTime >= endTime) {
  throw new InvalidBookingError("Start time must be before end time");
}
```

### In Controllers

Controllers use the `asyncHandler` wrapper to automatically catch errors:

```typescript
router.post(
  "/",
  authenticate,
  validate(createBookingSchema),
  asyncHandler(bookingController.createBooking)
);
```

## Validation Errors

Validation is handled by Zod schemas. Invalid requests automatically return:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "errors": [
      {
        "field": "userId",
        "message": "Invalid user ID"
      }
    ]
  }
}
```

## Prisma Errors

Prisma errors are automatically converted:

- **P2002**: Unique constraint violation → 409 Conflict
- **P2025**: Record not found → 404 Not Found

## JWT Errors

JWT errors are automatically handled:

- **JsonWebTokenError**: Invalid token → 401
- **TokenExpiredError**: Expired token → 401

## Best Practices

1. Always throw specific error types rather than generic Error
2. Provide clear, actionable error messages
3. Use appropriate HTTP status codes
4. Include field-level details for validation errors
5. Log all errors server-side
6. Don't expose sensitive information in error messages
7. Use operational errors for expected failures

## Logging

All errors are logged with:

- Error name and message
- Stack trace (in development)
- Request URL, method, IP
- Request body, params, and query

Error logs are stored in `logs/error.log`.

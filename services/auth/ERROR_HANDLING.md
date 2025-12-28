# Error Handling Guide

## Error Handling Architecture

This service implements a comprehensive error handling system with:

✅ Custom error classes for different scenarios
✅ Centralized error handling middleware
✅ Consistent error response format
✅ Proper HTTP status codes
✅ Detailed logging
✅ Production-safe error messages

## Custom Error Classes

Located in `src/utils/errors.ts`:

### Base Error: `AppError`

```typescript
new AppError(message, statusCode, isOperational, code);
```

### Specific Errors

1. **ValidationError (400)**
   - Input validation failures
   - Malformed requests
2. **AuthenticationError (401)**
   - Invalid credentials
   - Missing/invalid tokens
3. **AuthorizationError (403)**
   - Insufficient permissions
   - Role-based access denied
4. **NotFoundError (404)**
   - Resource doesn't exist
5. **ConflictError (409)**
   - Duplicate entries
   - Resource already exists
6. **RateLimitError (429)**
   - Too many requests
7. **InternalServerError (500)**
   - Unexpected server errors
8. **DatabaseError (500)**
   - Database operation failures
9. **TokenExpiredError (401)**
   - JWT token expired
10. **InvalidTokenError (401)**
    - Malformed JWT token

## Using Errors in Services

```typescript
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from "../utils/errors";

// Throw validation error
if (!email) {
  throw new ValidationError("Email is required");
}

// Throw authentication error
if (!isPasswordValid) {
  throw new AuthenticationError("Invalid credentials");
}

// Throw not found error
if (!user) {
  throw new NotFoundError("User not found");
}
```

## Using asyncHandler

Wrap all async route handlers with `asyncHandler` to automatically catch errors:

```typescript
import { asyncHandler } from "../utils/asyncHandler";

// Without asyncHandler (NOT RECOMMENDED)
router.get("/users", async (req, res, next) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (error) {
    next(error); // Manual error passing
  }
});

// With asyncHandler (RECOMMENDED)
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await userService.getAll();
    res.json(users);
  })
);
```

## Error Response Format

All errors return consistent JSON:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "errors": [
      // Optional, for validation errors
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Validation with Zod

Validation errors are automatically formatted:

```typescript
import { validate } from "../middlewares/validator";
import { registerSchema } from "../utils/validators";

router.post(
  "/register",
  validate(registerSchema), // Validates and formats errors
  authController.register
);
```

## Database Error Handling

Prisma errors are caught and transformed:

```typescript
// P2002: Unique constraint violation
if (prismaError.code === "P2002") {
  throw new ConflictError("Email already exists");
}

// P2025: Record not found
if (prismaError.code === "P2025") {
  throw new NotFoundError("User not found");
}
```

## Logging Errors

All errors are logged automatically in the error handler:

```typescript
logger.error("Error occurred:", {
  message: err.message,
  stack: err.stack,
  url: req.url,
  method: req.method,
  ip: req.ip,
});
```

## Best Practices

### ✅ DO:

1. Use specific error classes

   ```typescript
   throw new NotFoundError("User not found");
   ```

2. Provide helpful error messages

   ```typescript
   throw new ValidationError("Password must be at least 8 characters");
   ```

3. Wrap async handlers

   ```typescript
   router.get(
     "/users",
     asyncHandler(async (req, res) => {
       // Your code
     })
   );
   ```

4. Log errors appropriately
   ```typescript
   logger.error("Failed to send email:", error);
   ```

### ❌ DON'T:

1. Return raw errors

   ```typescript
   res.status(500).json(error); // BAD
   ```

2. Expose sensitive information

   ```typescript
   throw new Error(process.env.DATABASE_URL); // BAD
   ```

3. Ignore errors

   ```typescript
   try {
     await riskyOperation();
   } catch (e) {
     // BAD: Silent failure
   }
   ```

4. Generic error messages
   ```typescript
   throw new Error("Error"); // BAD: Not helpful
   ```

## Testing Error Scenarios

```typescript
// Test validation error
const res = await request(app)
  .post("/api/auth/register")
  .send({ email: "invalid" });

expect(res.status).toBe(400);
expect(res.body.error.code).toBe("VALIDATION_ERROR");

// Test authentication error
const res = await request(app)
  .post("/api/auth/login")
  .send({ email: "test@test.com", password: "wrong" });

expect(res.status).toBe(401);
expect(res.body.error.code).toBe("AUTHENTICATION_ERROR");
```

## Production Considerations

1. **Don't expose stack traces**

   - Stack traces are hidden in production
   - Logged but not sent to client

2. **Generic messages for sensitive errors**

   ```typescript
   // Production-safe message
   throw new AuthenticationError("Invalid credentials");
   // NOT: "User with email x@y.com not found"
   ```

3. **Monitor error rates**

   - Set up alerts for 5xx errors
   - Track error frequency by type
   - Monitor authentication failures

4. **Error Recovery**
   - Implement retry logic for transient failures
   - Use circuit breakers for external services
   - Graceful degradation when possible

## Common Error Scenarios

### 1. User Registration

```typescript
// Email already exists
if (existingUser) {
  throw new ConflictError("Email already registered");
}

// Weak password
if (!isStrongPassword(password)) {
  throw new ValidationError("Password too weak", [
    {
      field: "password",
      message:
        "Must contain uppercase, lowercase, number, and special character",
    },
  ]);
}
```

### 2. Authentication

```typescript
// User not found or wrong password
if (!user || !isPasswordValid) {
  throw new AuthenticationError("Invalid email or password");
}

// Email not verified
if (!user.isEmailVerified) {
  throw new AuthenticationError("Please verify your email first");
}
```

### 3. Token Validation

```typescript
// Token expired
if (tokenExpired) {
  throw new TokenExpiredError();
}

// Invalid token
if (!isValid) {
  throw new InvalidTokenError();
}
```

### 4. Authorization

```typescript
// Insufficient permissions
if (!hasPermission(user.role, requiredRole)) {
  throw new AuthorizationError("Admin access required");
}
```

## Debugging Tips

1. Check `logs/error.log` for stack traces
2. Use correlation IDs to track requests
3. Enable debug logging in development
4. Test error scenarios explicitly
5. Monitor error patterns in production

# Rate Limiting Configuration

This API Gateway implements comprehensive rate limiting to protect against abuse and ensure fair usage.

## Overview

Rate limiting is applied at the API Gateway level to control the number of requests clients can make within specific time windows.

## Rate Limit Policies

### 1. General Limiter (All Routes)

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Applies to**: All API endpoints
- **Purpose**: General protection against API abuse

### 2. Authentication Limiter

- **Window**: 15 minutes
- **Max Requests**: 5 login attempts per IP
- **Applies to**: `POST /api/auth/login`
- **Special**: Only failed attempts count (skipSuccessfulRequests: true)
- **Purpose**: Prevent brute force attacks

### 3. Signup Limiter

- **Window**: 1 hour
- **Max Requests**: 3 registrations per IP
- **Applies to**: `POST /api/auth/register`
- **Purpose**: Prevent fake account creation

### 4. Password Reset Limiter

- **Window**: 1 hour
- **Max Requests**: 3 attempts per IP
- **Applies to**:
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
- **Purpose**: Prevent password reset abuse

### 5. OTP Limiter

- **Window**: 1 hour
- **Max Requests**: 5 OTP requests per IP
- **Applies to**:
  - `POST /api/auth/verify-email`
  - `POST /api/auth/resend-verification`
- **Purpose**: Prevent OTP spam

### 6. Booking Limiter

- **Window**: 1 hour
- **Max Requests**: 20 bookings per IP
- **Applies to**: All `/api/bookings` endpoints
- **Purpose**: Prevent booking spam and slot hoarding

## Response Format

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Too many requests",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": "2026-01-23T15:30:00.000Z"
}
```

**HTTP Status Code**: 429 (Too Many Requests)

## Response Headers

The API returns standard rate limit headers:

- `RateLimit-Limit`: Maximum number of requests allowed
- `RateLimit-Remaining`: Number of requests remaining
- `RateLimit-Reset`: Timestamp when the limit resets

## Implementation Details

### Technology

- **Package**: `express-rate-limit`
- **Storage**: In-memory (default)
- **Identification**: Client IP address

### Customization

You can adjust limits in `api-gateway/src/middlewares/rateLimit.middleware.ts`:

```typescript
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Adjust time window
  max: 5, // Adjust max requests
  // ...
});
```

## Production Recommendations

### 1. Use Redis for Distributed Rate Limiting

For production with multiple gateway instances:

```bash
npm install rate-limit-redis redis
```

```typescript
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "rl:auth:",
  }),
  // ... other options
});
```

### 2. IP Trust Configuration

Behind a proxy (Nginx, CloudFlare):

```typescript
// In api-gateway/src/index.ts
app.set("trust proxy", 1); // Trust first proxy
```

### 3. Per-User Rate Limiting

For authenticated endpoints, rate limit by user ID:

```typescript
export const userBasedLimiter = rateLimit({
  keyGenerator: (req) => {
    return req.user?.id || req.ip; // Use user ID if authenticated
  },
  // ...
});
```

### 4. Bypass for Trusted IPs

Whitelist specific IPs:

```typescript
export const generalLimiter = rateLimit({
  skip: (req) => {
    const trustedIPs = ["127.0.0.1", "::1"];
    return trustedIPs.includes(req.ip);
  },
  // ...
});
```

## Testing Rate Limits

### Using cURL

```bash
# Test auth rate limit (should fail after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "\nAttempt $i"
done
```

### Using Bruno/Postman

1. Send multiple requests to the same endpoint
2. Check response headers for rate limit info
3. After exceeding limit, verify 429 status code

## Monitoring

### Logs

Rate limit events are logged automatically. Monitor for:

- Frequent 429 responses (possible attack)
- Legitimate users hitting limits (adjust thresholds)

### Metrics to Track

- Rate limit hit rate per endpoint
- Top IPs hitting limits
- Time distribution of rate limit violations

## Troubleshooting

### "Rate limit hit immediately"

**Issue**: Behind reverse proxy without trust proxy setting
**Solution**: Add `app.set('trust proxy', 1)`

### "Different users sharing same limit"

**Issue**: All users behind same NAT/proxy
**Solution**: Use user-based rate limiting for authenticated routes

### "Limits reset unexpectedly"

**Issue**: Server restart clears in-memory store
**Solution**: Use Redis for persistent storage

## Security Best Practices

1. ✅ **Layer rate limits**: General + specific endpoint limits
2. ✅ **Different limits for different endpoints**: Auth stricter than read
3. ✅ **Skip successful requests for auth**: Only count failed login attempts
4. ⚠️ **Use Redis in production**: For multi-instance deployments
5. ⚠️ **Monitor and adjust**: Based on real traffic patterns
6. ⚠️ **Combine with other security**: CAPTCHA, account lockout, etc.

## Environment Variables

Add to `.env`:

```env
# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
REDIS_URL=redis://localhost:6379  # For production
```

## Future Enhancements

- [ ] Redis integration for distributed systems
- [ ] Per-user rate limiting for authenticated routes
- [ ] Dynamic rate limits based on user subscription tier
- [ ] Rate limit dashboard/analytics
- [ ] IP whitelist/blacklist management
- [ ] Exponential backoff for repeat offenders

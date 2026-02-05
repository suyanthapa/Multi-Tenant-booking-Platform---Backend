# Rate Limiting Test Guide

## Test Rate Limiting with cURL

### 1. Test General Rate Limiter (100 requests/15 min)

```bash
# Should work fine for first 100 requests
for i in {1..5}; do
  curl -s http://localhost:3000/health | jq
  echo "Request $i"
done
```

### 2. Test Auth Login Limiter (5 attempts/15 min)

```bash
# This should fail after 5 attempts with wrong password
for i in {1..7}; do
  echo "\n=== Attempt $i ==="
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nHTTP Status: %{http_code}\n" | jq
  sleep 1
done
```

Expected output after 5th attempt:

```json
{
  "success": false,
  "error": "Too many login attempts",
  "message": "Account temporarily locked due to multiple failed login attempts. Please try again later."
}
```

### 3. Test Signup Limiter (3 attempts/hour)

```bash
# Should fail after 3 attempts
for i in {1..5}; do
  echo "\n=== Signup Attempt $i ==="
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "username":"testuser'$i'",
      "email":"test'$i'@test.com",
      "password":"password123",
      "role":"CUSTOMER"
    }' \
    -w "\nHTTP Status: %{http_code}\n" | jq
  sleep 1
done
```

### 4. Test OTP Limiter (5 attempts/hour)

```bash
# Should fail after 5 attempts
for i in {1..7}; do
  echo "\n=== OTP Request $i ==="
  curl -X POST http://localhost:3000/api/auth/resend-verification \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com"}' \
    -w "\nHTTP Status: %{http_code}\n" | jq
  sleep 1
done
```

### 5. Check Rate Limit Headers

```bash
curl -I http://localhost:3000/health
```

Look for headers:

- `RateLimit-Limit: 100`
- `RateLimit-Remaining: 99`
- `RateLimit-Reset: 1706034000`

## Test with Bruno Collection

### Create new requests in your Bruno collection:

**Test Rate Limit - Login (Fail)**

```
POST http://localhost:3000/api/auth/login

Body:
{
  "email": "wrong@test.com",
  "password": "wrongpassword"
}
```

Run this 6+ times quickly to trigger rate limit.

**Test Rate Limit - Health Check**

```
GET http://localhost:3000/health
```

Run this 100+ times to trigger general rate limit.

## Monitor Rate Limits

### View in Terminal

Watch the API Gateway logs while testing:

```bash
# In api-gateway directory
npm run dev
```

You'll see request logs from Morgan middleware.

### Using Postman/Bruno Pre-request Script

```javascript
// Add to pre-request script
pm.sendRequest(pm.request.url, function (err, res) {
  console.log("RateLimit-Limit:", res.headers["ratelimit-limit"]);
  console.log("RateLimit-Remaining:", res.headers["ratelimit-remaining"]);
  console.log("RateLimit-Reset:", res.headers["ratelimit-reset"]);
});
```

## Expected Behavior

| Endpoint                    | Limit | Window | Status on Exceed |
| --------------------------- | ----- | ------ | ---------------- |
| Any route                   | 100   | 15 min | 429              |
| `/api/auth/login`           | 5     | 15 min | 429              |
| `/api/auth/register`        | 3     | 1 hour | 429              |
| `/api/auth/forgot-password` | 3     | 1 hour | 429              |
| `/api/auth/verify-email`    | 5     | 1 hour | 429              |
| `/api/bookings/*`           | 20    | 1 hour | 429              |

## Troubleshooting

### Issue: Rate limit triggers immediately

**Cause**: Multiple tests from same IP
**Solution**: Wait for window to reset or restart gateway

### Issue: Rate limit not working

**Cause**: Requests from different IPs (VPN/proxy changes)
**Solution**: Check IP consistency with `curl ifconfig.me`

### Issue: All users share same limit

**Cause**: Behind NAT/proxy
**Solution**: Add user-based rate limiting for authenticated routes

## Reset Rate Limits

Restart the API Gateway:

```bash
# Stop current process (Ctrl+C)
# Start again
npm run dev
```

Note: In-memory store clears on restart. Use Redis for persistence.

## Production Testing

Before deploying to production:

1. ✅ Test all rate limit thresholds
2. ✅ Verify appropriate error messages
3. ✅ Check rate limit headers are present
4. ✅ Test with multiple IPs
5. ✅ Monitor for false positives
6. ✅ Have whitelist ready for trusted services
7. ✅ Set up Redis for distributed systems

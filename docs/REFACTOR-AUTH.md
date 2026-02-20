## 🔧 Refactors & Improvements

### Table of Contents

- [1. Separated Validation Schemas](#1-separated-validation-schemas-from-type-definitions)
- [2. Split Auth Routes](#2-split-auth-routes-into-separate-route-files)
- [3. Reused passwordSchema](#3-reused-passwordschema-in-resetpasswordschema-dry-fix)
- [5. Sanitized Sensitive Fields](#5-sanitized-sensitive-fields-from-error-logs-p0-security-fix)
- [6. Replaced JWT Fallbacks](#6-replaced-hardcoded-jwt-fallbacks-with-startup-validation)
- [7. Replaced Math.random](#7-replaced-mathrandom-with-cryptorandomint-for-otp-generation)
- [8. Express Type Augmentation](#8-added-global-express-request-type-augmentation)
- [9. Consistent Success/Error Response](#9-added-consistent-success-error-response-envelope)

### 1. Separated Validation Schemas from Type Definitions

**Before:** All Zod schemas and inferred types lived in a single `utils/validator.ts` file.

**After:** Split into two dedicated layers:

- `dtos/auth.dto.ts` → Zod schemas for runtime request validation → validate incoming request data
- `types/auth.types.ts` → TypeScript types inferred from those schemas → describe the shape of data used in the app

**Why I did this:**
Keeping runtime logic and type definitions in the same file works fine
but doesn't scale well. This separation makes each
file single-responsibility — DTOs handle _what's valid_, types handle
_what shape the data is_ throughout the app.

**What I learned:**
The difference between runtime validation (Zod, runs in JS) and
compile-time types (TypeScript, erased at runtime) — and why treating
them as separate concerns leads to a cleaner architecture.

### 2. Split Auth Routes into Separate Route Files

**Before:** All routes (login, register, OTP, user management) lived in a single `auth.routes.ts` file.

**After:** Split into dedicated route files with a central entry point `routes/index.ts`:

- `auth.routes.ts` → login, register, verify OTP, forgot/reset password
- `user.routes.ts` → get all users, edit user, delete user
- `index.ts` → mounts both routers, single entry point for the app

**Why I did this:**
Auth flows (login/register) and user management (CRUD) are different
concerns. Mixing them in one file made it hard to find routes quickly
and would only get worse as the app grows.

**What I learned:**
Express Router composition — each router handles its own
concern, and a central index mounts them all.

### 3. Reused passwordSchema in resetPasswordSchema (DRY Fix)

**Before:**
`resetPasswordSchema` duplicated all the regex checks from `passwordSchema`
manually inside the `newPassword` field.

**After:**

```ts
// reused the existing passwordSchema
newPassword: passwordSchema,
```

**Why:**
Duplicated validation rules mean if password requirements change,
you'd have to update multiple places and could easily miss one.

**What I learned:**
DRY (Don't Repeat Yourself) — extract reusable logic once and
reference it everywhere it's needed. Zod schemas are just objects,
so they can be reused like any other variable.

### 5. Sanitized Sensitive Fields from Error Logs (P0 Security Fix)

**Bug:**
`errorHandler.ts` was logging `req.body` directly, which included
plaintext passwords, OTPs, and tokens in log files.

```ts
// before — plaintext password sitting in logs forever
logger.error("Error occurred:", {
  body: req.body, // { email: "x", password: "MySecret123" }
});
```

**Fix:**
Created `sanitizeBody()` utility in `src/utils/sanitizer.ts` that
replaces known sensitive fields with `[REDACTED]` before logging.

```ts
// after
logger.error("Error occurred:", {
  body: sanitizeBody(req.body),
  // { email: "x", password: "[REDACTED]" }
});
```

**Sensitive fields protected:**
`password`, `confirmPassword`, `newPassword`, `passwordHash`,
`resetToken`, `refreshToken`, `accessToken`, `otp`

**Why this is P0 (critical):**
Log files are written to disk and accessible to anyone with server
access — developers, DevOps, or an attacker who breaches the server.
Plaintext passwords sitting in a log file is a serious exposure risk
even in a local or small scale setup, and builds bad habits that
carry into production.

**What I learned:**
Never log `req.body` directly. Treat logs as a public surface —
anything written to logs should be safe to expose. Sensitive data
must be redacted at the point of logging, not assumed to be safe
because logs are "internal".

### 6. Replaced Hardcoded JWT Fallbacks with Startup Validation

**Bug:**
Critical secrets had hardcoded fallbacks in `config.ts`:

```ts
accessSecret: process.env.JWT_ACCESS_SECRET || "your-access-secret-key";
```

If a secret was missing in production, the app ran silently with a
known static secret — allowing anyone to forge valid tokens.

**Fix:**
Added a `requireEnv()` helper in `config.ts` that throws immediately
at startup if a required variable is missing:

```bash
Error: Missing required environment variable: DATABASE_URL
# server refuses to start
```

**Fields that now require explicit env vars:**
`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`EMAIL_USER`, `EMAIL_PASSWORD`

**What I learned:**
Fail fast — a server that refuses to start with a clear error is
safer and easier to debug than one that starts silently in a broken
state.

### 7. Replaced Math.random with crypto.randomInt for OTP Generation

**Bug:**
OTPs were generated using `Math.random()` which is pseudorandom —
predictable if an attacker observes enough outputs and reverse
engineers the seed.

**Fix:**

```ts
// before
otp += digits[Math.floor(Math.random() * 10)].toString();

// after
otp += crypto.randomInt(0, 10).toString();
```

### 8. Added Global Express Request Type Augmentation

**Problem:**
`req.user`were declared inside `auth.middleware.ts`
locally. TypeScript augmentations defined inside middleware files are
not reliably recognized globally — other files would get type errors
or need to re-declare the same types.

**Fix:**
Created `src/types/express.d.ts` as the single source of truth:

```ts
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
```

Updated `tsconfig.json` to use `typeRoots` instead of `types`:

```json
"typeRoots": ["./src/types", "./node_modules/@types"]
```

**Why:**
`"types": ["node"]` was telling TypeScript to only load `@types/node`,
which could cause custom type declarations to be ignored. `typeRoots`
tells TypeScript to look in `src/types/` first, picking up
`express.d.ts` automatically across the entire project.

**What I learned:**
TypeScript module augmentation must be in a dedicated `.d.ts` file
to be reliably global. Declaration files in `src/types/` are the
standard place for project-wide type extensions.

### 9. Added Consistent Success Error Response Envelope

**Problem:**
Response shapes were inconsistent across the entire API:

- Some placed `message` inside `data`
- Some placed `message` at the top level
- Error responses had `message` nested inside `error`
- No single source of truth for response structure

```ts
// before — inconsistent
res.json({ success: true, data: { message: "Login successful", user } });
res.json({ success: true, data: result, message: "Business registration..." });
res.json({ success: false, error: { code, message } });
```

**Fix:**
Created `src/utils/response.ts` with two utility functions:

```ts
successResponse(res, data, message, statusCode);
errorResponse(res, message, statusCode, code, errors, stack);
```

Every response now follows the same envelope:

```json
// success
{ "success": true, "message": "...", "data": {...} }

// error
{ "success": false, "message": "...", "error": { "code": "..." } }
```

**Status codes used consistently:**

- `200` — default for fetch/update/actions
- `201` — something created in DB
- `204` — deleted, no body needed

**What I learned:**
A consistent response envelope is a contract between the backend
and frontend. Inconsistent shapes force the frontend to handle
multiple cases for the same thing. Centralizing it in one utility
means one change updates every response in the app.

## 🔧 Refactors & Improvements

## 1. Separated Validation Schemas from Type Definitions

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

## 2. Split Auth Routes into Separate Route Files

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

## 3. Reused passwordSchema in resetPasswordSchema (DRY Fix)

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

## 5. Sanitized Sensitive Fields from Error Logs (P0 Security Fix)

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

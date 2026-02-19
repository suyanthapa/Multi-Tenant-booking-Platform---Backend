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
concern, and a central index mounts them all. T

# 📓 Technical Challenges & Decisions

This document records technical issues encountered during development and the reasoning behind the changes made to address them. The focus is on what broke, why it broke, and what was changed as a result.

---

## 1. Request Validation vs Framework Constraints (Express + Zod)

### The Challenge

While implementing request validation using **Zod**, I attempted to normalize query parameters (e.g., converting `status=active` → `ACTIVE`) directly inside a validation middleware. This resulted in runtime failures because Express exposes `req.query` as a **getter-only property** derived from Node’s `IncomingMessage`.

This surfaced a deeper issue: conflating **raw input**, **validated data**, and **transformed domain data**.

### The Solution

I redesigned the request pipeline to explicitly separate concerns:

- `req.body`, `req.query`, `req.params` are treated as **immutable raw input**
- Zod performs **validation and safe transformation**
- Validated data is attached to the request as:
  - `req.validatedBody`
  - `req.validatedQuery`
  - `req.validatedParams`

This avoided mutating framework-owned objects while preserving full type safety.

### Learned

Framework request objects should be treated as **read-only inputs**, not application state. Introducing a validated boundary creates a clean contract between middleware and business logic and scales well in large codebases.

---

## 2. Enum Normalization Across HTTP, TypeScript, and Prisma

### The Challenge

Prisma enums (e.g., `BusinessStatus`) are **case-sensitive**, while HTTP query parameters are user-controlled and inconsistent (`active`, `Active`, `ACTIVE`). Passing raw query values directly into Prisma caused runtime query failures and type mismatches.

### The Solution

I implemented enum normalization at the validation layer:

- User input is normalized (`toUpperCase`)
- Then validated against the Prisma enum
- Only enum-safe values are allowed into the service layer

This guarantees that downstream database queries are always type-correct.

### Learned

APIs must absorb user inconsistency while enforcing strict internal contracts. Enum validation at the boundary prevents fragile defensive logic inside services and repositories.

---

## 3. Database Modeling Pitfall: Status Overloading

### The Challenge

Initially, a single `status` field attempted to represent multiple concerns:

- Lifecycle state (ACTIVE, SUSPENDED, DELETED)
- Platform trust (verified vs unverified)

This quickly became ambiguous and logically incorrect.

### The Solution

I normalized the schema:

- `status` enum → lifecycle state
- `isVerified` boolean → platform trust

I used **Prisma migrations** to safely evolve the schema without breaking existing data.

### Learned

Overloaded fields are a sign of unclear domain modeling. Separating orthogonal concerns leads to clearer logic, simpler queries, and fewer edge cases.

---

## 4. Prisma Query Type Safety: `not` vs `notIn`

### The Challenge

While implementing filtered queries, I encountered TypeScript errors (`TS2322`) when attempting to exclude multiple enum values using Prisma’s `not` operator.

### The Solution

After consulting Prisma’s type definitions, I corrected the query to use:

- `not` → single-value negation
- `notIn` → set-based exclusion

This aligned the query with Prisma’s strict typing model.

### Learned

Strongly typed ORMs catch logic errors at compile time. Understanding these constraints prevents subtle runtime bugs and invalid SQL generation.

---

## 5. Pagination & Query Trust Boundaries

### The Challenge

Query parameters (`page`, `limit`) arrive as strings and can be malformed or malicious (`limit=100000`). Passing these values directly into database queries risks performance degradation.

### The Solution

Implemented a three-tier protection strategy:

- Validation: Zod transforms strings to numbers and sets defaults and Max(50).
- Sanitization: Applied Math.min() in the Service layer to hard-cap the limit at 50
- Capped at safe limits before reaching the repository layer

### Learned

Even “harmless” query parameters can become attack vectors. Treating pagination as part of input validation is a performance and security concern, not just UX.

---

## Closing Reflection

Working on this project taught me the importance of separating raw input from validated data, handling framework limitations, and thinking carefully about edge cases. Many issues, like request mutations or unsafe pagination, only became clear when things broke in practice. Overall, I learned how small decisions in validation, authorization, and database design can have a big impact on stability and security.

# Architectural Post-Mortem: Challenges in Distributed Resource Allocation

## 📝 The "Microservice Tax" & Lessons Learned

This project involved developing a booking system using a **Database-per-Service** architecture with TypeScript and Prisma. Moving from a monolith to microservices introduced a specific set of challenges referred to as the "Microservice Tax."

### 1. The Challenge of "Distributed Conversations"

In a monolithic application, checking if a room is available is a single database query. In this architecture, a single "Book Now" click triggers a **chain reaction** of internal communication.

When code grows, what felt "easy" as a synchronous call becomes a complex orchestration:

- **Identity Handshake:** Booking Service ➔ Business Service (Verify Vendor).
- **Structural Validation:** Booking Service ➔ Resource Service (Verify Category existence).
- **Inventory Pull:** Booking Service ➔ Resource Service (Fetch the pool of 10+ Resource IDs).
- **Local Conflict Math:** Filtering those IDs against the local `Booking` table using the **Inverse Overlap Rule**.

### 2. The "Contract Gap" & Silly Mistakes

Even with **TypeScript's strict safety**, types only protect you _inside_ a service. Once data crosses the network as JSON, you enter the "Contract Gap."

- **The Issue:** I encountered "silly" naming mismatches—for example, the Resource Service sending a key named `availableResourcesInfo` while the Booking Client was looking for `resourceInfo`.
- **The Lesson:** In microservices, the **JSON structure is your contract.** A single character mismatch results in `undefined` errors that bypass TypeScript's compile-time checks.

### 3. Debugging the "404" Chain

When one service communicates with multiple others, and those communications involve 2 or 3 API hits each, debugging becomes a search for the "broken link."

- A `404 Not Found` was rarely a server crash; it was usually a route mismatch (e.g., calling `/categories/:id/exists` when the server expected `/:id/exists`).
- **Adaptation:** I learned to implement explicit logging for every outgoing request and incoming response to visualize the "chain" in the console.

### 4. Logic Evolution: The Overlap Rule

A major milestone was fixing the availability logic. Initially, my date checks only looked for bookings "inside" the requested range. I had to refactor to the **Inverse Overlap Rule** to prevent double-bookings.

**The Logic Rule:**

> A conflict exists if: `(ExistingStart < UserEnd) AND (ExistingEnd > UserStart)`

This ensures that even if a resource is occupied for only 5 minutes of the requested time, the system flags it as a conflict and moves to the next available ID in the pool.

---

## 💡 Final Confession & Reflections

It is honest to admit: this was hard to adapt to. The complexity of making 3 API hits to do one "simple" task felt overwhelming at first.

- **Microservices are about Resilience:** You have to code defensively. If hit #1 fails, you must handle the exit gracefully before hit #2.
- **Database Refactoring:** I realized that as logic grows, database fields often need to be refactored to store "snapshots" (like `priceAtBooking`) because you can't rely on other services to keep that data unchanged forever.
- **Growth:** Solving the "10 Resource Pool" logic across distributed databases proved that the architecture works, provided you respect the network layer.

---

This document serves as a post-mortem for the development process. It highlights the transition from "simple code" to "distributed system thinking."

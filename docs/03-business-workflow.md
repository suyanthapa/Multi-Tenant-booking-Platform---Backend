# Business Workflow

## Booking Workflow

1. User browses available resources
2. User selects a resource and time range
3. System checks availability and conflicts
4. Booking is created with status `PENDING`
5. Time slot is temporarily locked
6. User initiates payment
7. On successful payment:
   - Booking status becomes `CONFIRMED`
   - Notification job is triggered

## Cancellation Workflow

- User may cancel a booking before start time
- Booking status becomes `CANCELLED`
- Refund logic handled asynchronously if applicable

## Failure Scenarios

### Payment Failure

- Booking expires automatically
- Slot is released
- User is notified

### Double Booking Attempt

- Database transaction prevents overlap
- Second request is rejected

## Why This Workflow

This flow ensures data consistency, prevents race conditions, and keeps APIs responsive by delegating non-critical tasks to background jobs.

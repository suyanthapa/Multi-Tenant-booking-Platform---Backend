# Business Requirements

## Actors

### User (Customer)

- Register and authenticate
- Browse available resources
- Book a resource for a time range
- Make payments
- Cancel bookings within allowed rules

### Vendor

- Register as a vendor
- Create and manage resources
- Define availability
- View bookings related to their resources

### Admin

- Approve or suspend vendors
- Monitor bookings and payments
- Resolve disputes and trigger refunds

## Functional Requirements

- Time-based booking of exclusive resources
- Prevention of overlapping bookings
- Secure authentication and role-based access
- Payment lifecycle tied to booking state
- Asynchronous notifications

## Non-Functional Requirements

- High security (auth, RBAC, validation)
- Data consistency
- Scalability
- Fault tolerance
- Observability and logging

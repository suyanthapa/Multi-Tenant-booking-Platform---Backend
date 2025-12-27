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

# Business Requirements

## 1. Purpose

This document defines the **business and functional requirements** of the booking platform from a backend perspective.

---

## 2. Actors

### 2.1 User

- Registers and logs into the system
- Browses available resources
- Creates, views, and cancels bookings
- Makes payments for bookings

---

### 2.2 Vendor

- Registers as a vendor
- Creates and manages resources
- Defines availability and pricing
- Receives booking notifications

---

### 2.3 Admin

- Manages users and vendors
- Reviews bookings and payments
- Resolves disputes
- Monitors system health

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

- Users must authenticate to create bookings
- Support JWT-based authentication
- Role-based access control (USER, VENDOR, ADMIN)
- Optional OAuth login (Google)

---

### 3.2 Vendor Management

- Vendors can onboard and update profiles
- Vendors can create multiple resources
- Vendors cannot directly modify booking state

---

### 3.3 Resource Management

- Resources must belong to a vendor
- Each resource must define:
  - Type
  - Availability
  - Pricing
- Resources must be searchable and filterable

---

### 3.4 Booking Management

- Users can create bookings for available resources
- System must prevent overlapping bookings
- Booking lifecycle:
  - PENDING
  - CONFIRMED
  - CANCELLED
  - FAILED
- Users can view booking history

---

### 3.5 Payment Processing

- Payments must be linked to bookings
- Booking confirmation depends on successful payment
- Failed payments must not create confirmed bookings
- Refunds supported for eligible cancellations

---

### 3.6 Notifications

- Users receive booking confirmations
- Vendors receive booking alerts
- Notifications handled asynchronously

---

## 4. Non-Functional Requirements

### 4.1 Security

- Input validation and sanitization
- Protection against SQL injection
- Secure token handling
- Rate limiting on sensitive APIs

---

### 4.2 Performance

- Fast availability checks
- Efficient database queries
- Caching for read-heavy operations

---

### 4.3 Scalability

- Support concurrent booking requests
- Stateless backend services
- Ability to scale horizontally

---

### 4.4 Reliability

- No double bookings
- Atomic booking creation
- Safe failure handling

---

## 5. Constraints & Assumptions

- Backend-only implementation
- REST-based APIs
- Relational database as source of truth
- Single-region deployment initially

---

## 6. Success Criteria

- Correct booking behavior under concurrency
- Clear separation of vendor and booking responsibilities
- Ability to add new resource types without core logic changes
- Clean, maintainable backend architecture

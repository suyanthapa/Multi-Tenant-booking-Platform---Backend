# ER Diagram (Logical)

## Core Entities

- User
- Vendor
- Resource
- Availability
- Booking
- Payment

## Key Relationships

- A User can have multiple Bookings
- A Vendor owns multiple Resources
- A Resource can have many Bookings but no overlaps
- Each Booking has exactly one Payment

## Design Principle

Booking is designed around a generic Resource entity to support multiple business domains without schema changes.

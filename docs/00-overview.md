# Project Overview

## Problem Statement

Many booking systems are tightly coupled to a single business domain (e.g., only hotels or only vehicles). This makes them hard to extend, scale, or reuse.

This project aims to build a **generic, resource-based booking backend** that can support multiple industries such as vehicle rental, clinics, salons, or coworking spaces without changing core logic.

## Solution Summary

The system introduces a **Resource abstraction** — any vendor-owned entity that can be booked exclusively for a time range. Users book resources, payments are processed, and system events are handled asynchronously.

## Target Users

- Customers who want to book resources
- Vendors who own and manage resources
- Administrators who control and monitor the platform

## Non-Goals

- Frontend UI perfection
- Real payment provider integration in early phase
- Mobile application support (out of scope for backend demo)

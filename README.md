# GIST Library Reservation System

A modern, user-friendly web application for reserving study rooms at the GIST Library.

## Features
- **Room Booking:** Browse available rooms by floor and capacity, and book time slots.
- **My Reservations:** View and manage your existing reservations.
- **Exam Period Support:** Automatically adjusts operating hours during exam periods (extended to 02:00 AM).
- **Responsive Design:** Optimized for both desktop and mobile usage.

## Exam Period Configuration

The application supports dynamic operating hours for exam periods. During these periods, the reservation slots are extended to include **00:00 (24)** and **01:00**.

### How to Add New Exam Dates

1.  Open the file: `src/lib/constants.ts`
2.  Locate the `EXAM_PERIODS` array.
3.  Add a new object with `start` and `end` dates in `YYYY-MM-DD` format.

```typescript
export const EXAM_PERIODS = [
  { start: "2024-04-20", end: "2024-04-26" },
  { start: "2024-06-15", end: "2024-06-21" },
  // Add your new period here:
  { start: "2025-04-20", end: "2025-04-26" }, 
];
```

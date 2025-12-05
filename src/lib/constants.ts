import { isWithinInterval, parseISO } from "date-fns";

// =============================================================================
// EXAM PERIOD CONFIGURATION
// =============================================================================
// Add new exam periods here.
// Format: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }
// The logic will automatically switch to "Exam Mode" (09:00 - 02:00 next day)
// if the selected date falls within any of these ranges.
// =============================================================================
export const EXAM_PERIODS = [
  { start: "2025-12-06", end: "2025-12-19" }, // Final Fall 2025
  { start: "2026-04-12", end: "2026-04-24" }, // Midterm Spring 2026
  { start: "2026-06-07", end: "2026-06-19" }, // Final Spring 2026
  { start: "2026-10-11", end: "2026-10-23" }, // Midterm Fall 2026
  { start: "2026-12-06", end: "2026-12-18" }, // Final Fall 2026
];

/**
 * Checks if a given date is within any defined exam period.
 * @param date The date to check
 * @returns true if the date is in an exam period, false otherwise.
 */
export function isExamPeriod(date: Date): boolean {
  return EXAM_PERIODS.some((period) =>
    isWithinInterval(date, {
      start: parseISO(period.start),
      end: parseISO(period.end),
    })
  );
}

/**
 * Returns the list of hours to display based on the date.
 * Normal: 9, 10, ..., 23
 * Exam: 24, 1, 9, 10, ..., 23
 */
export function getOperatingHours(date: Date): number[] {
  if (isExamPeriod(date)) {
    // Exam Period: 0(24), 1, then 9..23
    // We use 0 for midnight to ensure compatibility with standard time formats and APIs.
    const lateNight = [0, 1];
    const normalHours = Array.from({ length: 15 }, (_, i) => i + 9); // 9 to 23
    return [...lateNight, ...normalHours];
  } else {
    // Normal Period: 8 to 23 (User said hide 24)
    return Array.from({ length: 16 }, (_, i) => i + 8); // 8 to 23
  }
}

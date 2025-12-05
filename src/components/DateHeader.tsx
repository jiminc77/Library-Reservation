"use client";

import * as React from "react";
import { format, addDays, subDays, addMonths, startOfDay, isBefore, isAfter, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  isAdmin?: boolean;
}

export function DateHeader({ selectedDate, onDateChange, isAdmin = false }: DateHeaderProps) {
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  // Define limits
  // If admin, allow effectively unlimited range (e.g., +/- 10 years)
  // If not admin, restrict to today -> 1 month
  const minDate = isAdmin ? startOfDay(new Date(2020, 0, 1)) : startOfDay(new Date());
  const maxDate = isAdmin ? startOfDay(new Date(2030, 11, 31)) : addMonths(startOfDay(new Date()), 1);

  const handlePrevDay = () => {
    const newDate = subDays(selectedDate, 1);
    if (!isBefore(newDate, minDate)) {
      onDateChange(newDate);
    }
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    if (!isAfter(newDate, maxDate)) {
      onDateChange(newDate);
    }
  };

  const isPrevDisabled = isSameDay(selectedDate, minDate) || isBefore(selectedDate, minDate);
  const isNextDisabled = isSameDay(selectedDate, maxDate) || isAfter(selectedDate, maxDate);

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1 pl-2 pr-2">
      <button 
        onClick={handlePrevDay}
        disabled={isPrevDisabled}
        className={cn(
          "p-1.5 rounded-full transition-all",
          isPrevDisabled
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-500 hover:bg-white hover:shadow-sm hover:text-gray-900"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <div 
        className="flex items-center gap-2 px-4 py-1.5 cursor-pointer hover:bg-white/50 rounded-md transition-colors relative"
        onClick={() => {
          try {
            const input = dateInputRef.current as any;
            // Try explicit showPicker first
            if (input && typeof input.showPicker === 'function') {
              input.showPicker();
            } else {
              input?.focus();
              input?.click(); // Try triggering click
            }
          } catch (e) {
            console.log("showPicker failed", e);
            const input = dateInputRef.current as any;
            input?.click();
          }
        }}
      >
        <CalendarIcon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-900 min-w-[140px] text-center">
          {format(selectedDate, "MMMM d, yyyy")}
        </span>
        <input
          ref={dateInputRef}
          type="date"
          min={format(minDate, "yyyy-MM-dd")}
          max={format(maxDate, "yyyy-MM-dd")}
          className="absolute top-0 left-0 w-full h-full cursor-pointer z-20"
          style={{ opacity: 0 }} 
          value={format(selectedDate, "yyyy-MM-dd")}
          onChange={(e) => {
            if (e.target.value) {
              const newDate = new Date(e.target.value);
              // Basic validation for manual input
              if (!isBefore(newDate, minDate) && !isAfter(newDate, maxDate)) {
                onDateChange(newDate);
              } else {
                // Optionally handle out of range input, e.g. reset or alert
                // For now, just clamp or ignore? Let's ignore to prevent invalid state
                if (isBefore(newDate, minDate)) onDateChange(minDate);
                if (isAfter(newDate, maxDate)) onDateChange(maxDate);
              }
            }
          }}
        />
      </div>

      <button 
        onClick={handleNextDay}
        disabled={isNextDisabled}
        className={cn(
          "p-1.5 rounded-full transition-all",
          isNextDisabled
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-500 hover:bg-white hover:shadow-sm hover:text-gray-900"
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

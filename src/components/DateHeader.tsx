"use client";

import * as React from "react";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateHeader({ selectedDate, onDateChange }: DateHeaderProps) {
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1 pl-2 pr-2">
      <button 
        onClick={() => onDateChange(subDays(selectedDate, 1))}
        className="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all text-gray-500 hover:text-gray-900"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <div 
        className="flex items-center gap-2 px-4 py-1.5 cursor-pointer hover:bg-white/50 rounded-md transition-colors relative"
        onClick={() => {
          try {
            dateInputRef.current?.showPicker();
          } catch (e) {
            // Fallback for browsers that don't support showPicker (input click should handle it)
            console.log("showPicker not supported or failed", e);
            dateInputRef.current?.focus();
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
          className="absolute opacity-0 top-0 left-0 w-full h-full cursor-pointer z-10"
          value={format(selectedDate, "yyyy-MM-dd")}
          onChange={(e) => {
            if (e.target.value) {
              onDateChange(new Date(e.target.value));
            }
          }}
        />
      </div>

      <button 
        onClick={() => onDateChange(addDays(selectedDate, 1))}
        className="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all text-gray-500 hover:text-gray-900"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

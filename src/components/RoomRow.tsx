"use client";

import * as React from "react";
import { Room, Reservation } from "@/types";
import { cn } from "@/lib/utils";
import { Users, Monitor, Zap, MapPin } from "lucide-react";
import { format } from "date-fns";

interface RoomRowProps {
  room: Room;
  reservations: Reservation[];
  selectedDate: Date;
  onSlotClick: (room: Room, time: string) => void;
  currentUserId?: string;
  selectedSlots: { roomId: string; time: string }[];
}

import { getOperatingHours } from "@/lib/constants";

interface RoomRowProps {
  room: Room;
  reservations: Reservation[];
  selectedDate: Date;
  onSlotClick: (room: Room, time: string) => void;
  currentUserId?: string;
  selectedSlots: { roomId: string; time: string }[];
}

export function RoomRow({ room, reservations, selectedDate, onSlotClick, currentUserId, selectedSlots }: RoomRowProps) {
  const hours = getOperatingHours(selectedDate);

  const getSlotStatus = (roomId: string, hour: number) => {
    const timeStr = `${hour.toString().padStart(2, "0")}:00`;
    const reservation = reservations.find(
      (r) => r.roomId === roomId && r.date === format(selectedDate, "yyyy-MM-dd") && r.startTime.startsWith(timeStr)
    );

    if (reservation) {
      return reservation.userId === currentUserId ? "my-booking" : "booked";
    }
    return "available";
  };

  const isSlotSelected = (roomId: string, time: string) => {
    return selectedSlots.some(s => s.roomId === roomId && s.time === time);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col md:flex-row min-h-[240px]">
      {/* Room Info - Left Side */}
      <div className="w-full md:w-80 shrink-0 bg-gray-50 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r">
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-xl text-gray-900 leading-tight">{room.name}</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{room.capacity} People</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{room.floor}</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-gray-400" />
              <span className="truncate" title={room.equipment.join(", ")}>
                {room.equipment.length > 0 ? room.equipment.join(", ") : "No Equipment"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline - Right Side */}
      <div className="flex-1 p-6 overflow-x-auto flex items-center">
        <div className="w-full">
          <div className="flex min-w-[600px] border rounded-lg overflow-hidden">
            {hours.map((hour) => {
              const status = getSlotStatus(room.id, hour);
              const isSelected = isSlotSelected(room.id, `${hour}:00`);
              
              return (
                <div key={hour} className="flex-1 flex flex-col">
                  <div className="h-6 bg-gray-50 border-b border-r text-[10px] text-gray-500 flex items-center justify-center">
                    {hour === 0 ? "24" : hour}
                  </div>
                  <button
                    onClick={() => (status === "available" || status === "my-booking") && onSlotClick(room, `${hour}:00`)}
                    disabled={status === "booked"}
                    className={cn(
                      "h-28 border-r transition-all relative",
                      status === "available" && !isSelected && "hover:bg-green-50 cursor-pointer bg-white",
                      isSelected && "bg-green-100 cursor-pointer hover:bg-green-200",
                      status === "booked" && "bg-gray-100 cursor-not-allowed", // Lighter gray for booked
                      status === "my-booking" && "bg-blue-50 cursor-pointer hover:bg-blue-100"
                    )}
                    title={`${hour}:00 - ${status}`}
                  >
                    {status === "booked" && (
                      <div className="absolute inset-1 rounded bg-gray-300" />
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    )}
                    {status === "my-booking" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          
          {/* Legend - Compact */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 justify-end">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white border"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-200 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              </div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-300"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>
              <span>My Booking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

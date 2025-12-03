"use client";

import * as React from "react";
import { Room } from "@/types";
import { X, Calendar, Clock, Users } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  selectedDate: Date;
  selectedTime: string;
  onConfirm: () => void;
}

export function BookingModal({ isOpen, onClose, room, selectedDate, selectedTime, onConfirm }: BookingModalProps) {
  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Confirm Reservation</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{room.name}</h3>
                <p className="text-sm text-gray-500">{room.floor} • Capacity: {room.capacity}</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date
                </div>
                <div className="font-medium text-sm">
                  {selectedDate.toLocaleDateString()}
                </div>
              </div>
              <div className="flex-1 border-l pl-4">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Time
                </div>
                <div className="font-medium text-sm">
                  {selectedTime} - {parseInt(selectedTime) + 1}:00
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Purpose of Use</label>
            <input 
              type="text" 
              placeholder="e.g. Group Study"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-all hover:shadow-md"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: "group" | "mini-theater" | "studio";
  floor: string;
  equipment: string[];
}

export interface Reservation {
  id: string;
  roomId: string;
  userId: string;
  startTime: string; // ISO string or "HH:mm"
  endTime: string;
  date: string; // YYYY-MM-DD
  status: "confirmed" | "cancelled";
}

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
  reservation?: Reservation;
}

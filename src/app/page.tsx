"use client";

import * as React from "react";
import { DateHeader } from "@/components/DateHeader";
import { RoomRow } from "@/components/RoomRow";
import { BookingModal } from "@/components/BookingModal";
import { LoginModal } from "@/components/LoginModal";
import { MyReservationsModal } from "@/components/MyReservationsModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Room, Reservation } from "@/types";
import { format } from "date-fns";
import { libraryApi, User } from "@/lib/api";
import { LogIn, LogOut, User as UserIcon, List, Filter, ChevronDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Logo from "./logo.svg";
import { toast } from "sonner";

export default function Home() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [isMyReservationsModalOpen, setIsMyReservationsModalOpen] = React.useState(false);
  const [selectedSlots, setSelectedSlots] = React.useState<{ room: Room; time: string }[]>([]);
  const [reservations, setReservations] = React.useState<Reservation[]>([]);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Confirm Modal State
  const [confirmState, setConfirmState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  const closeConfirm = () => setConfirmState(prev => ({ ...prev, isOpen: false }));

  // Filter State
  const [selectedFloor, setSelectedFloor] = React.useState("All");
  const [minCapacity, setMinCapacity] = React.useState(0);
  const [isFloorDropdownOpen, setIsFloorDropdownOpen] = React.useState(false);
  const [isCapacityDropdownOpen, setIsCapacityDropdownOpen] = React.useState(false);
  const floorDropdownRef = React.useRef<HTMLDivElement>(null);
  const capacityDropdownRef = React.useRef<HTMLDivElement>(null);

  // Check for existing session
  React.useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const response = await libraryApi.getAccount();
          console.log("Session check response:", response);

          // Handle various response structures
          const userData = response.result || response;

          if (userData && (userData.user_id || userData.USER_ID)) {
            setUser(userData);
          } else {
            console.warn("Invalid session data:", response);
            // Only remove if explicitly failed or empty
            if (response.success === false) {
              localStorage.removeItem("accessToken");
            }
          }
        } catch (error) {
          console.error("Failed to restore session", error);
          localStorage.removeItem("accessToken");
        }
      }
    };
    checkSession();
  }, []);

  const fetchData = React.useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    console.log("🔍 fetchData called. Token exists:", !!token, "User exists:", !!user);

    if (!token && !user) {
      console.log("⚠️ No token or user, skipping data fetch");
      return;
    }

    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyyMMdd");
      console.log("📅 Fetching data for date:", dateStr, selectedDate);

      const y = selectedDate.getFullYear();
      const m = selectedDate.getMonth();
      const startDt = format(new Date(y, m, 1), "yyyyMMdd");
      const endDt = format(new Date(y, m + 1, 0), "yyyyMMdd");

      console.log("📡 Calling getFacilityInfo with:", { startDt, endDt, dateStr });

      const facilityInfo = await libraryApi.getFacilityInfo({
        START_DT_YYYYMMDD: startDt,
        END_DT_YYYYMMDD: endDt,
        RES_YYYYMMDD: dateStr
      });

      console.log("✅ getFacilityInfo response:", facilityInfo);
      console.log("   - Has facility array?", !!facilityInfo?.facility);
      console.log("   - Facility count:", facilityInfo?.facility?.length || 0);

      if (facilityInfo && facilityInfo.facility) {
        const apiRooms = facilityInfo.facility
          .map((r: any) => {
            const match = r.FAC_NM.match(/\((\d+)\)$/);
            const roomNum = match ? parseInt(match[1]) : 0;
            let capacity = 6;
            let equipment = ["Screen", "Whiteboard"];
            let name = `Group Study Room, ${roomNum}`;
            let type = "group";
            let floor = r.FAC_NM.includes("2F") ? "2F" : r.FAC_NM.includes("3F") ? "3F" : r.FAC_NM.includes("4F") ? "4F" : "1F";

            // Apply specific rules based on room number
            if (floor === "2F") {
              if (roomNum >= 219 && roomNum <= 236) {
                capacity = 1;
                equipment = [];
                name = `Small-sized Carrels, ${roomNum}`;
                type = "personal";
              } else if (roomNum >= 205 && roomNum <= 210) {
                capacity = 5;
                equipment = ["Whiteboard"];
              } else if (roomNum >= 202 && roomNum <= 204) {
                capacity = 8;
                equipment = ["Whiteboard", "LED TV"];
              }
            } else if (floor === "3F") {
              if (roomNum >= 302 && roomNum <= 307) {
                capacity = 10;
                equipment = ["Whiteboard", "LED TV"];
              }
            }

            return {
              id: r.ROOM_ID,
              name: name,
              capacity: capacity,
              type: type,
              floor: floor,
              equipment: equipment,
              originalName: r.FAC_NM, // Keep for debugging if needed
              roomNum: roomNum
            };
          })
          .filter((room: any) => {
            // Exclusions
            if (room.floor === "1F") return false;
            if (room.floor === "4F") return false; // Explicitly remove 4F as requested

            // 2F Exclusions
            if (room.floor === "2F") {
              if (room.roomNum >= 237 && room.roomNum <= 240) return false;
            }

            // General exclusions from before
            if (room.originalName.includes("Lecture Room(for 30 people)")) return false;
            if (room.originalName.includes("Room 310")) return false;

            return true;
          });

        console.log("🏢 Filtered rooms:", apiRooms.length);
        console.log("   Rooms:", apiRooms.map((r: any) => r.name).join(", "));
        setRooms(apiRooms);

        console.log("🔄 Fetching reservations for each room...");
        const roomReservationResults = await Promise.all(apiRooms.map(async (room: any) => {
          try {
            // Use getRoom as it returns detailed availability in 'roomOther'
            const resData = await libraryApi.getRoom({
              START_DT_YYYYMMDD: dateStr,
              END_DT_YYYYMMDD: dateStr,
              ROOM_ID: room.id,
              RES_YYYYMMDD: dateStr
            });

            // console.log(`   Room ${room.name} (${room.id}) getRoom keys:`, resData ? Object.keys(resData) : 'null');

            const roomReservations: Reservation[] = [];

            // Map 'roomOther' (other people's reservations)
            if (resData && resData.roomOther && Array.isArray(resData.roomOther)) {
              resData.roomOther.forEach((r: any) => {
                if (r.RES_HOUR === undefined || r.RES_HOUR === null) return;
                const startTime = `${r.RES_HOUR.toString().padStart(2, '0')}:00`;
                const endTime = `${(r.RES_HOUR + 1).toString().padStart(2, '0')}:00`;
                const date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;

                roomReservations.push({
                  id: `${room.id}-${dateStr}-${r.RES_HOUR}`, // Generate ID
                  roomId: room.id,
                  userId: "other", // Mark as other to show gray
                  startTime,
                  endTime,
                  date,
                  status: "confirmed"
                });
              });
            }

            // Also check 'room' array if it exists (might contain my reservations or others?)
            // Based on debug output, 'room' was empty, but 'roomOther' had data.
            // We should also merge 'my reservations' which we fetch separately? 
            // Actually, 'fetchReservations' (My Reservations) fetches my bookings.
            // But for the grid, we need to show them too. 
            // The 'room' array in getRoom might be 'my' reservations for this room?
            // Let's map it just in case.
            if (resData && resData.room && Array.isArray(resData.room)) {
              resData.room.forEach((r: any) => {
                if (r.RES_HOUR === undefined || r.RES_HOUR === null) return;
                const startTime = `${r.RES_HOUR.toString().padStart(2, '0')}:00`;
                const endTime = `${(r.RES_HOUR + 1).toString().padStart(2, '0')}:00`;
                const date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;

                // Check if this is already added?
                roomReservations.push({
                  id: r.RES_ID || `${room.id}-${dateStr}-${r.RES_HOUR}`,
                  roomId: room.id,
                  userId: "me", // Assuming 'room' contains my reservations? Or maybe check user ID?
                  // For now, let's assume 'room' is also booked. 
                  // Actually, let's stick to 'roomOther' for gray slots. 
                  // My slots are handled by the 'myReservations' state which we overlay?
                  // No, we need to return them here to be in 'allReservations'.
                  // Let's assume 'room' is also booked.
                  startTime,
                  endTime,
                  date,
                  status: "confirmed"
                });
              });
            }

            return roomReservations;
          } catch (err) {
            console.error(`   ❌ Failed to fetch room info for ${room.name} (${room.id}):`, err);
            return [];
          }
        }));

        const allReservations = roomReservationResults.flat();
        console.log("📊 Total reservations fetched:", allReservations.length);

        if (user) {
          console.log("👤 Fetching my reservations to identify user's bookings...");
          const myResData = await libraryApi.getMyReservation({
            START_DT: dateStr,
            END_DT: dateStr
          });

          let myResList: any[] = [];
          if (myResData) {
            if (Array.isArray(myResData)) myResList = myResData;
            else if (myResData.data && Array.isArray(myResData.data)) myResList = myResData.data;
            else if (myResData.result && Array.isArray(myResData.result)) myResList = myResData.result;
            else if (myResData.RESULT && Array.isArray(myResData.RESULT)) myResList = myResData.RESULT;
            else if (myResData.data && myResData.data.result && Array.isArray(myResData.data.result)) myResList = myResData.data.result;
          }

          console.log("   My reservations:", myResList.length);

          if (myResList.length > 0) {
            myResList.forEach((myR: any) => {
              const match = allReservations.find(r =>
                r.roomId === myR.ROOM_ID &&
                parseInt(r.startTime) === myR.RES_HOUR &&
                r.date.replace(/-/g, '') === myR.RES_YYYYMMDD
              );
              if (match) {
                match.userId = user.user_id;
                match.id = myR.RES_ID;
              } else {
                const startTime = `${myR.RES_HOUR.toString().padStart(2, '0')}:00`;
                const endTime = `${(myR.RES_HOUR + 1).toString().padStart(2, '0')}:00`;
                const date = `${myR.RES_YYYYMMDD.substring(0, 4)}-${myR.RES_YYYYMMDD.substring(4, 6)}-${myR.RES_YYYYMMDD.substring(6, 8)}`;
                allReservations.push({
                  id: myR.RES_ID,
                  roomId: myR.ROOM_ID,
                  userId: user.user_id,
                  startTime,
                  endTime,
                  date,
                  status: "confirmed"
                });
              }
            });
          }
        }

        console.log("✅ Final state: Rooms:", apiRooms.length, "Reservations:", allReservations.length);
        setReservations(allReservations);
      } else {
        console.log("⚠️ No facility data returned from API");
      }
    } catch (error) {
      console.error("❌ Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, user]);

  // Fetch data when date changes
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSlotClick = async (room: Room, time: string) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    // Check if it's my booking (Cancellation)
    const myBooking = reservations.find(
      (r) => r.roomId === room.id && r.userId === user.user_id && r.startTime.startsWith(time)
    );

    if (myBooking) {
      setConfirmState({
        isOpen: true,
        title: "Cancel Reservation",
        message: "Do you want to cancel this reservation?",
        confirmText: "Cancel Reservation",
        isDestructive: true,
        onConfirm: async () => {
          try {
            const dateStr = format(selectedDate, "yyyyMMdd");
            const hour = parseInt(time);

            const response = await libraryApi.cancelReservation({
              ROOM_ID: room.id,
              RES_YYYYMMDD: dateStr,
              RES_HOUR: hour,
              RES_ID: myBooking.id
            });

            console.log("Cancellation Response:", response);

            if (response && (response.success !== false)) {
              await fetchData();
              toast.success("Reservation cancelled successfully.");
            } else {
              toast.error("Failed to cancel reservation. Please try refreshing the list to check status.");
            }
          } catch (error) {
            console.error("Cancellation failed", error);
            toast.error("Failed to cancel reservation. Please try refreshing the list to check status.");
          }
        }
      });
      return;
    }

    // Toggle Selection
    const isSelected = selectedSlots.some(s => s.room.id === room.id && s.time === time);
    if (isSelected) {
      setSelectedSlots(prev => prev.filter(s => !(s.room.id === room.id && s.time === time)));
    } else {
      // Validate: Can only select slots for the same room? Or multiple rooms?
      if (selectedSlots.length > 0 && selectedSlots[0].room.id !== room.id) {
        setConfirmState({
          isOpen: true,
          title: "Change Room Selection",
          message: "You can only select slots for one room at a time. Clear previous selection?",
          confirmText: "Clear & Select",
          onConfirm: () => {
            setSelectedSlots([{ room, time }]);
          }
        });
        return;
      }

      // Validate Max 4 hours total (existing + selected)
      const myDailyReservations = reservations.filter(
        (r) => r.userId === user.user_id && r.date === format(selectedDate, "yyyy-MM-dd")
      );
      if (myDailyReservations.length + selectedSlots.length >= 4) {
        toast.error("You can only book up to 4 hours per day.");
        return;
      }

      setSelectedSlots(prev => [...prev, { room, time }]);
    }
  };

  const handleConfirmBooking = async () => {
    console.log("handleConfirmBooking called. Slots:", selectedSlots.length, "User:", user);
    if (selectedSlots.length === 0 || !user) {
      console.log("Aborting: No slots or no user");
      return;
    }

    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyyMMdd");
      let successCount = 0;
      let failCount = 0;

      // Sort slots by time to book in order
      const sortedSlots = [...selectedSlots].sort((a, b) => parseInt(a.time) - parseInt(b.time));

      // Validate 1-hour gap rule for the whole batch + existing
      const myDailyReservations = reservations.filter(
        (r) => r.userId === user.user_id && r.date === format(selectedDate, "yyyy-MM-dd")
      );
      const existingHours = myDailyReservations.map(r => parseInt(r.startTime));
      const newHours = sortedSlots.map(s => parseInt(s.time));
      const allHours = [...existingHours, ...newHours].sort((a, b) => a - b);

      // Check for gaps
      for (let i = 0; i < allHours.length - 1; i++) {
        if (allHours[i + 1] - allHours[i] === 2) {
          toast.error(`Cannot leave a 1-hour gap between reservations (e.g., ${allHours[i]}:00 and ${allHours[i + 1]}:00).`);
          setIsLoading(false);
          return;
        }
      }

      for (const slot of sortedSlots) {
        const hour = parseInt(slot.time);
        try {
          const response = await libraryApi.makeReservation({
            ROOM_ID: slot.room.id,
            CREATE_ID: user.user_id,
            REMARK: user.org_nm || "Student",
            RES_YYYYMMDD: dateStr,
            RES_HOUR: hour,
            ADMIN_YN: user.library_yn || "N"
          });

          if (response && (response.entries || typeof response === 'number')) { // Check for success signal
            successCount++;
          } else {
            console.error(`Failed to book ${hour}:00`, response);
            failCount++;
          }
        } catch (err) {
          console.error(`Error booking ${hour}:00`, err);
          failCount++;
        }
      }

      if (failCount > 0) {
        toast.warning(`Booked ${successCount} slots. Failed to book ${failCount} slots. Please check availability.`);
      } else {
        toast.success("All reservations successful!");
        await fetchData(); // Re-fetch to get real IDs and ensure sync
      }
      setSelectedSlots([]);

    } catch (error) {
      console.error("Booking process failed", error);
      toast.error("An error occurred while booking.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setReservations([]);
    setSelectedSlots([]);
    toast.success("Logged out successfully");
  };

  const filteredRooms = rooms.filter(room => {
    if (selectedFloor !== "All" && room.floor !== selectedFloor) return false;
    if (minCapacity > 0 && room.capacity !== minCapacity) return false; // Exact Match
    if (minCapacity > 0 && room.capacity < minCapacity) return false; // Changed to capacity < minCapacity
    return true;
  });

  return (
    <main className="h-screen flex flex-col overflow-hidden bg-white relative">
      {/* Header Section */}
      <div className="flex flex-col w-full bg-white z-10 shrink-0 shadow-sm">
        {/* Row 1: Brand Header */}
        <div className="flex items-center px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <Image src={Logo} alt="GIST Library Logo" width={32} height={32} className="h-8 w-auto" />
            <h1 className="text-xl font-bold text-gray-900">Library Reservation</h1>
          </div>
        </div>

        {/* Row 2: Control Bar */}
        {user && (
          <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-6 py-3 border-t border-gray-100 bg-white gap-4 md:gap-0">

            {/* Mobile: Date Picker First */}
            <div className="w-full md:hidden flex justify-center">
              <DateHeader selectedDate={selectedDate} onDateChange={(d) => { setSelectedDate(d); setSelectedSlots([]); }} />
            </div>

            {/* Left: Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
              {/* Floor Filter */}
              <div className="relative" ref={floorDropdownRef}>
                <button
                  onClick={() => setIsFloorDropdownOpen(!isFloorDropdownOpen)}
                  className="flex items-center justify-between w-[110px] md:w-[130px] px-2 md:px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="truncate">{selectedFloor === "All" ? "All" : selectedFloor}</span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {isFloorDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                    {["All", "2F", "3F"].map((floor) => (
                      <button
                        key={floor}
                        onClick={() => {
                          setSelectedFloor(floor);
                          setIsFloorDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                          selectedFloor === floor ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"
                        )}
                      >
                        {floor === "All" ? "All Floors" : floor}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Capacity Filter */}
              <div className="relative" ref={capacityDropdownRef}>
                <button
                  onClick={() => setIsCapacityDropdownOpen(!isCapacityDropdownOpen)}
                  className="flex items-center justify-between w-[120px] md:w-[150px] px-2 md:px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="truncate">{minCapacity === 0 ? "Any" : `${minCapacity} Ppl`}</span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {isCapacityDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                    {[0, 1, 5, 8, 10].map((cap) => (
                      <button
                        key={cap}
                        onClick={() => {
                          setMinCapacity(cap);
                          setIsCapacityDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                          minCapacity === cap ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"
                        )}
                      >
                        {cap === 0 ? "Any Capacity" : `${cap} Person${cap > 1 ? 's' : ''}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile: Actions in same row as filters */}
              <div className="flex md:hidden items-center gap-1 ml-auto">
                <button
                  onClick={fetchData}
                  disabled={isLoading || !user}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                </button>
                {user && (
                  <>
                    <button
                      onClick={() => setIsMyReservationsModalOpen(true)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <List className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Desktop: Date Picker Center */}
            <div className="hidden md:flex flex-1 justify-center">
              <DateHeader selectedDate={selectedDate} onDateChange={(d) => { setSelectedDate(d); setSelectedSlots([]); }} />
            </div>

            {/* Desktop: Actions Right */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={isLoading || !user}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-30"
                title="Refresh Data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
              </button>

              {user && (
                <>
                  <button
                    onClick={() => setIsMyReservationsModalOpen(true)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="My Reservations"
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {user ? (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Room List */}
            <div className="space-y-4">
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room) => (
                  <RoomRow
                    key={room.id}
                    room={room}
                    reservations={reservations.filter((r) => r.roomId === room.id)}
                    onSlotClick={handleSlotClick}
                    selectedDate={selectedDate}
                    currentUserId={user?.user_id}
                    selectedSlots={selectedSlots.map(s => ({ roomId: s.room.id, time: s.time }))}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
                  No rooms match your filters.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center pb-32">
              <div className="bg-white px-8 py-12 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md w-full">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
              <p className="text-gray-600 mb-8">
                  Please login with your library ID to view room availability and make reservations.
              </p>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
              >
                Login Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Booking Action Bar */}
      {selectedSlots.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-lg border border-gray-200 rounded-full px-4 py-2 md:px-6 md:py-3 flex items-center gap-3 md:gap-4 animate-in slide-in-from-bottom-4 z-50 w-max max-w-[90%] justify-between">
          <div className="text-xs md:text-sm font-medium text-gray-900 whitespace-nowrap">
            {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirmBooking}
              disabled={isLoading}
              className="bg-blue-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isLoading ? "Booking..." : "Confirm"}
            </button>
            <button
              onClick={() => setSelectedSlots([])}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <BookingModal
        isOpen={false} // Deprecated, using direct booking
        onClose={() => { }}
        room={null}
        selectedDate={selectedDate}
        selectedTime={""}
        onConfirm={() => { }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(u) => {
          setUser(u);
          const name = u.user_nm || u.USER_NM || u.user_id || "Student";
          toast.success(`Welcome back, ${name}`);
        }}
      />

      <MyReservationsModal
        isOpen={isMyReservationsModalOpen}
        onClose={() => setIsMyReservationsModalOpen(false)}
        user={user}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        isDestructive={confirmState.isDestructive}
      />
    </main>
  );
}

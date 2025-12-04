
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { X, Calendar, Clock, RotateCw } from 'lucide-react';
import { libraryApi } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmModal } from './ConfirmModal';

interface MyReservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

interface MyReservation {
  RES_ID: string;
  FAC_NM: string;
  RES_YYYYMMDD: string;
  RES_HOUR: number;
  RES_STATUS_NM: string;
  ROOM_ID: string;
  STATUS?: string;
}

export function MyReservationsModal({ isOpen, onClose, user }: MyReservationsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  // Use ref to store data to avoid state update issues
  const reservationsRef = useRef<MyReservation[]>([]);
  const [_, forceUpdate] = useState(0);

  // Confirm Modal State
  const [confirmState, setConfirmState] = useState<{
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

  useEffect(() => {
    if (isOpen && user) {
      fetchReservations();
    }
  }, [isOpen, user]);

  const formatRoomName = (name: string) => {
    return name.replace(/, Room .* \((\d+)\)$/, ", $1");
  };

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      
      // 1. Fetch Facility Info to get Room Names (Map ROOM_ID -> FAC_NM)
      const startDtInfo = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyyMMdd");
      const endDtInfo = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyyMMdd");
      
      const roomMap: Record<string, string> = {};
      try {
        const facilityResponse = await libraryApi.getFacilityInfo({
            START_DT_YYYYMMDD: startDtInfo,
            END_DT_YYYYMMDD: endDtInfo,
            RES_YYYYMMDD: startDtInfo
        });
        if (facilityResponse && facilityResponse.facility) {
            facilityResponse.facility.forEach((fac: any) => {
                roomMap[fac.ROOM_ID] = fac.FAC_NM;
            });
        }
      } catch (err) {
        console.error("Failed to fetch facility info for names", err);
      }

      // 2. Fetch reservations in chunks
      // 2. Fetch reservations in chunks
      // Reduce to specific months to avoid rate limiting: [-1, 0, 1] (near past/future) and [12] (target future date)
      const months = [-1, 0, 1, 12]; 
      
      const promises = months.map(async (offset) => {
        const sDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const eDate = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
        const start = format(sDate, "yyyyMMdd");
        const end = format(eDate, "yyyyMMdd");
        
        try {
            console.log(`Fetching My Reservations for ${start}-${end}...`);
            const res = await libraryApi.getMyReservation({
                START_DT: start,
                END_DT: end
            });
            console.log(`Response for ${start}-${end}:`, res);
            console.log("Response keys:", Object.keys(res));
            if (res.data) console.log("Response.data keys:", Object.keys(res.data));
            
            let list = [];
            if (Array.isArray(res)) {
                list = res;
            } else if (res.data && Array.isArray(res.data)) {
                list = res.data;
            } else if (res.result && Array.isArray(res.result)) {
                list = res.result;
            } else if (res.RESULT && Array.isArray(res.RESULT)) {
                list = res.RESULT;
            } else if (res.list && Array.isArray(res.list)) {
                list = res.list;
            } else if (res.data && res.data.result && Array.isArray(res.data.result)) {
                list = res.data.result;
            }
            
            console.log(`Found ${list.length} items in list`);
            return list;
        } catch (e) {
            console.error(`Failed to fetch for ${start}-${end}`, e);
            return [];
        }
      });

      const results = await Promise.all(promises);
      console.log("Results from Promise.all:", results);
      const allReservations = results.flat();
      console.log("Flattened reservations:", allReservations.length, allReservations);

      // 3. Map names and set state
      const mappedReservations = allReservations.map((res: any) => {
        // Normalize keys
        const RES_ID = res.RES_ID || res.res_id || res.resId || `temp-${Math.random()}`;
        const ROOM_ID = res.ROOM_ID || res.room_id || res.roomId;
        const RES_YYYYMMDD = res.RES_YYYYMMDD || res.res_yyyymmdd || res.resYyyymmdd;
        const RES_HOUR = res.RES_HOUR ?? res.res_hour ?? res.resHour;
        const FAC_NM = roomMap[ROOM_ID] || res.FAC_NM || res.fac_nm || res.facNm || `Room ${ROOM_ID}`;
        const RES_STATUS_NM = res.RES_STATUS_NM || res.res_status_nm || res.resStatusNm || "Unknown";

        return {
            ...res,
            RES_ID,
            ROOM_ID,
            RES_YYYYMMDD,
            RES_HOUR,
            FAC_NM,
            RES_STATUS_NM
        };
      });
      console.log("Mapped reservations:", mappedReservations.length, mappedReservations);

      // Sort by date and time (descending)
      const sorted = mappedReservations.sort((a: any, b: any) => {
        if (a.RES_YYYYMMDD !== b.RES_YYYYMMDD) {
          return (b.RES_YYYYMMDD || "").localeCompare(a.RES_YYYYMMDD || "");
        }
        return (a.RES_HOUR || 0) - (b.RES_HOUR || 0);
      });
      
      console.log("Sorted reservations (setting to ref):", sorted.length);
      
      reservationsRef.current = sorted; // Use sorted directly to avoid filtering issues
      forceUpdate(n => n + 1);
      setIsLoading(false);

    } catch (error) {
      console.error("Failed to fetch my reservations", error);
      setIsLoading(false);
    }
  };
  
  const reservations = reservationsRef.current;

  const handleCancelAll = async (items: MyReservation[]) => {
    const cancellableItems = items.filter(i => i.RES_STATUS_NM !== "취소");
    if (cancellableItems.length === 0) return;

    setConfirmState({
      isOpen: true,
      title: "Cancel All Reservations",
      message: `Are you sure you want to cancel all ${cancellableItems.length} reservations for this date?`,
      confirmText: "Cancel All",
      isDestructive: true,
      onConfirm: async () => {
        try {
          let successCount = 0;
          let failCount = 0;

          // Process sequentially to avoid overwhelming the API or hitting rate limits
          for (const item of cancellableItems) {
            try {
              const response = await libraryApi.cancelReservation({
                ROOM_ID: item.ROOM_ID,
                RES_YYYYMMDD: item.RES_YYYYMMDD,
                RES_HOUR: item.RES_HOUR,
                RES_ID: item.RES_ID
              });

              if (response && (response.success !== false)) {
                successCount++;
              } else {
                failCount++;
              }
            } catch (e) {
              console.error(`Failed to cancel ${item.RES_ID}`, e);
              failCount++;
            }
          }

          if (successCount > 0) {
            toast.success(`Cancelled ${successCount} reservations.${failCount > 0 ? ` Failed to cancel ${failCount}.` : ''}`);
            fetchReservations();
          } else {
            toast.error("Failed to cancel reservations.");
          }

        } catch (error) {
          console.error("Bulk cancellation failed", error);
          toast.error("An error occurred during bulk cancellation.");
        }
      }
    });
  };

  const handleCancel = async (res: MyReservation) => {
    setConfirmState({
      isOpen: true,
      title: "Cancel Reservation",
      message: "Do you want to cancel this reservation?",
      confirmText: "Cancel Reservation",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const response = await libraryApi.cancelReservation({
            ROOM_ID: res.ROOM_ID,
            RES_YYYYMMDD: res.RES_YYYYMMDD,
            RES_HOUR: res.RES_HOUR,
            RES_ID: res.RES_ID
          });

          console.log("Cancellation Response:", response);

          // Relaxed success check: API might not return success: true but still succeed
          // If we got a response and it doesn't explicitly say success: false, assume success
          if (response && (response.success !== false)) {
            toast.success("Reservation cancelled successfully.");
            fetchReservations(); // Refresh list
          } else {
            toast.error("Failed to cancel reservation. Please try refreshing the list to check status.");
          }
        } catch (error) {
          console.error("Cancellation failed", error);
          toast.error("Failed to cancel reservation. Please try refreshing the list to check status.");
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">My Reservations</h2>
          <div className="flex items-center gap-2">
            <button 
                onClick={fetchReservations}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title="Refresh"
            >
                <RotateCw className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50">
            {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    <div className="space-y-6 pb-4">
                      {Object.entries(reservations
                        .filter(res => {
                            const now = new Date();
                            const today = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
                            return res.RES_YYYYMMDD >= today;
                        })
                        .reduce((acc, res) => {
                        const date = res.RES_YYYYMMDD;
                        if (!acc[date]) acc[date] = [];
                        acc[date].push(res);
                        return acc;
                      }, {} as Record<string, typeof reservations>)).map(([date, items]) => (
                        <div key={date} className="relative">
                          <div className="sticky top-0 bg-gray-50 py-2 z-10 px-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">
                              {date.substring(0, 4)}-{date.substring(4, 6)}-{date.substring(6, 8)}
                            </h3>
                            {items.some(i => i.RES_STATUS_NM !== "취소") && (
                              <button
                                onClick={() => handleCancelAll(items)}
                                className="text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-1 rounded-full transition-colors"
                              >
                                Cancel All
                              </button>
                            )}
                          </div>
                          <div className="space-y-3 px-6 py-4">
                            {items.map((reservation) => (
                              <div
                                key={reservation.RES_ID}
                                className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors bg-white shadow-sm"
                              >
                                <div>
                                  <div className="font-medium text-lg text-gray-900">
                                    {formatRoomName(reservation.FAC_NM)}
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                                      <Clock className="w-4 h-4" />
                                      <span>{reservation.RES_HOUR}:00 - {reservation.RES_HOUR + 1}:00</span>
                                  </div>
                                  {/* Status removed as requested */}
                                </div>
                                {reservation.RES_STATUS_NM !== "취소" && (
                                  <button
                                    onClick={() => handleCancel(reservation)}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors border border-red-200"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {reservations.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No reservations found.
                        </div>
                    )}
                </>
            )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        isDestructive={confirmState.isDestructive}
      />
    </div>
  );
}


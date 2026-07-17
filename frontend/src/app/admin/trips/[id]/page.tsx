"use client";

import { use, useState, useEffect } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

const GET_TRIP_DETAILS = gql`
  query GetTripDetails($id: ID!) {
    trip(id: $id) {
      id
      origin
      destination
      departure_time
      bus_house
      bus_type
    }
    getSeatMap(tripId: $id) {
      id
      seat_number
      status
    }
  }
`;

const LOCK_SEATS = gql`
  mutation LockSeats($tripId: ID!, $seatIds: [String!]!) {
    lockSeats(tripId: $tripId, seatIds: $seatIds) {
      success
      message
    }
  }
`;

export default function AdminTripSeatMap({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;
  
  const { data, loading, refetch } = useQuery(GET_TRIP_DETAILS, {
    variables: { id: tripId },
    fetchPolicy: "network-only"
  });
  
  const [lockSeatsMutation] = useMutation(LOCK_SEATS);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const trip = data?.trip;
  const seats = data?.getSeatMap || [];

  const toggleSeat = (seatId: string) => {
    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(id => id !== seatId) 
        : [...prev, seatId]
    );
  };

  const handleLockSeats = async () => {
    if (selectedSeats.length === 0) return;
    if (!window.confirm(`Xác nhận KHÓA ${selectedSeats.length} ghế này (không bán)?`)) return;

    try {
      const token = localStorage.getItem("admin_token");
      await lockSeatsMutation({
        variables: { tripId, seatIds: selectedSeats },
        context: { headers: { authorization: `Bearer ${token}` } }
      });
      alert("Đã khóa ghế thành công!");
      setSelectedSeats([]);
      refetch();
    } catch (err: any) {
      alert("Lỗi khóa ghế: " + err.message);
    }
  };

  if (loading) return <div className="p-8">Đang tải thông tin chuyến xe...</div>;
  if (!trip) return <div className="p-8 text-red-500">Không tìm thấy chuyến xe</div>;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <Link href="/admin/trips" className="text-blue-600 hover:underline flex items-center gap-2 mb-4">
          <ArrowLeft size={16} /> Quay lại danh sách chuyến
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Cấu hình Ghế - Chuyến {tripId.split('-')[0]}</h1>
        <p className="text-gray-500 mt-1">
          {trip.origin} &rarr; {trip.destination} | Khởi hành: {new Date(trip.departure_time).toLocaleString("vi-VN")}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Seat Map */}
        <div className="flex-1 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-center">Sơ đồ ghế xe {trip.bus_type}</h3>
          
          <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto">
            {seats.map((seat: any) => {
              const isSelected = selectedSeats.includes(seat.id);
              const isAvailable = seat.status === "AVAILABLE";
              const isLocked = seat.status === "LOCKED";
              const isHeld = seat.status === "HELD";

              let bgClass = "bg-white border-2 border-green-500 text-green-700 hover:bg-green-50"; // AVAILABLE
              if (isSelected) bgClass = "bg-blue-600 border-2 border-blue-600 text-white";
              if (isLocked) bgClass = "bg-gray-300 border-2 border-gray-300 text-gray-500 cursor-not-allowed";
              if (isHeld || seat.status === "BOOKED") bgClass = "bg-red-500 border-2 border-red-500 text-white cursor-not-allowed";

              return (
                <button
                  key={seat.id}
                  disabled={!isAvailable && !isSelected}
                  onClick={() => toggleSeat(seat.id)}
                  className={`py-3 rounded-lg font-bold text-sm transition flex flex-col items-center justify-center gap-1 ${bgClass}`}
                >
                  {isLocked ? <Lock size={14} /> : seat.seat_number}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center gap-6 text-sm font-medium text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-green-500 rounded"></div> Trống
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div> Đã bán / Đang giữ
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div> Đã Khóa
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div> Đang chọn
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="w-80">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-8">
            <h3 className="font-bold text-lg mb-4">Thao tác Admin</h3>
            <p className="text-gray-600 text-sm mb-4">
              Bạn có thể chọn các ghế đang trống để khóa lại, không cho phép khách hàng đặt vé trên hệ thống (ví dụ ghế ưu tiên nội bộ).
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
              <p className="font-bold text-blue-800">Ghế đang chọn: {selectedSeats.length}</p>
              {selectedSeats.length > 0 && (
                <p className="text-sm text-blue-600 mt-1 font-mono">{selectedSeats.join(", ")}</p>
              )}
            </div>

            <button
              disabled={selectedSeats.length === 0}
              onClick={handleLockSeats}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                selectedSeats.length === 0 
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                  : "bg-red-600 hover:bg-red-700 text-white shadow-md"
              }`}
            >
              <Lock size={18} /> KHÓA GHẾ NÀY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

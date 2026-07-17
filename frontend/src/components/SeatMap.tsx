"use client";

import { useState, useEffect } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation, useSubscription } from "@apollo/client/react";

const GET_SEAT_MAP = gql`
  query GetSeatMap($tripId: ID!) {
    getSeatMap(tripId: $tripId) {
      id
      seat_number
      status
    }
  }
`;

const HOLD_SEATS = gql`
  mutation HoldSeats($tripId: ID!, $seatIds: [String!]!) {
    holdSeats(tripId: $tripId, seatIds: $seatIds) {
      success
      message
    }
  }
`;

const CREATE_BOOKING = gql`
  mutation CreateBooking($tripId: ID!, $passengers: [PassengerInput!]!, $customerName: String!, $customerPhone: String!, $customerEmail: String!) {
    createBooking(tripId: $tripId, passengers: $passengers, customerName: $customerName, customerPhone: $customerPhone, customerEmail: $customerEmail) {
      booking_id
      status
      message
    }
  }
`;

const SEAT_STATUS_SUBSCRIPTION = gql`
  subscription OnSeatStatusChanged($tripId: ID!) {
    seatStatusChanged(tripId: $tripId) {
      id
      seat_number
      status
    }
  }
`;

export default function SeatMap({ tripId }: { tripId: string }) {
  const { data, loading, error, refetch } = useQuery(GET_SEAT_MAP, {
    variables: { tripId },
    fetchPolicy: "network-only"
  });

  const [holdSeats] = useMutation(HOLD_SEATS);
  const [createBooking] = useMutation(CREATE_BOOKING);
  const [seats, setSeats] = useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [holdError, setHoldError] = useState("");
  const [user, setUser] = useState<any>(null);
  
  // Payment Form State
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update local state when query finishes
  useEffect(() => {
    if (data?.getSeatMap) {
      setSeats(data.getSeatMap);
    }
  }, [data]);

  // Autofill user info if logged in
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setFormData(prev => ({
        ...prev,
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || ""
      }));
    }
  }, []);

  const isProfileIncomplete = user && (!user.phone || !user.identity_number);

  // Handle Subscription updates
  const { data: subData } = useSubscription(SEAT_STATUS_SUBSCRIPTION, {
    variables: { tripId }
  });

  useEffect(() => {
    if (subData?.seatStatusChanged) {
      const updatedSeat = subData.seatStatusChanged;
      setSeats(prev => prev.map(s => s.id === updatedSeat.id ? updatedSeat : s));
    }
  }, [subData]);

  // Countdown Timer
  useEffect(() => {
    let timer: any;
    if (countdown !== null && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c! - 1), 1000);
    } else if (countdown === 0) {
      setSelectedSeats([]);
      setCountdown(null);
      refetch(); // Tự động refetch lại map khi hết hạn
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (loading) return <div className="p-4 text-center">Đang tải sơ đồ ghế...</div>;
  if (error) return <div className="p-4 text-red-500">Lỗi tải sơ đồ ghế: {error.message}</div>;

  const toggleSeat = (seatId: string, status: string) => {
    if (status !== "AVAILABLE") return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      if (selectedSeats.length >= 5) {
        alert("Chỉ được chọn tối đa 5 ghế");
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleHold = async () => {
    setHoldError("");
    try {
      const res = await holdSeats({ variables: { tripId, seatIds: selectedSeats } });
      if (res.data.holdSeats.success) {
        setCountdown(300); // 5 phút
        // Gọi refetch để đảm bảo đồng bộ với server
        setTimeout(() => refetch(), 500); 
      }
    } catch (e: any) {
      setHoldError(e.message);
      setSelectedSeats([]);
      refetch(); // Nếu ai đó đã lấy, refetch lại map
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setHoldError("");
    try {
      const passengerInput = selectedSeats.map(seatId => ({
        seat_id: seatId,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        identity_number: ""
      }));

      const res = await createBooking({
        variables: {
          tripId,
          passengers: passengerInput,
          customerName: formData.name,
          customerPhone: formData.phone,
          customerEmail: formData.email
        }
      });
      if (res.data.createBooking.booking_id) {
        // Chuyển hướng tới trang thành công
        window.location.href = `/booking/success/${res.data.createBooking.booking_id}`;
      }
    } catch (e: any) {
      setHoldError(e.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 mt-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Chọn chỗ ngồi</h3>
      
      {countdown !== null && countdown > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-center font-bold">
          ⏳ Bạn còn {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} để hoàn tất thanh toán.
        </div>
      )}

      {holdError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6">
          {holdError}
        </div>
      )}

      <div className="flex gap-8">
        {/* Seat Map */}
        <div className="flex-1 max-w-sm mx-auto bg-gray-50 p-6 rounded-3xl border-2 border-gray-200">
          <div className="text-center text-gray-400 font-bold mb-8">TÀI XẾ</div>
          <div className="grid grid-cols-4 gap-4 justify-items-center">
            {seats.map((seat) => {
              const isSelected = selectedSeats.includes(seat.id);
              let bgColor = "bg-white border-gray-300";
              let textColor = "text-gray-600";
              
              if (seat.status === "HELD") {
                bgColor = "bg-yellow-200 border-yellow-400 cursor-not-allowed";
                textColor = "text-yellow-800";
              } else if (seat.status === "BOOKED" || seat.status === "LOCKED") {
                bgColor = "bg-gray-300 border-gray-400 cursor-not-allowed";
                textColor = "text-gray-500";
              } else if (isSelected) {
                bgColor = "bg-green-500 border-green-600 shadow-md";
                textColor = "text-white font-bold";
              } else if (seat.status === "AVAILABLE") {
                bgColor = "bg-white border-blue-300 hover:border-blue-500 cursor-pointer hover:bg-blue-50";
              }

              return (
                <div 
                  key={seat.id}
                  onClick={() => toggleSeat(seat.id, seat.status)}
                  className={`w-12 h-14 rounded-t-xl rounded-b-md border-2 flex items-center justify-center transition-all ${bgColor} ${textColor}`}
                >
                  {seat.seat_number}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend & Action */}
        <div className="w-64">
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded border-2 border-blue-300 bg-white" /> Trống
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded border-2 border-green-600 bg-green-500" /> Đang chọn
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded border-2 border-yellow-400 bg-yellow-200" /> Đang giữ
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded border-2 border-gray-400 bg-gray-300" /> Đã bán
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
            <p className="text-sm text-gray-600 mb-1">Ghế đã chọn:</p>
            <p className="font-bold text-blue-800 text-lg mb-2">
              {selectedSeats.length > 0 ? selectedSeats.join(", ") : "Chưa chọn"}
            </p>
            {selectedSeats.length > 0 && (
              <p className="text-sm text-gray-600 border-t border-blue-200 pt-2">
                Tổng tiền: <strong className="text-xl text-green-600">{(selectedSeats.length * 300000).toLocaleString('vi-VN')}đ</strong>
              </p>
            )}
          </div>

          {countdown === null ? (
            isProfileIncomplete ? (
              <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-xl mb-4 text-center">
                <p className="text-yellow-800 font-bold mb-2">Cập nhật thông tin</p>
                <p className="text-sm text-yellow-700 mb-4">Bạn cần bổ sung Số điện thoại và CMND/CCCD trong hồ sơ trước khi đặt vé.</p>
                <a href="/profile" className="inline-block w-full text-center bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl transition shadow-md">Đến trang Hồ sơ</a>
              </div>
            ) : (
              <button 
                disabled={selectedSeats.length === 0}
                onClick={handleHold}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition shadow-md"
              >
                Giữ chỗ & Tiếp tục
              </button>
            )
          ) : (
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="bg-white p-4 border rounded-xl shadow-sm mb-4">
                <h4 className="font-bold text-gray-800 mb-3 text-sm border-b pb-2">Thông tin hành khách (Sử dụng cho tất cả các ghế)</h4>
                <input 
                  required 
                  type="text" 
                  placeholder="Họ tên người đi" 
                  className="w-full p-2 border rounded-lg mb-2 text-sm"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
                <input 
                  required 
                  type="tel" 
                  placeholder="Số điện thoại" 
                  className="w-full p-2 border rounded-lg mb-2 text-sm"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
                <input 
                  required 
                  type="email" 
                  placeholder="Email nhận vé" 
                  className="w-full p-2 border rounded-lg text-sm"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition shadow-md"
              >
                {isSubmitting ? "Đang xử lý..." : "Đặt vé ngay"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

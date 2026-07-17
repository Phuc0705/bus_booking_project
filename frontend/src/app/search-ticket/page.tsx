"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Search, Ticket, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const GET_BOOKING_STATUS = gql`
  query BookingStatus($id: ID!, $email: String!) {
    bookingStatus(id: $id, email: $email) {
      id
      trip_id
      trip {
        origin
        destination
        departure_time
        bus_house
      }
      customer_name
      customer_email
      customer_phone
      total_amount
      status
      tickets {
        seat_number
        ticket_code
      }
      created_at
    }
  }
`;

export default function SearchTicketPage() {
  const [bookingId, setBookingId] = useState("");
  const [email, setEmail] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(false);

  const { data, loading, error } = useQuery(GET_BOOKING_STATUS, {
    variables: { id: bookingId, email: email },
    skip: !searchTrigger,
    fetchPolicy: "network-only",
    onError: () => {
      setSearchTrigger(false);
    },
    onCompleted: () => {
      setSearchTrigger(false);
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingId && email) {
      setSearchTrigger(true);
    }
  };

  const booking = data?.bookingStatus;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tra cứu thông tin vé</h1>
          <p className="text-gray-500">Nhập mã vé và email bạn đã dùng để đặt vé để kiểm tra trạng thái vé của bạn.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã vé (VD: 155B1C59)</label>
              <input 
                required 
                type="text" 
                placeholder="Nhập mã vé..." 
                className="w-full p-3 border rounded-xl focus:ring-blue-500 focus:border-blue-500" 
                value={bookingId} 
                onChange={e => setBookingId(e.target.value)} 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email đặt vé</label>
              <input 
                required 
                type="email" 
                placeholder="Nhập email..." 
                className="w-full p-3 border rounded-xl focus:ring-blue-500 focus:border-blue-500" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
            <div className="flex items-end">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center disabled:bg-gray-400"
              >
                {loading ? "Đang tìm..." : <><Search className="w-5 h-5 mr-2" /> Tra cứu</>}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-100">
            <p className="font-medium">Không tìm thấy vé hợp lệ!</p>
            <p className="text-sm mt-1">Vui lòng kiểm tra lại Mã vé và Email của bạn. Lỗi: {error.message}</p>
          </div>
        )}

        {!loading && !error && booking && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4 flex items-center">
              <Ticket className="w-6 h-6 text-blue-600 mr-2" /> Thông tin vé của bạn
            </h2>
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="w-full">
                <p className="text-sm text-gray-500 mb-1">Mã vé: <span className="font-mono font-bold text-gray-900">{booking.id.split("-")[0].toUpperCase()}</span></p>
                <p className="text-sm text-gray-500 mt-2 flex items-center mb-4">
                  <Clock className="w-4 h-4 mr-1" /> 
                  Đặt lúc {new Date(booking.created_at).toLocaleString("vi-VN")}
                </p>
                
                {booking.trip && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                    <p className="text-lg font-bold text-gray-900 mb-2">{booking.trip.origin} → {booking.trip.destination}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Nhà xe</p>
                        <p className="font-medium text-gray-900">{booking.trip.bus_house}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Khởi hành</p>
                        <p className="font-medium text-gray-900">{new Date(booking.trip.departure_time).toLocaleString("vi-VN")}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {booking.tickets && booking.tickets.length > 0 && (
                  <div>
                    <p className="font-bold text-sm text-gray-700 mb-3">Danh sách ghế đã đặt:</p>
                    <div className="space-y-2">
                      {booking.tickets.map((t: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm py-2 px-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
                          <span className="font-bold">Ghế: {t.seat_number}</span>
                          <span className="font-mono">{t.ticket_code || "Chưa có mã vé"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="w-full md:w-1/3 md:border-l pl-0 md:pl-6 pt-6 md:pt-0 border-t md:border-t-0 flex flex-col justify-center items-center md:items-end text-center md:text-right">
                <p className="text-sm font-medium text-gray-500 mb-1">Tổng thanh toán</p>
                <p className="text-2xl font-black text-green-600 mb-4">{(booking.total_amount).toLocaleString("vi-VN")}đ</p>
                
                {booking.status === "CHECKED_IN" ? (
                  <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Đã lên xe
                  </span>
                ) : booking.status === "PAID" ? (
                  <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    Đã thanh toán
                  </span>
                ) : booking.status === "PENDING_PAYMENT" ? (
                  <span className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold">
                    Chờ thanh toán
                  </span>
                ) : (
                  <span className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                    Đã hủy
                  </span>
                )}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

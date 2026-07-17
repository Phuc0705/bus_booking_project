"use client";

import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { CheckCircle2, ArrowLeft, Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

const GET_BOOKINGS_BY_TRIP = gql`
  query GetBookingsByTrip($tripId: ID!) {
    getAllBookings(limit: 100, offset: 0, tripId: $tripId) {
      bookings {
        id
        trip_id
        customer_name
        customer_phone
        total_amount
        status
        tickets {
          seat_number
        }
        created_at
      }
      total
    }
  }
`;

const CHECKIN_BOOKING = gql`
  mutation CheckinBooking($bookingId: ID!) {
    checkinBooking(bookingId: $bookingId) {
      status
      message
    }
  }
`;

export default function AdminTripBookingsPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const { data, loading, error, refetch } = useQuery(GET_BOOKINGS_BY_TRIP, {
    variables: { tripId },
    fetchPolicy: "cache-and-network"
  });
  const [checkin] = useMutation(CHECKIN_BOOKING);

  if (loading) return <div className="p-8 text-gray-500">Đang tải danh sách đặt vé...</div>;
  if (error) return <div className="p-8 text-red-500">Lỗi tải dữ liệu: {error.message}</div>;

  const bookings = data?.getAllBookings?.bookings || [];

  const handleCheckin = async (bookingId: string) => {
    if (!window.confirm("Xác nhận hành khách đã lên xe?")) return;
    try {
      await checkin({ variables: { bookingId } });
      alert("Check-in thành công!");
      refetch();
    } catch (e: any) {
      alert("Lỗi check-in: " + e.message);
    }
  };

  return (
    <div className="p-8">
      <button 
        onClick={() => router.back()}
        className="mb-6 flex items-center text-gray-500 hover:text-gray-900 transition font-medium"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại danh sách chuyến
      </button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kiểm soát vé</h1>
          <p className="text-gray-500 mt-2">Đang xem chuyến xe: <span className="font-mono text-gray-700 font-bold">{tripId.slice(-6)}</span></p>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Tìm theo Tên hoặc SĐT..." 
            className="pl-10 pr-4 py-2 border rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-bold">Mã vé</th>
              <th className="p-4 font-bold">Khách hàng</th>
              <th className="p-4 font-bold">Liên hệ</th>
              <th className="p-4 font-bold">Tổng tiền</th>
              <th className="p-4 font-bold">Ghế</th>
              <th className="p-4 font-bold">Trạng thái</th>
              <th className="p-4 font-bold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((booking: any) => (
              <tr key={booking.id} className="hover:bg-blue-50/50 transition">
                <td className="p-4 font-mono text-sm text-gray-600 font-bold">
                  {booking.id.split('-')[0].toUpperCase()}
                </td>
                <td className="p-4 font-bold text-gray-900">{booking.customer_name}</td>
                <td className="p-4 text-gray-600">{booking.customer_phone}</td>
                <td className="p-4 text-green-600 font-bold">{(booking.total_amount).toLocaleString('vi-VN')}đ</td>
                <td className="p-4 text-blue-700 font-bold">{booking.tickets.map((t: any) => t.seat_number).join(", ")}</td>
                <td className="p-4">
                  {booking.status === "CHECKED_IN" ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center w-max">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Đã lên xe
                    </span>
                  ) : booking.status === "PAID" ? (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold flex items-center w-max">
                      Đã thanh toán
                    </span>
                  ) : booking.status === "PENDING_PAYMENT" ? (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold flex items-center w-max">
                      Chờ thanh toán
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold flex items-center w-max">
                      {booking.status}
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {booking.status === "PAID" && (
                    <button 
                      onClick={() => handleCheckin(booking.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition shadow-sm"
                    >
                      Check-in
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">Chưa có vé nào cho chuyến xe này.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

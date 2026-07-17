"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import Link from "next/link";

const GET_ALL_TRIPS = gql`
  query GetAllTrips {
    searchTrips(limit: 100, status: "ALL") {
      trips {
        id
        origin
        destination
        departure_time
        bus_house
        price
        available_seats
        total_seats
        status
      }
    }
  }
`;

export default function AdminBookingsPage() {
  const { data, loading, error } = useQuery(GET_ALL_TRIPS, {
    fetchPolicy: "cache-and-network"
  });

  if (loading) return <div className="p-8 text-gray-500">Đang tải danh sách chuyến xe...</div>;
  if (error) return <div className="p-8 text-red-500">Lỗi tải dữ liệu: {error.message}</div>;

  const trips = data?.searchTrips?.trips || [];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Đặt vé (Theo Chuyến)</h1>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Tìm mã chuyến, tuyến..." 
            className="pl-10 pr-4 py-2 border rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-bold">Mã chuyến</th>
              <th className="p-4 font-bold">Tuyến đường</th>
              <th className="p-4 font-bold">Nhà xe</th>
              <th className="p-4 font-bold">Khởi hành</th>
              <th className="p-4 font-bold text-center">Ghế trống</th>
              <th className="p-4 font-bold text-center">Trạng thái</th>
              <th className="p-4 font-bold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trips.map((trip: any) => (
              <tr key={trip.id} className="hover:bg-blue-50/50 transition">
                <td className="p-4 font-mono text-sm text-gray-600 font-bold">...{trip.id.slice(-6)}</td>
                <td className="p-4 font-bold text-gray-900">
                  {trip.origin} <span className="text-gray-400 mx-1">→</span> {trip.destination}
                </td>
                <td className="p-4 text-gray-700">{trip.bus_house}</td>
                <td className="p-4 text-gray-600">{new Date(trip.departure_time).toLocaleString("vi-VN")}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    trip.available_seats < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {trip.available_seats} / {trip.total_seats}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    trip.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {trip.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <Link 
                    href={`/admin/bookings/${trip.id}`} 
                    className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition shadow-sm"
                  >
                    Xem / Check-in
                  </Link>
                </td>
              </tr>
            ))}
            {trips.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">Chưa có chuyến xe nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

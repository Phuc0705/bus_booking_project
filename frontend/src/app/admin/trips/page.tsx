"use client";

import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { Plus, Edit2, Trash2 } from "lucide-react";
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

const UPDATE_TRIP_STATUS = gql`
  mutation UpdateTripStatus($id: ID!, $status: String!) {
    updateTripStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

const DELETE_TRIP = gql`
  mutation DeleteTrip($id: ID!) {
    deleteTrip(id: $id)
  }
`;

export default function AdminTripsPage() {
  const { data, loading, error, refetch } = useQuery(GET_ALL_TRIPS, {
    fetchPolicy: "cache-and-network"
  });
  const [updateStatus] = useMutation(UPDATE_TRIP_STATUS);
  const [deleteTrip] = useMutation(DELETE_TRIP);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      await updateStatus({
        variables: { id, status: newStatus },
        context: { headers: { authorization: `Bearer ${token}` } }
      });
      refetch();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chuyến xe này không? Hành động này có thể thất bại nếu đã có khách đặt vé.")) return;
    try {
      const token = localStorage.getItem("admin_token");
      await deleteTrip({
        variables: { id },
        context: { headers: { authorization: `Bearer ${token}` } }
      });
      alert("Xóa thành công!");
      refetch();
    } catch (error: any) {
      alert("Lỗi khi xóa: " + error.message);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Đang tải danh sách chuyến xe...</div>;
  if (error) return <div className="p-8 text-red-500">Lỗi tải dữ liệu: {error.message}</div>;

  const trips = data?.searchTrips?.trips || [];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Chuyến xe</h1>
        <Link href="/admin/trips/create" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center transition shadow-sm">
          <Plus className="w-5 h-5 mr-2" />
          Thêm chuyến mới
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-bold">Mã chuyến</th>
              <th className="p-4 font-bold">Tuyến đường</th>
              <th className="p-4 font-bold">Nhà xe</th>
              <th className="p-4 font-bold">Khởi hành</th>
              <th className="p-4 font-bold">Giá vé</th>
              <th className="p-4 font-bold text-center">Ghế trống</th>
              <th className="p-4 font-bold text-center">Trạng thái</th>
              <th className="p-4 font-bold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trips.map((trip: any) => (
              <tr key={trip.id} className="hover:bg-blue-50/50 transition">
                <td className="p-4 font-mono text-sm text-gray-600">...{trip.id.slice(-6)}</td>
                <td className="p-4 font-bold text-gray-900">
                  {trip.origin} <span className="text-gray-400 mx-1">→</span> {trip.destination}
                </td>
                <td className="p-4 text-gray-700">{trip.bus_house}</td>
                <td className="p-4 text-gray-600">{new Date(trip.departure_time).toLocaleString("vi-VN")}</td>
                <td className="p-4 text-green-600 font-bold">{(trip.price).toLocaleString('vi-VN')}đ</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    trip.available_seats < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {trip.available_seats} / {trip.total_seats}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <select 
                    value={trip.status}
                    onChange={(e) => handleStatusChange(trip.id, e.target.value)}
                    className="p-1 border rounded bg-gray-50 text-sm font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="LOCKED">LOCKED</option>
                    <option value="DEPARTED">DEPARTED</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </td>
                <td className="p-4 text-center whitespace-nowrap">
                  <Link href={`/admin/trips/${trip.id}`} className="inline-block bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded font-semibold text-sm transition mr-2">
                    Cấu hình
                  </Link>
                  <button 
                    onClick={() => handleDelete(trip.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {trips.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">Chưa có chuyến xe nào trong hệ thống.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

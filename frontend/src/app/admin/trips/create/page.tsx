"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { Ticket, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

const GET_DEPENDENCIES = gql`
  query GetDependencies {
    getRoutes {
      id
      origin
      destination
    }
    getBuses {
      id
      license_plate
      bus_house
      bus_type
    }
  }
`;

const CREATE_TRIP = gql`
  mutation CreateTrip($route_id: ID!, $bus_id: ID!, $departure_time: String!, $arrival_time: String!, $price: Int!) {
    createTrip(route_id: $route_id, bus_id: $bus_id, departure_time: $departure_time, arrival_time: $arrival_time, price: $price) {
      id
    }
  }
`;

export default function CreateTripPage() {
  const router = useRouter();
  const { data, loading } = useQuery(GET_DEPENDENCIES);
  const [createTrip] = useMutation(CREATE_TRIP);
  
  const [formData, setFormData] = useState({
    route_id: "",
    bus_id: "",
    departure_time: "",
    arrival_time: "",
    price: 300000
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      await createTrip({
        variables: {
          route_id: formData.route_id,
          bus_id: formData.bus_id,
          departure_time: new Date(formData.departure_time).toISOString(),
          arrival_time: new Date(formData.arrival_time).toISOString(),
          price: Number(formData.price)
        },
        context: { headers: { authorization: `Bearer ${token}` } }
      });
      alert("Tạo chuyến xe thành công!");
      router.push("/admin/trips");
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    }
  };

  if (loading) return <div className="p-8">Đang tải dữ liệu...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/trips" className="text-blue-600 hover:underline flex items-center gap-2 mb-4">
          <ArrowLeft size={16} /> Quay lại danh sách
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Ticket className="text-blue-600" /> Tạo Chuyến Xe Mới
        </h1>
        <p className="text-gray-500 mt-1">Gán xe vào tuyến đường và lên lịch khởi hành</p>
      </div>

      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Route Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tuyến đường</label>
              <select 
                required 
                className="w-full p-3 border rounded-lg bg-gray-50"
                value={formData.route_id} 
                onChange={e => setFormData({...formData, route_id: e.target.value})}
              >
                <option value="">-- Chọn tuyến đường --</option>
                {data?.getRoutes.map((route: any) => (
                  <option key={route.id} value={route.id}>
                    {route.origin} &rarr; {route.destination}
                  </option>
                ))}
              </select>
            </div>

            {/* Bus Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Xe phục vụ</label>
              <select 
                required 
                className="w-full p-3 border rounded-lg bg-gray-50"
                value={formData.bus_id} 
                onChange={e => setFormData({...formData, bus_id: e.target.value})}
              >
                <option value="">-- Chọn xe --</option>
                {data?.getBuses.map((bus: any) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.license_plate} ({bus.bus_house} - {bus.bus_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Departure */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Khởi hành lúc</label>
              <input 
                required 
                type="datetime-local" 
                className="w-full p-3 border rounded-lg"
                value={formData.departure_time} 
                onChange={e => setFormData({...formData, departure_time: e.target.value})}
              />
            </div>

            {/* Arrival */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Dự kiến đến lúc</label>
              <input 
                required 
                type="datetime-local" 
                className="w-full p-3 border rounded-lg"
                value={formData.arrival_time} 
                onChange={e => setFormData({...formData, arrival_time: e.target.value})}
              />
            </div>

            {/* Price */}
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Giá vé (VNĐ)</label>
              <input 
                required 
                type="number" 
                className="w-full p-3 border rounded-lg text-lg font-bold text-green-600"
                value={formData.price} 
                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-sm transition">
              <Save size={20} /> Xuất bến (Tạo chuyến)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

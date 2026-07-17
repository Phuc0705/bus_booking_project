"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { Map, Plus, Save } from "lucide-react";

const GET_ROUTES = gql`
  query GetRoutes {
    getRoutes {
      id
      origin
      destination
      distance_km
      estimated_hours
    }
  }
`;
const CREATE_ROUTE = gql`
  mutation CreateRoute($origin: String!, $destination: String!, $distance_km: Int!, $estimated_hours: Float!) {
    createRoute(origin: $origin, destination: $destination, distance_km: $distance_km, estimated_hours: $estimated_hours) {
      id
      origin
      destination
    }
  }
`;

const DELETE_ROUTE = gql`
  mutation DeleteRoute($id: ID!) {
    deleteRoute(id: $id)
  }
`;

export default function RoutesPage() {
  const { data, loading, refetch } = useQuery(GET_ROUTES);
  const [createRoute] = useMutation(CREATE_ROUTE);
  const [deleteRoute] = useMutation(DELETE_ROUTE);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ origin: "", destination: "", distance_km: 0, estimated_hours: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      await createRoute({
        variables: {
          origin: formData.origin,
          destination: formData.destination,
          distance_km: Number(formData.distance_km),
          estimated_hours: Number(formData.estimated_hours)
        },
        context: { headers: { authorization: `Bearer ${token}` } }
      });
      setShowForm(false);
      setFormData({ origin: "", destination: "", distance_km: 0, estimated_hours: 0 });
      refetch();
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tuyến đường này không?")) return;
    try {
      const token = localStorage.getItem("admin_token");
      await deleteRoute({
        variables: { id },
        context: { headers: { authorization: `Bearer ${token}` } }
      });
      alert("Xóa thành công!");
      refetch();
    } catch (error: any) {
      alert("Lỗi khi xóa: " + error.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Map className="text-blue-600" /> Quản lý Tuyến xe
          </h1>
          <p className="text-gray-500 mt-1">Quản lý các tuyến đường cố định và khoảng cách</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <Plus size={18} /> Thêm tuyến mới
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold mb-4">Tạo tuyến xe mới</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nơi đi</label>
              <select required className="w-full p-2 border rounded-lg bg-gray-50" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})}>
                <option value="">-- Chọn điểm xuất phát --</option>
                {["TP.HCM", "Hà Nội", "Đà Lạt", "Nha Trang", "Đà Nẵng", "Cần Thơ", "Sapa", "Huế"].map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nơi đến</label>
              <select required className="w-full p-2 border rounded-lg bg-gray-50" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})}>
                <option value="">-- Chọn điểm đến --</option>
                {["TP.HCM", "Hà Nội", "Đà Lạt", "Nha Trang", "Đà Nẵng", "Cần Thơ", "Sapa", "Huế"].map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Khoảng cách (km)</label>
              <input required type="number" className="w-full p-2 border rounded-lg" value={formData.distance_km} onChange={e => setFormData({...formData, distance_km: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Thời gian dự kiến (giờ)</label>
              <input required type="number" step="0.1" className="w-full p-2 border rounded-lg" value={formData.estimated_hours} onChange={e => setFormData({...formData, estimated_hours: Number(e.target.value)})} />
            </div>
            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Hủy</button>
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                <Save size={18} /> Lưu lại
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <th className="p-4 font-semibold text-sm">ID</th>
                <th className="p-4 font-semibold text-sm">Tuyến đường</th>
                <th className="p-4 font-semibold text-sm">Khoảng cách</th>
                <th className="p-4 font-semibold text-sm">TG dự kiến</th>
                <th className="p-4 font-semibold text-sm text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.getRoutes.map((route: any) => (
                <tr key={route.id} className="hover:bg-blue-50/50 transition">
                  <td className="p-4 text-sm text-gray-500 font-mono">...{route.id.slice(-6)}</td>
                  <td className="p-4 font-bold text-gray-800">
                    {route.origin} &rarr; {route.destination}
                  </td>
                  <td className="p-4 text-gray-600">{route.distance_km} km</td>
                  <td className="p-4 text-gray-600">{route.estimated_hours} giờ</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleDelete(route.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition shadow-sm"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.getRoutes.length === 0 && (
            <div className="p-8 text-center text-gray-500">Chưa có tuyến xe nào. Hãy tạo một tuyến mới!</div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { Bus, Plus, Save } from "lucide-react";

const GET_BUSES = gql`
  query GetBuses {
    getBuses {
      id
      license_plate
      bus_house
      bus_type
      total_seats
    }
  }
`;
const CREATE_BUS = gql`
  mutation CreateBus($license_plate: String!, $bus_house: String!, $bus_type: String!, $total_seats: Int!) {
    createBus(license_plate: $license_plate, bus_house: $bus_house, bus_type: $bus_type, total_seats: $total_seats) {
      id
      license_plate
      bus_house
    }
  }
`;

const DELETE_BUS = gql`
  mutation DeleteBus($id: ID!) {
    deleteBus(id: $id)
  }
`;

export default function BusesPage() {
  const { data, loading, refetch } = useQuery(GET_BUSES);
  const [createBus] = useMutation(CREATE_BUS);
  const [deleteBus] = useMutation(DELETE_BUS);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ license_plate: "", bus_house: "", bus_type: "Giường nằm 34 chỗ", total_seats: 34 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      await createBus({
        variables: {
          license_plate: formData.license_plate,
          bus_house: formData.bus_house,
          bus_type: formData.bus_type,
          total_seats: Number(formData.total_seats)
        },
        context: { headers: { authorization: `Bearer ${token}` } }
      });
      setShowForm(false);
      setFormData({ license_plate: "", bus_house: "", bus_type: "Giường nằm 34 chỗ", total_seats: 34 });
      refetch();
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa xe này không?")) return;
    try {
      const token = localStorage.getItem("admin_token");
      await deleteBus({
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
            <Bus className="text-blue-600" /> Quản lý Xe
          </h1>
          <p className="text-gray-500 mt-1">Quản lý đội xe và biển số xe của từng nhà xe</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <Plus size={18} /> Thêm xe mới
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold mb-4">Thêm xe mới</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Biển số xe</label>
              <input required type="text" placeholder="VD: 51B-123.45" className="w-full p-2 border rounded-lg" value={formData.license_plate} onChange={e => setFormData({...formData, license_plate: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tên Nhà Xe</label>
              <input required type="text" placeholder="VD: Phương Trang" className="w-full p-2 border rounded-lg" value={formData.bus_house} onChange={e => setFormData({...formData, bus_house: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loại Xe</label>
              <select 
                className="w-full p-2 border rounded-lg" 
                value={formData.bus_type} 
                onChange={e => {
                  const type = e.target.value;
                  let seats = 34;
                  if (type.includes("40")) seats = 40;
                  else if (type.includes("22")) seats = 22;
                  else if (type.includes("20")) seats = 20;
                  setFormData({...formData, bus_type: type, total_seats: seats});
                }}
              >
                <option value="Giường nằm 34 chỗ">Giường nằm 34 chỗ</option>
                <option value="Giường nằm 40 chỗ">Giường nằm 40 chỗ</option>
                <option value="Limousine 22 chỗ">Limousine 22 chỗ</option>
                <option value="Ghế ngồi 20 chỗ">Ghế ngồi 20 chỗ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tổng số ghế</label>
              <input 
                required 
                type="number" 
                className="w-full p-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" 
                value={formData.total_seats} 
                disabled
              />
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
                <th className="p-4 font-semibold text-sm">Biển số</th>
                <th className="p-4 font-semibold text-sm">Nhà xe</th>
                <th className="p-4 font-semibold text-sm">Loại xe</th>
                <th className="p-4 font-semibold text-sm">Số ghế</th>
                <th className="p-4 font-semibold text-sm text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.getBuses.map((bus: any) => (
                <tr key={bus.id} className="hover:bg-blue-50/50 transition">
                  <td className="p-4 font-bold text-gray-800">{bus.license_plate}</td>
                  <td className="p-4 text-gray-600">{bus.bus_house}</td>
                  <td className="p-4 text-gray-600">{bus.bus_type}</td>
                  <td className="p-4 text-gray-600">{bus.total_seats}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleDelete(bus.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition shadow-sm"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.getBuses.length === 0 && (
            <div className="p-8 text-center text-gray-500">Chưa có xe nào. Hãy thêm xe mới!</div>
          )}
        </div>
      )}
    </div>
  );
}

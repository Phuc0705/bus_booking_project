"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { LogOut, User, Ticket, Clock, CheckCircle2, Settings } from "lucide-react";
import Link from "next/link";

const GET_USER_BOOKINGS = gql`
  query GetUserBookings {
    getUserBookings {
      bookings {
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
      total
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String!, $phone: String, $address: String, $identity_number: String) {
    updateProfile(name: $name, phone: $phone, address: $address, identity_number: $identity_number) {
      id
      name
      email
      role
      phone
      address
      identity_number
    }
  }
`;

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"bookings" | "settings">("bookings");
  
  // Profile form state
  const [formData, setFormData] = useState({ name: "", phone: "", address: "", identity_number: "" });
  const [updateMsg, setUpdateMsg] = useState("");

  const [updateProfile, { loading: updating }] = useMutation(UPDATE_PROFILE);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token || !userStr) {
      router.push("/login");
    } else {
      const u = JSON.parse(userStr);
      setUser(u);
      setFormData({
        name: u.name || "",
        phone: u.phone || "",
        address: u.address || "",
        identity_number: u.identity_number || ""
      });
    }
  }, [router]);

  const { data, loading, error } = useQuery(GET_USER_BOOKINGS, {
    skip: !user,
    fetchPolicy: "network-only"
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMsg("");
    try {
      const res = await updateProfile({ variables: formData });
      if (res.data.updateProfile) {
        setUpdateMsg("Cập nhật thông tin thành công!");
        const updatedUser = res.data.updateProfile;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (e: any) {
      setUpdateMsg("Lỗi cập nhật: " + e.message);
    }
  };

  if (!user) return <div className="p-12 text-center text-gray-500">Đang xác thực...</div>;

  const bookings = data?.getUserBookings?.bookings || [];

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col items-center border-b pb-6 mb-6">
              <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <User className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
            
            <div className="space-y-3">
              <button onClick={() => setActiveTab("bookings")} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition ${activeTab === "bookings" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"}`}>
                <Ticket className="w-5 h-5 mr-3" /> Lịch sử đặt vé
              </button>
              <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition ${activeTab === "settings" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-50"}`}>
                <Settings className="w-5 h-5 mr-3" /> Cập nhật hồ sơ
              </button>
              <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition">
                <LogOut className="w-5 h-5 mr-3" /> Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-2/3">
          {activeTab === "settings" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Cập nhật hồ sơ</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                {updateMsg && (
                  <div className={`p-4 mb-6 rounded-lg font-medium ${updateMsg.includes("Lỗi") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                    {updateMsg}
                  </div>
                )}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <input required type="text" className="w-full p-3 border rounded-xl focus:ring-blue-500 focus:border-blue-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input type="tel" className="w-full p-3 border rounded-xl focus:ring-blue-500 focus:border-blue-500" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <input type="text" className="w-full p-3 border rounded-xl focus:ring-blue-500 focus:border-blue-500" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CMND / CCCD</label>
                    <input type="text" className="w-full p-3 border rounded-xl focus:ring-blue-500 focus:border-blue-500" value={formData.identity_number} onChange={e => setFormData({ ...formData, identity_number: e.target.value })} />
                  </div>
                  <button type="submit" disabled={updating} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition disabled:bg-gray-400">
                    {updating ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "bookings" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Lịch sử đặt vé</h2>
              
              {loading && <p className="text-gray-500">Đang tải lịch sử...</p>}
              {error && <p className="text-red-500">Lỗi tải dữ liệu: {error.message}</p>}
              
              {!loading && !error && bookings.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Bạn chưa có chuyến đi nào</h3>
                  <p className="text-gray-500 mb-6">Hãy khám phá các chuyến đi tuyệt vời cùng chúng tôi</p>
                  <Link href="/" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition">
                    Tìm chuyến xe
                  </Link>
                </div>
              )}

              {!loading && bookings.length > 0 && (
                <div className="space-y-4">
                  {bookings.map((booking: any) => (
                    <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="w-full">
                        <p className="text-sm text-gray-500 mb-1">Mã vé: <span className="font-mono font-bold text-gray-900">{booking.id.split("-")[0].toUpperCase()}</span></p>
                        <p className="text-sm text-gray-500 mt-2 flex items-center mb-3">
                          <Clock className="w-4 h-4 mr-1" /> 
                          Đặt lúc {new Date(booking.created_at).toLocaleString("vi-VN")}
                        </p>
                        {booking.trip && (
                          <div className="mb-3">
                            <p className="font-bold text-gray-900">{booking.trip.origin} → {booking.trip.destination}</p>
                            <p className="text-sm text-gray-600">Nhà xe: <span className="font-medium text-gray-900">{booking.trip.bus_house}</span></p>
                            <p className="text-sm text-gray-600">Khởi hành: <span className="font-medium text-gray-900">{new Date(booking.trip.departure_time).toLocaleString("vi-VN")}</span></p>
                          </div>
                        )}
                        {booking.tickets && booking.tickets.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3 border">
                            <p className="font-bold text-sm text-gray-700 mb-2 border-b pb-1">Chi tiết vé</p>
                            {booking.tickets.map((t: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm py-1">
                                <span className="font-medium text-blue-600">Ghế: {t.seat_number}</span>
                                <span className="font-mono text-gray-500">{t.ticket_code || "Chưa có mã vé"}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-left md:text-right w-full md:w-auto">
                        <p className="text-lg font-bold text-green-600 mb-2 whitespace-nowrap">{(booking.total_amount).toLocaleString("vi-VN")}đ</p>
                        {booking.status === "CHECKED_IN" ? (
                          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Đã lên xe
                          </span>
                        ) : booking.status === "PAID" ? (
                          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold whitespace-nowrap">
                            Đã thanh toán
                          </span>
                        ) : booking.status === "PENDING_PAYMENT" ? (
                          <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold whitespace-nowrap">
                            Chờ thanh toán
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold whitespace-nowrap">
                            Đã hủy
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

export default function BookingPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    idCard: "",
    seatId: "A01",
  });
  
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: "TRIP-123", // mock data
          user_id: "",
          total_amount: 150000,
          passengers: [
            {
              full_name: formData.fullName,
              phone_number: formData.phone,
              email: formData.email,
              id_card: formData.idCard,
              seat_id: formData.seatId,
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        setBookingId(data.booking_id);
        setStatus("Booking created successfully. Please pay.");
      } else {
        setStatus("Error: " + data.message);
      }
    } catch (err: any) {
      setStatus("Failed to create booking: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (success: boolean) => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/booking/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          payment_success: success,
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(`Payment processed: ${data.status}`);
      } else {
        setStatus("Payment error: " + data.message);
      }
    } catch (err: any) {
      setStatus("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Checkout / Đặt Vé</h1>
      
      {!bookingId ? (
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
            <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" 
              value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input required type="tel" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" 
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" 
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">CCCD / ID Card</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" 
              value={formData.idCard} onChange={e => setFormData({...formData, idCard: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ghế (Mock)</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-gray-100" 
              readOnly value={formData.seatId} />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            {loading ? "Đang xử lý..." : "Tạo Booking"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 text-blue-800 rounded">
            <strong>Mã Booking của bạn:</strong> {bookingId}
          </div>
          <div className="flex space-x-4">
            <button disabled={loading} onClick={() => handlePayment(true)} className="flex-1 bg-green-600 text-white p-2 rounded hover:bg-green-700">
              Thanh toán thành công
            </button>
            <button disabled={loading} onClick={() => handlePayment(false)} className="flex-1 bg-red-600 text-white p-2 rounded hover:bg-red-700">
              Thanh toán thất bại
            </button>
          </div>
        </div>
      )}

      {status && (
        <div className="mt-4 p-3 bg-gray-100 text-gray-800 rounded">
          {status}
        </div>
      )}
    </div>
  );
}

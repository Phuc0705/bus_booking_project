"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle, Download, Home, Bus, XCircle, CreditCard } from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

const PAY_BOOKING = gql`
  mutation PayBooking($bookingId: ID!) {
    payBooking(bookingId: $bookingId) {
      status
      message
    }
  }
`;

const CANCEL_BOOKING = gql`
  mutation CancelBooking($bookingId: ID!) {
    cancelBooking(bookingId: $bookingId) {
      status
      message
    }
  }
`;

export default function BookingSuccessPage({ params }: { params: any }) {
  const [bookingId, setBookingId] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID" | "CANCELLED">("PENDING");
  const [payBooking] = useMutation(PAY_BOOKING);
  const [cancelBooking] = useMutation(CANCEL_BOOKING);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    params.then((p: any) => {
      setBookingId(p.id);
      setTicketCode(`TICKET-${p.id.split('-')[0].toUpperCase()}`);
    });
  }, [params]);

  if (!bookingId) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;

  const handlePay = async () => {
    setIsLoading(true);
    try {
      const res = await payBooking({ variables: { bookingId } });
      if (res.data.payBooking.status === "PAID") {
        setPaymentStatus("PAID");
      }
    } catch (e: any) {
      alert("Lỗi thanh toán: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const res = await cancelBooking({ variables: { bookingId } });
      if (res.data.cancelBooking.status === "CANCELLED") {
        setPaymentStatus("CANCELLED");
      }
    } catch (e: any) {
      alert("Lỗi hủy: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentStatus === "PENDING") {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-md w-full p-8 text-center">
          <CreditCard className="w-20 h-20 mx-auto mb-4 text-blue-500" />
          <h1 className="text-2xl font-bold mb-2">Thanh Toán Đơn Hàng</h1>
          <p className="text-gray-500 mb-8">Mã đơn: <span className="font-mono">{bookingId.split('-')[0]}</span></p>
          
          <div className="space-y-4">
            <button 
              onClick={handlePay}
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition shadow-md disabled:bg-gray-400"
            >
              Giả lập Thanh toán Thành công
            </button>
            <button 
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition shadow-md disabled:bg-gray-400"
            >
              Giả lập Thanh toán Thất bại / Hủy
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === "CANCELLED") {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-md w-full p-8 text-center">
          <XCircle className="w-20 h-20 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2 text-red-600">Đã Hủy Đơn Hàng</h1>
          <p className="text-gray-500 mb-8">Bạn đã hủy đơn hàng hoặc thanh toán thất bại.</p>
          <Link href="/" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-xl transition">
            Về Trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-green-500 p-8 text-center text-white">
            <CheckCircle className="w-20 h-20 mx-auto mb-4 text-white" />
            <h1 className="text-3xl font-extrabold mb-2">Thanh Toán Thành Công!</h1>
            <p className="text-green-100 text-lg">Giao dịch của bạn đã được xác nhận</p>
          </div>

          {/* Ticket Body */}
          <div className="p-8 relative">
            
            <div className="flex justify-between items-center border-b-2 border-dashed border-gray-300 pb-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Mã Đặt Chỗ</p>
                <p className="text-3xl font-black text-gray-800 font-mono">{bookingId.split('-')[0]}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center text-gray-500 mb-2">
                  <Bus className="w-5 h-5 mr-2" />
                  <span className="font-bold">Trạng thái</span>
                </div>
                <p className="text-green-600 font-bold text-lg">Đã thanh toán (PAID)</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 mb-2 font-bold">Email nhận vé</p>
                <p className="text-gray-800 font-medium">Đã gửi qua Email của bạn</p>
              </div>
            </div>

            <div className="text-center mb-8">
              <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-gray-200 rounded-xl flex items-center justify-center p-4">
                <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TICKET-SUCCESS')] bg-contain bg-no-repeat bg-center opacity-80 mix-blend-multiply"></div>
              </div>
              <p className="text-sm text-gray-500 mt-3">Xuất trình mã này khi lên xe</p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => alert("Đã tải vé PDF xuống máy!")}
                className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-md"
              >
                <Download className="w-5 h-5 mr-2" />
                Tải vé PDF
              </button>
              <Link 
                href="/"
                className="flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 rounded-xl transition shadow-md"
              >
                <Home className="w-5 h-5 mr-2" />
                Về Trang chủ
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

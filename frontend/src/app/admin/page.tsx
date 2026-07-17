"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { BarChart3, Users, DollarSign, BusFront } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const GET_OVERVIEW_DATA = gql`
  query GetOverviewData {
    getRevenueSummary {
      date
      total_revenue
      total_bookings
    }
    searchTrips(limit: 1000) {
      trips {
        status
        total_seats
        available_seats
      }
    }
  }
`;

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("day");

  const { data, loading, error } = useQuery(GET_OVERVIEW_DATA, {
    fetchPolicy: "network-only",
    pollInterval: 5000 // Tự động cập nhật mỗi 5 giây (Realtime)
  });

  if (loading) return <div className="p-8">Đang tải dữ liệu tổng quan...</div>;
  if (error) return <div className="p-8 text-red-500">Lỗi: {error.message}</div>;

  const todayStr = new Date().toISOString().split('T')[0];
  const revenueSummary = data?.getRevenueSummary || [];
  const todayStats = revenueSummary.find((s: any) => s.date === todayStr) || { total_revenue: 0, total_bookings: 0 };

  const trips = data?.searchTrips?.trips || [];
  const runningTrips = trips.filter((t: any) => t.status === "ACTIVE").length;

  let totalSeats = 0;
  let bookedSeats = 0;
  trips.forEach((t: any) => {
    totalSeats += t.total_seats;
    bookedSeats += (t.total_seats - t.available_seats);
  });
  const fillRate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

  // Chart Data Processing
  const getChartData = () => {
    if (!revenueSummary.length) return [];
    
    // Sort ascending by date
    const sorted = [...revenueSummary].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (timeRange === "day") {
      return sorted.map((item: any) => ({
        name: new Date(item.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        DoanhThu: item.total_revenue,
        SoVe: item.total_bookings,
      }));
    }

    if (timeRange === "week") {
      const grouped: Record<string, any> = {};
      sorted.forEach((item: any) => {
        const d = new Date(item.date);
        // Get week number (rough calculation)
        const weekNum = Math.ceil(d.getDate() / 7);
        const key = `Tuần ${weekNum}, ${d.getMonth() + 1}/${d.getFullYear()}`;
        if (!grouped[key]) grouped[key] = { name: key, DoanhThu: 0, SoVe: 0 };
        grouped[key].DoanhThu += item.total_revenue;
        grouped[key].SoVe += item.total_bookings;
      });
      return Object.values(grouped);
    }

    if (timeRange === "month") {
      const grouped: Record<string, any> = {};
      sorted.forEach((item: any) => {
        const d = new Date(item.date);
        const key = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
        if (!grouped[key]) grouped[key] = { name: key, DoanhThu: 0, SoVe: 0 };
        grouped[key].DoanhThu += item.total_revenue;
        grouped[key].SoVe += item.total_bookings;
      });
      return Object.values(grouped);
    }

    return [];
  };

  const chartData = getChartData();

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan Hệ thống</h1>
          <p className="text-gray-500 mt-2">Dữ liệu thống kê hôm nay, {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <button className="bg-white border shadow-sm px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
          Tải báo cáo
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Doanh thu hôm nay</p>
            <p className="text-2xl font-bold text-gray-900">{todayStats.total_revenue.toLocaleString('vi-VN')}đ</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Số vé bán hôm nay</p>
            <p className="text-2xl font-bold text-gray-900">{todayStats.total_bookings} Vé</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-4">
            <BusFront className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Chuyến xe đang chạy</p>
            <p className="text-2xl font-bold text-gray-900">{runningTrips} Chuyến</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-4">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Tỷ lệ lấp đầy</p>
            <p className="text-2xl font-bold text-gray-900">{fillRate}%</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Biểu đồ doanh thu</h2>
          <select 
            className="border-gray-300 border rounded-lg px-4 py-2 text-sm font-medium focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
          >
            <option value="day">Theo ngày</option>
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
          </select>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#6b7280', fontSize: 12}} 
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#6b7280', fontSize: 12}} 
              />
              <Tooltip 
                cursor={{fill: '#f3f4f6'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                formatter={(value: number, name: string) => {
                  if (name === "DoanhThu") return [`${value.toLocaleString('vi-VN')}đ`, "Doanh thu"];
                  return [`${value} vé`, "Số vé bán"];
                }}
              />
              <Legend wrapperStyle={{paddingTop: '20px'}} />
              <Bar yAxisId="left" dataKey="DoanhThu" name="DoanhThu" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar yAxisId="right" dataKey="SoVe" name="SoVe" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

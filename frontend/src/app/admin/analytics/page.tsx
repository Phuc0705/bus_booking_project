"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

const GET_ANALYTICS = gql`
  query GetAnalytics {
    getRevenueSummary {
      date
      total_revenue
      total_bookings
    }
    getPopularRoutes(limit: 5) {
      origin
      destination
      search_count
      booking_count
    }
    getBookingConversionRate {
      total_searches
      total_bookings
      conversion_rate
    }
  }
`;

export default function AnalyticsPage() {
  const { data, loading, error } = useQuery(GET_ANALYTICS, {
    fetchPolicy: "cache-and-network",
    pollInterval: 5000 // Cập nhật realtime mỗi 5 giây
  });

  if (loading) return <div className="p-8">Đang tải dữ liệu...</div>;
  if (error) return <div className="p-8 text-red-500">Lỗi tải dữ liệu: {error.message}</div>;

  const revenueData = data?.getRevenueSummary || [];
  const routeData = data?.getPopularRoutes?.map((r: any) => ({
    name: `${r.origin} - ${r.destination}`,
    search_count: r.search_count,
    booking_count: r.booking_count
  })) || [];
  const conversionRate = data?.getBookingConversionRate;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tổng Quan Hoạt Động (Analytics)</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Tổng Số Lượt Tìm Kiếm</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{conversionRate?.total_searches || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Tổng Số Vé Đã Đặt</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{conversionRate?.total_bookings || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Tỷ Lệ Chuyển Đổi</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {(conversionRate?.conversion_rate || 0).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Doanh Thu 30 Ngày Gần Nhất</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => `${value.toLocaleString()}đ`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()}đ`, "Doanh thu"]}
                  labelFormatter={(label) => `Ngày: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total_revenue" 
                  name="Doanh thu"
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3B82F6' }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Tuyến Đường Phổ Biến</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeData} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  width={150}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="search_count" name="Lượt tìm kiếm" fill="#93C5FD" radius={[0, 4, 4, 0]} />
                <Bar dataKey="booking_count" name="Lượt đặt vé" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

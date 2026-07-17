"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Activity } from "lucide-react";

const GET_EVENT_LOGS = gql`
  query GetEventLogs {
    getEventLogs {
      id
      event_type
      event_data
      created_at
    }
  }
`;

export default function AdminLogsPage() {
  const { data, loading, error } = useQuery(GET_EVENT_LOGS, {
    fetchPolicy: "network-only",
    pollInterval: 5000 // refresh every 5 seconds
  });

  if (loading && !data) return <div className="p-8">Đang tải nhật ký hệ thống...</div>;
  if (error) return <div className="p-8 text-red-500">Lỗi: {error.message}</div>;

  const logs = data?.getEventLogs || [];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-blue-600" /> System Event Logs
          </h1>
          <p className="text-gray-500 mt-1">Giám sát các sự kiện Kafka (Tạo chuyến, Đặt vé, Thanh toán, ...)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <th className="p-4 font-semibold w-48">Thời gian</th>
              <th className="p-4 font-semibold w-48">Loại sự kiện (Topic)</th>
              <th className="p-4 font-semibold">Dữ liệu (JSON)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-blue-50/30 transition">
                <td className="p-4 text-gray-600 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("vi-VN")}
                </td>
                <td className="p-4 font-bold text-blue-700">
                  {log.event_type}
                </td>
                <td className="p-4 font-mono text-xs text-gray-600 break-all bg-gray-50 m-2 rounded">
                  {log.event_data}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="p-8 text-center text-gray-500">Chưa có sự kiện nào được ghi nhận.</div>
        )}
      </div>
    </div>
  );
}

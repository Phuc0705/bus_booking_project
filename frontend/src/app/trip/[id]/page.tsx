import { Metadata } from 'next';
import { ApolloClient, InMemoryCache, HttpLink, gql } from "@apollo/client";
import Link from 'next/link';
import SeatMap from '@/components/SeatMap';

// Tạo một client tạm thời cho việc fetch phía Server (SSR)
const client = new ApolloClient({
  link: new HttpLink({ uri: "http://localhost:4000/graphql" }),
  cache: new InMemoryCache(),
});

const GET_TRIP_QUERY = gql`
  query GetTrip($id: ID!) {
    trip(id: $id) {
      id
      origin
      destination
      departure_time
      arrival_time
      bus_house
      bus_type
      price
      available_seats
      pickup_points
      dropoff_points
    }
  }
`;

type Props = {
  params: Promise<{ id: string }>
}

// Hàm này giúp Next.js tạo SEO Metadata động (Dynamic SEO)
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const { data } = await client.query({
      query: GET_TRIP_QUERY,
      variables: { id: resolvedParams.id }
    });
    
    if (data && data.trip) {
      const trip = data.trip;
      const date = new Date(trip.departure_time).toLocaleDateString('vi-VN');
      return {
        title: `Vé xe ${trip.origin} đi ${trip.destination} ngày ${date} - ${trip.bus_house}`,
        description: `Đặt vé xe khách ${trip.bus_type} từ ${trip.origin} đi ${trip.destination} với giá ${trip.price.toLocaleString('vi-VN')}đ. Dịch vụ uy tín bởi ${trip.bus_house}.`,
      }
    }
  } catch (e) {}

  return {
    title: 'Chi tiết chuyến đi | Hệ thống đặt vé',
  }
}

export default async function TripDetailPage({ params }: Props) {
  const resolvedParams = await params;
  let trip = null;
  let error = null;

  try {
    const { data } = await client.query({
      query: GET_TRIP_QUERY,
      variables: { id: resolvedParams.id }
    });
    trip = data.trip;
  } catch (e: any) {
    error = e.message;
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi: Không tìm thấy chuyến đi</h1>
        <Link href="/" className="text-blue-600 hover:underline">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block font-medium">
          &larr; Quay lại trang tìm kiếm
        </Link>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-start mb-8 border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {trip.origin} &rarr; {trip.destination}
              </h1>
              <p className="text-gray-500 text-lg">
                Khởi hành: {new Date(trip.departure_time).toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="text-right">
              <span className="bg-blue-100 text-blue-800 font-bold px-4 py-1.5 rounded-full inline-block mb-2">
                {trip.bus_house}
              </span>
              <p className="text-xl font-extrabold text-green-600">{trip.price.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Thông tin xe</h3>
              <ul className="space-y-3 text-gray-600">
                <li><strong className="text-gray-700">Loại xe:</strong> {trip.bus_type}</li>
                <li><strong className="text-gray-700">Ghế trống:</strong> {trip.available_seats} ghế</li>
                <li><strong className="text-gray-700">Giờ đến dự kiến:</strong> {new Date(trip.arrival_time).toLocaleString('vi-VN')}</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-4">Chính sách hủy vé</h3>
              <ul className="space-y-3 text-blue-700 text-sm list-disc pl-4">
                <li>Hủy trước 24h: Hoàn tiền 100%</li>
                <li>Hủy trước 12h: Hoàn tiền 50%</li>
                <li>Không áp dụng hủy vé sát giờ đi.</li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                Điểm đón
              </h3>
              {trip.pickup_points && trip.pickup_points.length > 0 ? (
                <ul className="space-y-2 text-gray-600 text-sm">
                  {trip.pickup_points.map((point: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">Không có thông tin điểm đón.</p>
              )}
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                Điểm trả
              </h3>
              {trip.dropoff_points && trip.dropoff_points.length > 0 ? (
                <ul className="space-y-2 text-gray-600 text-sm">
                  {trip.dropoff_points.map((point: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">Không có thông tin điểm trả.</p>
              )}
            </div>
          </div>

          <SeatMap tripId={trip.id} />
        </div>
      </div>
    </div>
  );
}

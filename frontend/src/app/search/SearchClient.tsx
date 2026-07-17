"use client";

import { useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Search, MapPin, Calendar, Filter, Clock, CreditCard, ChevronRight, AlertCircle, CalendarDays, Zap } from "lucide-react";
import Link from "next/link";

interface SearchTripsData {
  searchTrips: {
    total: number;
    nearestDate: string | null;
    trips: Trip[];
  };
}

interface Trip {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  bus_house: string;
  bus_type: string;
  price: number;
  available_seats: number;
  total_seats: number;
}

const SEARCH_TRIPS_QUERY = gql`
  query SearchTrips(
    $origin: String, 
    $destination: String, 
    $departureDate: String, 
    $limit: Int, 
    $offset: Int, 
    $minPrice: Int, 
    $maxPrice: Int, 
    $busHouse: String, 
    $busType: String, 
    $sortBy: String,
    $timeRange: String,
    $minAvailableSeats: Int
  ) {
    searchTrips(
      origin: $origin, 
      destination: $destination, 
      departureDate: $departureDate, 
      limit: $limit, 
      offset: $offset, 
      minPrice: $minPrice, 
      maxPrice: $maxPrice, 
      busHouse: $busHouse, 
      busType: $busType, 
      sortBy: $sortBy,
      timeRange: $timeRange,
      minAvailableSeats: $minAvailableSeats
    ) {
      total
      nearestDate
      trips {
        id
        origin
        destination
        departure_time
        arrival_time
        bus_house
        bus_type
        price
        available_seats
        total_seats
      }
    }
  }
`;

const CITIES = ["TP.HCM", "Hà Nội", "Đà Lạt", "Nha Trang", "Đà Nẵng", "Cần Thơ", "Sapa", "Huế"];
const BUS_HOUSES = ["", "Phương Trang", "Thành Bưởi", "Sao Việt", "Hoàng Long", "Kumho"];
const BUS_TYPES = ["", "Giường nằm 34 chỗ", "Giường nằm 40 chỗ", "Ghế ngồi 20 chỗ", "Limousine 22 chỗ"];

export default function SearchClient({ initialParams }: { initialParams: any }) {
  const [origin, setOrigin] = useState(initialParams.origin || "");
  const [destination, setDestination] = useState(initialParams.destination || "");
  const [departureDate, setDepartureDate] = useState(initialParams.departureDate || "");
  
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterBusHouse, setFilterBusHouse] = useState("");
  const [filterBusType, setFilterBusType] = useState("");
  const [filterTimeRange, setFilterTimeRange] = useState("");
  const [filterMinSeats, setFilterMinSeats] = useState("");
  const [sortBy, setSortBy] = useState("time_asc");

  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [searchVars, setSearchVars] = useState({
    origin: initialParams.origin || "",
    destination: initialParams.destination || "",
    departureDate: initialParams.departureDate || "",
    minPrice: 0,
    maxPrice: 0,
    busHouse: "",
    busType: "",
    sortBy: "time_asc",
    timeRange: "",
    minAvailableSeats: 0
  });

  const { data, loading, error } = useQuery<SearchTripsData>(SEARCH_TRIPS_QUERY, {
    variables: { ...searchVars, limit: 50, offset: 0 },
    fetchPolicy: "cache-and-network"
  });

  const handleSearch = () => {
    setSearchVars({
      origin,
      destination,
      departureDate,
      minPrice: Number(filterMinPrice) || 0,
      maxPrice: Number(filterMaxPrice) || 0,
      busHouse: filterBusHouse,
      busType: filterBusType,
      sortBy,
      timeRange: filterTimeRange,
      minAvailableSeats: Number(filterMinSeats) || 0
    });
  };

  const selectNearestDate = (nearestDateStr: string) => {
    // nearestDateStr is full ISO, we only want YYYY-MM-DD
    const datePart = nearestDateStr.split('T')[0];
    setDepartureDate(datePart);
    setSearchVars(prev => ({ ...prev, departureDate: datePart }));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-md">
            Hành Trình Trong Tầm Tay
          </h1>
          <p className="text-blue-100 text-lg mb-8">Đặt vé xe khách liên tỉnh dễ dàng, an toàn và nhanh chóng</p>
          
          {/* Search Box */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 max-w-5xl mx-auto relative z-10">
            {/* Origin Autocomplete */}
            <div className="flex-1 relative">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Nơi xuất phát</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Chọn điểm đi"
                  value={origin}
                  onChange={(e) => { setOrigin(e.target.value); setShowOriginDropdown(true); }}
                  onFocus={() => setShowOriginDropdown(true)}
                  onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                />
              </div>
              {showOriginDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 mt-2 rounded-xl shadow-lg overflow-hidden z-20">
                  {CITIES.filter(c => c.toLowerCase().includes(origin.toLowerCase())).map(c => (
                    <div 
                      key={c} 
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition text-gray-700"
                      onClick={() => { setOrigin(c); setShowOriginDropdown(false); }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Autocomplete */}
            <div className="flex-1 relative">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Nơi đến</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Chọn điểm đến"
                  value={destination}
                  onChange={(e) => { setDestination(e.target.value); setShowDestDropdown(true); }}
                  onFocus={() => setShowDestDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
                />
              </div>
              {showDestDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 mt-2 rounded-xl shadow-lg overflow-hidden z-20">
                  {CITIES.filter(c => c.toLowerCase().includes(destination.toLowerCase())).map(c => (
                    <div 
                      key={c} 
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition text-gray-700"
                      onClick={() => { setDestination(c); setShowDestDropdown(false); }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 relative">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Ngày đi</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                  type="date" 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-end">
              <button 
                onClick={handleSearch}
                className="w-full md:w-auto h-[50px] bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-8 rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Search size={20} />
                TÌM CHUYẾN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 sticky top-4">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Filter size={20} className="text-gray-500" />
              <h2 className="text-lg font-bold text-gray-800">Bộ Lọc</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nhà xe</label>
                <select 
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  value={filterBusHouse}
                  onChange={(e) => setFilterBusHouse(e.target.value)}
                >
                  <option value="">Tất cả nhà xe</option>
                  {BUS_HOUSES.filter(h => h).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Loại xe</label>
                <select 
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  value={filterBusType}
                  onChange={(e) => setFilterBusType(e.target.value)}
                >
                  <option value="">Tất cả loại xe</option>
                  {BUS_TYPES.filter(t => t).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Khoảng giờ đi</label>
                <select 
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  value={filterTimeRange}
                  onChange={(e) => setFilterTimeRange(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="morning">Sáng (06:00 - 11:59)</option>
                  <option value="afternoon">Chiều (12:00 - 17:59)</option>
                  <option value="evening">Tối (18:00 - 23:59)</option>
                  <option value="night">Đêm (00:00 - 05:59)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số ghế trống</label>
                <input 
                  type="number" 
                  placeholder="Tối thiểu"
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={filterMinSeats}
                  onChange={(e) => setFilterMinSeats(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mức giá (VNĐ)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="Tối thiểu"
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={filterMinPrice}
                    onChange={(e) => setFilterMinPrice(e.target.value)}
                  />
                  <span className="text-gray-400">-</span>
                  <input 
                    type="number" 
                    placeholder="Tối đa"
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sắp xếp</label>
                <select 
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="time_asc">Giờ khởi hành sớm nhất</option>
                  <option value="duration_asc">Thời gian di chuyển ngắn nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                </select>
              </div>

              <button 
                onClick={handleSearch}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition shadow-sm"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 mb-6">
              <AlertCircle size={20} />
              <p>Có lỗi xảy ra: {(error as Error).message}</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-blue-500">
              <Zap size={40} className="animate-pulse mb-4" />
              <p className="font-medium animate-pulse">Đang tìm kiếm các chuyến đi tốt nhất...</p>
            </div>
          )}

          {!loading && data && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {data.searchTrips.total > 0 
                    ? `Kết quả: ${data.searchTrips.total} chuyến đi` 
                    : "Không tìm thấy chuyến đi nào"}
                </h2>
              </div>

              {/* Nearest Date Suggestion */}
              {data.searchTrips.total === 0 && data.searchTrips.nearestDate && (
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                      <CalendarDays size={24} />
                    </div>
                    <div>
                      <h3 className="text-blue-800 font-bold text-lg">Hết vé cho ngày bạn chọn!</h3>
                      <p className="text-blue-600 mt-1">Tuy nhiên, chúng tôi tìm thấy chuyến gần nhất vào ngày: <strong className="text-blue-700">{new Date(data.searchTrips.nearestDate).toLocaleDateString('vi-VN')}</strong></p>
                    </div>
                  </div>
                  <button 
                    onClick={() => selectNearestDate(data.searchTrips.nearestDate!)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition whitespace-nowrap shadow-sm"
                  >
                    Xem ngày này
                  </button>
                </div>
              )}

              {/* Trip Cards */}
              <div className="space-y-4">
                {data.searchTrips.trips.map((trip: Trip) => (
                  <div key={trip.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group flex flex-col md:flex-row gap-6">
                    
                    {/* Time & Route Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{trip.bus_house}</span>
                        <span className="text-gray-500 text-sm flex items-center gap-1">
                          <CreditCard size={14} /> {trip.bus_type}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">{new Date(trip.departure_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-xs text-gray-400 font-normal">{new Date(trip.departure_time).toLocaleDateString('vi-VN')}</p>
                          <p className="text-sm font-medium text-gray-500 mt-1">{trip.origin}</p>
                        </div>
                        
                        <div className="flex-1 px-4 relative flex flex-col items-center">
                          <div className="w-full border-t-2 border-dashed border-gray-300 my-4 absolute top-0" />
                          <span className="text-xs text-gray-400 bg-white px-2 relative z-10 flex items-center gap-1">
                            <Clock size={12} />
                            {Math.round((new Date(trip.arrival_time).getTime() - new Date(trip.departure_time).getTime()) / (1000 * 60 * 60))} giờ
                          </span>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">{new Date(trip.arrival_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-xs text-gray-400 font-normal">{new Date(trip.arrival_time).toLocaleDateString('vi-VN')}</p>
                          <p className="text-sm font-medium text-gray-500 mt-1">{trip.destination}</p>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px bg-gray-100 mx-2" />

                    {/* Price & Action */}
                    <div className="w-full md:w-48 flex flex-col justify-center items-end gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                      <div className="text-right w-full">
                        <p className="text-2xl font-extrabold text-green-600">{trip.price.toLocaleString('vi-VN')}đ</p>
                        <div className="text-xs text-gray-500 mt-1 flex items-center justify-end gap-1">
                          <div className={`w-2 h-2 rounded-full ${trip.available_seats > 5 ? 'bg-green-500' : 'bg-red-500'}`} />
                          Còn {trip.available_seats} chỗ trống
                        </div>
                      </div>
                      <Link href={`/trip/${trip.id}`} className="w-full bg-blue-600 group-hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-blue-200">
                        Chọn chuyến
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

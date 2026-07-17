"use client";

import { useState } from "react";
import { Search, MapPin, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

const CITIES = ["TP.HCM", "Hà Nội", "Đà Lạt", "Nha Trang", "Đà Nẵng", "Cần Thơ", "Sapa", "Huế"];

export default function Home() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (origin) params.append("origin", origin);
    if (destination) params.append("destination", destination);
    if (departureDate) params.append("departureDate", departureDate);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 py-16 px-4 min-h-[60vh] flex flex-col justify-center">
        <div className="max-w-6xl mx-auto text-center w-full">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-md">
            Hành Trình Trong Tầm Tay
          </h1>
          <p className="text-blue-100 text-lg mb-8">Đặt vé xe khách liên tỉnh dễ dàng, an toàn và nhanh chóng</p>
          
          {/* Search Box */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 max-w-5xl mx-auto relative z-10">
            {/* Origin Autocomplete */}
            <div className="flex-1 relative">
              <label className="block text-left text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Nơi xuất phát</label>
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
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 mt-2 rounded-xl shadow-lg overflow-hidden z-20 text-left">
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
              <label className="block text-left text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Nơi đến</label>
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
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 mt-2 rounded-xl shadow-lg overflow-hidden z-20 text-left">
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
              <label className="block text-left text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Ngày đi</label>
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
    </div>
  );
}

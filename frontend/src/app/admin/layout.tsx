"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Bus, Ticket, UserCircle, LogOut, Map, Activity } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // If it's the login page, don't protect it and don't show the sidebar
    if (pathname === "/admin/login") return;

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token || !userStr) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(userStr);
      if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'STAFF') {
        router.push("/login");
      } else {
        setUser(parsedUser);
      }
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!user) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Đang xác thực...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-black text-blue-700 tracking-tight">AdminPanel</h2>
          <p className="text-sm text-gray-500 mt-1">Hệ thống xe khách liên tỉnh</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {user.role === "ADMIN" && (
            <>
              <Link href="/admin" className={`flex items-center space-x-3 px-4 py-3 font-medium rounded-xl transition ${pathname === "/admin" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>
                <LayoutDashboard className="w-5 h-5" />
                <span>Tổng quan</span>
              </Link>
              <Link href="/admin/analytics" className={`flex items-center space-x-3 px-4 py-3 font-medium rounded-xl transition ${pathname.startsWith("/admin/analytics") ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>
                <Activity className="w-5 h-5" />
                <span>Analytics</span>
              </Link>
              <Link href="/admin/routes" className={`flex items-center space-x-3 px-4 py-3 font-medium rounded-xl transition ${pathname.startsWith("/admin/routes") ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>
                <Map className="w-5 h-5" />
                <span>Tuyến & Trạm</span>
              </Link>
              <Link href="/admin/buses" className={`flex items-center space-x-3 px-4 py-3 font-medium rounded-xl transition ${pathname.startsWith("/admin/buses") ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>
                <Bus className="w-5 h-5" />
                <span>Quản lý Xe</span>
              </Link>
              <Link href="/admin/trips" className={`flex items-center space-x-3 px-4 py-3 font-medium rounded-xl transition ${pathname.startsWith("/admin/trips") ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>
                <Ticket className="w-5 h-5" />
                <span>Quản lý Chuyến Xe</span>
              </Link>
              <Link href="/admin/logs" className={`flex items-center space-x-3 px-4 py-3 font-medium rounded-xl transition ${pathname.startsWith("/admin/logs") ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>
                <Activity className="w-5 h-5" />
                <span>Nhật ký hệ thống</span>
              </Link>
            </>
          )}
          <Link href="/admin/bookings" className={`flex items-center space-x-3 px-4 py-3 font-medium rounded-xl transition ${pathname === "/admin/bookings" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>
            <Ticket className="w-5 h-5" />
            <span>Quản lý Đặt Vé</span>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 mb-4 px-4 text-gray-700">
            <UserCircle className="w-8 h-8 text-gray-400" />
            <div>
              <p className="font-bold text-sm line-clamp-1">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center space-x-3 px-4 py-3 text-red-600 font-medium rounded-xl hover:bg-red-50 transition w-full">
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

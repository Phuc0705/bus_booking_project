"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle, LogIn } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Only run on client side
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      setUser(null);
    }
  }, [pathname]); // Re-run when pathname changes (e.g. after login/logout)

  // Hide navbar on admin routes
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-blue-600 font-black text-2xl tracking-tight flex items-center gap-2">
              🚌 Vexere<span className="text-yellow-500">Clone</span>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/search-ticket" className="text-gray-600 hover:text-blue-600 font-medium transition">
              Tra cứu vé
            </Link>
            {user ? (
              <Link href="/profile" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition font-medium">
                <UserCircle className="w-6 h-6 text-gray-400" />
                <span>{user.name}</span>
              </Link>
            ) : (
              <Link href="/login" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm">
                <LogIn className="w-5 h-5" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

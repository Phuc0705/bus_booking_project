import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloWrapper } from "@/components/ApolloWrapper";
import { Navbar } from "@/components/Navbar";
import { BusAdvisorChat } from "@/components/ai/bus-advisor-chat";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hệ thống Đặt vé Xe khách",
  description: "Trải nghiệm đặt vé thông minh với AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <ApolloWrapper>
          <Navbar />
          <main className="min-h-screen bg-gray-50 text-gray-900">
            {children}
          </main>
          <BusAdvisorChat />
        </ApolloWrapper>
      </body>
    </html>
  );
}
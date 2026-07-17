import { z } from "zod";
import { tool } from "ai";
import { searchTrips, getTripDetail, getBookingStatus, getRevenueSummary, getPopularRoutes } from "./graphql";
import { searchPoliciesByRag } from "./rag";

export function createBusAdvisorTools() {
  return {
    searchPolicies: tool({
      description: "Tìm kiếm thông tin chính sách hủy vé, hoàn tiền, hoặc hướng dẫn thủ tục check-in (Semantic Search bằng RAG).",
      parameters: z.object({
        query: z.string().describe("Câu hỏi về chính sách"),
      }),
      execute: async ({ query }: { query: string }) => {
        try {
          const results = await searchPoliciesByRag(query);
          return {
            ok: true,
            results,
          };
        } catch (error: any) {
          return { ok: false, message: error.message };
        }
      },
    }),

    searchTrips: tool({
      description: "Tra cứu chuyến xe theo điểm đi, điểm đến và ngày đi. Bắt buộc phải hỏi lại ngày nếu người dùng chưa nhập.",
      parameters: z.object({
        origin: z.string().optional().describe("Điểm đi (VD: Sài Gòn, TP.HCM, Hà Nội)"),
        destination: z.string().optional().describe("Điểm đến (VD: Đà Lạt, Nha Trang)"),
        departureDate: z.string().optional().describe("Ngày đi định dạng YYYY-MM-DD")
      }),
      execute: async ({ origin, destination, departureDate }: { origin?: string, destination?: string, departureDate?: string }) => {
        try {
          const data = await searchTrips(origin, destination, departureDate);
          return { ok: true, data };
        } catch (error: any) {
          return { ok: false, message: error.message };
        }
      },
    }),

    getTripDetail: tool({
      description: "Lấy thông tin chi tiết một chuyến xe theo ID.",
      parameters: z.object({
        id: z.string().describe("ID của chuyến xe")
      }),
      execute: async ({ id }: { id: string }) => {
        try {
          const data = await getTripDetail(id);
          return { ok: true, data };
        } catch (error: any) {
          return { ok: false, message: error.message };
        }
      },
    }),

    getBookingStatus: tool({
      description: "Lấy thông tin vé đã đặt bằng mã vé và email người đặt.",
      parameters: z.object({
        id: z.string().describe("Mã vé (Booking ID)"),
        email: z.string().describe("Email của người đặt vé")
      }),
      execute: async ({ id, email }: { id: string, email: string }) => {
        try {
          const data = await getBookingStatus(id, email);
          return { ok: true, data };
        } catch (error: any) {
          return { ok: false, message: error.message };
        }
      },
    })
  };
}

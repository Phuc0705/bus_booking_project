import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchTrips, getTripDetail, getBookingStatus, getRevenueSummary, getPopularRoutes } from "./graphql.js";
const server = new McpServer({
    name: "bus-booking-mcp",
    version: "1.0.0",
});
// Tools
server.tool("search_trips", "Tra cứu chuyến xe theo điểm đi, điểm đến và ngày đi.", {
    origin: z.string().optional().describe("Điểm đi (VD: Sài Gòn)"),
    destination: z.string().optional().describe("Điểm đến (VD: Đà Lạt)"),
    departureDate: z.string().optional().describe("Ngày đi định dạng YYYY-MM-DD")
}, async ({ origin, destination, departureDate }) => {
    const data = await searchTrips(origin, destination, departureDate);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
});
server.tool("get_trip_detail", "Lấy thông tin chi tiết một chuyến xe theo ID.", {
    id: z.string().describe("ID của chuyến xe")
}, async ({ id }) => {
    const data = await getTripDetail(id);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
});
server.tool("get_booking_status", "Lấy thông tin vé đã đặt bằng mã vé và email người đặt.", {
    id: z.string().describe("Mã vé (Booking ID)"),
    email: z.string().describe("Email của người đặt vé")
}, async ({ id, email }) => {
    const data = await getBookingStatus(id, email);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
});
server.tool("get_revenue_summary", "Xem thống kê doanh thu theo ngày gần nhất.", {}, async () => {
    const data = await getRevenueSummary();
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
});
server.tool("get_popular_routes", "Lấy top các tuyến đường được tìm kiếm nhiều nhất.", {}, async () => {
    const data = await getPopularRoutes();
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
});
// Resources
server.resource("policy-cancellation", "bus://policy/cancellation", { description: "Chính sách hủy vé và hoàn tiền" }, async (uri) => {
    const policy = `
# CHÍNH SÁCH HỦY VÉ VÀ HOÀN TIỀN

1. **Hủy trước 24 giờ khởi hành:** Khách hàng được hoàn trả 100% số tiền vé.
2. **Hủy trước 12 đến 24 giờ khởi hành:** Khách hàng được hoàn trả 50% số tiền vé.
3. **Hủy trong vòng 12 giờ trước khi khởi hành:** Không được hoàn tiền.
4. **Cách thức nhận tiền:** Tiền hoàn sẽ được tự động chuyển về tài khoản thẻ/ngân hàng đã dùng để thanh toán trong vòng 3-5 ngày làm việc.
    `;
    return {
        contents: [
            {
                uri: uri.href,
                text: policy,
                mimeType: "text/markdown",
            }
        ]
    };
});
server.resource("policy-checkin", "bus://policy/checkin", { description: "Hướng dẫn thủ tục lên xe (Check-in)" }, async (uri) => {
    const checkin = `
# HƯỚNG DẪN THỦ TỤC LÊN XE

1. **Thời gian có mặt:** Hành khách vui lòng có mặt tại trạm/bến xe ít nhất 30 phút trước giờ khởi hành.
2. **Kiểm tra thông tin:** Xuất trình mã vé (Booking ID) hoặc số điện thoại đặt vé kèm giấy tờ tùy thân có ảnh cho nhân viên phụ xe.
3. **Hành lý:** Mỗi hành khách được mang theo tối đa 20kg hành lý ký gửi và 1 kiện hành lý xách tay nhỏ gọn.
    `;
    return {
        contents: [
            {
                uri: uri.href,
                text: checkin,
                mimeType: "text/markdown",
            }
        ]
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("bus-booking-mcp started");
}
main().catch((error) => {
    console.error("bus-booking-mcp failed:", error);
    process.exit(1);
});

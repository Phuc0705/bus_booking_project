import amqp from "amqplib";
import "dotenv/config";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://app:app123@localhost:5672";
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || "booking.events";
const QUEUE = process.env.QUEUE_NAME || "ticket.generate.queue";
const ROUTING_KEY = process.env.ROUTING_KEY || "booking.paid";

// Hàm mô phỏng việc sinh vé PDF và gửi Email
async function processTicketGeneration(payload) {
  console.log("\n------------------------------------------------");
  console.log(`[x] Bắt đầu xử lý vé cho Booking ID: ${payload.bookingId}`);
  console.log(`[-] Gửi email tới liên hệ chính: ${payload.customerEmail}`);
  console.log(`[-] Chi tiết chuyến xe: ${payload.tripId}`);
  
  // Giả lập thời gian phần mềm PDF render và Server Email xử lý mất 2 giây
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (payload.tickets && Array.isArray(payload.tickets)) {
    payload.tickets.forEach((ticket, index) => {
      console.log(`  [+] Vé ${index + 1}:`);
      console.log(`      - Mã vé: ${ticket.ticket_code}`);
      console.log(`      - Số ghế: ${ticket.seat_number}`);
      console.log(`      - Hành khách: ${ticket.passenger_name}`);
    });
  }
  
  console.log(`[v] Đã sinh vé điện tử thành công cho ${payload.tickets?.length || 0} hành khách`);
  console.log(`[v] Đã gửi Email mô phỏng kèm mã QR!`);
  console.log("------------------------------------------------\n");
}

async function startConsumer() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // 1. Đảm bảo Exchange tồn tại (phải khớp với loại 'topic' của Publisher)
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });

    // 2. Khởi tạo hàng đợi (Queue) để hứng tin nhắn
    await channel.assertQueue(QUEUE, { durable: true });

    // 3. Ràng buộc (Bind) Queue vào Exchange thông qua Routing Key
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    // 4. Giới hạn mỗi worker chỉ xử lý 1 tin nhắn một lúc để tránh quá tải
    await channel.prefetch(1);

    console.log(`[*] Chờ đón sự kiện từ hàng đợi '${QUEUE}'. Bấm CTRL+C để thoát.`);

    // 5. Bắt đầu lắng nghe
    channel.consume(QUEUE, async (msg) => {
      if (msg !== null) {
        try {
          const event = JSON.parse(msg.content.toString());
          // Outbox gửi lên một object có chứa field "payload"
          const payload = event.payload; 
          
          await processTicketGeneration(payload);
          
          // Xác nhận xử lý thành công (ACK) để RabbitMQ xóa tin nhắn khỏi hàng đợi
          channel.ack(msg);
        } catch (error) {
          console.error("[!] Lỗi xử lý sự kiện:", error);
          // Nếu có lỗi nghiêm trọng, từ chối (NACK) và không đưa lại vào hàng đợi (false)
          // Thực tế có thể đưa vào Dead Letter Queue để admin xử lý sau
          channel.nack(msg, false, false); 
        }
      }
    }, { noAck: false }); // Bắt buộc phải có lệnh channel.ack() thủ công

  } catch (error) {
    console.error("[!] Lỗi khởi tạo RabbitMQ Consumer:", error);
    process.exit(1);
  }
}

startConsumer();
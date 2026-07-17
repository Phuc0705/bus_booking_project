import "dotenv/config";
import amqp from "amqplib";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://app:app123@localhost:5672";
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || "booking.events";
const QUEUE_NAME = process.env.QUEUE_NAME || "ticket.generate.queue";
const ROUTING_KEY = process.env.ROUTING_KEY || "booking.paid"; // or booking.created

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TICKETS_DIR = path.resolve(__dirname, "../tickets_output");

async function init() {
  try {
    await fs.mkdir(TICKETS_DIR, { recursive: true });
    
    const conn = await amqp.connect(RABBITMQ_URL);
    const channel = await conn.createChannel();
    
    // Assert exchange & queue
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE, ROUTING_KEY);
    // Also bind to booking.paid if different
    if (ROUTING_KEY !== "booking.paid") {
       await channel.bindQueue(QUEUE_NAME, EXCHANGE, "booking.paid");
    }

    console.log(`[TicketWorker] Waiting for messages in queue: ${QUEUE_NAME}`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        try {
          const payload = JSON.parse(msg.content.toString());
          console.log(`[TicketWorker] Received event ${msg.fields.routingKey} for booking ${payload.booking_id}`);
          
          await generateTicket(payload);
          await simulateEmail(payload);

          channel.ack(msg);
        } catch (err) {
          console.error(`[TicketWorker] Error processing message:`, err);
          // depending on error, you might nack or ack. Here we'll ack to not block queue on bad message
          channel.ack(msg);
        }
      }
    });
  } catch (err) {
    console.error("[TicketWorker] Connection error:", err);
    setTimeout(init, 5000);
  }
}

async function generateTicket(payload) {
  const { booking_id, trip_id, passengers } = payload;
  const ticketId = `TKT-${booking_id}`;
  
  const htmlContent = `
    <html>
      <head><title>E-Ticket ${ticketId}</title></head>
      <body>
        <h1>Bus Ticket Confirmation</h1>
        <p><strong>Booking ID:</strong> ${booking_id}</p>
        <p><strong>Trip ID:</strong> ${trip_id}</p>
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <hr/>
        <h2>Passengers</h2>
        <ul>
          ${(passengers || []).map(p => `
            <li>${p.full_name} - Phone: ${p.phone_number} - Seat: ${p.seat_id}</li>
          `).join("")}
        </ul>
        <p><em>Thank you for booking with us! Please show this ticket at check-in.</em></p>
      </body>
    </html>
  `;
  
  const filePath = path.join(TICKETS_DIR, `${ticketId}.html`);
  await fs.writeFile(filePath, htmlContent);
  console.log(`[TicketWorker] Ticket HTML generated at ${filePath}`);
}

async function simulateEmail(payload) {
  const { booking_id, passengers } = payload;
  if (!passengers || passengers.length === 0) return;
  
  const primaryEmail = passengers[0].email;
  if (primaryEmail) {
    console.log(`[EmailWorker] Simulating sending email to ${primaryEmail} for booking ${booking_id}...`);
    console.log(`[EmailWorker] Email sent successfully.`);
  } else {
    console.log(`[EmailWorker] No email found for booking ${booking_id}. Skipped.`);
  }
}

init();

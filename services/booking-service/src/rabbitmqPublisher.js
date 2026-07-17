import amqp from "amqplib";
import { once } from "node:events";
import "dotenv/config";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://app:app123@localhost:5672";
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || "booking.events";
const EXCHANGE_TYPE = process.env.RABBITMQ_EXCHANGE_TYPE || "topic";

let connection;
let channel;

export async function connectRabbitMQ() {
  if (channel) return channel;
  
  connection = await amqp.connect(RABBITMQ_URL);
  connection.on("error", (err) => console.error("[RabbitMQ] Lỗi kết nối:", err.message));
  connection.on("close", () => {
    console.error("[RabbitMQ] Đã đóng kết nối");
    channel = null;
    connection = null;
  });

  channel = await connection.createConfirmChannel();
  await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  
  console.log(`[RabbitMQ] Connected to Exchange: ${EXCHANGE}`);
  return channel;
}

export async function publishEvent({ routingKey, event }) {
  const ch = await connectRabbitMQ();
  const buffer = Buffer.from(JSON.stringify(event), "utf8");
  
  const ok = ch.publish(EXCHANGE, routingKey, buffer, {
    persistent: true,
    contentType: "application/json",
    messageId: event.eventId,
    type: event.eventType,
    timestamp: Math.floor(Date.now() / 1000)
  });

  if (!ok) await once(ch, "drain");
  await ch.waitForConfirms();
}

export async function closeRabbitMQ() {
  if (channel) await channel.close();
  if (connection) await connection.close();
}
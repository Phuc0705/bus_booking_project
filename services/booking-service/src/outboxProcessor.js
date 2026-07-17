import amqp from "amqplib";
import { db } from "./db.js";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://app:app123@localhost:5672";
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || "booking.events";
const EXCHANGE_TYPE = process.env.RABBITMQ_EXCHANGE_TYPE || "topic";
const POLL_INTERVAL = parseInt(process.env.OUTBOX_POLL_INTERVAL_MS || "2000", 10);
const BATCH_SIZE = parseInt(process.env.OUTBOX_BATCH_SIZE || "20", 10);

let channel = null;

async function connectRabbitMQ() {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
    console.log("[Outbox] Connected to RabbitMQ");
  } catch (err) {
    console.error("[Outbox] RabbitMQ connection failed:", err.message);
    setTimeout(connectRabbitMQ, 5000);
  }
}

export async function startOutboxProcessor() {
  await connectRabbitMQ();

  setInterval(async () => {
    if (!channel) return;

    try {
      await db.transaction(async (trx) => {
        // Select events FOR UPDATE SKIP LOCKED
        const events = await trx("outbox_events")
          .where({ status: "PENDING" })
          .limit(BATCH_SIZE)
          .forUpdate()
          .skipLocked();

        for (const event of events) {
          try {
            const routingKey = event.type; // e.g. booking.created, booking.paid
            const message = Buffer.from(event.payload);

            channel.publish(EXCHANGE, routingKey, message, { persistent: true });

            await trx("outbox_events")
              .where({ id: event.id })
              .update({ status: "SENT", updated_at: db.fn.now() });
          } catch (err) {
            console.error(`[Outbox] Failed to send event ${event.id}:`, err);
            await trx("outbox_events")
              .where({ id: event.id })
              .update({ attempts: event.attempts + 1 });
          }
        }
      });
    } catch (err) {
      console.error("[Outbox] Processing error:", err);
    }
  }, POLL_INTERVAL);
}

import "dotenv/config";
import { db } from "./db.js";
import { createBookingRepository } from "./bookingRepository.js";
import { connectRabbitMQ, publishEvent, closeRabbitMQ } from "./rabbitmqPublisher.js";
import { Kafka } from "kafkajs";

const POLL_INTERVAL_MS = Number(process.env.OUTBOX_POLL_INTERVAL_MS || 2000);
const BATCH_SIZE = Number(process.env.OUTBOX_BATCH_SIZE || 20);
const KAFKA_BROKERS = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ["localhost:9092"];

let shouldStop = false;

const repository = createBookingRepository(db);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const kafka = new Kafka({
  clientId: 'booking-outbox',
  brokers: KAFKA_BROKERS
});
const kafkaProducer = kafka.producer();

async function run() {
  console.log("[outbox-worker] Đang khởi động...");
  await connectRabbitMQ();
  
  await kafkaProducer.connect().catch(console.error);
  console.log(`[outbox-worker] Connected to Kafka at ${KAFKA_BROKERS}`);

  while (!shouldStop) {
    const rows = await repository.reservePendingOutboxEvents(BATCH_SIZE);
    
    if (rows.length === 0) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    for (const row of rows) {
      try {
        const event = {
          eventId: row.id,
          eventType: row.event_type,
          payload: row.payload
        };

        // Publish to RabbitMQ for Ticket Service
        await publishEvent({ routingKey: row.routing_key, event });
        
        // Publish to Kafka for Analytics Service
        await kafkaProducer.send({
          topic: 'booking-events',
          messages: [{ value: JSON.stringify(event) }],
        });

        await repository.markOutboxEventPublished(row.id);
        
        console.log(`[outbox-worker] Đã đẩy event thành công: ${row.id}`);
      } catch (error) {
        console.error(`[outbox-worker] Lỗi đẩy event ${row.id}:`, error.message);
        await repository.markOutboxEventFailed(row.id, error);
      }
    }
  }
}

async function shutdown() {
  shouldStop = true;
  await closeRabbitMQ();
  await kafkaProducer.disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

run().catch(async (error) => {
  console.error("[outbox-worker] Lỗi nghiêm trọng:", error);
  await closeRabbitMQ();
  process.exit(1);
});
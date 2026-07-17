import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import express from "express";
import knex from "knex";
import { Kafka } from "kafkajs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/analytics.proto");
const GRPC_PORT = process.env.GRPC_PORT || 50056;
const HEALTH_PORT = process.env.HEALTH_PORT || 3006;
const KAFKA_BROKERS = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ["localhost:9092"];

// Database
const db = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 15432,
    user: process.env.DB_USER || "admin",
    password: process.env.DB_PASSWORD || "123456",
    database: process.env.DB_NAME || "analytics_db"
  }
});

// Kafka Consumer
const kafka = new Kafka({
  clientId: 'analytics-service',
  brokers: KAFKA_BROKERS
});

const consumer = kafka.consumer({ groupId: 'analytics-consumer-group' });

async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'search-events', fromBeginning: false });
  await consumer.subscribe({ topic: 'booking-events', fromBeginning: false });
  // await consumer.subscribe({ topic: 'payment-events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const payloadStr = message.value.toString();
        const payload = JSON.parse(payloadStr);

        await db("raw_events").insert({
          topic,
          payload: payloadStr
        });

        if (topic === 'search-events') {
          // payload: { origin, destination, departure_date, ... }
          const { origin, destination } = payload;
          if (origin && destination) {
            await db.raw(`
              INSERT INTO route_stats (origin, destination, search_count, updated_at)
              VALUES (?, ?, 1, NOW())
              ON CONFLICT (origin, destination) 
              DO UPDATE SET search_count = route_stats.search_count + 1, updated_at = NOW()
            `, [origin, destination]);
          }
        } else if (topic === 'booking-events') {
          // payload: { eventId, eventType: 'BookingPaid', payload: "..." }
          if (payload.eventType === 'BookingPaid') {
            const bookingData = JSON.parse(payload.payload);
            const amount = Number(bookingData.totalAmount) || 0;
            const today = new Date().toISOString().split('T')[0];
            const numTickets = bookingData.tickets ? bookingData.tickets.length : 1;

            await db.raw(`
              INSERT INTO daily_revenue (date, total_revenue, total_bookings, updated_at)
              VALUES (?, ?, ?, NOW())
              ON CONFLICT (date) 
              DO UPDATE SET 
                total_revenue = daily_revenue.total_revenue + EXCLUDED.total_revenue,
                total_bookings = daily_revenue.total_bookings + EXCLUDED.total_bookings,
                updated_at = NOW()
            `, [today, amount, numTickets]);
            
            // Note: We don't have origin/destination directly in booking event payload currently.
            // Ideally we'd join with trip DB or include it in event.
          }
        }
        console.log(`[Analytics] Processed event from ${topic}`);
      } catch (err) {
        console.error(`[Analytics] Error processing message from ${topic}:`, err);
      }
    },
  });
}

// gRPC Handlers
const handlers = {
  async GetRevenueSummary(call, callback) {
    try {
      const rows = await db("daily_revenue").orderBy("date", "desc").limit(30);
      const revenue_list = rows.map(r => {
        const d = r.date;
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return {
          date: dateStr,
          total_revenue: r.total_revenue,
          total_bookings: r.total_bookings
        };
      });
      callback(null, { revenue_list });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
  async GetPopularRoutes(call, callback) {
    try {
      const limit = call.request.limit || 5;
      const routes = await db("route_stats").orderBy("search_count", "desc").limit(limit);
      callback(null, { routes });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
  async GetBookingConversionRate(call, callback) {
    try {
      const searchRes = await db("route_stats").sum("search_count as count").first();
      const bookRes = await db("daily_revenue").sum("total_bookings as count").first();
      
      const total_searches = parseInt(searchRes.count || 0, 10);
      const total_bookings = parseInt(bookRes.count || 0, 10);
      const conversion_rate = total_searches > 0 ? (total_bookings / total_searches) * 100 : 0;
      
      callback(null, { total_searches, total_bookings, conversion_rate });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  }
};

// Start gRPC Server
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const analyticsProto = grpc.loadPackageDefinition(packageDefinition).analytics;

const grpcServer = new grpc.Server();
grpcServer.addService(analyticsProto.AnalyticsService.service, handlers);

grpcServer.bindAsync(
  `0.0.0.0:${GRPC_PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log(`[analytics-service] gRPC listening on port ${port}`);
  }
);

// Health Check Server
const app = express();
app.get("/health", async (req, res) => {
  try {
    await db.raw("select 1");
    res.json({ status: "ok", service: "analytics-service" });
  } catch (error) {
    res.status(503).json({ status: "error", service: "analytics-service" });
  }
});
app.listen(HEALTH_PORT, () => console.log(`[analytics-service] Health check at ${HEALTH_PORT}`));

// Start Kafka
const runKafkaWithRetry = async () => {
  try {
    await startKafkaConsumer();
  } catch (err) {
    console.error("[Analytics] Kafka consumer failed. Restarting process in 5 seconds...", err);
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }
};
runKafkaWithRetry();

import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import express from "express";

import { db } from "./db.js";
import { createBookingService, createBookingGrpcHandlers } from "./bookingService.js";
import { startOutboxProcessor } from "./outboxProcessor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/booking.proto");
const GRPC_PORT = process.env.GRPC_PORT || 50053;
const HEALTH_PORT = process.env.HEALTH_PORT || 3003;

// Health Check Server
const app = express();
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "booking-service" });
});
app.listen(HEALTH_PORT, () => console.log(`[booking-service] Health check at ${HEALTH_PORT}`));

// Start Outbox processor
startOutboxProcessor().catch(console.error);

// gRPC Server
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const proto = grpc.loadPackageDefinition(packageDefinition).booking;

const service = createBookingService(db);
const handlers = createBookingGrpcHandlers(service);

const grpcServer = new grpc.Server();
grpcServer.addService(proto.BookingService.service, handlers);

grpcServer.bindAsync(
  `0.0.0.0:${GRPC_PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log(`[booking-service] gRPC listening on port ${port}`);
  }
);

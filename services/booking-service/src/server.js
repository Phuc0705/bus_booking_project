import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import express from "express";

import { db } from "./db.js";
import { tripGateway } from "./circuitBreakers.js";
import { createBookingRepository } from "./bookingRepository.js";
import { createBookingService, createBookingGrpcHandlers } from "./bookingService.js";
import { startCronJobs } from "./cron.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/booking.proto");
const GRPC_PORT = process.env.GRPC_PORT || 50053;
const HEALTH_PORT = process.env.HEALTH_PORT || 3003;

const app = express();
app.get("/health", (req, res) => res.json({ status: "ok", service: "booking-service" }));
app.listen(HEALTH_PORT, () => console.log(`[booking-service] Health check at ${HEALTH_PORT}`));

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const bookingProto = grpc.loadPackageDefinition(packageDefinition).booking;

const repository = createBookingRepository(db);
const service = createBookingService(repository, tripGateway);
const handlers = createBookingGrpcHandlers(service);

const grpcServer = new grpc.Server();
grpcServer.addService(bookingProto.BookingService.service, handlers);

grpcServer.bindAsync(
  `0.0.0.0:${GRPC_PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) process.exit(1);
    console.log(`[booking-service] gRPC listening on port ${port}`);
    startCronJobs();
  }
);
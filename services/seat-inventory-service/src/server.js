import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import express from "express";

import { createSeatService } from "./seatService.js";
import { createSeatGrpcHandlers } from "./seatGrpcHandlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/seat.proto");
const GRPC_PORT = process.env.GRPC_PORT || 50054;
const HEALTH_PORT = process.env.HEALTH_PORT || 3004;

// Health Check Server
const app = express();
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "seat-inventory-service" });
});
app.listen(HEALTH_PORT, () => console.log(`[seat-inventory-service] Health check at ${HEALTH_PORT}`));

// gRPC Server
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const seatProto = grpc.loadPackageDefinition(packageDefinition).seat;

const service = createSeatService();
const handlers = createSeatGrpcHandlers(service);

const grpcServer = new grpc.Server();
grpcServer.addService(seatProto.SeatInventoryService.service, handlers);

grpcServer.bindAsync(
  `0.0.0.0:${GRPC_PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log(`[seat-inventory-service] gRPC listening on port ${port}`);
  }
);
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import express from "express";

import { db } from "./db.js";
import { createTripRepository } from "./tripRepository.js";
import { createTripService } from "./tripService.js";
import { createTripGrpcHandlers } from "./tripGrpcHandlers.js";

import { createClient } from "redis";
import { Kafka } from "kafkajs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/trip.proto");
const GRPC_PORT = process.env.GRPC_PORT || 50052;
const HEALTH_PORT = process.env.HEALTH_PORT || 3002;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const KAFKA_BROKERS = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ["localhost:9092"];

// Initialize Redis
const redisClient = createClient({ url: REDIS_URL });
redisClient.on('error', err => console.error('[trip-service] Redis Error:', err));
await redisClient.connect().catch(console.error);
console.log(`[trip-service] Connected to Redis at ${REDIS_URL}`);

// Initialize Kafka
const kafka = new Kafka({
  clientId: 'trip-service',
  brokers: KAFKA_BROKERS
});
const kafkaProducer = kafka.producer();
await kafkaProducer.connect().catch(console.error);
console.log(`[trip-service] Connected to Kafka at ${KAFKA_BROKERS}`);



// 1. Health Check Server (Dành cho Docker/K8s)
const app = express();
app.get("/health", async (req, res) => {
  try {
    await db.raw("select 1");
    res.json({ status: "ok", service: "trip-service" });
  } catch (error) {
    res.status(503).json({ status: "error", service: "trip-service" });
  }
});
app.listen(HEALTH_PORT, () => console.log(`[trip-service] Health check at ${HEALTH_PORT}`));

// 2. gRPC Server
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const tripProto = grpc.loadPackageDefinition(packageDefinition).trip;

const repository = createTripRepository(db);
const service = createTripService(repository, redisClient, kafkaProducer);
const handlers = createTripGrpcHandlers(service);

const grpcServer = new grpc.Server();
grpcServer.addService(tripProto.TripService.service, handlers);

grpcServer.bindAsync(
  `0.0.0.0:${GRPC_PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log(`[trip-service] gRPC listening on port ${port}`);
  }
);
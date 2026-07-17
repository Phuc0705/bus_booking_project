import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import express from "express";

import { db } from "./db.js";
import { createUserService, createUserGrpcHandlers } from "./userService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, "../../../protos/user.proto");
const GRPC_PORT = process.env.GRPC_PORT || 50055;
const HEALTH_PORT = process.env.HEALTH_PORT || 3005;

// Health Check Server
const app = express();
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "user-service" });
});
app.listen(HEALTH_PORT, () => console.log(`[user-service] Health check at ${HEALTH_PORT}`));

// gRPC Server
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const userProto = grpc.loadPackageDefinition(packageDefinition).user;

const service = createUserService(db);
const handlers = createUserGrpcHandlers(service);

const grpcServer = new grpc.Server();
grpcServer.addService(userProto.UserService.service, handlers);

grpcServer.bindAsync(
  `0.0.0.0:${GRPC_PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    console.log(`[user-service] gRPC listening on port ${port}`);
  }
);

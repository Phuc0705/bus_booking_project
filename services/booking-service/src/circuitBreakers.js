import path from "node:path";
import { fileURLToPath } from "node:url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import CircuitBreaker from "opossum";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const protoPath = path.resolve(__dirname, "../../../protos/trip.proto");
const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const tripProto = grpc.loadPackageDefinition(packageDefinition).trip;

const tripClient = new tripProto.TripService(
  process.env.TRIP_SERVICE_ADDR || "localhost:50052",
  grpc.credentials.createInsecure()
);

// Bọc hàm gọi gRPC thành Promise
const getTripPromise = (request) => {
  return new Promise((resolve, reject) => {
    tripClient.GetTrip(request, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
};

// Cấu hình Circuit Breaker
const tripBreaker = new CircuitBreaker(getTripPromise, {
  timeout: 1500, // Quá 1.5s là báo lỗi
  errorThresholdPercentage: 50,
  resetTimeout: 5000
});

tripBreaker.fallback(() => {
  const error = new Error("Trip service unavailable");
  error.code = "UNAVAILABLE";
  throw error;
});

const seatProtoPath = path.resolve(__dirname, "../../../protos/seat.proto");
const seatPackageDefinition = protoLoader.loadSync(seatProtoPath, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const seatProto = grpc.loadPackageDefinition(seatPackageDefinition).seat;

const seatClient = new seatProto.SeatInventoryService(
  process.env.SEAT_SERVICE_ADDR || "localhost:50054",
  grpc.credentials.createInsecure()
);

const confirmSeatsPromise = (request) => {
  return new Promise((resolve, reject) => {
    seatClient.ConfirmSeats(request, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
};

const releaseSeatsPromise = (request) => {
  return new Promise((resolve, reject) => {
    seatClient.ReleaseSeats(request, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
};

const updateTripBookedSeatsPromise = (request) => {
  return new Promise((resolve, reject) => {
    tripClient.UpdateTripBookedSeats(request, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
};

export const tripGateway = {
  async getTrip(id) {
    const response = await tripBreaker.fire({ id });
    return response.trip;
  },
  async confirmSeats({ trip_id, seat_ids }) {
    return await confirmSeatsPromise({ trip_id, seat_ids });
  },
  async releaseSeats({ trip_id, seat_ids }) {
    return await releaseSeatsPromise({ trip_id, seat_ids });
  },
  async updateTripBookedSeats({ trip_id, diff }) {
    return await updateTripBookedSeatsPromise({ trip_id, diff });
  }
};
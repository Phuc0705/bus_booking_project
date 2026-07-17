import path from "node:path";
import { fileURLToPath } from "node:url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadProto(relativePath, packageName) {
  const protoPath = path.resolve(__dirname, "../../protos", relativePath);
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
  });
  return grpc.loadPackageDefinition(packageDefinition)[packageName];
}

function createUnaryCaller(client) {
  return function call(methodName, request) {
    return new Promise((resolve, reject) => {
      client[methodName](request, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });
  };
}

// Khởi tạo Trip Client
const tripProto = loadProto("trip.proto", "trip");
const tripClient = new tripProto.TripService(
  process.env.TRIP_SERVICE_ADDR || "127.0.0.1:50052",
  grpc.credentials.createInsecure()
);

// Khởi tạo Seat Client
const seatProto = loadProto("seat.proto", "seat");
const seatClient = new seatProto.SeatInventoryService(
  process.env.SEAT_SERVICE_ADDR || "127.0.0.1:50054",
  grpc.credentials.createInsecure()
);

// Khởi tạo Booking Client
const bookingProto = loadProto("booking.proto", "booking");
const bookingClient = new bookingProto.BookingService(
  process.env.BOOKING_SERVICE_ADDR || "127.0.0.1:50053",
  grpc.credentials.createInsecure()
);

// Khởi tạo User Client
const userProto = loadProto("user.proto", "user");
const userClient = new userProto.UserService(
  process.env.USER_SERVICE_ADDR || "127.0.0.1:50055",
  grpc.credentials.createInsecure()
);

// Khởi tạo Analytics Client
const analyticsProto = loadProto("analytics.proto", "analytics");
const analyticsClient = new analyticsProto.AnalyticsService(
  process.env.ANALYTICS_SERVICE_ADDR || "127.0.0.1:50056",
  grpc.credentials.createInsecure()
);

export const grpcClients = {
  trip: {
    call: createUnaryCaller(tripClient)
  },
  seat: {
    call: createUnaryCaller(seatClient)
  },
  booking: {
    call: createUnaryCaller(bookingClient)
  },
  user: {
    call: createUnaryCaller(userClient)
  },
  analytics: {
    call: createUnaryCaller(analyticsClient)
  }
};
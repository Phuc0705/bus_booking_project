import grpc from "@grpc/grpc-js";

function toGrpcError(error) {
  if (error.code === "NOT_FOUND") return { code: grpc.status.NOT_FOUND, message: error.message };
  if (error.code === "INVALID_ARGUMENT") return { code: grpc.status.INVALID_ARGUMENT, message: error.message };
  return { code: grpc.status.INTERNAL, message: "Internal trip service error" };
}

export function createTripGrpcHandlers(tripService) {
  return {
    async GetTrip(call, callback) {
      try {
        const trip = await tripService.getTrip(call.request.id);
        // Map database fields to proto fields (nếu tên cột db khác tên field trong proto)
        callback(null, { trip });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async SearchTrips(call, callback) {
      try {
        const result = await tripService.searchTrips(call.request);
        callback(null, result);
      } catch (error) {
        callback(toGrpcError(error));
      }
    },
    async CreateRoute(call, callback) {
      try {
        const route = await tripService.createRoute(call.request);
        callback(null, { route });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },
    async GetRoutes(call, callback) {
      try {
        const routes = await tripService.getRoutes();
        callback(null, { routes });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },
    async DeleteRoute(call, callback) {
      try {
        const result = await tripService.deleteRoute(call.request.id);
        callback(null, result);
      } catch (error) {
        callback({ code: grpc.status.FAILED_PRECONDITION, message: error.message });
      }
    },
    async CreateBus(call, callback) {
      try {
        const bus = await tripService.createBus(call.request);
        callback(null, { bus });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },
    async GetBuses(call, callback) {
      try {
        const buses = await tripService.getBuses();
        callback(null, { buses });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },
    async DeleteBus(call, callback) {
      try {
        const result = await tripService.deleteBus(call.request.id);
        callback(null, result);
      } catch (error) {
        callback({ code: grpc.status.FAILED_PRECONDITION, message: error.message });
      }
    },
    async CreateTrip(call, callback) {
      try {
        const trip = await tripService.createTrip(call.request);
        callback(null, { trip });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },
    async UpdateTripStatus(call, callback) {
      try {
        const trip = await tripService.updateTripStatus(call.request.id, call.request.status);
        callback(null, { trip });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },
    async DeleteTrip(call, callback) {
      try {
        const result = await tripService.deleteTrip(call.request.id);
        callback(null, result);
      } catch (error) {
        callback({ code: grpc.status.FAILED_PRECONDITION, message: error.message });
      }
    },
    async GetEventLogs(call, callback) {
      try {
        const result = await tripService.getEventLogs(call.request);
        callback(null, result);
      } catch (error) {
        callback({ code: grpc.status.INTERNAL, message: error.message });
      }
    },

    async UpdateTripBookedSeats(call, callback) {
      try {
        const result = await tripService.updateTripBookedSeats(call.request);
        callback(null, result);
      } catch (error) {
        let code = grpc.status.INTERNAL;
        if (error.code === "INVALID_ARGUMENT") code = grpc.status.INVALID_ARGUMENT;
        callback({ code, message: error.message });
      }
    }
  };
}
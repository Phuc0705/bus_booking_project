import grpc from "@grpc/grpc-js";

function toGrpcError(error) {
  if (error.code === "ALREADY_EXISTS") return { code: grpc.status.ALREADY_EXISTS, message: error.message };
  if (error.code === "INVALID_ARGUMENT") return { code: grpc.status.INVALID_ARGUMENT, message: error.message };
  return { code: grpc.status.INTERNAL, message: "Internal seat service error" };
}

export function createSeatGrpcHandlers(seatService) {
  return {
    async HoldSeats(call, callback) {
      try {
        const result = await seatService.holdSeats(call.request);
        callback(null, result);
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async GetSeatMap(call, callback) {
      try {
        const seats = await seatService.getSeatMap(call.request);
        callback(null, { seats });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async LockSeats(call, callback) {
      try {
        const result = await seatService.lockSeats(call.request);
        callback(null, result);
      } catch (error) {
        let code = grpc.status.INTERNAL;
        if (error.code === "INVALID_ARGUMENT") code = grpc.status.INVALID_ARGUMENT;
        callback({ code, message: error.message });
      }
    },

    async ConfirmSeats(call, callback) {
      try {
        const result = await seatService.confirmSeats(call.request);
        callback(null, result);
      } catch (error) {
        let code = grpc.status.INTERNAL;
        if (error.code === "INVALID_ARGUMENT") code = grpc.status.INVALID_ARGUMENT;
        callback({ code, message: error.message });
      }
    },

    async ReleaseSeats(call, callback) {
      try {
        const result = await seatService.releaseSeats(call.request);
        callback(null, result);
      } catch (error) {
        let code = grpc.status.INTERNAL;
        if (error.code === "INVALID_ARGUMENT") code = grpc.status.INVALID_ARGUMENT;
        callback({ code, message: error.message });
      }
    }
  };
}
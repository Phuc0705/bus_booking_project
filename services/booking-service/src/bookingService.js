import grpc from "@grpc/grpc-js";

export function createBookingService(bookingRepository, tripGateway) {
  return {
    async createBooking(request) {
      if (!request.trip_id || !request.passengers || request.passengers.length === 0) {
        throw { code: "INVALID_ARGUMENT", message: "Thiếu thông tin chuyến xe hoặc hành khách" };
      }

      // 1. Gọi Trip Service để lấy giá vé
      const trip = await tripGateway.getTrip(request.trip_id);
      if (!trip) {
        throw { code: "NOT_FOUND", message: "Không tìm thấy chuyến xe" };
      }

      // 2. Tính tổng tiền
      const totalAmount = trip.price * request.passengers.length;

      // 3. Lưu vào DB bằng Transaction
      const bookingId = await bookingRepository.createBookingWithOutbox({
        userId: request.user_id,
        tripId: request.trip_id,
        customerName: request.customer_name,
        customerPhone: request.customer_phone,
        customerEmail: request.customer_email,
        totalAmount: totalAmount,
        passengers: request.passengers
      });

      return {
        booking_id: bookingId,
        status: "PENDING_PAYMENT",
        message: "Đặt vé thành công, vui lòng thanh toán."
      };
    },

    async payBooking(request) {
      if (!request.booking_id) throw { code: "INVALID_ARGUMENT", message: "Thiếu booking_id" };
      
      const booking = await bookingRepository.getBooking(request.booking_id);
      if (!booking) throw { code: "NOT_FOUND", message: "Không tìm thấy booking" };
      if (booking.status !== "PENDING_PAYMENT") {
         throw { code: "INVALID_ARGUMENT", message: `Trạng thái hiện tại: ${booking.status}` };
      }

      // Confirm ghế qua seat-inventory-service (tripgateway.confirmSeats)
      try {
        await tripGateway.confirmSeats({ trip_id: booking.trip_id, seat_ids: booking.tickets.map(t => t.seat_number) });
      } catch (err) {
        console.error("Failed to confirm seats", err);
        throw { code: "INTERNAL", message: "Không thể xác nhận ghế" };
      }

      await bookingRepository.payBooking(request.booking_id);

      // Cập nhật số ghế đã đặt vào trip-service
      try {
        await tripGateway.updateTripBookedSeats({ trip_id: booking.trip_id, diff: booking.tickets.length });
      } catch (err) {
        console.error("Failed to update trip booked seats", err);
      }

      return {
        booking_id: request.booking_id,
        status: "PAID",
        message: "Thanh toán thành công"
      };
    },

    async cancelBooking(request) {
      if (!request.booking_id) throw { code: "INVALID_ARGUMENT", message: "Thiếu booking_id" };
      
      const booking = await bookingRepository.getBooking(request.booking_id);
      if (!booking) throw { code: "NOT_FOUND", message: "Không tìm thấy booking" };
      
      if (booking.status === "CANCELLED" || booking.status === "EXPIRED") {
        throw { code: "INVALID_ARGUMENT", message: "Vé đã bị hủy hoặc hết hạn" };
      }

      // Release seats
      try {
        await tripGateway.releaseSeats({ trip_id: booking.trip_id, seat_ids: booking.tickets.map(t => t.seat_number) });
      } catch (err) {
        console.error("Failed to release seats", err);
      }

      await bookingRepository.cancelBooking(request.booking_id);

      // Cập nhật số ghế đã đặt vào trip-service
      if (booking.status === "PAID") {
        try {
          await tripGateway.updateTripBookedSeats({ trip_id: booking.trip_id, diff: -booking.tickets.length });
        } catch (err) {
          console.error("Failed to update trip booked seats", err);
        }
      }

      return {
        booking_id: request.booking_id,
        status: "CANCELLED",
        message: "Hủy vé thành công"
      };
    },

    async getAllBookings(request) {
      const limit = request.limit || 50;
      const offset = request.offset || 0;
      
      const { bookings, total } = await bookingRepository.getAllBookings(limit, offset, request.trip_id);
      
      const mappedBookings = bookings.map(b => ({
        id: b.id,
        trip_id: b.trip_id,
        customer_name: b.customer_name,
        customer_phone: b.customer_phone,
        customer_email: b.customer_email,
        total_amount: b.total_amount,
        status: b.status,
        tickets: b.tickets.map(t => ({
          seat_number: t.seat_number,
          ticket_code: t.ticket_code || "",
          passenger_name: t.passenger_name || "",
          passenger_phone: t.passenger_phone || "",
          passenger_email: t.passenger_email || "",
          passenger_identity: t.passenger_identity || ""
        })),
        created_at: b.created_at ? b.created_at.toISOString() : ""
      }));

      return {
        bookings: mappedBookings,
        total
      };
    },

    async getUserBookings(request) {
      if (!request.user_id) throw { code: "INVALID_ARGUMENT", message: "Thiếu user_id" };
      
      const bookings = await bookingRepository.getUserBookings(request.user_id);
      
      const mappedBookings = bookings.map(b => ({
        id: b.id,
        trip_id: b.trip_id,
        customer_name: b.customer_name,
        customer_phone: b.customer_phone,
        customer_email: b.customer_email,
        total_amount: b.total_amount,
        status: b.status,
        tickets: b.tickets.map(t => ({
          seat_number: t.seat_number,
          ticket_code: t.ticket_code || "",
          passenger_name: t.passenger_name || "",
          passenger_phone: t.passenger_phone || "",
          passenger_email: t.passenger_email || "",
          passenger_identity: t.passenger_identity || ""
        })),
        created_at: b.created_at ? b.created_at.toISOString() : ""
      }));

      return {
        bookings: mappedBookings,
        total: mappedBookings.length
      };
    },

    async checkinBooking(request) {
      if (!request.booking_id) throw { code: "INVALID_ARGUMENT", message: "Thiếu booking_id" };
      
      const booking = await bookingRepository.getBooking(request.booking_id);
      if (!booking) throw { code: "NOT_FOUND", message: "Không tìm thấy booking" };

      if (booking.status === "PENDING_PAYMENT") {
        try {
          await tripGateway.confirmSeats({ trip_id: booking.trip_id, seat_ids: booking.tickets.map(t => t.seat_number) });
          await tripGateway.updateTripBookedSeats({ trip_id: booking.trip_id, diff: booking.tickets.length });
        } catch (err) {
          console.error("Failed to update trip booked seats on checkin", err);
        }
      }

      await bookingRepository.checkinBooking(request.booking_id);
      return {
        booking_id: request.booking_id,
        status: "CHECKED_IN",
        message: "Check-in thành công."
      };
    },

    async getBookingByIdAndEmail(request) {
      if (!request.id || !request.email) throw { code: "INVALID_ARGUMENT", message: "Thiếu id hoặc email" };
      
      const booking = await bookingRepository.getBookingByIdAndEmail(request.id, request.email);
      if (!booking) throw { code: "NOT_FOUND", message: "Không tìm thấy vé" };
      
      return {
        booking: {
          id: booking.id,
          trip_id: booking.trip_id,
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          customer_email: booking.customer_email,
          total_amount: booking.total_amount,
          status: booking.status,
          tickets: (booking.tickets || []).map(t => ({
            seat_number: t.seat_number,
            ticket_code: t.ticket_code || "",
            passenger_name: t.passenger_name || "",
            passenger_phone: t.passenger_phone || "",
            passenger_email: t.passenger_email || "",
            passenger_identity: t.passenger_identity || ""
          })),
          created_at: booking.created_at ? booking.created_at.toISOString() : ""
        }
      };
    }
  };
}

export function createBookingGrpcHandlers(bookingService) {
  return {
    async CreateBooking(call, callback) {
      try {
        const result = await bookingService.createBooking(call.request);
        callback(null, result);
      } catch (error) {
        let code = grpc.status.INTERNAL;
        if (error.code === "NOT_FOUND") code = grpc.status.NOT_FOUND;
        if (error.code === "INVALID_ARGUMENT") code = grpc.status.INVALID_ARGUMENT;
        if (error.code === "UNAVAILABLE") code = grpc.status.UNAVAILABLE;
        callback({ code, message: error.message });
      }
    },

    async PayBooking(call, callback) {
      try {
        const result = await bookingService.payBooking(call.request);
        callback(null, result);
      } catch (error) {
        let code = grpc.status.INTERNAL;
        if (error.code === "NOT_FOUND") code = grpc.status.NOT_FOUND;
        if (error.code === "INVALID_ARGUMENT") code = grpc.status.INVALID_ARGUMENT;
        callback({ code, message: error.message });
      }
    },

    async CancelBooking(call, callback) {
      try {
        const result = await bookingService.cancelBooking(call.request);
        callback(null, result);
      } catch (error) {
        let code = grpc.status.INTERNAL;
        if (error.code === "NOT_FOUND") code = grpc.status.NOT_FOUND;
        if (error.code === "INVALID_ARGUMENT") code = grpc.status.INVALID_ARGUMENT;
        callback({ code, message: error.message });
      }
    },

    async GetAllBookings(call, callback) {
      try {
        const result = await bookingService.getAllBookings(call.request);
        callback(null, result);
      } catch (error) {
        callback({ code: grpc.status.INTERNAL, message: error.message });
      }
    },

    async GetUserBookings(call, callback) {
      try {
        const result = await bookingService.getUserBookings(call.request);
        callback(null, result);
      } catch (error) {
        callback({ code: grpc.status.INTERNAL, message: error.message });
      }
    },

    async CheckinBooking(call, callback) {
      try {
        const result = await bookingService.checkinBooking(call.request);
        callback(null, result);
      } catch (error) {
        let code = grpc.status.INTERNAL;
        if (error.code === "INVALID_ARGUMENT") code = grpc.status.INVALID_ARGUMENT;
        callback({ code, message: error.message });
      }
    },

    async GetBookingByIdAndEmail(call, callback) {
      try {
        const result = await bookingService.getBookingByIdAndEmail(call.request);
        callback(null, result);
      } catch (error) {
        let code = grpc.status.INTERNAL;
        if (error.code === "INVALID_ARGUMENT") code = grpc.status.INVALID_ARGUMENT;
        if (error.code === "NOT_FOUND") code = grpc.status.NOT_FOUND;
        callback({ code, message: error.message });
      }
    }
  };
}
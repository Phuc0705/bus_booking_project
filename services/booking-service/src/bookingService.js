import { v4 as uuidv4 } from "uuid";

export function createBookingService(db) {
  return {
    async createBooking(data) {
      const { trip_id, user_id, passengers, total_amount } = data;
      const bookingId = `BKG-${uuidv4().substring(0, 8).toUpperCase()}`;

      await db.transaction(async (trx) => {
        await trx("bookings").insert({
          id: bookingId,
          trip_id,
          user_id: user_id || null,
          total_amount,
          status: "PENDING_PAYMENT", // simplified for now
        });

        const passengerInserts = passengers.map(p => ({
          booking_id: bookingId,
          full_name: p.full_name,
          phone_number: p.phone_number,
          email: p.email || null,
          id_card: p.id_card || null,
          seat_id: p.seat_id,
        }));
        await trx("passengers").insert(passengerInserts);

        // Outbox event
        await trx("outbox_events").insert({
          aggregate_id: bookingId,
          aggregate_type: "Booking",
          type: "booking.created",
          payload: JSON.stringify({ booking_id: bookingId, trip_id, passengers, total_amount }),
        });
      });

      return { booking_id: bookingId };
    },

    async payBooking(bookingId, paymentSuccess) {
      const status = paymentSuccess ? "PAID" : "FAILED";
      
      await db.transaction(async (trx) => {
        await trx("bookings").where({ id: bookingId }).update({ status, updated_at: db.fn.now() });
        
        if (paymentSuccess) {
          // get booking info for event
          const booking = await trx("bookings").where({ id: bookingId }).first();
          const passengers = await trx("passengers").where({ booking_id: bookingId });
          
          await trx("outbox_events").insert({
            aggregate_id: bookingId,
            aggregate_type: "Booking",
            type: "booking.paid",
            payload: JSON.stringify({ booking_id: bookingId, trip_id: booking.trip_id, passengers }),
          });
        }
      });

      return { status };
    },

    async getBooking(bookingId) {
      const booking = await db("bookings").where({ id: bookingId }).first();
      if (!booking) return null;
      
      const passengers = await db("passengers").where({ booking_id: bookingId });
      return { ...booking, passengers };
    }
  };
}

export function createBookingGrpcHandlers(service) {
  return {
    CreateBooking: async (call, callback) => {
      try {
        const { booking_id } = await service.createBooking(call.request);
        callback(null, { success: true, message: "Booking created", booking_id });
      } catch (err) {
        console.error("CreateBooking error:", err);
        callback(null, { success: false, message: err.message });
      }
    },
    PayBooking: async (call, callback) => {
      try {
        const { status } = await service.payBooking(call.request.booking_id, call.request.payment_success);
        callback(null, { success: true, message: "Payment processed", status });
      } catch (err) {
        console.error("PayBooking error:", err);
        callback(null, { success: false, message: err.message, status: "ERROR" });
      }
    },
    GetBooking: async (call, callback) => {
      try {
        const booking = await service.getBooking(call.request.booking_id);
        if (!booking) {
          return callback(null, { success: false, message: "Not found" });
        }
        callback(null, { success: true, message: "OK", booking });
      } catch (err) {
        console.error("GetBooking error:", err);
        callback(null, { success: false, message: err.message });
      }
    }
  };
}

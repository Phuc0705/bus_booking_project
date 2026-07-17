import crypto from "node:crypto";

export function createBookingRepository(db) {
  return {
    async createBookingWithOutbox({ userId, tripId, customerName, customerPhone, customerEmail, totalAmount, passengers }) {
      return db.transaction(async (trx) => {
        const bookingId = crypto.randomUUID();
        
        // 1. Lưu Booking
        await trx("bookings").insert({
          id: bookingId,
          user_id: userId || null,
          trip_id: tripId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          total_amount: totalAmount,
          status: "PENDING_PAYMENT"
        });

        // 2. Lưu Booking Seats với thông tin hành khách
        const seatRows = passengers.map(p => ({
          id: crypto.randomUUID(),
          booking_id: bookingId,
          seat_number: p.seat_id,
          passenger_name: p.name,
          passenger_phone: p.phone,
          passenger_email: p.email,
          passenger_identity: p.identity_number
        }));
        await trx("booking_seats").insert(seatRows);

        // 3. Ghi Outbox Event
        await trx("outbox_events").insert({
          id: crypto.randomUUID(),
          event_type: "BookingCreated",
          routing_key: "booking.created",
          version: 1,
          payload: JSON.stringify({
            bookingId,
            tripId,
            seatIds: passengers.map(p => p.seat_id),
            customerEmail,
            totalAmount
          }),
          status: "pending"
        });

        return bookingId;
      });
    },

    async getBooking(bookingId) {
      const booking = await db("bookings").where({ id: bookingId }).first();
      if (!booking) return null;

      const tickets = await db("booking_seats").where({ booking_id: booking.id });
      booking.tickets = tickets;
      return booking;
    },

    async payBooking(bookingId) {
      return db.transaction(async (trx) => {
        const booking = await trx("bookings").where({ id: bookingId }).first();
        if (!booking) throw new Error("Booking not found");

        await trx("bookings").where({ id: bookingId }).update({
          status: "PAID",
          updated_at: trx.fn.now()
        });

        const tickets = await trx("booking_seats").where({ booking_id: bookingId });
        for (const ticket of tickets) {
          const ticketCode = `TICKET-${bookingId.split('-')[0].toUpperCase()}-${ticket.seat_number}`;
          await trx("booking_seats").where({ id: ticket.id }).update({
            ticket_code: ticketCode
          });
          ticket.ticket_code = ticketCode; // Update for payload
        }

        await trx("outbox_events").insert({
          id: crypto.randomUUID(),
          event_type: "BookingPaid",
          routing_key: "booking.paid",
          version: 1,
          payload: JSON.stringify({
            bookingId,
            tripId: booking.trip_id,
            totalAmount: booking.total_amount,
            customerEmail: booking.customer_email,
            tickets: tickets.map(t => ({
              seat_number: t.seat_number,
              ticket_code: t.ticket_code,
              passenger_name: t.passenger_name
            }))
          }),
          status: "pending"
        });

        return true;
      });
    },

    async cancelBooking(bookingId) {
      await db("bookings").where({ id: bookingId }).update({
        status: "CANCELLED",
        updated_at: db.fn.now()
      });
    },

    async getExpiredPendingBookings(minutes = 15) {
      const timeThreshold = new Date(Date.now() - minutes * 60 * 1000);
      return db("bookings")
        .where({ status: "PENDING_PAYMENT" })
        .andWhere("created_at", "<", timeThreshold);
    },

    async markBookingExpired(bookingId) {
      await db("bookings").where({ id: bookingId }).update({
        status: "EXPIRED",
        updated_at: db.fn.now()
      });
    },

    async reservePendingOutboxEvents(limit = 20) {
      return db.transaction(async (trx) => {
        const rows = await trx("outbox_events")
          .select("*")
          .where({ status: "pending" })
          .andWhere("attempts", "<", 10)
          .orderBy("created_at", "asc")
          .limit(limit)
          .forUpdate()
          .skipLocked();

        if (rows.length === 0) return [];

        await trx("outbox_events")
          .whereIn("id", rows.map(r => r.id))
          .update({
            status: "publishing",
            updated_at: trx.fn.now()
          });

        return rows;
      });
    },

    async markOutboxEventPublished(eventId) {
      await db("outbox_events").where({ id: eventId }).update({
        status: "published",
        published_at: db.fn.now(),
        updated_at: db.fn.now(),
        last_error: null
      });
    },

    async markOutboxEventFailed(eventId, error) {
      const row = await db("outbox_events").select("attempts").where({ id: eventId }).first();
      const nextAttempts = (row?.attempts || 0) + 1;
      
      await db("outbox_events").where({ id: eventId }).update({
        attempts: nextAttempts,
        status: nextAttempts >= 10 ? "failed" : "pending",
        last_error: String(error?.message || error).slice(0, 1000),
        updated_at: db.fn.now()
      });
    },

    async getAllBookings(limit = 50, offset = 0, tripId = null) {
      let query = db("bookings")
        .select("*")
        .orderBy("created_at", "desc");
        
      if (tripId) {
        query = query.where({ trip_id: tripId });
      }

      const bookings = await query.limit(limit).offset(offset);

      const bookingIds = bookings.map(b => b.id);
      if (bookingIds.length === 0) return { bookings: [], total: 0 };

      const seats = await db("booking_seats")
        .select("*")
        .whereIn("booking_id", bookingIds);

      let countQuery = db("bookings");
      if (tripId) countQuery = countQuery.where({ trip_id: tripId });
      const totalRes = await countQuery.count("id as count").first();

      const bookingsWithSeats = bookings.map(b => {
        return {
          ...b,
          tickets: seats.filter(s => s.booking_id === b.id)
        };
      });

      return {
        bookings: bookingsWithSeats,
        total: parseInt(totalRes.count, 10)
      };
    },

    async getUserBookings(userId) {
      const bookings = await db("bookings")
        .select("*")
        .where({ user_id: userId })
        .orderBy("created_at", "desc");

      const bookingIds = bookings.map(b => b.id);
      if (bookingIds.length === 0) return [];

      const seats = await db("booking_seats")
        .select("*")
        .whereIn("booking_id", bookingIds);

      const bookingsWithSeats = bookings.map(b => {
        return {
          ...b,
          tickets: seats.filter(s => s.booking_id === b.id)
        };
      });

      return bookingsWithSeats;
    },

    async checkinBooking(bookingId) {
      await db("bookings").where({ id: bookingId }).update({
        status: "CHECKED_IN",
        updated_at: db.fn.now()
      });
    },

    async getBookingByIdAndEmail(bookingId, email) {
      const booking = await db("bookings")
        .select("*")
        .whereRaw("id::text ILIKE ?", [`${bookingId}%`])
        .andWhere({ customer_email: email })
        .first();

      if (!booking) return null;

      const tickets = await db("booking_seats")
        .select("*")
        .where({ booking_id: booking.id });

      booking.tickets = tickets;
      return booking;
    }
  };
}
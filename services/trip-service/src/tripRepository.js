export function createTripRepository(db) {
  return {
    // Routes
    async createRoute(route) {
      const [newRoute] = await db("routes").insert(route).returning("*");
      return newRoute;
    },
    async getRoutes() {
      return db("routes").select("*");
    },
    async getRouteById(id) {
      return db("routes").where({ id }).first();
    },
    async deleteRoute(id) {
      return db("routes").where({ id }).del();
    },

    // Buses
    async createBus(bus) {
      const [newBus] = await db("buses").insert(bus).returning("*");
      return newBus;
    },
    async getBuses() {
      return db("buses").select("*");
    },
    async getBusById(id) {
      return db("buses").where({ id }).first();
    },
    async deleteBus(id) {
      return db("buses").where({ id }).del();
    },

    // Trips
    async createTrip(trip) {
      const [newTrip] = await db("trips").insert(trip).returning("*");
      return this.findById(newTrip.id);
    },
    async updateTripStatus(id, status) {
      await db("trips").where({ id }).update({ status });
      return this.findById(id);
    },
    async deleteTrip(id) {
      return db("trips").where({ id }).del();
    },
    async findById(id) {
      return db("trips")
        .join("routes", "trips.route_id", "routes.id")
        .join("buses", "trips.bus_id", "buses.id")
        .where("trips.id", id)
        .select(
          "trips.*",
          "routes.origin",
          "routes.destination",
          "buses.bus_house",
          "buses.bus_type",
          "buses.total_seats",
          db.raw("buses.total_seats - trips.booked_seats as available_seats")
        )
        .first();
    },

    async searchTrips(params) {
      const { origin, destination, departure_date, limit, offset, min_price, max_price, bus_house, bus_type, sort_by, status, time_range, min_available_seats } = params;
      let query = db("trips")
        .join("routes", "trips.route_id", "routes.id")
        .join("buses", "trips.bus_id", "buses.id")
        .select(
          "trips.*",
          "routes.origin",
          "routes.destination",
          "buses.bus_house",
          "buses.bus_type",
          "buses.total_seats",
          db.raw("buses.total_seats - trips.booked_seats as available_seats")
        );
      
      if (status && status !== "ALL") {
        query = query.where("trips.status", "ACTIVE");
      }

      if (origin) query = query.where("routes.origin", "ilike", `%${origin}%`);
      if (destination) query = query.where("routes.destination", "ilike", `%${destination}%`);
      if (departure_date) query = query.whereRaw("DATE(trips.departure_time) = ?", [departure_date]);
      
      if (min_price > 0) query = query.where("trips.price", ">=", min_price);
      if (max_price > 0) query = query.where("trips.price", "<=", max_price);
      if (bus_house) query = query.where("buses.bus_house", "ilike", `%${bus_house}%`);
      if (bus_type) query = query.where("buses.bus_type", "ilike", `%${bus_type}%`);
      
      if (min_available_seats > 0) query = query.whereRaw("buses.total_seats - trips.booked_seats >= ?", [min_available_seats]);

      if (time_range) {
        if (time_range === "morning") {
          query = query.whereRaw("EXTRACT(HOUR FROM trips.departure_time) BETWEEN 6 AND 11");
        } else if (time_range === "afternoon") {
          query = query.whereRaw("EXTRACT(HOUR FROM trips.departure_time) BETWEEN 12 AND 17");
        } else if (time_range === "evening") {
          query = query.whereRaw("EXTRACT(HOUR FROM trips.departure_time) BETWEEN 18 AND 23");
        } else if (time_range === "night") {
          query = query.whereRaw("EXTRACT(HOUR FROM trips.departure_time) BETWEEN 0 AND 5");
        }
      }
      
      if (sort_by === "price_asc") {
        query = query.orderBy("trips.price", "asc");
      } else if (sort_by === "price_desc") {
        query = query.orderBy("trips.price", "desc");
      } else if (sort_by === "duration_asc") {
        query = query.orderByRaw("EXTRACT(EPOCH FROM (trips.arrival_time - trips.departure_time)) ASC");
      } else {
        query = query.orderBy("trips.departure_time", "asc");
      }
      
      return query.limit(limit).offset(offset);
    },

    async countSearchTrips(params) {
      const { origin, destination, departure_date, min_price, max_price, bus_house, bus_type, status, time_range, min_available_seats } = params;
      let query = db("trips")
        .join("routes", "trips.route_id", "routes.id")
        .join("buses", "trips.bus_id", "buses.id")
        .count({ count: "*" });

      if (status && status !== "ALL") {
        query = query.where("trips.status", "ACTIVE");
      }

      if (origin) query = query.where("routes.origin", "ilike", `%${origin}%`);
      if (destination) query = query.where("routes.destination", "ilike", `%${destination}%`);
      if (departure_date) query = query.whereRaw("DATE(trips.departure_time) = ?", [departure_date]);
      if (min_price > 0) query = query.where("trips.price", ">=", min_price);
      if (max_price > 0) query = query.where("trips.price", "<=", max_price);
      if (bus_house) query = query.where("buses.bus_house", "ilike", `%${bus_house}%`);
      if (bus_type) query = query.where("buses.bus_type", "ilike", `%${bus_type}%`);
      
      if (min_available_seats > 0) query = query.whereRaw("buses.total_seats - trips.booked_seats >= ?", [min_available_seats]);

      if (time_range) {
        if (time_range === "morning") {
          query = query.whereRaw("EXTRACT(HOUR FROM trips.departure_time) BETWEEN 6 AND 11");
        } else if (time_range === "afternoon") {
          query = query.whereRaw("EXTRACT(HOUR FROM trips.departure_time) BETWEEN 12 AND 17");
        } else if (time_range === "evening") {
          query = query.whereRaw("EXTRACT(HOUR FROM trips.departure_time) BETWEEN 18 AND 23");
        } else if (time_range === "night") {
          query = query.whereRaw("EXTRACT(HOUR FROM trips.departure_time) BETWEEN 0 AND 5");
        }
      }
      
      const row = await query.first();
      return Number(row.count);
    },

    async findNearestTripDate(params) {
      const { origin, destination, departure_date } = params;
      if (!departure_date) return null;
      let query = db("trips")
        .join("routes", "trips.route_id", "routes.id")
        .where("trips.status", "ACTIVE")
        .select("trips.departure_time");

      if (origin) query = query.where("routes.origin", "ilike", `%${origin}%`);
      if (destination) query = query.where("routes.destination", "ilike", `%${destination}%`);
      
      query = query.where("trips.departure_time", ">", departure_date)
                   .orderBy("trips.departure_time", "asc")
                   .first();
                   
      const row = await query;
      return row ? row.departure_time : null;
    },

    async getEventLogs(limit = 50) {
      return db("event_logs").select("*").orderBy("created_at", "desc").limit(limit);
    },

    async updateTripBookedSeats(tripId, diff) {
      return db.raw(
        "UPDATE trips SET booked_seats = booked_seats + ? WHERE id = ?",
        [diff, tripId]
      );
    }
  };
}
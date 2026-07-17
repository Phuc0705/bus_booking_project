export function createTripService(tripRepository, redisClient, kafkaProducer) {
  return {
    async getTrip(id) {
      if (!id) {
        const error = new Error("trip_id is required");
        error.code = "INVALID_ARGUMENT";
        throw error;
      }
      
      const trip = await tripRepository.findById(id);
      if (!trip) {
        const error = new Error("Trip not found");
        error.code = "NOT_FOUND";
        throw error;
      }
      return trip;
    },

    async searchTrips(params) {
      const { limit, offset } = params;
      const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
      const safeOffset = Math.max(Number(offset) || 0, 0);
      
      const safeParams = { ...params, limit: safeLimit, offset: safeOffset };
      
      // 1. Publish search event to Kafka for Analytics
      if (kafkaProducer) {
        kafkaProducer.send({
          topic: 'search-events',
          messages: [{ value: JSON.stringify({ ...safeParams, timestamp: new Date().toISOString() }) }],
        }).catch(err => console.error("[trip-service] Kafka Error:", err));
      }

      // 2. Try Redis Cache
      const cacheKey = `search:trips:${JSON.stringify(safeParams)}`;
      if (redisClient) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          console.log("[trip-service] Cache hit for:", cacheKey);
          return JSON.parse(cachedData);
        }
      }

      // 3. Fallback to DB
      const [trips, total] = await Promise.all([
        tripRepository.searchTrips(safeParams),
        tripRepository.countSearchTrips(safeParams)
      ]);

      let nearest_date = null;
      if (total === 0 && safeParams.departure_date) {
        nearest_date = await tripRepository.findNearestTripDate(safeParams);
        // Format to ISO string or just return DB format
        if (nearest_date) {
          nearest_date = new Date(nearest_date).toISOString();
        }
      }

      const result = { trips, total, nearest_date };

      // 4. Save to Cache (TTL 5 minutes = 300s)
      if (redisClient) {
        await redisClient.set(cacheKey, JSON.stringify(result), { EX: 300 });
      }

      return result;
    },

    // Routes
    async createRoute(route) {
      if (!route.origin || !route.destination || !route.distance_km || !route.estimated_hours) {
        throw new Error("Missing required route fields");
      }
      return tripRepository.createRoute(route);
    },
    async getRoutes() {
      return tripRepository.getRoutes();
    },
    async deleteRoute(id) {
      if (!id) throw new Error("Missing route id");
      try {
        await tripRepository.deleteRoute(id);
        return { success: true, message: "Route deleted successfully" };
      } catch (err) {
        if (err.code === '23503') { // Postgres Foreign Key Violation
          throw new Error("Không thể xóa tuyến đường này vì đang có chuyến xe sử dụng.");
        }
        throw err;
      }
    },

    // Buses
    async createBus(bus) {
      if (!bus.license_plate || !bus.bus_house || !bus.bus_type || !bus.total_seats) {
        throw new Error("Missing required bus fields");
      }
      return tripRepository.createBus(bus);
    },
    async getBuses() {
      return tripRepository.getBuses();
    },
    async deleteBus(id) {
      if (!id) throw new Error("Missing bus id");
      try {
        await tripRepository.deleteBus(id);
        return { success: true, message: "Bus deleted successfully" };
      } catch (err) {
        if (err.code === '23503') { // Postgres Foreign Key Violation
          throw new Error("Không thể xóa xe này vì đang có chuyến xe sử dụng.");
        }
        throw err;
      }
    },

    // Trips
    async createTrip(trip) {
      if (!trip.route_id || !trip.bus_id || !trip.departure_time || !trip.arrival_time || !trip.price) {
        throw new Error("Missing required trip fields");
      }
      const newTrip = await tripRepository.createTrip(trip);
      if (kafkaProducer) {
        kafkaProducer.send({
          topic: 'trip-events',
          messages: [{ value: JSON.stringify({ event: 'TRIP_CREATED', data: newTrip, timestamp: new Date().toISOString() }) }],
        }).catch(err => console.error(err));
      }
      return newTrip;
    },
    async updateTripStatus(id, status) {
      if (!id || !status) throw new Error("Missing id or status");
      const updated = await tripRepository.updateTripStatus(id, status);
      if (kafkaProducer) {
        kafkaProducer.send({
          topic: 'trip-events',
          messages: [{ value: JSON.stringify({ event: 'TRIP_STATUS_UPDATED', data: updated, timestamp: new Date().toISOString() }) }],
        }).catch(err => console.error(err));
      }
      return updated;
    },
    async deleteTrip(id) {
      if (!id) throw new Error("Missing trip id");
      try {
        await tripRepository.deleteTrip(id);
        return { success: true, message: "Trip deleted successfully" };
      } catch (err) {
        if (err.code === '23503') { // Postgres Foreign Key Violation
          throw new Error("Không thể xóa chuyến xe này vì đang có đơn đặt vé.");
        }
        throw err;
      }
    },

    async getEventLogs(request) {
      const limit = request.limit || 50;
      const logs = await tripRepository.getEventLogs(limit);
      return { logs };
    },

    async updateTripBookedSeats(request) {
      if (!request.trip_id || request.diff === undefined) {
        throw { code: "INVALID_ARGUMENT", message: "trip_id and diff are required" };
      }
      await tripRepository.updateTripBookedSeats(request.trip_id, request.diff);
      return { success: true };
    }
  };
}
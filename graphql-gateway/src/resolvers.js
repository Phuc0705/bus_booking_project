import { GraphQLError } from "graphql";
import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();

function toGraphQLError(error) {
  return new GraphQLError(error.details || error.message || "Internal server error", {
    extensions: { code: error.code || "INTERNAL_SERVER_ERROR" }
  });
}

export const resolvers = {
  Query: {
    async trip(_, { id }, ctx) {
      try {
        const response = await ctx.grpc.trip.call("GetTrip", { id });
        return response.trip;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async searchTrips(_, args, ctx) {
      try {
        const response = await ctx.grpc.trip.call("SearchTrips", {
          origin: args.origin || "",
          destination: args.destination || "",
          departure_date: args.departureDate || "",
          limit: args.limit || 20,
          offset: args.offset || 0,
          min_price: args.minPrice || 0,
          max_price: args.maxPrice || 0,
          bus_house: args.busHouse || "",
          bus_type: args.busType || "",
          sort_by: args.sortBy || "",
          status: args.status || "",
          time_range: args.timeRange || "",
          min_available_seats: args.minAvailableSeats || 0
        });
        return {
          trips: response.trips || [],
          total: response.total || 0,
          nearestDate: response.nearest_date || null
        };
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async getSeatMap(_, { tripId }, ctx) {
      try {
        const tripRes = await ctx.grpc.trip.call("GetTrip", { id: tripId });
        const totalSeats = tripRes.trip?.total_seats || 34;
        const response = await ctx.grpc.seat.call("GetSeatMap", { trip_id: tripId, total_seats: totalSeats });
        return response.seats || [];
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async getAllBookings(_, args, ctx) {
      try {
        const response = await ctx.grpc.booking.call("GetAllBookings", {
          limit: args.limit || 50,
          offset: args.offset || 0,
          trip_id: args.tripId || ""
        });
        return {
          bookings: response.bookings || [],
          total: response.total || 0
        };
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async getUserBookings(_, __, ctx) {
      if (!ctx.user) {
        throw new Error("Vui lòng đăng nhập");
      }
      try {
        const response = await ctx.grpc.booking.call("GetUserBookings", { user_id: ctx.user.id });
        return {
          bookings: response.bookings || [],
          total: response.total || 0
        };
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async getRoutes(_, __, ctx) {
      try {
        const response = await ctx.grpc.trip.call("GetRoutes", {});
        return response.routes || [];
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async getBuses(_, __, ctx) {
      try {
        const response = await ctx.grpc.trip.call("GetBuses", {});
        return response.buses || [];
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async getEventLogs(_, __, ctx) {
      if (!ctx.user || ctx.user.role !== "ADMIN") throw new Error("Unauthorized");
      try {
        const response = await ctx.grpc.trip.call("GetEventLogs", {});
        return response.logs || [];
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async bookingStatus(_, { id, email }, ctx) {
      try {
        // Here we ideally have a gRPC method in booking service to fetch by ID & email.
        // For now, let's fetch all bookings of the user if they are logged in, or we would need a new gRPC method `GetBookingByIdAndEmail`.
        // Let's implement it by fetching all bookings and filtering if we don't want to change booking-service right now.
        // Wait, it's better to add a gRPC method. But for speed, let's just use GetAllBookings or a new one.
        // Actually, we can just throw if not implemented.
        // Let's implement `GetBookingByIdAndEmail` in booking-service later. I will call it now.
        const response = await ctx.grpc.booking.call("GetBookingByIdAndEmail", { id, email });
        return response.booking;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async getRevenueSummary(_, args, ctx) {
      try {
        const response = await ctx.grpc.analytics.call("GetRevenueSummary", { start_date: args.startDate || "", end_date: args.endDate || "" });
        return response.revenue_list || [];
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async getPopularRoutes(_, args, ctx) {
      try {
        const response = await ctx.grpc.analytics.call("GetPopularRoutes", { limit: args.limit || 5 });
        return response.routes || [];
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async getBookingConversionRate(_, __, ctx) {
      try {
        const response = await ctx.grpc.analytics.call("GetBookingConversionRate", {});
        return response;
      } catch (error) {
        throw toGraphQLError(error);
      }
    }
  },
  BookingInfo: {
    async trip(parent, _, ctx) {
      if (!parent.trip_id) return null;
      try {
        const res = await ctx.grpc.trip.call("GetTrip", { id: parent.trip_id });
        return res.trip;
      } catch (err) {
        return null;
      }
    }
  },
  Mutation: {
    async login(_, { email, password }, ctx) {
      try {
        const response = await ctx.grpc.user.call("Login", { email, password });
        return response;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async adminLogin(_, { email, password }, ctx) {
      try {
        const response = await ctx.grpc.user.call("Login", { email, password });
        if (response.user.role !== "ADMIN" && response.user.role !== "STAFF") {
          throw new Error("Không có quyền truy cập trang quản trị");
        }
        return response;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async customerLogin(_, { email, password }, ctx) {
      try {
        const response = await ctx.grpc.user.call("Login", { email, password });
        if (response.user.role !== "CUSTOMER") {
          throw new Error("Tài khoản không phải là khách hàng");
        }
        return response;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async customerRegister(_, { name, email, password }, ctx) {
      try {
        const response = await ctx.grpc.user.call("Register", { 
          name, 
          email, 
          password, 
          role: "CUSTOMER" 
        });
        return response;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async updateProfile(_, { name, phone, address, identity_number }, ctx) {
      if (!ctx.user) throw new Error("Vui lòng đăng nhập");
      try {
        const response = await ctx.grpc.user.call("UpdateProfile", { 
          id: ctx.user.id,
          name, 
          phone: phone || "", 
          address: address || "", 
          identity_number: identity_number || "" 
        });
        return response.user;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async holdSeats(_, { tripId, seatIds, userId }, ctx) {
      try {
        const response = await ctx.grpc.seat.call("HoldSeats", { 
          trip_id: tripId, 
          seat_ids: seatIds,
          user_id: ctx.user ? ctx.user.id : (userId || "guest")
        });
        
        // Publish status if successful
        if (response.success) {
          for (const seatId of seatIds) {
            pubsub.publish(`SEAT_STATUS_CHANGED_${tripId}`, {
              seatStatusChanged: {
                id: seatId,
                seat_number: seatId,
                status: "HELD"
              }
            });
          }
        }

        return {
          success: response.success,
          message: response.message
        };
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async lockSeats(_, { tripId, seatIds }, ctx) {
      if (!ctx.user || ctx.user.role !== "ADMIN") {
        throw new Error("Không có quyền thực hiện thao tác này");
      }
      try {
        const response = await ctx.grpc.seat.call("LockSeats", { 
          trip_id: tripId, 
          seat_ids: seatIds
        });
        
        // Publish status if successful
        if (response.success) {
          for (const seatId of seatIds) {
            pubsub.publish(`SEAT_STATUS_CHANGED_${tripId}`, {
              seatStatusChanged: {
                id: seatId,
                seat_number: seatId,
                status: "LOCKED"
              }
            });
          }
        }

        return {
          success: response.success,
          message: response.message
        };
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async createBooking(_, args, ctx) {
      try {
        const response = await ctx.grpc.booking.call("CreateBooking", {
          trip_id: args.tripId,
          passengers: args.passengers,
          customer_name: args.customerName,
          customer_phone: args.customerPhone,
          customer_email: args.customerEmail,
          user_id: ctx.user ? ctx.user.id : ""
        });
        return response;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async payBooking(_, { bookingId }, ctx) {
      try {
        const response = await ctx.grpc.booking.call("PayBooking", { booking_id: bookingId });
        return response;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async cancelBooking(_, { bookingId }, ctx) {
      try {
        const response = await ctx.grpc.booking.call("CancelBooking", { booking_id: bookingId });
        return response;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async checkinBooking(_, { bookingId }, ctx) {
      try {
        const response = await ctx.grpc.booking.call("CheckinBooking", { booking_id: bookingId });
        return response;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async createRoute(_, args, ctx) {
      if (!ctx.user || ctx.user.role !== "ADMIN") throw new Error("Unauthorized");
      try {
        const response = await ctx.grpc.trip.call("CreateRoute", args);
        return response.route;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async createBus(_, args, ctx) {
      if (!ctx.user || ctx.user.role !== "ADMIN") throw new Error("Unauthorized");
      try {
        const response = await ctx.grpc.trip.call("CreateBus", args);
        return response.bus;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async createTrip(_, args, ctx) {
      if (!ctx.user || ctx.user.role !== "ADMIN") throw new Error("Unauthorized");
      try {
        const response = await ctx.grpc.trip.call("CreateTrip", args);
        return response.trip;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async updateTripStatus(_, { id, status }, ctx) {
      if (!ctx.user || ctx.user.role !== "ADMIN") throw new Error("Unauthorized");
      try {
        const response = await ctx.grpc.trip.call("UpdateTripStatus", { id, status });
        return response.trip;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async deleteRoute(_, { id }, ctx) {
      if (!ctx.user || ctx.user.role !== "ADMIN") throw new Error("Unauthorized");
      try {
        const response = await ctx.grpc.trip.call("DeleteRoute", { id });
        return response.success;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async deleteBus(_, { id }, ctx) {
      if (!ctx.user || ctx.user.role !== "ADMIN") throw new Error("Unauthorized");
      try {
        const response = await ctx.grpc.trip.call("DeleteBus", { id });
        return response.success;
      } catch (error) {
        throw toGraphQLError(error);
      }
    },
    async deleteTrip(_, { id }, ctx) {
      if (!ctx.user || ctx.user.role !== "ADMIN") throw new Error("Unauthorized");
      try {
        const response = await ctx.grpc.trip.call("DeleteTrip", { id });
        return response.success;
      } catch (error) {
        throw toGraphQLError(error);
      }
    }
  },
  Subscription: {
    seatStatusChanged: {
      subscribe: (_, { tripId }) => pubsub.asyncIterableIterator(`SEAT_STATUS_CHANGED_${tripId}`)
    }
  }
};
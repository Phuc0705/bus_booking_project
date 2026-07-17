export const typeDefs = `#graphql
  type Trip {
    id: ID!
    origin: String!
    destination: String!
    departure_time: String!
    arrival_time: String!
    bus_house: String!
    bus_type: String!
    price: Int!
    total_seats: Int!
    available_seats: Int!
    pickup_points: [String]
    dropoff_points: [String]
    status: String
  }

  type SearchTripsResponse {
    trips: [Trip!]!
    total: Int!
    nearestDate: String
  }

  type Seat {
    id: ID!
    seat_number: String!
    status: String!
  }

  type HoldSeatsResponse {
    success: Boolean!
    message: String!
  }

  type BookingInfo {
    id: ID!
    trip_id: String!
    trip: Trip
    customer_name: String!
    customer_phone: String!
    customer_email: String!
    total_amount: Int!
    status: String!
    tickets: [TicketInfo!]!
    created_at: String!
  }

  type GetAllBookingsResponse {
    bookings: [BookingInfo!]!
    total: Int!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    phone: String
    address: String
    identity_number: String
  }

  type AuthResponse {
    token: String!
    user: User!
  }

  type Route {
    id: ID!
    origin: String!
    destination: String!
    distance_km: Int!
    estimated_hours: Float!
  }

  type Bus {
    id: ID!
    license_plate: String!
    bus_house: String!
    bus_type: String!
    total_seats: Int!
  }

  type EventLog {
    id: Int!
    event_type: String!
    event_data: String!
    created_at: String!
  }

  type DailyRevenue {
    date: String!
    total_revenue: Int!
    total_bookings: Int!
  }

  type RouteStat {
    origin: String!
    destination: String!
    search_count: Int!
    booking_count: Int!
  }

  type BookingConversionRate {
    total_searches: Int!
    total_bookings: Int!
    conversion_rate: Float!
  }

  type Query {
    trip(id: ID!): Trip
    searchTrips(
      origin: String, 
      destination: String, 
      departureDate: String,
      limit: Int, 
      offset: Int,
      minPrice: Int,
      maxPrice: Int,
      busHouse: String,
      busType: String,
      sortBy: String,
      status: String,
      timeRange: String,
      minAvailableSeats: Int
    ): SearchTripsResponse!
    getSeatMap(tripId: ID!): [Seat!]!
    getAllBookings(limit: Int, offset: Int, tripId: ID): GetAllBookingsResponse!
    getUserBookings: GetAllBookingsResponse!
    bookingStatus(id: ID!, email: String!): BookingInfo
    
    getRoutes: [Route!]!
    getBuses: [Bus!]!
    getEventLogs: [EventLog!]!
    
    getRevenueSummary(startDate: String, endDate: String): [DailyRevenue!]!
    getPopularRoutes(limit: Int): [RouteStat!]!
    getBookingConversionRate: BookingConversionRate!
  }

  type BookingResponse {
    booking_id: ID!
    status: String!
    message: String!
  }

  input PassengerInput {
    seat_id: String!
    name: String!
    phone: String!
    email: String!
    identity_number: String
  }

  type TicketInfo {
    seat_number: String!
    ticket_code: String!
    passenger_name: String!
    passenger_phone: String!
    passenger_email: String!
    passenger_identity: String!
  }

  type Mutation {
    login(email: String!, password: String!): AuthResponse!
    adminLogin(email: String!, password: String!): AuthResponse!
    customerLogin(email: String!, password: String!): AuthResponse!
    customerRegister(name: String!, email: String!, password: String!): AuthResponse!
    updateProfile(name: String!, phone: String, address: String, identity_number: String): User!
    
    holdSeats(tripId: ID!, seatIds: [String!]!, userId: String): HoldSeatsResponse!
    lockSeats(tripId: ID!, seatIds: [String!]!): HoldSeatsResponse!
    
    createBooking(
      tripId: ID!, 
      passengers: [PassengerInput!]!,
      customerName: String!, 
      customerPhone: String!, 
      customerEmail: String!
    ): BookingResponse!
    payBooking(bookingId: ID!): BookingResponse!
    cancelBooking(bookingId: ID!): BookingResponse!
    checkinBooking(bookingId: ID!): BookingResponse!

    # Admin CRUD
    createRoute(origin: String!, destination: String!, distance_km: Int!, estimated_hours: Float!): Route!
    deleteRoute(id: ID!): Boolean!
    createBus(license_plate: String!, bus_house: String!, bus_type: String!, total_seats: Int!): Bus!
    deleteBus(id: ID!): Boolean!
    createTrip(route_id: ID!, bus_id: ID!, departure_time: String!, arrival_time: String!, price: Int!): Trip!
    updateTripStatus(id: ID!, status: String!): Trip!
    deleteTrip(id: ID!): Boolean!
  }

  type Subscription {
    seatStatusChanged(tripId: ID!): Seat!
  }
`;
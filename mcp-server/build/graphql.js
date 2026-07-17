import { request } from "graphql-request";
const GRAPHQL_ENDPOINT = process.env.BACKEND_GRAPHQL_URL ?? "http://localhost:4000/graphql";
const SEARCH_TRIPS_QUERY = `
  query SearchTrips($origin: String, $destination: String, $departureDate: String) {
    searchTrips(origin: $origin, destination: $destination, departureDate: $departureDate, limit: 10) {
      trips {
        id
        origin
        destination
        departure_time
        arrival_time
        bus_house
        bus_type
        price
        available_seats
        status
      }
      total
    }
  }
`;
const TRIP_DETAIL_QUERY = `
  query GetTripDetail($id: ID!) {
    trip(id: $id) {
      id
      origin
      destination
      departure_time
      arrival_time
      bus_house
      bus_type
      price
      total_seats
      available_seats
      status
    }
  }
`;
const GET_BOOKING_STATUS_QUERY = `
  query GetBookingStatus($id: ID!, $email: String!) {
    bookingStatus(id: $id, email: $email) {
      id
      trip_id
      customer_name
      customer_email
      total_amount
      status
      seat_numbers
    }
  }
`;
const GET_REVENUE_SUMMARY_QUERY = `
  query GetRevenueSummary {
    getRevenueSummary {
      date
      total_revenue
      total_bookings
    }
  }
`;
const GET_POPULAR_ROUTES_QUERY = `
  query GetPopularRoutes {
    getPopularRoutes(limit: 5) {
      origin
      destination
      search_count
      booking_count
    }
  }
`;
export async function searchTrips(origin, destination, departureDate) {
    try {
        const data = await request(GRAPHQL_ENDPOINT, SEARCH_TRIPS_QUERY, { origin, destination, departureDate });
        return data.searchTrips;
    }
    catch (err) {
        throw new Error(err.message);
    }
}
export async function getTripDetail(id) {
    try {
        const data = await request(GRAPHQL_ENDPOINT, TRIP_DETAIL_QUERY, { id });
        return data.trip;
    }
    catch (err) {
        throw new Error(err.message);
    }
}
export async function getBookingStatus(id, email) {
    try {
        const data = await request(GRAPHQL_ENDPOINT, GET_BOOKING_STATUS_QUERY, { id, email });
        return data.bookingStatus;
    }
    catch (err) {
        throw new Error(err.message);
    }
}
export async function getRevenueSummary() {
    try {
        const data = await request(GRAPHQL_ENDPOINT, GET_REVENUE_SUMMARY_QUERY);
        return data.getRevenueSummary;
    }
    catch (err) {
        throw new Error(err.message);
    }
}
export async function getPopularRoutes() {
    try {
        const data = await request(GRAPHQL_ENDPOINT, GET_POPULAR_ROUTES_QUERY);
        return data.getPopularRoutes;
    }
    catch (err) {
        throw new Error(err.message);
    }
}

import fetch from 'node-fetch';

const GRAPHQL_URL = 'http://localhost:4000/graphql';

const HOLD_SEATS_MUTATION = `
  mutation HoldSeats($tripId: ID!, $seatIds: [String!]!, $userId: String!) {
    holdSeats(tripId: $tripId, seatIds: $seatIds, userId: $userId) {
      success
      message
    }
  }
`;

async function bookSeat(userId, tripId, seatIds) {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: HOLD_SEATS_MUTATION,
        variables: { tripId, seatIds, userId }
      })
    });
    const json = await res.json();
    if (json.errors) {
      console.log(`[User ${userId}] THẤT BẠI: ${json.errors[0].message}`);
    } else {
      console.log(`[User ${userId}] THÀNH CÔNG: ${json.data.holdSeats.message}`);
    }
  } catch (err) {
    console.log(`[User ${userId}] LỖI KẾT NỐI: ${err.message}`);
  }
}

async function testDoubleBooking() {
  const tripId = "trip-001";
  const seatIds = ["A01"]; // Cùng tranh nhau ghế A01
  
  console.log(`Bắt đầu test: 2 user cùng đặt ghế ${seatIds[0]} của chuyến ${tripId}...`);
  
  // Gọi đồng thời cả 2 request (Race Condition)
  await Promise.all([
    bookSeat("user_A", tripId, seatIds),
    bookSeat("user_B", tripId, seatIds)
  ]);
  
  console.log("Test hoàn tất!");
}

testDoubleBooking();

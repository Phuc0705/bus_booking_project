const { Client } = require('pg');
const { createClient } = require('redis');

async function sync() {
  const booking = new Client('postgres://admin:123456@localhost:15432/booking_db');
  await booking.connect();
  
  const redis = createClient({ url: 'redis://localhost:6379' });
  await redis.connect();
  
  const { rows } = await booking.query("SELECT b.trip_id, t.seat_number FROM bookings b JOIN booking_seats t ON b.id = t.booking_id WHERE b.status IN ('PAID', 'CHECKED_IN')");
  
  for (const r of rows) {
    const lockKey = `lock:${r.trip_id}:${r.seat_number}`;
    await redis.set(lockKey, "USER_BOOKED");
  }
  
  console.log('Fixed ' + rows.length + ' seat locks in Redis');
  
  await booking.end();
  await redis.quit();
}

sync().catch(console.error);

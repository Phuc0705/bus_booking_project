const { Client } = require('pg');

async function sync() {
  const booking = new Client('postgres://admin:123456@localhost:15432/booking_db');
  const trip = new Client('postgres://admin:123456@localhost:15432/trip_db');
  
  await booking.connect();
  await trip.connect();
  
  const { rows } = await booking.query("SELECT b.trip_id, COUNT(t.id) as count FROM bookings b JOIN booking_seats t ON b.id = t.booking_id WHERE b.status IN ('PAID', 'CHECKED_IN') GROUP BY b.trip_id");
  
  for (const r of rows) {
    await trip.query('UPDATE trips SET booked_seats = $1 WHERE id = $2', [parseInt(r.count, 10), r.trip_id]);
  }
  
  console.log('Fixed ' + rows.length + ' trips');
  
  await booking.end();
  await trip.end();
}

sync().catch(console.error);

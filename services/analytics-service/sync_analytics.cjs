const { Client } = require('pg');

async function sync() {
  const bookingDb = new Client('postgres://admin:123456@localhost:15432/booking_db');
  const analyticsDb = new Client('postgres://admin:123456@localhost:15432/analytics_db');
  
  await bookingDb.connect();
  await analyticsDb.connect();
  
  const { rows } = await bookingDb.query(`
    SELECT 
      DATE(b.created_at) as date,
      COUNT(s.id) as total_bookings,
      SUM(b.total_amount) / (SELECT COUNT(*) FROM bookings b2 WHERE b2.id = b.id) as total_revenue
    FROM bookings b
    JOIN booking_seats s ON b.id = s.booking_id
    WHERE b.status IN ('PAID', 'CHECKED_IN')
    GROUP BY b.id, DATE(b.created_at)
  `);
  
  const dailyData = {};
  for (const r of rows) {
    const d = r.date.toISOString().split('T')[0];
    if (!dailyData[d]) dailyData[d] = { rev: 0, tickets: 0 };
    dailyData[d].rev += Number(r.total_revenue) || 0;
    dailyData[d].tickets += Number(r.total_bookings) || 0;
  }
  
  // Clear old daily revenue
  await analyticsDb.query("DELETE FROM daily_revenue");
  
  for (const [date, data] of Object.entries(dailyData)) {
    await analyticsDb.query(`
      INSERT INTO daily_revenue (date, total_revenue, total_bookings)
      VALUES ($1, $2, $3)
    `, [date, data.rev, data.tickets]);
  }
  
  console.log('Synced ' + Object.keys(dailyData).length + ' daily_revenue records');
  
  await bookingDb.end();
  await analyticsDb.end();
}

sync().catch(console.error);

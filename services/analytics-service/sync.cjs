const { Client } = require('pg');

async function sync() {
  const src = new Client('postgres://admin:123456@localhost:15432/booking_db');
  const dest = new Client('postgres://admin:123456@localhost:15432/analytics_db');
  
  await src.connect();
  await dest.connect();
  
  const { rows } = await src.query("SELECT DATE(created_at) as date, SUM(total_amount) as total_revenue, COUNT(id) as total_bookings FROM bookings WHERE status IN ('PAID', 'CHECKED_IN') GROUP BY DATE(created_at)");
  
  for (const r of rows) {
    // Need to adjust date for timezone offset to avoid it becoming the previous day in ISO format if not careful
    const d = new Date(r.date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    const dateStr = d.toISOString().split('T')[0];

    await dest.query(
      'INSERT INTO daily_revenue (date, total_revenue, total_bookings, updated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (date) DO UPDATE SET total_revenue = EXCLUDED.total_revenue, total_bookings = EXCLUDED.total_bookings, updated_at = NOW()',
      [dateStr, parseInt(r.total_revenue, 10), parseInt(r.total_bookings, 10)]
    );
  }
  
  console.log('Synced ' + rows.length + ' days of revenue');
  
  await src.end();
  await dest.end();
}

sync().catch(console.error);

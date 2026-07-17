import knex from "knex";

const db = knex({
  client: "pg",
  connection: {
    host: "localhost",
    port: 15432,
    user: "admin",
    password: "123456",
    database: "postgres"
  }
});

async function init() {
  try {
    // Tạo database nếu chưa có
    const res = await db.raw("SELECT 1 FROM pg_database WHERE datname = 'analytics_db'");
    if (res.rows.length === 0) {
      await db.raw("CREATE DATABASE analytics_db");
      console.log("Created database analytics_db");
    }
  } catch (err) {
    console.log("DB check error:", err.message);
  } finally {
    await db.destroy();
  }

  // Kết nối vào analytics_db
  const dbAnalytics = knex({
    client: "pg",
    connection: {
      host: "localhost",
      port: 15432,
      user: "admin",
      password: "123456",
      database: "analytics_db"
    }
  });

  try {
    // Bảng lưu tổng hợp doanh thu theo ngày
    const hasDailyRevenue = await dbAnalytics.schema.hasTable("daily_revenue");
    if (!hasDailyRevenue) {
      await dbAnalytics.schema.createTable("daily_revenue", (table) => {
        table.date("date").primary();
        table.integer("total_revenue").defaultTo(0);
        table.integer("total_bookings").defaultTo(0);
        table.timestamp("updated_at").defaultTo(dbAnalytics.fn.now());
      });
      console.log("Created table daily_revenue");
    }

    // Bảng lưu số vé bán theo tuyến và số lượt tìm kiếm
    const hasRouteStats = await dbAnalytics.schema.hasTable("route_stats");
    if (!hasRouteStats) {
      await dbAnalytics.schema.createTable("route_stats", (table) => {
        table.string("origin").notNullable();
        table.string("destination").notNullable();
        table.integer("search_count").defaultTo(0);
        table.integer("booking_count").defaultTo(0);
        table.timestamp("updated_at").defaultTo(dbAnalytics.fn.now());
        table.primary(["origin", "destination"]);
      });
      console.log("Created table route_stats");
    }

    // Bảng raw events để debug (tùy chọn)
    const hasRawEvents = await dbAnalytics.schema.hasTable("raw_events");
    if (!hasRawEvents) {
      await dbAnalytics.schema.createTable("raw_events", (table) => {
        table.increments("id").primary();
        table.string("topic").notNullable();
        table.jsonb("payload").notNullable();
        table.timestamp("created_at").defaultTo(dbAnalytics.fn.now());
      });
      console.log("Created table raw_events");
    }

    console.log("Analytics tables initialized successfully!");
  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    await dbAnalytics.destroy();
  }
}

init();

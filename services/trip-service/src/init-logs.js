import { db } from "./db.js";

async function initLogs() {
  try {
    await db.schema.createTable("event_logs", (table) => {
      table.increments("id").primary();
      table.string("event_type").notNullable();
      table.text("event_data").notNullable();
      table.timestamp("created_at").defaultTo(db.fn.now());
    });
    console.log("Table 'event_logs' created.");
    process.exit(0);
  } catch (error) {
    console.error("Error creating event_logs table:", error);
    process.exit(1);
  }
}

initLogs();

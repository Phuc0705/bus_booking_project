export async function up(knex) {
  await knex.schema.createTable("bookings", (table) => {
    table.uuid("id").primary();
    table.uuid("user_id").nullable(); // Nullable cho Guest checkout
    table.uuid("trip_id").notNullable();
    table.string("customer_name", 150).notNullable();
    table.string("customer_phone", 20).notNullable();
    table.string("customer_email", 150).notNullable();
    table.integer("total_amount").notNullable();
    table.string("status", 30).notNullable().defaultTo("PENDING_PAYMENT");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("booking_seats", (table) => {
    table.uuid("id").primary();
    table.uuid("booking_id").notNullable().references("id").inTable("bookings").onDelete("CASCADE");
    table.string("seat_number", 10).notNullable();
  });

  await knex.schema.createTable("outbox_events", (table) => {
    table.uuid("id").primary();
    table.string("event_type", 100).notNullable();
    table.string("routing_key").notNullable();
    table.integer("version").notNullable().defaultTo(1);
    table.jsonb("payload").notNullable();
    table.string("correlation_id").nullable();
    table.string("status", 30).notNullable().defaultTo("pending");
    table.integer("attempts").notNullable().defaultTo(0);
    table.text("last_error").nullable();
    table.timestamp("published_at").nullable();
    table.timestamps(true, true);
    table.index(["status", "created_at"]);
    table.index(["event_type"]);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("outbox_events");
  await knex.schema.dropTableIfExists("booking_seats");
  await knex.schema.dropTableIfExists("bookings");
}
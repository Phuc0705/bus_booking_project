export async function up(knex) {
  await knex.schema.createTable("bookings", (table) => {
    table.string("id").primary();
    table.string("trip_id").notNullable();
    table.string("user_id").nullable(); // Nullable for guest checkout
    table.string("status").notNullable().defaultTo("DRAFT"); // DRAFT, PENDING_PAYMENT, PAID, CANCELLED
    table.decimal("total_amount", 10, 2).notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("passengers", (table) => {
    table.increments("id").primary();
    table.string("booking_id").notNullable().references("id").inTable("bookings").onDelete("CASCADE");
    table.string("full_name").notNullable();
    table.string("phone_number").notNullable();
    table.string("email").nullable();
    table.string("id_card").nullable();
    table.string("seat_id").notNullable();
  });

  await knex.schema.createTable("outbox_events", (table) => {
    table.increments("id").primary();
    table.string("aggregate_id").notNullable(); // Booking ID
    table.string("aggregate_type").notNullable(); // "Booking"
    table.string("type").notNullable(); // Event type: "booking.created", "booking.paid"
    table.json("payload").notNullable();
    table.string("status").notNullable().defaultTo("PENDING"); // PENDING, SENT, FAILED
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.integer("attempts").defaultTo(0);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("outbox_events");
  await knex.schema.dropTableIfExists("passengers");
  await knex.schema.dropTableIfExists("bookings");
}

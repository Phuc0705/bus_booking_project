export async function up(knex) {
  // Drop old flat table
  await knex.schema.dropTableIfExists("trips");
  await knex.schema.dropTableIfExists("buses");
  await knex.schema.dropTableIfExists("routes");

  // Create routes
  await knex.schema.createTable("routes", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("origin").notNullable();
    table.string("destination").notNullable();
    table.integer("distance_km").notNullable();
    table.decimal("estimated_hours", 4, 1).notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // Create buses
  await knex.schema.createTable("buses", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("license_plate").notNullable().unique();
    table.string("bus_house").notNullable();
    table.string("bus_type").notNullable();
    table.integer("total_seats").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // Create trips
  await knex.schema.createTable("trips", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.uuid("route_id").references("id").inTable("routes").onDelete("CASCADE");
    table.uuid("bus_id").references("id").inTable("buses").onDelete("CASCADE");
    table.timestamp("departure_time").notNullable();
    table.timestamp("arrival_time").notNullable();
    table.integer("price").notNullable();
    table.jsonb("pickup_points");
    table.jsonb("dropoff_points");
    table.string("status").defaultTo("ACTIVE"); // ACTIVE, LOCKED, DEPARTED, COMPLETED
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("trips");
  await knex.schema.dropTableIfExists("buses");
  await knex.schema.dropTableIfExists("routes");

  // Re-create flat table if rolling back
  await knex.schema.createTable("trips", (table) => {
    table.uuid("id").primary();
    table.string("route", 200).notNullable();
    table.string("origin", 100).notNullable();
    table.string("destination", 100).notNullable();
    table.timestamp("departure_time").notNullable();
    table.timestamp("arrival_time").notNullable();
    table.string("bus_house", 100).notNullable();
    table.string("bus_type", 50).notNullable();
    table.integer("price").notNullable();
    table.integer("total_seats").notNullable().defaultTo(34);
    table.integer("available_seats").notNullable().defaultTo(34);
    table.jsonb("pickup_points");
    table.jsonb("dropoff_points");
    table.string("status", 30).notNullable().defaultTo("SCHEDULED");
    table.timestamps(true, true);
  });
}

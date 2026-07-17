export async function up(knex) {
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
    table.string("status", 30).notNullable().defaultTo("SCHEDULED");
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("trips");
}
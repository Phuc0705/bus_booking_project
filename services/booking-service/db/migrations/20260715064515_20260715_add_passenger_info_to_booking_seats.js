export async function up(knex) {
  await knex.schema.alterTable("booking_seats", (table) => {
    table.string("passenger_name", 150).nullable();
    table.string("passenger_phone", 20).nullable();
    table.string("passenger_email", 150).nullable();
    table.string("passenger_identity", 50).nullable();
    table.string("ticket_code", 100).nullable().unique();
  });
}

export async function down(knex) {
  await knex.schema.alterTable("booking_seats", (table) => {
    table.dropColumn("passenger_name");
    table.dropColumn("passenger_phone");
    table.dropColumn("passenger_email");
    table.dropColumn("passenger_identity");
    table.dropColumn("ticket_code");
  });
}

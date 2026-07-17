export async function up(knex) {
  await knex.schema.alterTable("trips", (table) => {
    table.integer("booked_seats").notNullable().defaultTo(0);
  });
}

export async function down(knex) {
  await knex.schema.alterTable("trips", (table) => {
    table.dropColumn("booked_seats");
  });
}

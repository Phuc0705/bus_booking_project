export async function up(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.string("phone", 20).nullable();
    table.string("address", 255).nullable();
    table.string("identity_number", 50).nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("phone");
    table.dropColumn("address");
    table.dropColumn("identity_number");
  });
}

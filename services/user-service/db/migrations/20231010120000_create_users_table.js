export function up(knex) {
  return knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name").notNullable();
    table.string("email").notNullable().unique();
    table.string("password_hash").notNullable();
    table.enum("role", ["ADMIN", "STAFF", "CUSTOMER"]).defaultTo("CUSTOMER");
    table.timestamps(true, true);
  });
}

export function down(knex) {
  return knex.schema.dropTable("users");
}

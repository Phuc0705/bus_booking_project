export async function up(knex) {
  await knex.schema.alterTable('trips', (table) => {
    table.jsonb('pickup_points').defaultTo('[]');
    table.jsonb('dropoff_points').defaultTo('[]');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('trips', (table) => {
    table.dropColumn('pickup_points');
    table.dropColumn('dropoff_points');
  });
}

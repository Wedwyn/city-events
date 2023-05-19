export const up = (knex) => (
    knex.schema.createTable('events', (table) => {
        table.increments('id').primary();
        table.string('name');
        table.timestamp('date');
        table.integer('price');
        table.string('description');
        table.string('organizer');
        table.string('address');
        table.string('imageurl');
        table.integer('number_of_going').defaultTo(0);
    })
  );
  
  export const down = (knex) => knex.schema.dropTable('events');
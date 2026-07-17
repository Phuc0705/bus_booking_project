export function seed(knex) {
  return knex("users").del()
    .then(async function () {
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash("admin123", 10);
      return knex("users").insert([
        {
          id: "33333333-3333-3333-3333-333333333333",
          name: "Admin User",
          email: "admin@bus.com",
          password_hash: passwordHash,
          role: "ADMIN"
        },
        {
          id: "44444444-4444-4444-4444-444444444444",
          name: "Staff User",
          email: "staff@bus.com",
          password_hash: passwordHash,
          role: "STAFF"
        }
      ]);
    });
}

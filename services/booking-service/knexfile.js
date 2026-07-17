import "dotenv/config";

export default {
  client: "pg",
  connection: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "15432", 10),
    user: process.env.DB_USER || "admin",
    password: process.env.DB_PASSWORD || "123456",
    database: process.env.DB_NAME || "booking_db",
  },
  migrations: {
    directory: "./db/migrations",
  },
  seeds: {
    directory: "./db/seeds",
  },
};

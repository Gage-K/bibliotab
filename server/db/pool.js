require("dotenv").config();
const { Pool } = require("pg");

module.exports =
  process.env.NODE_ENV === "prod"
    ? new Pool({
        connectionString: process.env.DB_URL,
        ssl: { rejectUnauthorized: false },
      })
    : new Pool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      });

require("dotenv").config();
const { Pool } = require("pg");

const connectionURL = process.env.DB_URL;
console.log("connection url:");
console.log(connectionURL);

module.exports =
  process.env.NODE_ENV === "prod"
    ? new Pool({ connectionURL, ssl: { rejectUnauthorized: false } })
    : new Pool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      });

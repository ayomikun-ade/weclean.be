// const mysql = require("mysql2");

// require("dotenv").config();

// const db = mysql.createConnection({
//   host: process.env.DATABASE_HOST,
//   user: process.env.DATABASE_USERNAME,
//   password: process.env.DATABASE_PASSWORD,
//   database: process.env.DATABASE_NAME,
// });

// db.connect((err) => {
//   if (err) {
//     console.error(`Error connecting to database, ${err.message}`);
//     return;
//   }
//   console.log("Database connected!");
// });

// module.exports = db;

// Replace mysql2 with pg (PostgreSQL client)
const { Pool } = require("pg");

require("dotenv").config();

// Create a connection pool using the connection string provided by Vercel/Neon
const db = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon's SSL connection
  },
});

// Test the connection
db.connect((err, client, release) => {
  if (err) {
    console.error(`Error connecting to Neon database: ${err.message}`);
    return;
  }
  console.log("Connected to Neon PostgreSQL database!");
  release(); // Release the client back to the pool
});

// Export the pool instead of a single connection
module.exports = db;

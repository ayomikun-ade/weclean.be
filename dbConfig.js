const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "database",
  database: "weclean",
});

db.connect((err) => {
  if (err) {
    console.error(`Error connecting to database, ${err.message}`);
    return;
  }
  console.log("Database connected!");
});

module.exports = db;

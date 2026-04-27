const mysql = require("mysql2");

// create connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "studybuddy",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// export pool
module.exports = pool.promise();

// Logging (added)
console.log("Database pool initialized");

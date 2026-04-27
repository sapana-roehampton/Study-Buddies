const mysql = require("mysql2");

// create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "studybuddy",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// export pool
module.exports = pool.promise();

// Logging
console.log("Database pool initialized");
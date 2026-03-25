// config/db.js

const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Aarav@2710",
  database: "job_portal",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 👇 THIS IS THE IMPORTANT PART
const db = pool.promise();

module.exports = db;
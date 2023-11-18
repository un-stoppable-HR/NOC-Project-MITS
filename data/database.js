const mysql = require("mysql2/promise");

require("dotenv").config();

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  database: "noc",
  user: "root",
  password: process.env.DB_PASSWORD,
});

module.exports = pool;

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  database: "noc",
  user: "root",
  password: "#Password@0101",
});

module.exports = pool;

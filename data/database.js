const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  database: "noc",
  user: "root",
  password: "#Password@0101",
});

module.exports = pool;

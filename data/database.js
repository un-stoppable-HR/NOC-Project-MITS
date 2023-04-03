const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  database: "noc",
  user: "root",
  password: "",
});

module.exports = pool;

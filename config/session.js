const session = require("express-session");
const My_SQL_Store = require("express-mysql-session");

const db = require("../data/database");

require("dotenv").config();

function createSessionStore() {
  const MySQLStore = My_SQL_Store(session);

  const sessionStore = new MySQLStore({}, db.pool);

  // Optionally use onReady() to get a promise that resolves when store is ready.
  sessionStore
    .onReady()
    .then(() => {
      // MySQL session store ready for use.
      console.log("MySQLStore ready");
    })
    .catch((error) => {
      // Something went wrong.
      console.error(error);
    });

  return sessionStore;
}

function createSessionConfig() {
  return {
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: createSessionStore(),
  };
}

module.exports = createSessionConfig;

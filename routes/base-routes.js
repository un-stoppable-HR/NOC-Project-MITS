const express = require("express");

// const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.redirect("/login");
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.get("/forgot-password", function (req, res) {
  res.render("forgot-password");
});

module.exports = router;

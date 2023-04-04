const express = require("express");

// const db = require("../data/database");

const router = express.Router();

router.get("/dashboard-student", function (req, res) {
  res.render("dashboard-student");
});

router.get("/more-details", function (req, res) {
  res.render("more-details");
});

router.get("/student-personal-details", function (req, res) {
  res.render("student-personal-details");
});

router.get("/organization-details", function (req, res) {
  res.render("organization-details");
});

module.exports = router;

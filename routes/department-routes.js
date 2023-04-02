const express = require("express");

// const db = require("../data/database");

const router = express.Router();

router.get("/dashboard-department", function (req, res) {
  res.render("dashboard-department");
});

module.exports = router;

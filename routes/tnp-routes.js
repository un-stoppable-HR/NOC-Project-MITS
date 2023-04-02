const express = require("express");

// const db = require("../data/database");

const router = express.Router();

router.get("/dashboard-tnp", function (req, res) {
  res.render("dashboard-tnp");
});

module.exports = router;

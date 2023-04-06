const express = require("express");

const db = require("../data/database");

const router = express.Router();

router.get("/dashboard-department", function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "department") {
    return res.status(403).render("403");
  }

  res.render("dashboard-department");
});

module.exports = router;

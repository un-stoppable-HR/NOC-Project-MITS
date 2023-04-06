const express = require("express");

const db = require("../data/database");

const router = express.Router();

router.get("/dashboard-student", function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "student") {
    return res.status(403).render("403");
  }

  res.render("dashboard-student");
});

router.get("/more-details", function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "student") {
    return res.status(403).render("403");
  }

  res.render("more-details");
});

router.get("/student-personal-details", function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "student") {
    return res.status(403).render("403");
  }

  res.render("student-personal-details");
});

router.get("/organization-details", function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "student") {
    return res.status(403).render("403");
  }

  res.render("organization-details");
});

module.exports = router;

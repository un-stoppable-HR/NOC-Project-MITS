const path = require("path");

const express = require("express");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/student-personal-details", function (req, res) {
  res.render("student-personal-details");
});

app.get("/organization-details", function (req, res) {
  res.render("organization-details");
});

app.get("/forgot-password", function (req, res) {
  res.render("forgot-password");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.listen(3000);

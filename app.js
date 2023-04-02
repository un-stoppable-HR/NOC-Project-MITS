const path = require("path");

const express = require("express");

const baseRoutes = require("./routes/base-routes");
const studentRoutes = require("./routes/student-routes");
const departmentRoutes = require("./routes/department-routes");
const tnpRoutes = require("./routes/tnp-routes");

const app = express();

// Activate EJS view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Parse incoming request bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files (e.g. CSS files)
app.use(express.static("public"));

app.use(baseRoutes);
app.use(studentRoutes);
app.use(departmentRoutes);
app.use(tnpRoutes);

app.use(function (error, req, res, next) {
  // Default error handling function
  // Will become active whenever any route / middleware crashes
  console.log(error);
  res.status(500).render("500");
});

app.listen(3000);

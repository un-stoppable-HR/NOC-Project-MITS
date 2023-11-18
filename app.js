const path = require("path");

const express = require("express");
const session = require("express-session");

const db = require("./data/database");

const createSessionConfig = require('./config/session');
const baseRoutes = require("./routes/base-routes");
const studentRoutes = require("./routes/student-routes");
const departmentRoutes = require("./routes/department-routes");
const tnpRoutes = require("./routes/tnp-routes");

const app = express();

const port = 3000;

// Activate EJS view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Parse incoming request bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files (e.g. CSS files)
app.use(express.static("public"));

app.use("/offerLetters", express.static("offerLetters"));

const sessionConfig = createSessionConfig();

app.use(session(sessionConfig));

app.use(async function (req, res, next) {
  const user = req.session.user;
  const isAuth = req.session.isAuthenticated;

  if (!user || !isAuth) {
    return next();
  }

  const query1 = `
    SELECT role
    FROM users
    WHERE user_id = ?
  `;

  const [role] = await db.query(query1, [user.id]);

  const query2 = `
    SELECT students.*, users.email
    FROM students
    INNER JOIN users ON students.user_id = users.user_id
    WHERE students.user_id = ?
  `;

  const [students] = await db.query(query2, [user.id]);

  if (!students[0]) {
    res.locals.isRegisteredStudent = false;
  } else {
    res.locals.isRegisteredStudent = true;
    res.locals.studentEnrollmentNo = students[0].enrollment_no;
  }

  res.locals.isAuth = isAuth;
  res.locals.role = role[0].role;

  next();
});

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

app.listen(port, () => {
  console.log(`app listing on port http://localhost:${port}`);
});

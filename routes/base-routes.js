const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  if (!res.locals.isAuth) {
    return res.redirect("/login");
  }

  if (res.locals.role === "student") {
    return res.redirect("/dashboard-student");
  }

  if (res.locals.role === "department") {
    return res.redirect("/dashboard-department");
  }

  if (res.locals.role === "tnp") {
    return res.redirect("/dashboard-tnp");
  }
});

router.get("/login", function (req, res) {
  let sessionInputData = req.session.inputData;

  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: "",
      password: "",
    };
  }

  req.session.inputData = null;

  res.render("login", { inputData: sessionInputData });
});

router.get("/signup", function (req, res) {
  let sessionInputData = req.session.inputData;

  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: "",
      confirmEmail: "",
      password: "",
    };
  }

  req.session.inputData = null;

  res.render("signup", { inputData: sessionInputData });
});

router.get("/forgot-password", function (req, res) {
  res.render("forgot-password");
});

router.get("/more-details", function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  res.render("more-details");
});

router.post("/signup", async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredConfirmEmail = userData.confirmEmail;
  const enteredPassword = userData.password;

  let outsideInstitute = true;

  if (
    enteredEmail.includes("@mitsgwl.ac.in") ||
    enteredEmail.includes("@mitsgwalior.in")
  ) {
    outsideInstitute = false;
  }

  if (
    !enteredEmail ||
    !enteredConfirmEmail ||
    !enteredPassword ||
    enteredPassword.trim().length < 6 ||
    enteredEmail !== enteredConfirmEmail ||
    outsideInstitute
  ) {
    req.session.inputData = {
      hasError: true,
      message: "Invalid Input - Please check your data!",
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword,
    };

    req.session.save(function () {
      res.redirect("/signup");
    });

    return;
  }

  const query1 = `
    SELECT * 
    FROM users
    WHERE email = ?
  `;

  const [existingUser] = await db.query(query1, [enteredEmail]);

  if (existingUser[0]) {
    req.session.inputData = {
      hasError: true,
      message: "User already exists!",
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword,
    };

    req.session.save(function () {
      res.redirect("/signup");
    });

    return;
  }

  const hashedPassword = await bcrypt.hash(enteredPassword, 12);

  let role;

  if (enteredEmail.includes("@mitsgwl.ac.in")) {
    role = "student";
  } else if (enteredEmail.includes("@mitsgwalior.in")) {
    role = "department";
  }

  const user = [enteredEmail, hashedPassword, role];

  const query2 = `
    INSERT INTO users (email, password, role) 
    VALUES (?)
  `;

  await db.query(query2, [user]);

  res.redirect("/login");
});

router.post("/login", async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredPassword = userData.password;

  const query1 = `
    SELECT * 
    FROM users
    WHERE email = ?
  `;

  const [existingUser] = await db.query(query1, [enteredEmail]);

  if (!existingUser[0]) {
    req.session.inputData = {
      hasError: true,
      message: "Could not log in - Please check your credentials!",
      email: enteredEmail,
      password: enteredPassword,
    };

    req.session.save(function () {
      res.redirect("/login");
    });

    return;
  }

  const passwordsAreEqual = await bcrypt.compare(
    enteredPassword,
    existingUser[0].password
  );

  if (!passwordsAreEqual) {
    req.session.inputData = {
      hasError: true,
      message: "Could not log in - Please check your credentials!",
      email: enteredEmail,
      password: enteredPassword,
    };

    req.session.save(function () {
      res.redirect("/login");
    });

    return;
  }

  req.session.user = {
    id: existingUser[0].user_id,
    email: existingUser[0].email,
  };
  req.session.isAuthenticated = true;

  req.session.save(function () {
    res.redirect("/");
  });
});

router.post("/logout", function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false;
  req.session.save(function () {
    res.redirect("/");
  });
});

module.exports = router;

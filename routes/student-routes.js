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

  if (!res.locals.isRegisteredStudent) {
    return res.redirect("/student-personal-details");
  }

  res.render("dashboard-student");
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

  if (!res.locals.isRegisteredStudent) {
    return res.redirect("/student-personal-details");
  }

  res.render("organization-details");
});

router.post("/student-personal-details", async function (req, res) {
  const data = [
    req.body.studentEnrollmentNo,
    req.session.user.id,
    req.body.studentName,
    req.body.studentMobile,
    req.body.studentFatherName,
    req.body.branch,
    req.body.department,
    req.body.semester,
    req.body.studentCurrentAddress,
    req.body.studentCity,
    req.body.studentState,
    req.body.studentPincode,
  ];

  await db.query(
    "INSERT INTO `noc`.`students` (`enrollment_no`, `user_id`, `name`, `mobile_no`, `father_name`, `branch_id`, `department_id`, `semester`, `current_address`, `city`, `state`, `pin_code`) VALUES (?)",
    [data]
  );

  res.redirect("/");
});

module.exports = router;

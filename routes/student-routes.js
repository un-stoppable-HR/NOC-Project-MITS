const express = require("express");
const multer = require("multer");

const db = require("../data/database");

const storageConfig = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "offerLetters");
  },
  filename: async function (req, file, cb) {
    const user = req.session.user;

    const query1 = `
    SELECT students.enrollment_no
    FROM students
    INNER JOIN users ON students.user_id = users.user_id
    WHERE students.user_id = ?
  `;

    const [students] = await db.query(query1, [user.id]);

    const studentEnrollmentNo = students[0].enrollment_no;

    cb(null, studentEnrollmentNo + "-" + Date.now() + ".pdf");
  },
});

const upload = multer({
  storage: storageConfig,
});

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

router.post(
  "/organization-details",
  upload.single("internship-offer-letter"),
  async function (req, res) {
    const uploadedOfferLetter = req.file;
    const userData = req.body;

    const data1 = [
      userData.orgName,
      userData.orgLocation,
      userData.orgPersonReceivingNOC,
      userData.orgDesignationPersonReceivingNOC,
      userData.orgAddress,
      userData.orgWebsite,
    ];

    const query1 = `
    INSERT INTO noc.organizations (name, location, person_receiving_noc_name, person_receiving_noc_designation, address, website) 
    VALUES (?);
    `;

    const [organizations] = await db.query(query1, [data1]);

    const orgID = organizations.insertId;

    const data2 = [
      res.locals.studentEnrollmentNo,
      orgID,
      userData.internshipDays,
      userData.internshipStartingDate,
      userData.internshipEndDate,
      userData.applyingThrough,
      uploadedOfferLetter.path,
    ];

    const query2 = `
    INSERT INTO noc.noc_applications (enrollment_no, org_id, internship_days, internship_start_date, internship_end_date, applying_through, offer_letter) 
    VALUES (?);
    `;

    const [nocs] = await db.query(query2, [data2]);
    
    const nocID = nocs.insertId;
    
    const query3 = `
    SELECT department_id
    FROM students
    WHERE user_id = ?;
    `;

    const [departmentID] = await db.query(query3, req.session.user.id);
    
    const query4 = `
    SELECT coordinator_id
    FROM department_coordinator
    WHERE department_id = ?;
    `;

    const [coordinatorID] = await db.query(query4, departmentID[0].department_id);
    
    const data5 = [
      coordinatorID[0].coordinator_id,
      nocID
    ];

    const query5 = `
    INSERT INTO department_approval (coordinator_id, noc_id) 
    VALUES (?);
    `;

    await db.query(query5, [data5]);

    const query6 = `
    SELECT tpo_id
    FROM tpo;
    `;

    const [tpoID] = await db.query(query6);
    
    const data7 = [
      tpoID[0].tpo_id,
      nocID
    ];

    const query7 = `
    INSERT INTO tpo_approval (tpo_id, noc_id) 
    VALUES (?);
    `;

    await db.query(query7, [data7]);

    res.redirect("/");
  }
);

module.exports = router;

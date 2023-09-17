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

router.get("/dashboard-student", async function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "student") {
    return res.status(403).render("403");
  }
  
  if (!res.locals.isRegisteredStudent) {
    return res.redirect("/student-personal-details");
  }
  
  const query1 = `
  SELECT 
    students.name AS student_name,
    students.branch_id,
    students.department_id,
    students.enrollment_no
  FROM
    students
  WHERE
    user_id = ?;
  `;

  const [studentDetails] = await db.query(query1, req.session.user.id);

  const query2 = `
  SELECT 
    noc_applications.noc_id,
    noc_applications.internship_days,
    noc_applications.internship_start_date,
    noc_applications.internship_end_date,
    organizations.name AS organization_name,
    organizations.location AS organization_location,
    department_approval.approval_status AS department_status,
    tpo_approval.approval_status AS tpo_status
  FROM 
    noc_applications
    INNER JOIN organizations 
      ON noc_applications.org_id = organizations.org_id
    INNER JOIN department_approval
      ON noc_applications.noc_id = department_approval.noc_id
    INNER JOIN tpo_approval
      ON noc_applications.noc_id = tpo_approval.noc_id
    WHERE
      noc_applications.enrollment_no = ?;
  `;

  const [nocDetails] = await db.query(query2, studentDetails[0].enrollment_no);

  const branchID = studentDetails[0].branch_id;
  const departmentID = studentDetails[0].department_id;

  const query3 = `
  SELECT branch_name FROM branches WHERE branch_id = ?;
  `;

  const [branchName] = await db.query(query3, branchID);

  const query4 = `
  SELECT department_name FROM departments WHERE department_id = ?;
  `;

  const [departmentName] = await db.query(query4, departmentID);

  const nocs = [
    ...nocDetails,
  ];

  const studentInfo = {
    ...studentDetails[0],
    ...branchName[0],
    ...departmentName[0],
  };

  res.render("dashboard-student", { nocs: nocs, studentInfo: studentInfo });
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
      userData.stipend,
    ];

    const query2 = `
    INSERT INTO noc.noc_applications (enrollment_no, org_id, internship_days, internship_start_date, internship_end_date, applying_through, offer_letter, stipend) 
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

    const [coordinatorID] = await db.query(
      query4,
      departmentID[0].department_id
    );

    const data5 = [coordinatorID[0].coordinator_id, nocID];

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

    const data7 = [tpoID[0].tpo_id, nocID];

    const query7 = `
    INSERT INTO tpo_approval (tpo_id, noc_id) 
    VALUES (?);
    `;

    await db.query(query7, [data7]);

    res.redirect("/");
  }
);

router.post("/dashboard-student/:nocID", async function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "student") {
    return res.status(403).render("403");
  }

  const nocID = req.params.nocID;

  const query1 = `
  SELECT 
    noc_applications.noc_id,
    noc_applications.enrollment_no,
    noc_applications.internship_days,
    noc_applications.internship_start_date,
    noc_applications.internship_end_date,
    noc_applications.applying_through,
    noc_applications.date,
    noc_applications.stipend,
    students.user_id,
    students.name AS student_name,
    students.mobile_no AS student_mobile_no,
    students.father_name,
    students.semester,
    students.current_address AS student_current_address,
    students.city AS student_city,
    students.state AS student_state,
    students.pin_code AS student_pin_code,
    students.branch_id,
    students.department_id,
    organizations.name AS organization_name,
    organizations.location AS organization_location,
    organizations.person_receiving_noc_name,
    organizations.person_receiving_noc_designation,
    organizations.address AS organization_address,
    organizations.website AS organization_website,
    department_approval.approval_status AS department_status,
    tpo_approval.approval_status AS tpo_status
  FROM 
    noc_applications
    INNER JOIN organizations 
      ON noc_applications.org_id = organizations.org_id
    INNER JOIN department_approval
      ON noc_applications.noc_id = department_approval.noc_id
    INNER JOIN tpo_approval
      ON noc_applications.noc_id = tpo_approval.noc_id
    INNER JOIN students
      ON noc_applications.enrollment_no = students.enrollment_no
  WHERE noc_applications.noc_id = ?;
  `;

  const [nocDetails] = await db.query(query1, nocID);

  const branchID = nocDetails[0].branch_id;
  const departmentID = nocDetails[0].department_id;
  const userID = nocDetails[0].user_id;

  const query2 = `
  SELECT branch_name FROM branches WHERE branch_id = ?;
  `;

  const [branchName] = await db.query(query2, branchID);

  const query3 = `
  SELECT department_name FROM departments WHERE department_id = ?;
  `;

  const [departmentName] = await db.query(query3, departmentID);

  const query4 = `
  SELECT email FROM users WHERE user_id = ?;
  `;

  const [studentEmail] = await db.query(query4, userID);

  req.session.moreDetails = {
    ...nocDetails[0],
    ...branchName[0],
    ...departmentName[0],
    ...studentEmail[0],
  };

  req.session.save(function () {
    res.redirect("/more-details");
  });
});

module.exports = router;

const express = require("express");

const db = require("../data/database");

const router = express.Router();

router.get("/dashboard-tnp", async function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "tnp") {
    return res.status(403).render("403");
  }

  let updateStatus = req.session.updateStatus;

  if (!updateStatus) {
    updateStatus = {
      hasMessage: false,
    };
  }

  req.session.updateStatus = null;

  const query1 = `
  SELECT 
    noc_applications.noc_id,
    noc_applications.enrollment_no,
    students.name AS student_name,
    organizations.name AS organization_name,
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
      ON noc_applications.enrollment_no = students.enrollment_no;
  `;

  const [nocs] = await db.query(query1);

  const query2 = `
  SELECT
    COUNT(CASE WHEN tpo_approval.approval_status = 'pending' THEN 1 END) AS count_pending,
    COUNT(CASE WHEN tpo_approval.approval_status = 'rejected' THEN 1 END) AS count_rejected,
    COUNT(CASE WHEN tpo_approval.approval_status = 'approved' THEN 1 END) AS count_approved
  FROM
    noc_applications
    INNER JOIN tpo_approval ON noc_applications.noc_id = tpo_approval.noc_id;
  `;

  const [statusStats] = await db.query(query2);

  res.render("dashboard-tnp", { nocs: nocs, statusStats: statusStats[0], updateStatus: updateStatus });
});

router.post("/dashboard-tnp/:nocID", async function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "tnp") {
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
    tpo_approval.approval_status AS tpo_status,
    department_approval.query AS department_query,
    tpo_approval.query AS tpo_query
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

router.get("/admin-panel-tnp", async function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "tnp") {
    return res.status(403).render("403");
  }

  const query1 = `
  SELECT 
    users.user_id, 
    users.email, 
    COALESCE(department_coordinator.department_id, NULL) AS department_id
  FROM users
  LEFT JOIN department_coordinator
  ON users.user_id = department_coordinator.user_id
  WHERE users.role = "department";
  `;

  const [potentialCoordinators] = await db.query(query1);

  res.render("admin-panel-tnp", {
    potentialCoordinators: potentialCoordinators,
  });
});

router.post("/admin-panel-tnp/:userID", async function (req, res) {
  const userID = req.params.userID;
  const departmentID = req.body.department;

  const query1 = `
  SELECT *
  FROM department_coordinator
  WHERE user_id = ?
  `;

  const [existingCoordinator] = await db.query(query1, userID);

  if (!existingCoordinator[0]) {
    const coordinatorData1 = [userID, departmentID];

    const query2 = `
    INSERT INTO department_coordinator (user_id, department_id) VALUES (?)
    `;

    await db.query(query2, [coordinatorData1]);
  } else {
    const query3 = `
    UPDATE department_coordinator SET department_id = ? 
    WHERE user_id = ?
    `;

    await db.query(query3, [departmentID, userID]);
  }

  res.redirect("/admin-panel-tnp");
});

router.post("/tnp/update-noc-status/:nocID", async function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "tnp") {
    return res.status(403).render("403");
  }

  const nocID = req.params.nocID;
  const updateData = req.body;

  const query1Data = [updateData.status, updateData.query, nocID];

  const query1 = `
  UPDATE 
    tpo_approval 
  SET 
    approval_status = ?, 
    query = ?
  WHERE 
    noc_id = ?;
  `;

  await db.query(query1, query1Data);

  req.session.updateStatus = {
    hasMessage: true,
    message: "Status Updated Successfully!",
  };

  req.session.save(function () {
    res.redirect("/");
  });
});

module.exports = router;

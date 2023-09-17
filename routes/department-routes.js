const express = require("express");

const db = require("../data/database");

const router = express.Router();

router.get("/dashboard-department", async function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "department") {
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
  SELECT department_id
  FROM department_coordinator 
  WHERE user_id = ?;
  `;

  const [deptId] = await db.query(query1, req.session.user.id);

  const departmentID = deptId[0].department_id;

  const query2 = `
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
      ON noc_applications.enrollment_no = students.enrollment_no
  WHERE 
  students.department_id = ?;
  `;

  const [nocs] = await db.query(query2, departmentID);

  const query3 = `
  SELECT
    COUNT(CASE WHEN department_approval.approval_status = 'pending' THEN 1 END) AS count_pending,
    COUNT(CASE WHEN department_approval.approval_status = 'rejected' THEN 1 END) AS count_rejected,
    COUNT(CASE WHEN department_approval.approval_status = 'approved' THEN 1 END) AS count_approved
  FROM
    noc_applications
    INNER JOIN department_approval 
      ON noc_applications.noc_id = department_approval.noc_id
    INNER JOIN students
      ON noc_applications.enrollment_no = students.enrollment_no
  WHERE 
    students.department_id = ?;
  `;

  const [statusStats] = await db.query(query3, departmentID);

  res.render("dashboard-department", { nocs: nocs, statusStats: statusStats[0], updateStatus: updateStatus });
});

router.post("/dashboard-department/:nocID", async function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "department") {
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

router.post("/department/update-noc-status/:nocID", async function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "department") {
    return res.status(403).render("403");
  }

  const nocID = req.params.nocID;
  const updateData = req.body;

  const query1Data = [updateData.status, updateData.query, nocID];

  const query1 = `
  UPDATE 
    department_approval 
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

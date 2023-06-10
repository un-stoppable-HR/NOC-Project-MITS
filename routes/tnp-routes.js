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

  res.render("dashboard-tnp", {nocs: nocs, statusStats: statusStats[0]});
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

router.post("/admin-panel-tnp/:userID", async function(req, res) {
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
  }
  
  else {
    const query3 = `
    UPDATE department_coordinator SET department_id = ? 
    WHERE user_id = ?
    `;

    await db.query(query3, [departmentID, userID]);
  }

  res.redirect("/admin-panel-tnp");
});

module.exports = router;

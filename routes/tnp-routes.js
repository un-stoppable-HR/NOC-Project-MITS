const express = require("express");

const db = require("../data/database");

const router = express.Router();

router.get("/dashboard-tnp", function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }

  if (res.locals.role !== "tnp") {
    return res.status(403).render("403");
  }

  res.render("dashboard-tnp");
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

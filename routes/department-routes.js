const express = require("express");

const departmentController = require("../controllers/department-controller");

const router = express.Router();

router.get(
  "/dashboard-department",
  departmentController.getDepartmentDashboard
);

router.post(
  "/dashboard-department/:nocID",
  departmentController.NOCmoreDetails
);

router.post(
  "/department/update-noc-status/:nocID",
  departmentController.updateNOCStatus
);

module.exports = router;

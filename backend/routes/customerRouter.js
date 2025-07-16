const express = require("express");
const router = express.Router();
const {
  createNewCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  exportCustomersToExcel,
  //   restoreCustomer,
} = require("../controllers/customer");

const { protect, isRole } = require("../middlewares/authMiddleware");
const upload = require('../middlewares/uploadMiddleware');

router.post("/addNewCustomer", protect, upload.single('certificateScan'), createNewCustomer);

router.get("/", protect, isRole("مدير"), getCustomers);
router.patch("/:id", protect, isRole("مدير"), upload.single('certificateScan'), updateCustomer);
router.delete("/:id", protect, isRole("مدير"), deleteCustomer);
router.get("/export", protect, exportCustomersToExcel);
router.patch("/:id/revoke", protect, isRole("مدير"), require("../controllers/customer").revokeCustomer);
router.patch("/:id/renew", protect, isRole("مدير"), require("../controllers/customer").renewCustomer);

// router.patch("/restore/:id", protect, restoreCustomer);

module.exports = router;

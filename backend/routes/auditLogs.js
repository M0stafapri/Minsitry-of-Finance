const express = require("express");
const router = express.Router();
const { getAuditLogs } = require("../controllers/auditLog");
const { protect, isRole } = require("../middlewares/authMiddleware");

router.get("/", protect, isRole("مدير"), getAuditLogs);

module.exports = router;

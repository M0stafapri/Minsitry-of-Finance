const express = require("express");
const router = express.Router();
const { createCarType, getAllCarTypes, deleteCarType } = require("../controllers/carType");
const { protect, isRole } = require("../middlewares/authMiddleware");
// POST /api/cartypes → إنشاء نوع سيارة
router.post("/", protect, isRole("مدير"), createCarType);
router.post("/add", createCarType);

// GET /api/cartypes → جلب كل الأنواع
router.get("/", protect, isRole("مدير"), getAllCarTypes);

// Add DELETE endpoint
router.delete("/:id", protect, isRole("مدير"), deleteCarType);

module.exports = router;

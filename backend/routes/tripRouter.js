const express = require("express");
const router = express.Router();
const {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
} = require("../controllers/trip");
const { protect, isRole } = require("../middlewares/authMiddleware");

router.use(protect);

// Get all trips (accessible to all authenticated users)
router.get("/", getAllTrips);

// Get trip by ID (accessible to all authenticated users)
router.get("/:id", getTripById);

// Create, update, delete trips (manager only)
router.post("/", isRole("مدير"), createTrip);
router.patch("/:id", isRole("مدير"), updateTrip);
router.delete("/:id", isRole("مدير"), deleteTrip);

module.exports = router; 
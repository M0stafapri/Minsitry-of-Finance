const Trip = require("../models/Trip");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

/**
 * Get all trips
 * @route GET /api/v1/trips
 * @access Private
 */
const getAllTrips = catchAsync(async (req, res) => {
  const trips = await Trip.find()
    .populate('supplier', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    data: {
      trips,
    },
  });
});

/**
 * Get trip by ID
 * @route GET /api/v1/trips/:id
 * @access Private
 */
const getTripById = catchAsync(async (req, res) => {
  const trip = await Trip.findById(req.params.id).populate('supplier', 'name');

  if (!trip) {
    throw new ApiError(404, "الرحلة غير موجودة");
  }

  res.status(200).json({
    status: "success",
    data: {
      trip,
    },
  });
});

/**
 * Create new trip
 * @route POST /api/v1/trips
 * @access Private
 */
const createTrip = catchAsync(async (req, res) => {
  const trip = await Trip.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      trip,
    },
  });
});

/**
 * Update trip
 * @route PATCH /api/v1/trips/:id
 * @access Private
 */
const updateTrip = catchAsync(async (req, res) => {
  const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('supplier', 'name');

  if (!trip) {
    throw new ApiError(404, "الرحلة غير موجودة");
  }

  res.status(200).json({
    status: "success",
    data: {
      trip,
    },
  });
});

/**
 * Delete trip
 * @route DELETE /api/v1/trips/:id
 * @access Private
 */
const deleteTrip = catchAsync(async (req, res) => {
  const trip = await Trip.findByIdAndDelete(req.params.id);

  if (!trip) {
    throw new ApiError(404, "الرحلة غير موجودة");
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

module.exports = {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
}; 
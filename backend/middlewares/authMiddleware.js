const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Employee = require("../models/Employee");
const BlacklistedToken = require("../models/functions/BlacklistedToken");

// Utility: Extract token from Authorization header
const extractToken = (req) => {
  if (req.headers.authorization?.startsWith("Bearer")) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

// Middleware: Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next(new ApiError("No token provided", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
      return next(new ApiError("Token is invalid or has been logged out", 401));
    }

    const user = await Employee.findById(decoded.id).select("-password");
    if (!user) {
      return next(new ApiError("Employee not found", 401));
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return next(
        new ApiError("Password changed recently. Please log in again.", 401)
      );
    }

    if (user.role === "banned") {
      return next(new ApiError("Your account has been banned", 403));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ApiError("Token has expired", 401));
    } else if (error.name === "JsonWebTokenError") {
      return next(new ApiError("Invalid token", 401));
    }
    return next(new ApiError("Authentication failed", 401));
  }
});

// Middleware: Role-based access
exports.isRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError("You are not authorized to access this resource", 403)
      );
    }
    next();
  };
};

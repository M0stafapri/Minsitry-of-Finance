module.exports = (err, req, res, next) => {
  // Log error for debugging
  console.error("ERROR STACK: ", err.stack);
  console.error("ERROR MESSAGE: ", err.message);

  // Ensure statusCode is an integer, default to 500 if invalid
  const statusCode = Number.isInteger(parseInt(err.statusCode, 10))
    ? parseInt(err.statusCode, 10)
    : 500;
  const status = err.status || "error";
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Something went very wrong!"
      : err.message;

  res.status(statusCode).json({
    status,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

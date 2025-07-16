module.exports = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.status = "fail";
  next(error); // Pass the error to the global error handler
};

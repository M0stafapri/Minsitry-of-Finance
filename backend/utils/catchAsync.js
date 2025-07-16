/**
 * Wraps async controller functions to catch errors and pass them to error handling middleware
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync; 
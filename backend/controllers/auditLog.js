const AuditLog = require("../models/AuditLog");
const asyncHandler = require("express-async-handler");

exports.getAuditLogs = asyncHandler(async (req, res) => {
  const { actor, action, from, to, page = 1, limit = 10, target, targetModel } = req.query;
  const logsData = await AuditLog.filterLogs(
    { actor, action, from, to, target, targetModel },
    Number(page),
    Number(limit)
  );

  res.status(200).json({
    status: "success",
    ...logsData,
  });
});

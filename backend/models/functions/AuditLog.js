// models/AuditLog.js
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  metadata: {
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
    additionalInfo: Object,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);

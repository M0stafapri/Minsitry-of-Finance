// models/AuditLog.js
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false, // Changed from true to false to handle failed login attempts
    },
    action: {
      type: String,
      enum: [
        "LOGIN",
        "LOGIN_FAILED",
        "CHANGE_PASSWORD",

        "CREATE_EMPLOYEE",
        "UPDATE_EMPLOYEE",
        "DELETE_EMPLOYEE",

        "CREATE_CUSTOMER",
        "UPDATE_CUSTOMER",
        "DELETE_CUSTOMER",
        "RESTORE_CUSTOMER",
        "RENEW_CUSTOMER",
        "REVOKE_CUSTOMER",

        "CREATE_SUPPLIER",
        "UPDATE_SUPPLIER",
        "DELETE_SUPPLIER",

        "VIEW_CONFIG",
        "UPDATE_CONFIG",
      ],
      required: true,
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetModel',
      required: false,
    },
    targetModel: {
      type: String,
      required: false,
      enum: ['Employee', 'Customer'],
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ actor: 1, action: 1, timestamp: -1 });

auditLogSchema.statics.filterLogs = async function (
  filters = {},
  page = 1,
  limit = 10
) {
  const query = {};
  if (filters.actor) query.actor = filters.actor;
  if (filters.action) query.action = filters.action;
  if (filters.from || filters.to) {
    query.timestamp = {};
    if (filters.from) query.timestamp.$gte = new Date(filters.from);
    if (filters.to) query.timestamp.$lte = new Date(filters.to);
  }
  if (filters.target) query.target = filters.target;
  if (filters.targetModel) query.targetModel = filters.targetModel;

  const total = await this.countDocuments(query);
  const logs = await this.find(query)
    .populate("actor", "name role")
    .populate("target", "name role")
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    total,
    page,
    pages: Math.ceil(total / limit),
    results: logs.length,
    logs,
  };
};

module.exports = mongoose.model("AuditLog", auditLogSchema);

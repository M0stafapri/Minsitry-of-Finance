const jwt = require("jsonwebtoken");

exports.generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

exports.getPermissionsForRole = (role) => {
  const allPermissions = {
    مدير: [
      { resource: "dashboard", action: "view" },
      { resource: "employees", action: "view" },
      { resource: "employees", action: "create" },
      { resource: "employees", action: "update" },
      { resource: "trips", action: "view" },
      { resource: "suppliers", action: "view" },
      { resource: "customers", action: "view" },
      { resource: "salaries", action: "view" },
      { resource: "commissions", action: "view" },
      { resource: "reports", action: "view" },
      { resource: "settings", action: "view" },
    ],
    موظف: [
      { resource: "dashboard", action: "view" },
      { resource: "trips", action: "view" },
      { resource: "customers", action: "view" },
    ],
  };

  return allPermissions[role] || [];
};

// controller/employee.js
const Employee = require("../models/Employee");
const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");
const { ROLES } = require("../utils/constants");
const { generateToken, getPermissionsForRole } = require("../utils/authUtils");
const AuditLog = require("../models/AuditLog");
const bcrypt = require("bcrypt");

exports.registerNewEmployee = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "fail",
      message: "فشل التحقق من صحة البيانات",
      errors: errors.array(),
    });
  }

  if (req.user.role !== ROLES.MANAGER) {
    return next(new ApiError("غير مصرح، يتطلب صلاحيات المدير", 403));
  }

  const { username } = req.body;
  const idDocument = req.files?.idDocument?.[0]?.filename;
  const cv = req.files?.cv?.[0]?.filename;

  if (await Employee.exists({ username })) {
    return next(new ApiError("اسم المستخدم موجود بالفعل", 409));
  }

  req.body.idDocument = idDocument;
  req.body.cv = cv;

  const employee = await Employee.create(req.body);

  await AuditLog.create({
    actor: req.user.id,
    action: "CREATE_EMPLOYEE",
    target: employee._id,
  });

  res.status(201).json({
    status: "success",
    message: "تم إنشاء مستخدم بنجاح",
    data: {
      employee: {
        _id: employee._id,
        name: employee.name,
        personalPhone: employee.personalPhone,
        username: employee.username,
        terminationDate: employee.terminationDate,
        executedTrips: employee.executedTrips,
        status: employee.status,
      },
    },
  });
});

// Login
exports.login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;
  const ip =
    req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"];

  if (!username || !password) {
    return next(new ApiError("بيانات تسجيل الدخول غير صحيحة", 400));
  }

  const employee = await Employee.findOne({ username }).select("+password");

  // إذا كان الموظف موجود نتحقق من محاولات الدخول
  if (employee) {
    const now = new Date();
    const MAX_ATTEMPTS = 5;
    const BLOCK_DURATION = 15 * 60 * 1000; // 15 دقيقة

    if (
      employee.loginAttempts >= MAX_ATTEMPTS &&
      now - employee.lastLoginAttempt < BLOCK_DURATION
    ) {
      return next(
        new ApiError("تم حظر الحساب مؤقتًا بسبب محاولات فاشلة متكررة", 429)
      );
    }
  }

  if (!employee || !(await employee.comparePassword(password))) {
    // إذا كان الموظف موجود، نزود العداد
    if (employee) {
      employee.loginAttempts = (employee.loginAttempts || 0) + 1;
      employee.lastLoginAttempt = new Date();
      await employee.save();
    }

    // Audit Log
    await AuditLog.create({
      action: "LOGIN_FAILED",
      actor: employee ? employee._id : null,
      target: employee ? employee._id : null,
      details: {
        username,
        ip,
        userAgent,
      },
    });

    return next(new ApiError("بيانات تسجيل الدخول غير صحيحة", 401));
  }

  // إعادة تعيين العداد عند نجاح الدخول
  employee.loginAttempts = 0;
  employee.lastLoginAttempt = null;
  employee.lastLogin = new Date();
  await employee.save();

  // Audit Log
  await AuditLog.create({
    action: "LOGIN",
    actor: employee._id,
    target: employee._id,
    details: {
      username: employee.username,
      ip,
      userAgent,
    },
  });

  const token = generateToken(employee._id, employee.role);
  const permissions = getPermissionsForRole(employee.role);

  res.status(200).json({
    status: "success",
    message: "تم تسجيل الدخول بنجاح",
    data: {
      token,
      employee: {
        _id: employee._id,
        name: employee.name,
        username: employee.username,
        role: employee.role,
        permissions,
      },
    },
  });
});

// Get all employees
// Get all employees (Advanced Search & Filters)
// Get all employees (Advanced Search & Filters)
exports.getAllEmployees = asyncHandler(async (req, res, next) => {
  if (req.user.role !== ROLES.MANAGER) {
    return next(new ApiError("غير مصرح لهذا الدور", 403));
  }

  const {
    page = 1,
    limit = 10,
    sort = "-employmentDate",
    search,
    name,
    username,
    personalPhone,
    status,
    role,
    employmentDateFrom,
    employmentDateTo,
    terminationDateFrom,
    terminationDateTo,
    executedTripsCount,
    id,
  } = req.query;

  const query = {};

  if (id) query._id = id;

  if (name) query.name = { $regex: name, $options: "i" };
  if (username) query.username = { $regex: username, $options: "i" };
  if (personalPhone)
    query.personalPhone = { $regex: personalPhone, $options: "i" };
  if (status) query.status = status;
  if (role) query.role = role;

  if (employmentDateFrom || employmentDateTo) {
    query.employmentDate = {};
    if (employmentDateFrom)
      query.employmentDate.$gte = new Date(employmentDateFrom);
    if (employmentDateTo)
      query.employmentDate.$lte = new Date(employmentDateTo);
  }

  if (terminationDateFrom || terminationDateTo) {
    query.terminationDate = {};
    if (terminationDateFrom)
      query.terminationDate.$gte = new Date(terminationDateFrom);
    if (terminationDateTo)
      query.terminationDate.$lte = new Date(terminationDateTo);
  }

  if (executedTripsCount) {
    query.executedTrips = { $size: parseInt(executedTripsCount) };
  }

  // Fallback search across multiple fields
  if (search && search.trim()) {
    const regex = new RegExp(search, "i");
    query.$or = [
      { name: regex },
      { username: regex },
      { personalPhone: regex },
      { role: regex },
    ];
  }

  const skip = (page - 1) * limit;

  const employees = await Employee.find(query)
    .select("-password")
    .sort(sort)
    .skip(Number(skip))
    .limit(Number(limit))
    .populate("linkedEmployee", "name");

  const total = await Employee.countDocuments(query);

  res.status(200).json({
    status: "success",
    total,
    results: employees.length,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: { employees },
  });
});

// Get single employee
exports.getEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (req.user.role !== ROLES.MANAGER && req.user.id !== id) {
    return next(new ApiError("غير مصرح لعرض هذه البيانات", 403));
  }

  const employee = await Employee.findById(id)
    .select("-password")
    .populate("linkedEmployee", "name");

  if (!employee) {
    return next(new ApiError("مستخدم غير موجود", 404));
  }

  res.status(200).json({ status: "success", data: { employee } });
});

// Update employee
exports.updateEmployee = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (req.user.role !== ROLES.MANAGER) {
    return next(new ApiError("غير مصرح لك بتحديث بيانات مستخدم", 403));
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ApiError("فشل التحقق من صحة البيانات", 400, errors.array())
    );
  }

  const allowedFields = [
    "name",
    "personalPhone",
    "username",
    "password",
    "role",
    "linkedEmployee",
    "status",
    "employmentDate",
    "terminationDate",
    "idDocument",
    "cv",
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (req.files?.idDocument?.[0]) {
    updates.idDocument = req.files.idDocument[0].filename;
  }
  if (req.files?.cv?.[0]) {
    updates.cv = req.files.cv[0].filename;
  }

  if (Object.keys(updates).length === 0) {
    return next(new ApiError("لا توجد بيانات صالحة للتحديث", 400));
  }

  // Find the employee first
  const employee = await Employee.findById(id);
  if (!employee) {
    return next(new ApiError("مستخدم غير موجود", 404));
  }

  // Update the employee fields
  Object.keys(updates).forEach(key => {
    employee[key] = updates[key];
  });

  // Save the employee to trigger pre-save hooks (including password hashing)
  await employee.save();

  // Fetch the updated employee without password for response
  const updatedEmployee = await Employee.findById(id).select("-password");

  await AuditLog.create({
    actor: req.user.id,
    action: "UPDATE_EMPLOYEE",
    target: id,
    changes: updates,
  });

  res.status(200).json({ status: "success", data: { employee: updatedEmployee } });
});

// Delete employee
exports.deleteEmployee = asyncHandler(async (req, res, next) => {
  if (req.user.role !== ROLES.MANAGER) {
    return next(new ApiError("غير مصرح، يتطلب صلاحيات المدير", 403));
  }

  if (req.user.id === req.params.id) {
    return next(new ApiError("لا يمكن حذف حسابك الشخصي", 400));
  }

  const employee = await Employee.findByIdAndDelete(req.params.id);
  if (!employee) {
    return next(new ApiError("مستخدم غير موجود", 404));
  }

  await AuditLog.create({
    actor: req.user.id,
    action: "DELETE_EMPLOYEE",
    target: req.params.id,
  });

  res.status(204).json({
    status: "success",
    message: "تم حذف مستخدم بنجاح",
    data: null,
  });
});

// Get available roles & positions
exports.getConfig = asyncHandler(async (req, res, next) => {
  if (req.user.role !== ROLES.MANAGER) {
    return next(new ApiError("غير مصرح، يتطلب صلاحيات مسؤول", 403));
  }
  await AuditLog.create({
    actor: req.user.id,
    action: "VIEW_CONFIG",
  });

  res.status(200).json({
    status: "success",
    data: {
      roles: await Employee.getAvailableRoles(),
    },
  });
});

// Update password
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(new ApiError("يرجى إدخال كلمة المرور الحالية والجديدة", 400));
  }

  const employee = await Employee.findById(req.user.id).select("+password");
  if (!(await employee.comparePassword(currentPassword))) {
    return next(new ApiError("كلمة المرور الحالية غير صحيحة", 401));
  }

  employee.password = newPassword;
  await employee.save();

  const token = generateToken(employee._id, employee.role);
  res.status(200).json({ status: "success", data: { token } });
});

// Dashboard stats endpoint
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const employees = await Employee.find().select("-password");
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === "active" || emp.status === "نشط").length;
  const managerCount = employees.filter(emp => emp.role === "مدير" || emp.role === "manager").length;
  const employeeCount = employees.filter(emp => emp.role === "موظف" || emp.role === "employee").length;

  res.status(200).json({
    status: "success",
    data: {
      statistics: {
        totalEmployees,
        activeEmployees,
        managerCount,
        employeeCount
      },
      employees
    }
  });
});
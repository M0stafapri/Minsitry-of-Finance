const Supplier = require("../models/Supplier");
const Trip = require("../models/Trip");
const CarType = require("../models/CarType");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const AuditLog = require("../models/AuditLog");
const { isValidInternationalPhone } = require("../utils/phoneUtils");

// ✅ Create Supplier (Manager only)
exports.createSupplier = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "مدير") {
    return next(new ApiError("غير مصرح لك بإضافة اكواد مؤسسية", 403));
  }

  let { name, institutionalCode, unitName, governorateOrMinistry } = req.body;

  try {
    const supplier = await Supplier.create({ name, institutionalCode, unitName, governorateOrMinistry });
    await AuditLog.create({
      actor: req.user.id,
      action: "CREATE_SUPPLIER",
      target: supplier._id,
      changes: { name, institutionalCode, unitName, governorateOrMinistry },
    });
    res.status(201).json({
      status: "success",
      message: "تم إضافة الكود المؤسسي بنجاح",
      data: { supplier },
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.institutionalCode) {
      return next(new ApiError("الكود المؤسسي موجود بالفعل ولا يمكن تكراره", 400));
    }
    return next(error);
  }
});

// ✅ Get All Suppliers (accessible to both roles)
exports.getAllSuppliers = asyncHandler(async (req, res) => {
  const { search = "", sortByTrips, page = 1, limit = 10 } = req.query;

  const query = {};

  // 🔍 بحث نصي
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { institutionalCode: { $regex: search, $options: "i" } },
      { unitName: { $regex: search, $options: "i" } },
      { governorateOrMinistry: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  // ✅ تحميل الموردين
  let suppliers = await Supplier.find(query)
    .sort({ createdAt: -1 }) // مؤقتًا سيتم التعديل لاحقًا بعد حساب عدد الرحلات
    .skip(Number(skip))
    .limit(Number(limit))
    .lean();

  // 🔃 ترتيب حسب عدد الرحلات
  if (sortByTrips === "asc") {
    suppliers.sort((a, b) => a.tripCount - b.tripCount);
  } else if (sortByTrips === "desc") {
    suppliers.sort((a, b) => b.tripCount - a.tripCount);
  }

  // إجمالي الموردين بعد الفلترة
  const total = await Supplier.countDocuments(query);

  res.status(200).json({
    status: "success",
    results: suppliers.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: { suppliers },
  });
});

// ✅ Update Supplier (Manager only)
exports.updateSupplier = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "مدير") {
    return next(new ApiError("غير مصرح لك بتعديل الاكواد المؤسسية", 403));
  }

  const { id } = req.params;
  let { name, institutionalCode, unitName, governorateOrMinistry } = req.body;
  const updates = {};

  if (name) {
    if (name.trim().length < 2) {
      return next(new ApiError("الاسم يجب أن يحتوي على حرفين على الأقل", 400));
    }
    updates.name = name.trim();
  }

  if (institutionalCode) {
    updates.institutionalCode = institutionalCode;
  }
  if (unitName) {
    updates.unitName = unitName;
  }
  if (governorateOrMinistry) {
    updates.governorateOrMinistry = governorateOrMinistry;
  }

  try {
    const supplier = await Supplier.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!supplier) {
      return next(new ApiError("الكود المؤسسي غير موجود", 404));
    }
    await AuditLog.create({
      actor: req.user.id,
      action: "UPDATE_SUPPLIER",
      changes: updates,
    });
    res.status(200).json({
      status: "success",
      message: "تم تحديث بيانات الكود المؤسسي بنجاح",
      data: { supplier },
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.institutionalCode) {
      return next(new ApiError("الكود المؤسسي موجود بالفعل ولا يمكن تكراره", 400));
    }
    return next(error);
  }
});

// ✅ Delete Supplier (Manager only)
exports.deleteSupplier = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "مدير") {
    return next(new ApiError("غير مصرح لك بحذف الاكواد المؤسسية", 403));
  }

  const { id } = req.params;

  const supplier = await Supplier.findByIdAndDelete(id);
  if (!supplier) {
    return next(new ApiError("الكود المؤسسي غير موجود", 404));
  }

  await AuditLog.create({
    actor: req.user.id,
    action: "DELETE_SUPPLIER",
    target: supplier._id,
    metadata: {
      name: supplier.name,
      phone: supplier.phone,
    },
  });

  res.status(200).json({
    status: "success",
    message: "تم حذف الكود المؤسسي",
    data: null,
  });
});
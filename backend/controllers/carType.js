const CarType = require("../models/CarType");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");

// ✅ إنشاء نوع جديد (Manager only)
exports.createCarType = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ status: "fail", message: "اسم نوع السيارة مطلوب" });
    }
    const exists = await CarType.findOne({ name: name.trim() });
    if (exists) {
      return res.status(409).json({ status: "fail", message: "نوع السيارة موجود بالفعل" });
    }
    const carType = await CarType.create({ name: name.trim() });
    res.status(201).json({ status: "success", data: { carType } });
  } catch (error) {
    next(error);
  }
};

// ✅ عرض كل أنواع السيارات (متاحة للجميع)
exports.getAllCarTypes = asyncHandler(async (req, res) => {
  const carTypes = await CarType.find().sort({ name: 1 });

  res.status(200).json({
    status: "success",
    results: carTypes.length,
    data: { carTypes },
  });
});

// ✅ حذف نوع سيارة (Manager only)
exports.deleteCarType = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const CarTypeModel = require("../models/CarType");
  const Supplier = require("../models/Supplier");

  // Check if car type exists
  const carType = await CarTypeModel.findById(id);
  if (!carType) {
    return res.status(404).json({ status: "fail", message: "نوع السيارة غير موجود" });
  }

  // Prevent deletion if used by any supplier
  const usedBySupplier = await Supplier.findOne({ availableCars: carType.name });
  if (usedBySupplier) {
    return res.status(400).json({ status: "fail", message: "لا يمكن حذف نوع السيارة لأنه مستخدم من قبل مورد." });
  }

  await CarTypeModel.findByIdAndDelete(id);
  res.status(200).json({ status: "success", message: "تم حذف نوع السيارة بنجاح" });
});
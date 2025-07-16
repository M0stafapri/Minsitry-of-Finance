const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Employee = require("../models/Employee");
const ApiError = require("../utils/ApiError");
const AuditLog = require("../models/AuditLog");
const validator = require("validator");
const ExcelJS = require("exceljs");

function isValidPhone(phone) {
  if (
    validator.isMobilePhone(phone, ["ar-SA", "ar-EG"], { strictMode: true })
  ) {
    return true;
  }
  return validator.isMobilePhone(phone, "any", { strictMode: true });
}

exports.createNewCustomer = asyncHandler(async (req, res, next) => {
  const assignedEmployee = req.user?.id;
  const {
    customerName,
    jobTitle,
    nationalId,
    unitName,
    systemName,
    email,
    certificateDuration,
    signatureType,
    certificateType,
    issueDate,
    expiryDate,
    institutionalCode,
    notes = ""
  } = req.body;

  console.log('🔍 [CREATE_CUSTOMER] File upload debug:');
  console.log('🔍 req.file:', req.file);
  console.log('🔍 req.body.certificateScan:', req.body.certificateScan);
  console.log('🔍 req.files:', req.files);

  if (!customerName || !assignedEmployee) {
    return next(
      new ApiError("الرجاء إدخال الاسم والموظف المسؤول", 400)
    );
  }

  const employeeExists = await Employee.exists({ _id: assignedEmployee });
  if (!employeeExists) {
    return next(new ApiError("الموظف المسؤول غير موجود", 404));
  }

  const certificateScan = req.file?.path || req.body.certificateScan || "";
  console.log('🔍 Final certificateScan path:', certificateScan);
  console.log('🔍 req.file details:', {
    fieldname: req.file?.fieldname,
    originalname: req.file?.originalname,
    filename: req.file?.filename,
    path: req.file?.path,
    mimetype: req.file?.mimetype
  });

  const customer = await Customer.create({
    customerName,
    jobTitle,
    nationalId,
    unitName,
    systemName,
    email,
    certificateDuration,
    signatureType,
    certificateType,
    issueDate,
    expiryDate,
    institutionalCode,
    assignedEmployee: assignedEmployee,
    notes,
    certificateScan,
    status: 'Active',
  });

  console.log('🔍 Created customer with certificateScan:', customer.certificateScan);
  console.log('🔍 Full customer object:', JSON.stringify(customer, null, 2));

  await AuditLog.create({
    actor: req.user?.id,
    action: "CREATE_CUSTOMER",
    target: customer._id,
    targetModel: 'Customer',
    metadata: {},
  });

  const populatedCustomer = await customer.populate(
    "assignedEmployee",
    "name position username"
  );

  res.status(201).json({
    status: "success",
    message: "تم إنشاء التوقيع بنجاح",
    data: {
      customer: populatedCustomer,
    },
  });
});

exports.getCustomers = asyncHandler(async (req, res, next) => {
  const { search } = req.query;

  const matchStage = {};

  // 👥 تحديد نطاق الرؤية
  if (req.user.role === "موظف") {
    matchStage.assignedEmployee = new mongoose.Types.ObjectId(req.user.id);
  } else if (req.user.role !== "مدير") {
    return next(new ApiError("غير مصرح لك بعرض قائمة العملاء", 403));
  }

  const pipeline = [
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: "employees",
        localField: "assignedEmployee",
        foreignField: "_id",
        as: "assignedEmployee",
      },
    },
    {
      $unwind: {
        path: "$assignedEmployee",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  // 🔍 دعم البحث
  if (search && search.trim().length > 0) {
    pipeline.push({
      $match: {
        $or: [
          { customerName: { $regex: search, $options: "i" } },
          { personalPhone: { $regex: search, $options: "i" } },
          { whatsAppNumber: { $regex: search, $options: "i" } },
          { "assignedEmployee.name": { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  pipeline.push({
    $project: {
      customerName: 1,
      jobTitle: 1,
      nationalId: 1,
      unitName: 1,
      systemName: 1,
      email: 1,
      certificateDuration: 1,
      signatureType: 1,
      certificateType: 1,
      issueDate: 1,
      expiryDate: 1,
      institutionalCode: 1,
      notes: 1,
      status: 1,
      certificateScan: 1,
      assignedEmployee: {
        _id: 1,
        name: 1,
      },
    },
  });

  const customers = await Customer.aggregate(pipeline);

  res.status(200).json({
    status: "success",
    results: customers.length,
    data: { customers },
  });
});

exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ApiError("معرّف التوقيع غير صالح", 400));
  }

  const customer = await Customer.findById(id);
  if (!customer) {
    return next(new ApiError("التوقيع غير موجود أو تم حذفه مسبقًا", 404));
  }

  // التحقق من الصلاحية: المدير أو الموظف الذي يرى العميل (يعني هو نفسه أضافه)
  if (
    req.user.role !== "مدير" &&
    customer.assignedEmployee.toString() !== req.user.id
  ) {
    return next(new ApiError("غير مصرح لك بحذف هذا التوقيع", 403));
  }

  await customer.deleteOne();

  await AuditLog.create({
    actor: req.user?.id,
    action: "DELETE_CUSTOMER",
    target: customer._id,
    targetModel: 'Customer',
    metadata: {
      customerName: customer.customerName,
      phone: customer.personalPhone,
      deletedAt: new Date(),
    },
  });

  res.status(200).json({
    status: "success",
    message: `تم حذف التوقيع (${customer.customerName}) بنجاح`,
    data: {
      customerId: customer._id,
      deletedBy: req.user?.id,
    },
  });
});

exports.updateCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  let updates = req.body || {};

  console.log('🔍 [UPDATE_CUSTOMER] File upload debug:');
  console.log('🔍 req.file:', req.file);
  console.log('🔍 req.body.certificateScan:', req.body.certificateScan);
  console.log('🔍 req.files:', req.files);

  // If sent as FormData, all fields are strings. Optionally parse JSON fields if needed.
  // Defensive: ensure updates is always an object
  if (typeof updates === 'string') {
    try {
      updates = JSON.parse(updates);
    } catch (e) {
      updates = {};
    }
  }

  const customer = await Customer.findById(id);
  if (!customer || customer.isDeleted) {
    return next(new ApiError("التوقيع غير موجود", 404));
  }

  // 🛡️ السماح للموظف بتعديل فقط عملائه
  if (req.user.role === "موظف") {
    if (String(customer.assignedEmployee) !== req.user.id) {
      return next(new ApiError("غير مصرح لك بتعديل هذا التوقيع", 403));
    }
    // 🧼 إزالة الحقول غير المصرح بها
    const allowedFields = [
      "customerName",
      "jobTitle",
      "nationalId",
      "unitName",
      "systemName",
      "email",
      "certificateDuration",
      "signatureType",
      "certificateType",
      "issueDate",
      "expiryDate",
      "institutionalCode",
      "notes",
      "certificateScan",
    ];
    Object.keys(updates).forEach((field) => {
      if (!allowedFields.includes(field)) delete updates[field];
    });
  } else if (req.user.role === "مدير") {
    // Allow admin to update status
    if (updates.status && !["Active", "Revoked"].includes(updates.status)) {
      return next(new ApiError("قيمة الحالة غير صالحة", 400));
    }
  }

  // 👮‍♂️ المدير فقط يمكنه تغيير الموظف المسؤول
  if (updates.assignedEmployee && req.user.role !== "مدير") {
    return next(new ApiError("غير مصرح لك بتغيير الموظف المسؤول", 403));
  }

  if (req.file?.path) {
    updates.certificateScan = req.file.path;
    console.log('🔍 Updated certificateScan path:', updates.certificateScan);
    console.log('🔍 req.file details (update):', {
      fieldname: req.file?.fieldname,
      originalname: req.file?.originalname,
      filename: req.file?.filename,
      path: req.file?.path,
      mimetype: req.file?.mimetype
    });
  }

  // Save the old expiryDate before updating
  const oldExpiryDate = customer.expiryDate;
  Object.assign(customer, updates);
  await customer.save();

  console.log('🔍 Saved customer with certificateScan:', customer.certificateScan);
  console.log('🔍 Full updated customer object:', JSON.stringify(customer, null, 2));

  await AuditLog.create({
    actor: req.user?.id,
    action: "UPDATE_CUSTOMER",
    target: customer._id,
    targetModel: 'Customer',
    changes: updates,
  });

  const populatedCustomer = await customer.populate(
    "assignedEmployee",
    "name position"
  );

  res.status(200).json({
    status: "success",
    message: "تم تحديث بيانات التوقيع بنجاح",
    data: { customer: populatedCustomer },
  });
});

exports.exportCustomersToExcel = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "مدير") {
    return next(new ApiError("غير مصرح، يتطلب صلاحيات المدير", 403));
  }

  const customers = await Customer.find({ isDeleted: { $ne: true } }).populate(
    "assignedEmployee",
    "name"
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Customers");

  worksheet.columns = [
    { header: "Customer Name", key: "customerName", width: 25 },
    { header: "Phone", key: "personalPhone", width: 15 },
    { header: "WhatsApp", key: "whatsAppNumber", width: 15 },
    { header: "Assigned Employee", key: "assignedEmployee", width: 25 },
    { header: "Created At", key: "createdAt", width: 20 },
  ];

  customers.forEach((c) => {
    worksheet.addRow({
      customerName: c.customerName,
      personalPhone: c.personalPhone,
      whatsAppNumber: c.whatsAppNumber,
      assignedEmployee: c.assignedEmployee?.name || "غير محدد",
      createdAt: c.createdAt?.toISOString().split("T")[0],
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=customers.xlsx");
  await workbook.xlsx.write(res);
  res.end();
});

exports.revokeCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const customer = await Customer.findById(id);
  if (!customer) {
    return next(new ApiError("التوقيع غير موجود", 404));
  }
  if (customer.status === "Revoked") {
    return next(new ApiError("تم إلغاء هذا التوقيع بالفعل", 400));
  }
  customer.status = "Revoked";
  await customer.save();
  await AuditLog.create({
    actor: req.user?.id,
    action: "REVOKE_CUSTOMER",
    target: customer._id,
    targetModel: 'Customer',
    changes: { status: "Revoked" },
  });
  res.status(200).json({
    status: "success",
    message: "تم إلغاء التوقيع بنجاح",
    data: { customerId: customer._id },
  });
});

exports.renewCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const customer = await Customer.findById(id);
  if (!customer) {
    return next(new ApiError("التوقيع غير موجود", 404));
  }
  if (customer.status !== "Revoked") {
    return next(new ApiError("لا يمكن تجديد التوقيع إلا إذا كان ملغيًا", 400));
  }
  // Extend expiryDate by 3 years
  let expiry = new Date(customer.expiryDate);
  if (isNaN(expiry.getTime())) {
    expiry = new Date();
  }
  expiry.setFullYear(expiry.getFullYear() + 3);
  customer.expiryDate = expiry.toISOString().split('T')[0];
  customer.status = "Active";
  await customer.save();
  await AuditLog.create({
    actor: req.user?.id,
    action: "RENEW_CUSTOMER",
    target: customer._id,
    targetModel: 'Customer',
    changes: { status: "Active", expiryDate: customer.expiryDate },
  });
  res.status(200).json({
    status: "success",
    message: "تم تجديد التوقيع بنجاح لمدة ثلاث سنوات",
    data: { customerId: customer._id, expiryDate: customer.expiryDate },
  });
});

// Optional Feature

// exports.restoreCustomer = asyncHandler(async (req, res, next) => {
//   const { id } = req.params;

//   const customer = await Customer.findById(id);
//   if (!customer || !customer.isDeleted) {
//     return next(new ApiError("العميل غير موجود أو لم يتم حذفه", 404));
//   }

//   customer.isDeleted = false;
//   await customer.save();

//   await AuditLog.create({
//     actor: req.user?.id,
//     action: "RESTORE_CUSTOMER",
//     target: customer._id,
//   });

//   res.status(200).json({
//     status: "success",
//     message: `تم استرجاع العميل (${customer.customerName}) بنجاح`,
//   });
// });
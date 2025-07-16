const express = require("express");
const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");
const {
  registerNewEmployee,
  login,
  getAllEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  getConfig,
  updatePassword,
  getDashboardStats,
} = require("../controllers/employee");

const Employee = require("../models/Employee");
const upload = require("../middlewares/uploadMiddleware");
const { protect, isRole } = require("../middlewares/authMiddleware");

const router = express.Router();

//
// 📊 Dashboard Statistics (Public - No Auth Required)
//

router.get("/dashboard/stats", getDashboardStats);

//
// 🔐 Validation Groups
//

const employeeValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("الاسم يجب أن يكون بين 2 و50 حرفًا"),
  body("personalPhone")
    .isMobilePhone("ar-EG")
    .withMessage("رقم الهاتف الشخصي غير صالح"),
  body("username")
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage("اسم المستخدم يجب أن يكون بين 4 و20 حرفًا"),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  body("role")
    .optional()
    .isIn(Employee.getAvailableRoles())
    .withMessage("الدور غير صالح"),
  body("employmentDate")
    .isISO8601()
    .withMessage("تاريخ التوظيف يجب أن يكون تاريخًا صالحًا")
    .custom((value) => new Date(value) <= new Date())
    .withMessage("تاريخ التوظيف لا يمكن أن يكون في المستقبل"),
  body("terminationDate")
    .optional()
    .isISO8601()
    .withMessage("تاريخ إيقاف التوظيف يجب أن يكون تاريخًا صالحًا")
    .custom((value, { req }) => {
      if (value && req.body.employmentDate) {
        return new Date(value) >= new Date(req.body.employmentDate);
      }
      return true;
    })
    .withMessage("تاريخ إيقاف التوظيف يجب أن يكون بعد تاريخ التوظيف")
    .custom((value) => !value || new Date(value) <= new Date())
    .withMessage("تاريخ إيقاف التوظيف لا يمكن أن يكون في المستقبل"),
  body("executedTrips")
    .optional()
    .isArray()
    .withMessage("الرحلات المنفذة يجب أن تكون مصفوفة")
    .custom((trips) => trips.every((trip) => mongoose.isValidObjectId(trip)))
    .withMessage("يجب أن تحتوي الرحلات المنفذة على معرفات MongoDB صالحة"),
  body("idDocument")
    .optional()
    .matches(/\.(pdf|jpg|jpeg|png)$/)
    .withMessage("مستند الهوية يجب أن يكون PDF أو صورة"),
  body("cv")
    .optional()
    .matches(/\.(pdf|doc|docx)$/)
    .withMessage("السيرة الذاتية يجب أن تكون PDF أو DOC"),
  body("linkedEmployee")
    .optional()
    .isMongoId()
    .withMessage("الموظف المرتبط يجب أن يكون معرف MongoDB صالح"),
];

const queryValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("رقم الصفحة يجب أن يكون عددًا صحيحًا أكبر من 0"),
  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("الحد يجب أن يكون عددًا صحيحًا أكبر من 0"),
  query("status")
    .optional()
    .isIn(["نشط", "غير نشط", "معلق"])
    .withMessage("حالة الموظف غير صالحة"),
  query("role")
    .optional()
    .isIn(Employee.getAvailableRoles())
    .withMessage("الدور غير صالح"),
];

const updateValidation = [
  body("name").optional().isLength({ min: 2, max: 50 }),
  body("personalPhone").optional().isMobilePhone("ar-EG"),
  body("password").optional().isLength({ min: 8 }),
  body("role").optional().isIn(Employee.getAvailableRoles()),
  body("status").optional().isIn(["نشط", "غير نشط", "معلق"]),
  body("linkedEmployee").optional().isMongoId(),
  body("idDocument").optional().isString(),
  body("cv").optional().isString(),
];

//
// 🚪 Auth + Account
//

router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("اسم المستخدم مطلوب"),
    body("password").notEmpty().withMessage("كلمة المرور مطلوبة"),
  ],
  login
);

router.patch(
  "/password",
  protect,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("كلمة المرور الحالية مطلوبة"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"),
  ],
  updatePassword
);

//
// 👤 Employee Management (Manager Only)
//

router.post(
  "/register",
  protect,
  isRole("مدير"),
  upload.fields([{ name: "idDocument" }, { name: "cv" }]),
  employeeValidation,
  registerNewEmployee
);

router.get("/", protect, queryValidation, getAllEmployees);

router.get(
  "/:id",
  protect,
  [
    param("id")
      .isMongoId()
      .withMessage("معرف الموظف يجب أن يكون معرف MongoDB صالح"),
  ],
  getEmployee
);

router.patch(
  "/:id",
  protect,
  [
    param("id").isMongoId().withMessage("معرف الموظف غير صالح"),
    ...updateValidation,
  ],
  updateEmployee
);

router.delete(
  "/:id",
  protect,
  isRole("مدير"),
  [
    param("id")
      .isMongoId()
      .withMessage("معرف الموظف يجب أن يكون معرف MongoDB صالح"),
  ],
  deleteEmployee
);

router.get("/config", protect, isRole("مدير"), getConfig);

module.exports = router;

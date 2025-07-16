const express = require("express");
const router = express.Router();
const {
  createSupplier,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplier");
const { protect, isRole } = require("../middlewares/authMiddleware");
const { body } = require('express-validator');

const supplierValidation = [
  body('name').notEmpty().withMessage('اسم الكود المؤسسي مطلوب'),
  body('phone').notEmpty().withMessage('رقم الهاتف مطلوب'),
  body('institutionalCode').notEmpty().withMessage('الكود المؤسسي مطلوب'),
  body('unitName').notEmpty().withMessage('اسم الوحدة مطلوب'),
  body('governorateOrMinistry').notEmpty().withMessage('اسم المحافظة أو الوزارة مطلوب'),
];

router.use(protect);
router.use(isRole("مدير"));

router.post("/NewSupplier", createSupplier);
router.get("/", getAllSuppliers);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

module.exports = router;

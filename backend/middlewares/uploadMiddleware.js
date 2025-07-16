const multer = require("multer");
const path = require("path");

// التخزين
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // المجلد اللي هيتحفظ فيه الملف
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${file.fieldname}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

// التحقق من أنواع الملفات
const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("نوع الملف غير مدعوم"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // الحد الأقصى 5MB
});

module.exports = upload;

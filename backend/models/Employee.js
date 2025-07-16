const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const POSITION_CONFIG = {
  management: [
    "مدير عام",
    "مدير مبيعات",
    "مدير تسويق",
    "مدير موارد بشرية",
    "مدير عمليات",
    "مدير تطوير أعمال",
    "مدير الحركة",
    "المدير التنفيذي",
  ],
  operational: [
    "منسق رحلات",
    "مسؤول جدول",
    "محاسب",
    "مندوب مبيعات",
    "سكرتير تنفيذي",
    "موظف خدمة عملاء",
    "مسؤول علاقات عامة",
    "مشرف رحلات",
    "مسؤول تذاكر",
  ],
};

const ROLES = {
  EMPLOYEE: "موظف",
  MANAGER: "مدير",
};

const STATUS = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  SUSPENDED: "معلق",
};

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "الاسم مطلوب"],
      trim: true,
      minlength: [2, "الاسم يجب أن يكون أكثر من حرفين"],
      maxlength: [50, "الاسم لا يمكن أن يتجاوز 50 حرفًا"],
    },

    personalPhone: {
      type: String,
      required: [true, "رقم الهاتف الشخصي مطلوب"],
      validate: {
        validator: (v) => validator.isMobilePhone(v, ["ar-EG"]),
        message: "رقم الهاتف غير صالح",
      },
      unique: true,
    },

    username: {
      type: String,
      required: [true, "اسم المستخدم مطلوب"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [4, "اسم المستخدم يجب أن يكون 4 أحرف على الأقل"],
      maxlength: [20, "اسم المستخدم لا يمكن أن يتجاوز 20 حرفًا"],
    },

    password: {
      type: String,
      required: [true, "كلمة المرور مطلوبة"],
      minlength: [8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"],
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: "الدور غير صالح",
      },
      required: [true, "الدور مطلوب"],
      default: ROLES.EMPLOYEE,
    },

    // Removed managedPhones field

    linkedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      validate: {
        validator: async function (v) {
          if (!v) return true;
          const employee = await this.model("Employee").findById(v);
          return employee && employee.role === ROLES.MANAGER;
        },
        message: "الموظف المرتبط يجب أن يكون مديرًا",
      },
    },

    employmentDate: {
      type: Date,
      required: [true, "تاريخ التوظيف مطلوب"],
      validate: {
        validator: (v) => v <= new Date(),
        message: "تاريخ التوظيف لا يمكن أن يكون في المستقبل",
      },
    },

    terminationDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return v >= this.employmentDate && v <= new Date();
        },
        message:
          "تاريخ إيقاف التوظيف يجب أن يكون بعد تاريخ التوظيف ولا يمكن أن يكون في المستقبل",
      },
    },

    executedTrips: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trip",
        validate: {
          validator: async (v) => !!(await mongoose.model("Trip").findById(v)),
          message: "الرحلة غير موجودة",
        },
      },
    ],

    idDocument: {
      type: String,
      default: "",
    },
    cv: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: {
        values: Object.values(STATUS),
        message: "حالة الموظف غير صالحة",
      },
      default: STATUS.ACTIVE,
    },

    lastLogin: {
      type: Date,
    },

    passwordChangedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
// Removed positionDetails virtual

// Indexes
employeeSchema.index({ status: 1 });
employeeSchema.index({ role: 1 });

// Pre-save: Hash password
employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now();
  next();
});

// Remove pre-save: Validate unique managedPhones

// Methods
employeeSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

employeeSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Removed getAvailablePositions static

employeeSchema.statics.getAvailableRoles = function () {
  return Object.values(ROLES);
};

module.exports = mongoose.model("Employee", employeeSchema);

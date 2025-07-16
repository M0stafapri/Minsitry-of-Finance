const mongoose = require("mongoose");
const CarType = require("./CarType");
const validator = require("validator");

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "اسم المؤسسة مطلوب"],
      minlength: 2,
    },
    institutionalCode: {
      type: String,
      required: [true, 'الكود المؤسسي مطلوب'],
      unique: true,
      validate: {
        validator: function(v) {
          return /^INS\d+$/.test(v); // Must start with INS and be followed by digits
        },
        message: 'الكود المؤسسي يجب أن يكون على الشكل INS123',
      },
    },
    unitName: {
      type: String,
      required: [true, 'اسم الوحدة مطلوب'],
      trim: true,
    },
    governorateOrMinistry: {
      type: String,
      required: [true, 'اسم المحافظة أو الوزارة مطلوب'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

supplierSchema.set("toObject", { virtuals: true });
supplierSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Supplier", supplierSchema);

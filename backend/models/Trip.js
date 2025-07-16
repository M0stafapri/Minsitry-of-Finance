const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    // 1. بيانات العميل
    customerName: {
      type: String,
      required: [true, "اسم العميل مطلوب"],
    },
    customerPhone: {
      type: String,
      required: [true, "رقم هاتف العميل مطلوب"],
      match: [/^01[0-9]{9}$/, "رقم الهاتف غير صالح"],
    },
    customerWhatsApp: {
      type: String,
      required: [true, "رقم واتساب العميل مطلوب"],
      match: [/^01[0-9]{9}$/, "رقم الواتساب غير صالح"],
    },

    // 2. معلومات الرحلة الأساسية
    tripDate: {
      type: Date,
      required: [true, "تاريخ الرحلة مطلوب"],
    },
    tripType: {
      type: String,
      required: [true, "نوع الرحلة مطلوب"],
      enum: ["ذهاب", "عودة", "ذهاب وعودة"],
    },

    // 3. تفاصيل الرحلة
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "اسم المورد مطلوب"],
    },
    path: {
      type: String,
      required: [true, "المسار مطلوب"],
    },
    carType: {
      type: String,
      required: [true, "نوع السيارة مطلوب"],
    },

    // 4. بيانات التكلفة
    commercialPrice: {
      type: Number,
      required: [true, "السعر التجاري مطلوب"],
      min: 0,
    },
    paidAmount: {
      type: Number,
      required: [true, "المبلغ المدفوع مطلوب"],
      min: 0,
    },
    collection: {
      type: Number,
      required: [true, "التحصيل مطلوب"],
      min: 0,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    commission: {
      type: Number,
      default: 0,
    },

    // 5. بيانات السائق
    driverName: {
      type: String,
      required: [true, "اسم السائق مطلوب"],
    },
    driverPhone: {
      type: String,
      required: [true, "رقم هاتف السائق مطلوب"],
      match: [/^01[0-9]{9}$/, "رقم الهاتف غير صالح"],
    },

    // 6. إثبات الدفع
    paymentProof: {
      type: String, // مسار الصورة أو اسم الملف
    },

    // 7. حالة التسوية
    isSettled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);

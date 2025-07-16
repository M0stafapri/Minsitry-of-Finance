const mongoose = require("mongoose");

const customerSchema = mongoose.Schema({
  customerName: {
    type: String,
    required: [true, "الاسم مطلوب"],
    trim: true,
    minlength: [2, "الاسم يجب أن يكون أكثر من حرفين"],
    maxlength: [50, "الاسم لا يمكن أن يتجاوز 50 حرفًا"],
  },
  jobTitle: { type: String, required: true },
  nationalId: { type: String, required: true },
  unitName: { type: String, required: true },
  systemName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  certificateDuration: { type: String, required: true },
  signatureType: { type: String, required: true },
  certificateType: { type: String, required: true },
  issueDate: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  institutionalCode: { type: String, required: true },
  certificateScan: {
    type: String,
    default: "",
  },
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: [true, "الموظف المسؤول مطلوب"],
  },
  notes: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["Active", "Revoked"],
    default: "Active",
  },
});

module.exports = mongoose.model("Customer", customerSchema);

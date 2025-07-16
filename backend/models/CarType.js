const mongoose = require("mongoose");

const carTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "اسم نوع السيارة مطلوب"],
    unique: true,
    trim: true,
  },
});

module.exports = mongoose.model("CarType", carTypeSchema);

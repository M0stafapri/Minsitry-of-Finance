const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Employee = require("./models/Employee");

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net')
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    const existing = await Employee.findOne({ username: "admin" });
    if (existing) {
      console.log("⚠️ Admin already exists. Skipping...");
      return process.exit(0);
    }

    await Employee.create({
      username: "mostafa",
      password: "mostafa123",
      name: "Mostafa Rihan", // <--- Use a real name here
      personalPhone: "+201275323141",
      role: "مدير",
      employmentDate: new Date(),
      status: "نشط",
    });

    console.log("✅ Admin created successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err);
    process.exit(1);
  });

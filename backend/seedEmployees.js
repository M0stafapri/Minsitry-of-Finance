const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net';

const sampleEmployees = [
  {
    name: "Mostafa",
    personalPhone: "+201012345672",
    username: "Mostafa",
    password: "12345678",
    role: "مدير",
    employmentDate: new Date("2023-01-15"),
    status: "نشط"
  },
  {
    name: "مصطفي أحمد حسن",
    personalPhone: "+201012345701",
    username: "Deesha",
    password: "12345678",
    role: "موظف",
    employmentDate: new Date("2023-03-20"),
    status: "نشط"
  },
  {
    name: "مصطفي علي أحمد",
    personalPhone: "+201012345712",
    username: "Tofi",
    password: "12345678",
    role: "موظف",
    employmentDate: new Date("2023-06-10"),
    status: "نشط"
  },
  {
    name: "مصطفي محمود",
    personalPhone: "+201012345723",
    username: "Taftf",
    password: "12345678",
    role: "موظف",
    employmentDate: new Date("2023-02-01"),
    status: "نشط"
  },
  {
    name: "مصطفي حسن محمد",
    personalPhone: "+201012345734",
    username: "Mufasa",
    password: "12345678",
    role: "موظف",
    employmentDate: new Date("2023-04-15"),
    status: "نشط"
  }
];

async function seedEmployees() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all existing employees to start fresh
    const existingEmployees = await Employee.find();
    if (existingEmployees.length > 0) {
      console.log(`🗑️  Deleting ${existingEmployees.length} existing employees...`);
      await Employee.deleteMany({});
      console.log('✅ All existing employees deleted');
    }

    console.log('🌱 Seeding employees...');

    // Hash passwords and create employees
    const employeesToCreate = await Promise.all(
      sampleEmployees.map(async (employeeData) => {
        const hashedPassword = await bcrypt.hash(employeeData.password, 12);
        return {
          ...employeeData,
          password: hashedPassword
        };
      })
    );

    const createdEmployees = await Employee.insertMany(employeesToCreate);
    console.log(`✅ Successfully created ${createdEmployees.length} employees`);

    // Display created employees
    createdEmployees.forEach(emp => {
      console.log(`   - ${emp.name} (${emp.username})`);
    });

  } catch (error) {
    console.error('❌ Error seeding employees:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedEmployees(); 
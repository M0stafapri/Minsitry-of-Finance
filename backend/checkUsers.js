require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

const checkUsers = async () => {
  try {
    console.log('🔍 Checking Existing Users');
    console.log('========================\n');
    
    // Connect to database
    const uri = process.env.MONGODB_URI || 'mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net';
    console.log('🔌 Connecting to MongoDB at URI:', uri);
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    // Get all employees
    const employees = await Employee.find({}).select('username name role status');
    
    if (employees.length === 0) {
      console.log('❌ No employees found in database');
      return;
    }
    
    console.log(`📊 Found ${employees.length} employee(s):\n`);
    
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. Username: ${emp.username}`);
      console.log(`   Name: ${emp.name}`);
      console.log(`   Role: ${emp.role}`);
      console.log(`   Status: ${emp.status}`);
      console.log('');
    });
    
    // Check for admin users specifically
    const admins = employees.filter(emp => emp.role === 'مدير');
    if (admins.length > 0) {
      console.log('👑 Admin Users Found:');
      admins.forEach(admin => {
        console.log(`   - ${admin.username} (${admin.name})`);
      });
      console.log('\n💡 You can login with any of these admin accounts');
    } else {
      console.log('❌ No admin users found');
    }
    
  } catch (error) {
    console.error('🔴 Error checking users:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
    process.exit(0);
  }
};

// Run the check
checkUsers(); 
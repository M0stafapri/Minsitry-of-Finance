require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

const checkEmployeeStatus = async () => {
  try {
    console.log('🔍 Checking Employee Status Values');
    console.log('================================\n');
    
    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net');
    console.log('✅ Connected to MongoDB');
    
    // Get all employees with their status
    const employees = await Employee.find({}).select('username name status');
    
    if (employees.length === 0) {
      console.log('❌ No employees found in database');
      return;
    }
    
    console.log(`📊 Found ${employees.length} employee(s):\n`);
    
    // Group by status to see all unique status values
    const statusGroups = {};
    employees.forEach(emp => {
      const status = emp.status || 'undefined';
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(emp);
    });
    
    console.log('📋 Status Summary:');
    Object.keys(statusGroups).forEach(status => {
      console.log(`   "${status}": ${statusGroups[status].length} employee(s)`);
      statusGroups[status].forEach(emp => {
        console.log(`     - ${emp.name} (${emp.username})`);
      });
    });
    
    console.log('\n🔍 Raw Status Values:');
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.name} (${emp.username}): "${emp.status}"`);
    });
    
  } catch (error) {
    console.error('🔴 Error checking employee status:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
    process.exit(0);
  }
};

// Run the check
checkEmployeeStatus(); 
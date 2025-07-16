require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

const fixDatabase = async () => {
  try {
    console.log('🔧 Fixing Database Issues');
    console.log('========================\n');
    
    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net');
    console.log('✅ Connected to MongoDB');
    
    // Check current employees
    console.log('\n📊 Current Employees:');
    const employees = await Employee.find({}).select('username name status personalPhone');
    
    if (employees.length === 0) {
      console.log('❌ No employees found');
      return;
    }
    
    console.log(`Found ${employees.length} employees:\n`);
    
    // Check for duplicate phone numbers and null values
    const phoneNumbers = {};
    const nullPhones = [];
    
    employees.forEach(emp => {
      console.log(`${emp.name} (${emp.username}):`);
      console.log(`  Status: "${emp.status}"`);
      console.log(`  Phone: "${emp.personalPhone}"`);
      
      if (!emp.personalPhone || emp.personalPhone === null) {
        nullPhones.push(emp);
      } else if (phoneNumbers[emp.personalPhone]) {
        console.log(`  ⚠️  DUPLICATE PHONE: ${emp.personalPhone}`);
      } else {
        phoneNumbers[emp.personalPhone] = emp;
      }
    });
    
    // Fix null phone numbers
    if (nullPhones.length > 0) {
      console.log(`\n🔧 Fixing ${nullPhones.length} employees with null phone numbers...`);
      
      for (let i = 0; i < nullPhones.length; i++) {
        const emp = nullPhones[i];
        const newPhone = `+2010123${String(i + 100000).padStart(6, '0')}`;
        
        await Employee.findByIdAndUpdate(emp._id, {
          personalPhone: newPhone
        });
        
        console.log(`  Fixed ${emp.name}: ${newPhone}`);
      }
    }
    
    // Check status values
    console.log('\n📋 Status Summary:');
    const statusCount = {};
    employees.forEach(emp => {
      const status = emp.status || 'undefined';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    Object.keys(statusCount).forEach(status => {
      console.log(`  "${status}": ${statusCount[status]} employee(s)`);
    });
    
    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('🔴 Error fixing database:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
    process.exit(0);
  }
};

// Run the fix
fixDatabase(); 
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

async function checkMissingEmployee() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net');
    console.log('✅ Connected to MongoDB');
    
    // Get all employees with detailed info
    const employees = await Employee.find({}).select('-password');
    console.log(`\n👥 Total employees found: ${employees.length}`);
    
    console.log('\n📋 All employees:');
    employees.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.name} (${emp.username})`);
      console.log(`      - Role: ${emp.role}`);
      console.log(`      - Position: ${emp.position}`);
      console.log(`      - Status: ${emp.status}`);
      console.log(`      - Phone: ${emp.personalPhone}`);
      console.log('');
    });
    
    // Check specifically for the manager
    const manager = await Employee.findOne({ username: 'sasa' });
    if (manager) {
      console.log('✅ Manager found:');
      console.log(`   - Name: ${manager.name}`);
      console.log(`   - Role: ${manager.role}`);
      console.log(`   - Status: ${manager.status}`);
      console.log(`   - Position: ${manager.position}`);
    } else {
      console.log('❌ Manager not found!');
    }
    
    // Check for any employees with issues
    const employeesWithIssues = await Employee.find({
      $or: [
        { status: { $ne: 'نشط' } },
        { role: 'مدير' }
      ]
    }).select('-password');
    
    if (employeesWithIssues.length > 0) {
      console.log('\n⚠️  Employees that might be filtered out:');
      employeesWithIssues.forEach(emp => {
        console.log(`   - ${emp.name} (${emp.username}) - Role: ${emp.role} - Status: ${emp.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkMissingEmployee(); 
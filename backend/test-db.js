const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net';

async function testDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test employees
    console.log('\n📋 Testing Employees...');
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees in database:`);
    employees.forEach(emp => {
      console.log(`  - ${emp.name} (${emp.username}) - ${emp.role} - ${emp.status}`);
    });

    // Test customers
    console.log('\n📋 Testing Customers...');
    const customers = await Customer.find({});
    console.log(`Found ${customers.length} customers in database:`);
    customers.forEach(cust => {
      console.log(`  - ${cust.customerName} (${cust.personalPhone})`);
    });

    // Test suppliers
    console.log('\n📋 Testing Suppliers...');
    const suppliers = await Supplier.find({});
    console.log(`Found ${suppliers.length} suppliers in database:`);
    suppliers.forEach(supp => {
      console.log(`  - ${supp.name} (${supp.phone})`);
    });

  } catch (error) {
    console.error('❌ Error testing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testDatabase(); 
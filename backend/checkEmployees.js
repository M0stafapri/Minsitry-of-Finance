const mongoose = require('mongoose');

async function checkEmployees() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net');
    console.log('✅ Connected to MongoDB');
    
    // Get the raw database connection
    const db = mongoose.connection.db;
    
    // List all databases
    const adminDb = mongoose.connection.db.admin();
    const databases = await adminDb.listDatabases();
    console.log('\n📊 Available databases:');
    databases.databases.forEach(db => {
      console.log(`   - ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    // Check 1 database collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections in 1 database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Check employees collection
    const employeeCollection = db.collection('employees');
    const count = await employeeCollection.countDocuments();
    console.log(`\n👥 Employee count: ${count}`);
    
    if (count > 0) {
      console.log('\n📋 Employee details:');
      const employees = await employeeCollection.find({}).toArray();
      employees.forEach((emp, index) => {
        console.log(`   ${index + 1}. ${emp.name} (${emp.username}) - ${emp.position} - ${emp.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkEmployees(); 
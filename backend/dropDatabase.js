require('dotenv').config();
const mongoose = require('mongoose');

const dropDatabase = async () => {
  try {
    console.log('💥 Database Drop Tool');
    console.log('====================\n');
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net', {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log(`✅ Connected to: ${conn.connection.name}`);
    
    // List all databases
    console.log('\n🗄️ All Databases:');
    const adminDb = conn.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    
    dbList.databases.forEach(db => {
      const sizeMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
      console.log(`   - ${db.name} (${sizeMB} MB)`);
    });
    
    // Confirm before dropping
    console.log('\n⚠️  WARNING: This will COMPLETELY DELETE the 1 database!');
    console.log('   This action cannot be undone.');
    console.log('\n   To proceed, you need to manually confirm by editing this script.');
    console.log('   Change the line: const shouldDrop = false; to const shouldDrop = true;');
    
    const shouldDrop = false; // CHANGE THIS TO true TO PROCEED
    
    if (!shouldDrop) {
      console.log('\n❌ Database drop cancelled. No data was deleted.');
      console.log('   Edit this script and set shouldDrop = true to proceed.');
      return;
    }
    
    // Drop the database
    console.log('\n💥 Dropping 1 database...');
    await conn.connection.db.dropDatabase();
    
    console.log('\n✅ 1 database dropped successfully!');
    console.log('   The database no longer exists.');
    
    // Verify the drop
    console.log('\n🔍 Verification:');
    const newDbList = await adminDb.listDatabases();
    const erpExists = newDbList.databases.find(db => db.name === '1');
    
    if (erpExists) {
      console.log('   ❌ 1 database still exists');
    } else {
      console.log('   ✅ 1 database successfully removed');
    }
    
  } catch (error) {
    console.error('🔴 Error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
};

// Run the drop tool
dropDatabase(); 
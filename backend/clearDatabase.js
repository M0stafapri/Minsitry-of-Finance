require('dotenv').config();
const mongoose = require('mongoose');

const clearDatabase = async () => {
  try {
    console.log('🗑️ Database Clear Tool');
    console.log('=====================\n');
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net', {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log(`✅ Connected to: ${conn.connection.name}`);
    
    // List all collections before clearing
    console.log('\n📋 Current Collections:');
    const collections = await conn.connection.db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Confirm before clearing
    console.log('\n⚠️  WARNING: This will DELETE ALL DATA in the 1 database!');
    console.log('   This action cannot be undone.');
    console.log('\n   To proceed, you need to manually confirm by editing this script.');
    console.log('   Change the line: const shouldClear = false; to const shouldClear = true;');
    
    const shouldClear = true; // CHANGE THIS TO true TO PROCEED
    
    if (!shouldClear) {
      console.log('\n❌ Database clear cancelled. No data was deleted.');
      console.log('   Edit this script and set shouldClear = true to proceed.');
      return;
    }
    
    // Clear all collections
    console.log('\n🧹 Clearing all collections...');
    
    for (const collection of collections) {
      console.log(`   Clearing ${collection.name}...`);
      await conn.connection.db.collection(collection.name).deleteMany({});
      console.log(`   ✅ ${collection.name} cleared`);
    }
    
    console.log('\n✅ Database cleared successfully!');
    console.log('   All collections are now empty.');
    
    // Verify the clear
    console.log('\n🔍 Verification:');
    for (const collection of collections) {
      const count = await conn.connection.db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
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

// Run the clear tool
clearDatabase(); 
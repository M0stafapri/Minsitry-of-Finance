// backend/scripts/migrateInstitutionalCodeToString.js
const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdbname');
    const suppliers = await Supplier.find({});
    let updatedCount = 0;
    for (const supplier of suppliers) {
      if (typeof supplier.institutionalCode === 'number') {
        // Convert number to string with INS prefix
        supplier.institutionalCode = `INS${supplier.institutionalCode}`;
        await supplier.save();
        console.log(`Updated supplier ${supplier.name}: institutionalCode -> ${supplier.institutionalCode}`);
        updatedCount++;
      }
    }
    console.log(`Migration complete! Updated ${updatedCount} suppliers.`);
    process.exit();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate(); 
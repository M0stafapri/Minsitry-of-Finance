// backend/scripts/deleteNumericInstitutionalCodeSuppliers.js
const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');

async function deleteNumericInstitutionalCodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdbname');
    const numericSuppliers = await Supplier.find({ institutionalCode: { $type: 'int' } });
    let deletedCount = 0;
    for (const supplier of numericSuppliers) {
      await supplier.deleteOne();
      console.log(`Deleted supplier ${supplier.name} with numeric institutionalCode: ${supplier.institutionalCode}`);
      deletedCount++;
    }
    console.log(`Deletion complete! Deleted ${deletedCount} suppliers with numeric institutionalCode.`);
    process.exit();
  } catch (err) {
    console.error('Deletion failed:', err);
    process.exit(1);
  }
}

deleteNumericInstitutionalCodes(); 
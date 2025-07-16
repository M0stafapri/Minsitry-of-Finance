const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const connectDB = require('../config/db');

async function migrateExpiryDates() {
  await connectDB();
  const customers = await Customer.find({});
  let updated = 0;
  for (const customer of customers) {
    if (typeof customer.expiryDate === 'string') {
      const date = new Date(customer.expiryDate);
      if (!isNaN(date)) {
        customer.expiryDate = date;
        await customer.save();
        updated++;
      }
    }
  }
  console.log(`✅ Migrated ${updated} customers' expiryDate to Date type.`);
  process.exit(0);
}

migrateExpiryDates().catch(err => {
  console.error('❌ Migration error:', err);
  process.exit(1);
}); 
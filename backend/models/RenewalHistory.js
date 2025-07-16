const mongoose = require('mongoose');
const RenewalHistorySchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  durationYears: Number,
  renewedAt: Date
});
module.exports = mongoose.model('RenewalHistory', RenewalHistorySchema); 
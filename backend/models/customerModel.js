const mongoose = require('mongoose');
const { Schema } = mongoose;

const CustomerSchema = new Schema({
  id: { type: Schema.Types.ObjectId, auto: true },
  loyaltyPoints: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);




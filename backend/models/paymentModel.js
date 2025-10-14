const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentSchema = new Schema({
  id: { type: Schema.Types.ObjectId, auto: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, required: true },
  status: { type: String, required: true },
  refundStatus: { type: String, default: 'not_refunded' },
  refundedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);

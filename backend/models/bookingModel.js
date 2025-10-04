// models/bookingModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookingSchema = new Schema({
  id: { type: Schema.Types.ObjectId, auto: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  nights: { type: Number, required: true, min: 1 },
  taxes: { type: Number, default: 0 },
  discounts: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  status: { type: String, required: true },
  confirmedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);

// models/hotelModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const HotelSchema = new Schema({
  id: { type: Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  amenities: [{ type: String }],
  policies: { type: Schema.Types.Mixed, default: {} },
  isApproved: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Hotel', HotelSchema);

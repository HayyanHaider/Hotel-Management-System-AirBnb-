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
  suspensionReason: { type: String, default: '' },
  rejectionReason: { type: String, default: '' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  isFlagged: { type: Boolean, default: false },
  flaggedReason: { type: String, default: '' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  pricing: {
    basePrice: { type: Number, required: true, min: 0 },
    cleaningFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 }
  },
  images: [{ type: String }],
  capacity: {
    guests: { type: Number, required: true, min: 1 },
    bedrooms: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 }
  },
  commissionRate: { type: Number, default: 0.10, min: 0, max: 1 } // 10% platform commission
}, { timestamps: true });

module.exports = mongoose.model('Hotel', HotelSchema);

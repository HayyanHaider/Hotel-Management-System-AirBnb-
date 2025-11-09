// models/reviewsModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReviewSchema = new Schema({
  id: { type: Schema.Types.ObjectId, auto: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, default: '' },
  replyText: { type: String, trim: true, default: '' },
  repliedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);

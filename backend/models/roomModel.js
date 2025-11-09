const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomSchema = new Schema({
  id: { type: Schema.Types.ObjectId, auto: true },
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true },
  description: { type: String, default: '' },
  pricePerNight: { type: Number, required: true, min: 0 },
  capacity: { type: Number, required: true, min: 1 },
  amenities: [{ type: String }],
  images: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);

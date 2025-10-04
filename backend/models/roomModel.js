const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomSchema = new Schema({
  id: { type: Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true },
  pricePerNight: { type: Number, required: true, min: 0 },
  amenities: [{ type: String }],
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);

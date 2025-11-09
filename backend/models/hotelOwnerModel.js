const mongoose = require('mongoose');
const { Schema } = mongoose;

const HotelOwnerSchema = new Schema({
  id: { type: Schema.Types.ObjectId, auto: true },
  businessName: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('HotelOwner', HotelOwnerSchema);




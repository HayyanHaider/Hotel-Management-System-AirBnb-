// models/addressModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const AddressSchema = new Schema({
  id: { type: Schema.Types.ObjectId, auto: true },
  formattedAddress: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  province: { type: String, trim: true, default: '' },
  country: { type: String, required: true, trim: true },
  postalCode: { type: String, trim: true, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat] - GeoJSON Point
  }
}, { timestamps: true });

AddressSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Address', AddressSchema);

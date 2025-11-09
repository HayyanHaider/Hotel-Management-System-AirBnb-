// models/userModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  id: { type: Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, trim: true, default: '' },
  role: { type: String, enum: ['customer', 'hotel_owner', 'admin'], default: 'customer', index: true },
  isVerified: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  suspendedReason: { type: String, default: '' },
  suspendedAt: { type: Date, default: null },
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Hotel' }],
  profilePicture: { type: String, default: '' },
  dateOfBirth: { type: Date },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    emailUpdates: { type: Boolean, default: true },
    language: { type: String, default: 'en' }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

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
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Hotel' }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

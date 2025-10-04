const mongoose = require('mongoose');
const { Schema } = mongoose;

const CouponSchema = new Schema({
  id: { type: Schema.Types.ObjectId, auto: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  discountPercentage: { type: Number, required: true, min: 0, max: 100 },
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CouponSchema);




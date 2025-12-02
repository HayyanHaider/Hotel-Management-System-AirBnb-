const BaseRepository = require('./BaseRepository');
const CouponModel = require('../models/couponModel');

/**
 * CouponRepository - Repository for Coupon entities
 * Follows Single Responsibility Principle - only handles Coupon data access
 */
class CouponRepository extends BaseRepository {
  constructor() {
    super(CouponModel);
  }

  /**
   * Find coupons by hotel
   * @param {string} hotelId - Hotel ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of coupons
   */
  async findByHotel(hotelId, options = {}) {
    return this.find({ hotelId }, options);
  }

  /**
   * Find coupon by code
   * @param {string} code - Coupon code
   * @returns {Promise<Object|null>} Coupon or null
   */
  async findByCode(code) {
    try {
      const doc = await this.model.findOne({ code: code.toUpperCase() });
      return this.toObject(doc);
    } catch (error) {
      throw new Error(`Error finding coupon by code: ${error.message}`);
    }
  }

  /**
   * Find active coupons
   * @param {Object} criteria - Additional criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of active coupons
   */
  async findActive(criteria = {}, options = {}) {
    const now = new Date();
    return this.find({
      ...criteria,
      isActive: true,
      validFrom: { $lte: now },
      validTo: { $gte: now }
    }, options);
  }

  /**
   * Increment coupon usage
   * @param {string} couponId - Coupon ID
   * @returns {Promise<Object|null>} Updated coupon
   */
  async incrementUsage(couponId) {
    try {
      const doc = await this.model.findByIdAndUpdate(
        couponId,
        { $inc: { currentUses: 1 } },
        { new: true }
      );
      return this.toObject(doc);
    } catch (error) {
      throw new Error(`Error incrementing coupon usage: ${error.message}`);
    }
  }

  /**
   * Decrement coupon usage
   * @param {string} couponId - Coupon ID
   * @returns {Promise<Object|null>} Updated coupon
   */
  async decrementUsage(couponId) {
    try {
      const doc = await this.model.findByIdAndUpdate(
        couponId,
        { $inc: { currentUses: -1 } },
        { new: true }
      );
      return this.toObject(doc);
    } catch (error) {
      throw new Error(`Error decrementing coupon usage: ${error.message}`);
    }
  }
}

module.exports = new CouponRepository();


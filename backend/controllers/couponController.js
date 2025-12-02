const BaseController = require('./BaseController');
const CouponService = require('../services/CouponService');

/**
 * CouponController - Handles coupon endpoints
 * Follows Single Responsibility Principle - only handles HTTP requests/responses
 * Follows Dependency Inversion Principle - depends on service abstractions
 */
class CouponController extends BaseController {
  constructor() {
    super();
    this.couponService = CouponService;
  }

  /**
   * Create Coupon
   * Delegates business logic to CouponService
   */
  createCoupon = async (req, res) => {
    try {
      const ownerId = req.user.userId;
      const { hotelId, code, discountPercentage, validFrom, validTo, maxUses } = req.body;

      if (!hotelId || !code || discountPercentage === undefined || !validFrom || !validTo) {
        return this.fail(res, 400, 'hotelId, code, discountPercentage, validFrom, and validTo are required');
      }

      const coupon = await this.couponService.createCoupon({
        hotelId,
        code,
        discountPercentage,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        maxUses: maxUses || null
      }, ownerId);

      return this.created(res, {
        message: 'Coupon created successfully',
        coupon
      });
    } catch (error) {
      console.error('Create coupon error:', error);
      const status = error.message.includes('not found') || error.message.includes('permission') ? 404 :
        error.message.includes('already exists') || error.message.includes('Invalid') ? 400 :
          error.message.includes('suspended') ? 403 : 500;
      return this.fail(res, status, error.message || 'Server error while creating coupon');
    }
  };

  /**
   * Get Hotel Coupons
   */
  getHotelCoupons = async (req, res) => {
    try {
      const ownerId = req.user.userId;
      const { hotelId } = req.params;

      const coupons = await this.couponService.getHotelCoupons(hotelId, ownerId);

      return this.ok(res, {
        count: coupons.length,
        coupons
      });
    } catch (error) {
      console.error('Get hotel coupons error:', error);
      const status = error.message.includes('not found') || error.message.includes('permission') ? 404 : 500;
      return this.fail(res, status, error.message || 'Server error while fetching coupons');
    }
  };

  /**
   * Get Coupon Details
   */
  getCouponDetails = async (req, res) => {
    try {
      const ownerId = req.user.userId;
      const { couponId } = req.params;
      const coupon = await this.couponService.getCoupon(couponId, ownerId);
      return this.ok(res, { coupon });
    } catch (error) {
      console.error('Get coupon details error:', error);
      return this.fail(res, 500, error.message || 'Server error while fetching coupon details');
    }
  };

  /**
   * Update Coupon
   */
  updateCoupon = async (req, res) => {
    try {
      const ownerId = req.user.userId;
      const { couponId } = req.params;
      const { discountPercentage, validFrom, validTo, maxUses, isActive } = req.body;

      const updateData = {};
      if (discountPercentage !== undefined) updateData.discountPercentage = discountPercentage;
      if (validFrom) updateData.validFrom = new Date(validFrom);
      if (validTo) updateData.validTo = new Date(validTo);
      if (maxUses !== undefined) updateData.maxUses = maxUses;
      if (isActive !== undefined) updateData.isActive = isActive;

      const coupon = await this.couponService.updateCoupon(couponId, updateData, ownerId);

      return this.ok(res, {
        message: 'Coupon updated successfully',
        coupon
      });
    } catch (error) {
      console.error('Update coupon error:', error);
      const status = error.message.includes('not found') ? 404 :
        error.message.includes('authorized') ? 403 : 500;
      return this.fail(res, status, error.message || 'Server error while updating coupon');
    }
  };

  /**
   * Delete Coupon
   */
  deleteCoupon = async (req, res) => {
    try {
      const ownerId = req.user.userId;
      const { couponId } = req.params;

      await this.couponService.deleteCoupon(couponId, ownerId);

      return this.ok(res, {
        message: 'Coupon deleted successfully'
      });
    } catch (error) {
      console.error('Delete coupon error:', error);
      const status = error.message.includes('not found') ? 404 :
        error.message.includes('authorized') ? 403 : 500;
      return this.fail(res, status, error.message || 'Server error while deleting coupon');
    }
  };
}

// Export singleton instance
const couponController = new CouponController();

module.exports = {
  createCoupon: couponController.createCoupon,
  getHotelCoupons: couponController.getHotelCoupons,
  getCouponDetails: couponController.getCouponDetails,
  updateCoupon: couponController.updateCoupon,
  deleteCoupon: couponController.deleteCoupon
};


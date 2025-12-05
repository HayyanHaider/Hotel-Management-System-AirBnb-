const BaseService = require('./BaseService');
const CouponRepository = require('../repositories/CouponRepository');
const HotelRepository = require('../repositories/HotelRepository');
const Coupon = require('../classes/Coupon');

/**
 * CouponService - Handles coupon business logic
 * Follows Single Responsibility Principle - only handles coupon operations
 * Follows Dependency Inversion Principle - depends on repository abstractions
 */
class CouponService extends BaseService {
  constructor(dependencies = {}) {
    super(dependencies);
    this.couponRepository = dependencies.couponRepository || CouponRepository;
    this.hotelRepository = dependencies.hotelRepository || HotelRepository;
  }

  /**
   * Create a new coupon
   */
  async createCoupon(couponData, ownerId) {
    try {
      this.validateRequired(couponData, ['hotelId', 'code', 'discountPercentage', 'validFrom', 'validTo']);
      this.validateRequired({ ownerId }, ['ownerId']);

      // Verify hotel ownership
      const hotel = await this.hotelRepository.findOne({ _id: couponData.hotelId, ownerId });
      if (!hotel) {
        throw new Error('Hotel not found or you do not have permission');
      }

      // Check if hotel is suspended
      if (hotel.isSuspended) {
        throw new Error('Cannot create coupons for a suspended hotel');
      }

      // Check if coupon code already exists
      const existingCoupon = await this.couponRepository.findByCode(couponData.code);
      if (existingCoupon) {
        throw new Error('Coupon code already exists');
      }

      // Validate coupon code format
      if (!Coupon.isValidCodeFormat(couponData.code.toUpperCase())) {
        throw new Error('Invalid coupon code format');
      }

      // Create coupon instance
      const couponInstance = new Coupon({
        hotelId: couponData.hotelId,
        code: couponData.code.toUpperCase(),
        discountPercentage: couponData.discountPercentage,
        validFrom: couponData.validFrom,
        validTo: couponData.validTo,
        maxUses: couponData.maxUses || null,
        currentUses: 0
      });

      // Validate coupon
      const validationErrors = couponInstance.validate();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Calculate active status based on dates and usage
      const calculatedIsActive = couponInstance.calculateActiveStatus();

      // Save coupon
      const savedCoupon = await this.couponRepository.create({
        hotelId: couponInstance.hotelId,
        code: couponInstance.code,
        discountPercentage: couponInstance.discountPercentage,
        validFrom: couponInstance.validFrom,
        validTo: couponInstance.validTo,
        maxUses: couponInstance.maxUses,
        currentUses: couponInstance.currentUses,
        isActive: calculatedIsActive // Set based on calculated status
      });

      couponInstance.id = savedCoupon._id || savedCoupon.id;

      return couponInstance.getPublicInfo();
    } catch (error) {
      this.handleError(error, 'Failed to create coupon');
    }
  }

  /**
   * Get coupons for a hotel
   */
  async getHotelCoupons(hotelId, ownerId) {
    try {
      if (!hotelId || !ownerId) {
        throw new Error('Hotel ID and Owner ID are required');
      }

      // Verify ownership
      const hotel = await this.hotelRepository.findOne({ _id: hotelId, ownerId });
      if (!hotel) {
        throw new Error('Hotel not found or you do not have permission');
      }

      const coupons = await this.couponRepository.findByHotel(hotelId, {
        sort: { createdAt: -1 }
      });

      return coupons.map(coupon => {
        const couponInstance = new Coupon(coupon);
        return couponInstance.getPublicInfo();
      });
    } catch (error) {
      this.handleError(error, 'Failed to fetch coupons');
    }
  }

  /**
   * Get single coupon
   */
  async getCoupon(couponId, ownerId) {
    try {
      if (!couponId || !ownerId) {
        throw new Error('Coupon ID and Owner ID are required');
      }

      const coupon = await this.couponRepository.findById(couponId);
      if (!coupon) {
        throw new Error('Coupon not found');
      }

      // Verify hotel ownership
      const hotel = await this.hotelRepository.findOne({ _id: coupon.hotelId, ownerId });
      if (!hotel) {
        throw new Error('Coupon not found or you do not have permission');
      }

      const couponInstance = new Coupon(coupon);
      return couponInstance.getPublicInfo();
    } catch (error) {
      this.handleError(error, 'Failed to fetch coupon');
    }
  }

  /**
   * Update coupon
   */
  async updateCoupon(couponId, updates, ownerId) {
    try {
      if (!couponId || !ownerId) {
        throw new Error('Coupon ID and Owner ID are required');
      }

      const coupon = await this.couponRepository.findById(couponId);
      if (!coupon) {
        throw new Error('Coupon not found');
      }

      // Verify hotel ownership
      const hotel = await this.hotelRepository.findOne({ _id: coupon.hotelId, ownerId });
      if (!hotel) {
        throw new Error('Not authorized to update this coupon');
      }

      const allowedFields = ['discountPercentage', 'validFrom', 'validTo', 'maxUses'];
      const updateData = {};

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      // Create a temporary instance to calculate active status
      // Convert coupon to plain object if it's a Mongoose document
      const couponPlain = coupon.toObject ? coupon.toObject() : coupon;
      const tempCouponData = {
        ...couponPlain,
        ...updateData
      };
      const tempCouponInstance = new Coupon(tempCouponData);
      
      // Recalculate active status based on updated dates and usage
      updateData.isActive = tempCouponInstance.calculateActiveStatus();

      const updatedCoupon = await this.couponRepository.updateById(couponId, updateData);
      const couponInstance = new Coupon(updatedCoupon);

      return couponInstance.getPublicInfo();
    } catch (error) {
      this.handleError(error, 'Failed to update coupon');
    }
  }

  /**
   * Delete coupon
   */
  async deleteCoupon(couponId, ownerId) {
    try {
      if (!couponId || !ownerId) {
        throw new Error('Coupon ID and Owner ID are required');
      }

      const coupon = await this.couponRepository.findById(couponId);
      if (!coupon) {
        throw new Error('Coupon not found');
      }

      // Verify hotel ownership
      const hotel = await this.hotelRepository.findOne({ _id: coupon.hotelId, ownerId });
      if (!hotel) {
        throw new Error('Not authorized to delete this coupon');
      }

      await this.couponRepository.deleteById(couponId);
      return true;
    } catch (error) {
      this.handleError(error, 'Failed to delete coupon');
    }
  }
}

module.exports = new CouponService();


const CouponModel = require('../models/couponModel');
const HotelModel = require('../models/hotelModel');
const Coupon = require('../classes/Coupon');

// Create Coupon Controller
const createCoupon = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { hotelId, code, discountPercentage, validFrom, validTo, maxUses } = req.body;

    // Debug logging
    console.log('Create coupon request body:', req.body);
    console.log('Extracted hotelId:', hotelId);

    if (!hotelId || !code || discountPercentage === undefined || !validFrom || !validTo) {
      return res.status(400).json({
        success: false,
        message: 'hotelId, code, discountPercentage, validFrom, and validTo are required',
        received: { hotelId, code, discountPercentage, validFrom, validTo }
      });
    }

    // Verify hotel ownership
    const hotel = await HotelModel.findOne({ _id: hotelId, ownerId });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found or you do not have permission'
      });
    }

    // Check if hotel is suspended
    if (hotel.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Cannot create coupons for a suspended hotel'
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await CouponModel.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    // Validate coupon code format
    if (!Coupon.isValidCodeFormat(code.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code must be 3-20 characters, uppercase alphanumeric'
      });
    }

    // Create coupon instance using OOP
    const couponData = {
      hotelId,
      code: code.toUpperCase(),
      discountPercentage,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      maxUses: maxUses || null
    };

    const couponInstance = new Coupon(couponData);

    // Validate using OOP method
    const validationErrors = couponInstance.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Save to database
    const newCoupon = new CouponModel({
      hotelId: couponInstance.hotelId,
      code: couponInstance.code,
      discountPercentage: couponInstance.discountPercentage,
      validFrom: couponInstance.validFrom,
      validTo: couponInstance.validTo,
      isActive: true,
      maxUses: couponInstance.maxUses || null,
      currentUses: 0
    });

    await newCoupon.save();
    couponInstance.id = newCoupon._id;

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon: couponInstance.getSummary()
    });

  } catch (error) {
    console.error('Create coupon error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating coupon'
    });
  }
};

// Get Coupons for Hotel Controller
const getHotelCoupons = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { hotelId } = req.params;

    // Verify hotel ownership
    const hotel = await HotelModel.findOne({ _id: hotelId, ownerId });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found or you do not have permission'
      });
    }

    // Check if hotel is suspended
    if (hotel.isSuspended) {
      return res.json({
        success: true,
        count: 0,
        coupons: [],
        message: 'Hotel is suspended. Coupons are not available.'
      });
    }

    const dbCoupons = await CouponModel.find({ hotelId }).sort({ createdAt: -1 });

    const couponsData = dbCoupons.map(dbCoupon => {
      const couponData = {
        id: dbCoupon._id,
        hotelId: dbCoupon.hotelId,
        code: dbCoupon.code,
        discountPercentage: dbCoupon.discountPercentage,
        validFrom: dbCoupon.validFrom,
        validTo: dbCoupon.validTo
      };
      const couponInstance = new Coupon(couponData);
      return {
        ...couponInstance.getSummary(),
        isActive: dbCoupon.isActive,
        maxUses: dbCoupon.maxUses,
        currentUses: dbCoupon.currentUses
      };
    });

    res.json({
      success: true,
      count: couponsData.length,
      coupons: couponsData
    });

  } catch (error) {
    console.error('Get hotel coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching coupons'
    });
  }
};

// Get Coupon Details Controller
const getCouponDetails = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { couponId } = req.params;

    const dbCoupon = await CouponModel.findById(couponId);
    if (!dbCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Verify hotel ownership
    const hotel = await HotelModel.findOne({ _id: dbCoupon.hotelId, ownerId });
    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this coupon'
      });
    }

    // Check if hotel is suspended
    if (hotel.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Cannot view coupons for a suspended hotel'
      });
    }

    const couponData = {
      id: dbCoupon._id,
      hotelId: dbCoupon.hotelId,
      code: dbCoupon.code,
      discountPercentage: dbCoupon.discountPercentage,
      validFrom: dbCoupon.validFrom,
      validTo: dbCoupon.validTo
    };

    const couponInstance = new Coupon(couponData);

    res.json({
      success: true,
      coupon: {
        ...couponInstance.getSummary(),
        isActive: dbCoupon.isActive,
        maxUses: dbCoupon.maxUses,
        currentUses: dbCoupon.currentUses
      }
    });

  } catch (error) {
    console.error('Get coupon details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching coupon details'
    });
  }
};

// Update Coupon Controller
const updateCoupon = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { couponId } = req.params;
    const { discountPercentage, validFrom, validTo, maxUses, isActive } = req.body;

    const dbCoupon = await CouponModel.findById(couponId);
    if (!dbCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Verify hotel ownership
    const hotel = await HotelModel.findOne({ _id: dbCoupon.hotelId, ownerId });
    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this coupon'
      });
    }

    // Check if hotel is suspended
    if (hotel.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update coupons for a suspended hotel'
      });
    }

    // Build update object
    const updateData = {};
    if (discountPercentage !== undefined) updateData.discountPercentage = discountPercentage;
    if (validFrom) updateData.validFrom = new Date(validFrom);
    if (validTo) updateData.validTo = new Date(validTo);
    if (maxUses !== undefined) updateData.maxUses = maxUses;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Validate updated data
    const couponData = {
      id: dbCoupon._id,
      hotelId: dbCoupon.hotelId,
      code: dbCoupon.code,
      discountPercentage: updateData.discountPercentage || dbCoupon.discountPercentage,
      validFrom: updateData.validFrom || dbCoupon.validFrom,
      validTo: updateData.validTo || dbCoupon.validTo
    };

    const couponInstance = new Coupon(couponData);
    const validationErrors = couponInstance.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Update in database
    await CouponModel.findByIdAndUpdate(couponId, updateData);

    const updatedCoupon = await CouponModel.findById(couponId);

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      coupon: {
        ...couponInstance.getSummary(),
        isActive: updatedCoupon.isActive,
        maxUses: updatedCoupon.maxUses,
        currentUses: updatedCoupon.currentUses
      }
    });

  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating coupon'
    });
  }
};

// Delete Coupon Controller
const deleteCoupon = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { couponId } = req.params;

    const dbCoupon = await CouponModel.findById(couponId);
    if (!dbCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Verify hotel ownership
    const hotel = await HotelModel.findOne({ _id: dbCoupon.hotelId, ownerId });
    if (!hotel) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this coupon'
      });
    }

    // Check if hotel is suspended
    if (hotel.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete coupons for a suspended hotel'
      });
    }

    await CouponModel.findByIdAndDelete(couponId);

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });

  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting coupon'
    });
  }
};

module.exports = {
  createCoupon,
  getHotelCoupons,
  getCouponDetails,
  updateCoupon,
  deleteCoupon
};


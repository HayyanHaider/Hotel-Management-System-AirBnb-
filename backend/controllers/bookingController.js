const BookingModel = require('../models/bookingModel');
const HotelModel = require('../models/hotelModel');
const CustomerModel = require('../models/customerModel');
const CouponModel = require('../models/couponModel');
const Coupon = require('../classes/Coupon');
const Booking = require('../classes/Booking');

// Create Booking Controller
const createBooking = async (req, res) => {
  try {
    const { hotelId, checkInDate, checkOutDate, guests } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    let customerDoc = await CustomerModel.findOne({ user: userId });
    
    // If customer document doesn't exist, create it automatically
    if (!customerDoc) {
      customerDoc = await CustomerModel.create({
        user: userId,
        loyaltyPoints: 0,
        bookingHistory: [],
        reviewsGiven: [],
        preferredLocations: []
      });
    }
    
    const customerId = customerDoc._id;

    // Debug logging
    console.log('Booking request body:', req.body);
    console.log('User ID:', userId);
    console.log('Customer ID:', customerId);

    if (!hotelId || !checkInDate || !checkOutDate || !guests) {
      return res.status(400).json({ 
        success: false, 
        message: 'hotelId, checkInDate, checkOutDate, and guests are required',
        received: {
          hotelId: !!hotelId,
          checkInDate: !!checkInDate,
          checkOutDate: !!checkOutDate,
          guests: !!guests
        }
      });
    }

    const hotel = await HotelModel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    // Check if hotel is approved and not suspended
    if (!hotel.isApproved) {
      return res.status(400).json({ success: false, message: 'Hotel is not approved yet' });
    }
    if (hotel.isSuspended) {
      return res.status(400).json({ success: false, message: 'Hotel is currently suspended' });
    }

    // Check hotel capacity
    const maxGuests = hotel.capacity?.guests || 1;
    if (parseInt(guests) > maxGuests) {
      return res.status(400).json({ 
        success: false, 
        message: `Hotel can only accommodate ${maxGuests} guests` 
      });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    // Validate dates
    if (checkIn >= checkOut) {
      return res.status(400).json({ success: false, message: 'Check-out date must be after check-in date' });
    }
    if (checkIn < new Date()) {
      return res.status(400).json({ success: false, message: 'Check-in date cannot be in the past' });
    }

    // Calculate nights: For hotel bookings, nights = days difference - 1
    // Check-in Nov 10, check-out Nov 11: 1 day difference = 1 night (Nov 10 night)
    // Check-in Nov 10, check-out Nov 12: 2 days difference = 1 night (Nov 10 night)
    // Check-in Nov 10, check-out Nov 13: 3 days difference = 2 nights (Nov 10 + Nov 11 nights)
    const daysDiff = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
    const nights = Math.max(1, Math.floor(daysDiff) - 1);

    // Check room availability - count overlapping bookings for each day
    const totalRooms = hotel.totalRooms || 1;
    const overlappingBookings = await BookingModel.find({
      hotelId: hotelId,
      status: { $in: ['pending', 'confirmed', 'active'] },
      $or: [
        { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }
      ]
    });

    // Check room availability for each day in the booking period
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    
    // Check each day from check-in to check-out
    for (let date = new Date(checkInTime); date < checkOutTime; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);
      
      // Count bookings that overlap with this specific day
      const bookingsOnThisDay = overlappingBookings.filter(booking => {
        const bookingCheckIn = new Date(booking.checkIn);
        const bookingCheckOut = new Date(booking.checkOut);
        bookingCheckIn.setHours(0, 0, 0, 0);
        bookingCheckOut.setHours(0, 0, 0, 0);
        
        // Check if this day falls within the booking period
        return currentDate >= bookingCheckIn && currentDate < bookingCheckOut;
      });
      
      // Each booking uses 1 room
      const roomsBookedOnThisDay = bookingsOnThisDay.length;
      
      // Check if there are available rooms for this day
      if (roomsBookedOnThisDay >= totalRooms) {
        const dateStr = currentDate.toLocaleDateString();
        return res.status(400).json({ 
          success: false, 
          message: `Hotel is fully booked on ${dateStr}. Only ${totalRooms} room(s) available.` 
        });
      }
    }

    // Calculate price (no taxes)
    const basePrice = hotel.pricing?.basePrice || 0;
    const cleaningFee = hotel.pricing?.cleaningFee || 0;
    const serviceFee = hotel.pricing?.serviceFee || 0;
    const subtotal = (basePrice * nights) + cleaningFee + serviceFee;
    const taxes = 0; // No taxes
    
    // Automatically find and apply available coupon (first-come-first-serve)
    let appliedCoupon = null;
    let discounts = 0;
    let couponId = null;
    
    // Find available coupons for this hotel
    const now = new Date();
    const availableCoupons = await CouponModel.find({
      hotelId: hotelId,
      isActive: true,
      validFrom: { $lte: now },
      validTo: { $gte: now },
      $or: [
        { maxUses: null }, // No limit
        { $expr: { $lt: ['$currentUses', '$maxUses'] } } // Has remaining uses
      ]
    }).sort({ createdAt: 1 }); // First-come-first-serve: oldest first
    
    if (availableCoupons.length > 0) {
      // Apply the first available coupon
      const couponDoc = availableCoupons[0];
      const couponData = {
        id: couponDoc._id,
        hotelId: couponDoc.hotelId,
        code: couponDoc.code,
        discountPercentage: couponDoc.discountPercentage,
        validFrom: couponDoc.validFrom,
        validTo: couponDoc.validTo,
        maxUses: couponDoc.maxUses
      };
      
      const couponInstance = new Coupon(couponData);
      
      if (couponInstance.isValid()) {
        // Calculate discount on subtotal (before taxes)
        discounts = couponInstance.calculateDiscount(subtotal);
        appliedCoupon = {
          id: couponDoc._id,
          code: couponDoc.code,
          discountPercentage: couponDoc.discountPercentage,
          discountAmount: discounts
        };
        couponId = couponDoc._id;
        
        // Note: Coupon usage count will be incremented only when payment is processed
        // This ensures the coupon is only "used" when payment is confirmed
        
        console.log(`Applied coupon ${couponDoc.code} (${couponDoc.discountPercentage}% off) - Discount: $${discounts.toFixed(2)}`);
      }
    }
    
    const totalPrice = subtotal + taxes - discounts;

    // Create booking
    const newBooking = await BookingModel.create({
      userId: customerId,
      hotelId: hotelId,
      couponId: couponId,
      checkIn,
      checkOut,
      nights,
      guests: parseInt(guests),
      taxes,
      discounts,
      totalPrice,
      status: 'pending',
      priceSnapshot: {
        basePricePerDay: basePrice,
        nights: nights,
        basePriceTotal: basePrice * nights,
        cleaningFee: cleaningFee,
        serviceFee: serviceFee,
        subtotal: subtotal,
        taxes: 0, // No taxes
        discounts: discounts,
        totalPrice: totalPrice,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        couponDiscountPercentage: appliedCoupon ? appliedCoupon.discountPercentage : null
      }
    });

    const bookingResponse = await BookingModel.findById(newBooking._id)
      .populate('hotelId', 'name location')
      .populate('couponId', 'code discountPercentage');

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: bookingResponse,
      appliedCoupon: appliedCoupon ? {
        code: appliedCoupon.code,
        discountPercentage: appliedCoupon.discountPercentage,
        discountAmount: appliedCoupon.discountAmount
      } : null
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating booking' });
  }
};

// Get User Bookings Controller
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Find customer document
    let customerDoc = await CustomerModel.findOne({ user: userId });
    if (!customerDoc) {
      customerDoc = await CustomerModel.create({
        user: userId,
        loyaltyPoints: 0,
        bookingHistory: [],
        reviewsGiven: [],
        preferredLocations: []
      });
    }
    const customerId = customerDoc._id;

    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId: customerId };
    if (status) query.status = status;

    const dbBookings = await BookingModel.find(query)
      .populate('hotelId', 'name location')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    return res.json({ success: true, count: dbBookings.length, bookings: dbBookings });
  } catch (error) {
    console.error('Get user bookings error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching bookings' });
  }
};

// Cancel Booking Controller
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason = '' } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Find customer document
    let customerDoc = await CustomerModel.findOne({ user: userId });
    if (!customerDoc) {
      return res.status(404).json({ success: false, message: 'Customer profile not found' });
    }
    const customerId = customerDoc._id;

    const dbBooking = await BookingModel.findOne({ _id: bookingId, userId: customerId });
    if (!dbBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

        // Allow pending bookings to be cancelled without restrictions
        if (dbBooking.status === 'pending') {
          // Note: No need to decrement coupon usage for pending bookings
          // because coupon usage is only incremented when payment is processed
          
          await BookingModel.findByIdAndUpdate(bookingId, {
            status: 'cancelled',
            cancelledAt: new Date()
          });
          return res.json({ success: true, message: 'Booking cancelled successfully' });
        }

    // For confirmed bookings, check 24-hour rule
    if (dbBooking.status === 'confirmed') {
      const hoursUntilCheckIn = (dbBooking.checkIn - new Date()) / (1000 * 60 * 60);
      if (hoursUntilCheckIn <= 24) {
        return res.status(400).json({ success: false, message: 'Cannot cancel within 24 hours of check-in' });
      }
    }

    // Don't allow cancellation of already cancelled or completed bookings
    if (dbBooking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    if (dbBooking.status === 'completed' || dbBooking.status === 'checked-out') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed booking' });
    }

    // Decrement coupon usage if coupon was applied and payment was made
    // Only decrement if booking was confirmed (payment was processed)
    if (dbBooking.couponId && dbBooking.status === 'confirmed') {
      await CouponModel.findByIdAndUpdate(dbBooking.couponId, {
        $inc: { currentUses: -1 }
      });
      console.log(`Coupon usage decremented for coupon ${dbBooking.couponId} after booking cancellation`);
    }

    await BookingModel.findByIdAndUpdate(bookingId, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationPolicyApplied: '24h-before-check-in',
      cancellationFee: 0,
      refundAmount: dbBooking.priceSnapshot?.totalPrice || dbBooking.totalPrice
    });

    return res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error while cancelling booking' });
  }
};

// Get Booking Details Controller
const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Find customer document
    let customerDoc = await CustomerModel.findOne({ user: userId });
    if (!customerDoc) {
      // Create customer document if it doesn't exist
      customerDoc = await CustomerModel.create({
        user: userId,
        loyaltyPoints: 0,
        bookingHistory: [],
        reviewsGiven: [],
        preferredLocations: []
      });
    }
    const customerId = customerDoc._id;

        const dbBooking = await BookingModel.findOne({ _id: bookingId, userId: customerId })
          .populate('hotelId', 'name location contactInfo')
          .populate('couponId', 'code discountPercentage');

    if (!dbBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.json({ success: true, booking: dbBooking });
  } catch (error) {
    console.error('Get booking details error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching booking details' });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  cancelBooking,
  getBookingDetails
};

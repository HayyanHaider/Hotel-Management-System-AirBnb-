const BookingModel = require('../models/bookingModel');
const HotelModel = require('../models/hotelModel');
const CustomerModel = require('../models/customerModel');
const CouponModel = require('../models/couponModel');
const UserModel = require('../models/userModel');
const PaymentModel = require('../models/paymentModel');
const Coupon = require('../classes/Coupon');
const Booking = require('../classes/Booking');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const { generateInvoicePDF } = require('../utils/pdfService');
const path = require('path');
const fs = require('fs');

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
        reviewsGiven: []
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
    
    // Normalize dates to midnight to avoid timezone issues
    const checkInDateNormalized = new Date(checkIn);
    const checkOutDateNormalized = new Date(checkOut);
    checkInDateNormalized.setHours(0, 0, 0, 0);
    checkOutDateNormalized.setHours(0, 0, 0, 0);
    
    // Set time to midnight for date-only comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Validate dates
    if (checkInDateNormalized >= checkOutDateNormalized) {
      return res.status(400).json({ success: false, message: 'Check-out date must be after check-in date' });
    }
    if (checkInDateNormalized < today) {
      return res.status(400).json({ success: false, message: 'Check-in date cannot be in the past' });
    }

    // Calculate nights: check-out date minus check-in date gives the number of nights
    // Check-in Nov 22, check-out Nov 24: 2 days = 2 nights
    const daysDiff = (checkOutDateNormalized - checkInDateNormalized) / (1000 * 60 * 60 * 24);
    const nights = Math.max(1, Math.floor(daysDiff));

    // Check room availability - count overlapping bookings for each day
    // Only count confirmed/active bookings (exclude pending bookings since payment wasn't made)
    const totalRooms = hotel.totalRooms || 1;
    const overlappingBookings = await BookingModel.find({
      hotelId: hotelId,
      status: { $in: ['confirmed', 'active', 'checked-in'] }, // Exclude 'pending' - only count paid bookings
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
        
        // Reserve the coupon by incrementing usage count when booking is created
        // This ensures the coupon is reserved even if payment isn't completed yet
        // If booking is cancelled, the usage will be decremented to release it
        await CouponModel.findByIdAndUpdate(couponDoc._id, {
          $inc: { currentUses: 1 }
        });
        console.log(`Coupon usage incremented for coupon ${couponDoc._id} when booking was created (reserved)`);
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
        reviewsGiven: []
      });
    }
    const customerId = customerDoc._id;

    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId: customerId };
    if (status) {
      query.status = status;
    } else {
      // By default, exclude pending bookings (only show bookings after payment)
      query.status = { $ne: 'pending' };
    }

    const dbBookings = await BookingModel.find(query)
      .populate({
        path: 'hotelId',
        select: 'name location isSuspended',
        match: { isSuspended: { $ne: true } } // Filter out suspended hotels
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Filter out bookings where hotel is null (suspended hotels) and pending bookings
    const filteredBookings = dbBookings.filter(booking => 
      booking.hotelId !== null && booking.status !== 'pending'
    );

    return res.json({ success: true, count: filteredBookings.length, bookings: filteredBookings });
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
          // Decrement coupon usage if coupon was applied (to release the reserved coupon)
          if (dbBooking.couponId) {
            await CouponModel.findByIdAndUpdate(dbBooking.couponId, {
              $inc: { currentUses: -1 }
            });
            console.log(`Coupon usage decremented for coupon ${dbBooking.couponId} after pending booking cancellation (released)`);
          }
          
          // Delete the pending booking since payment wasn't made
          await BookingModel.findByIdAndDelete(bookingId);

          // Send cancellation email for pending bookings too
          try {
            const updatedBooking = await BookingModel.findById(bookingId)
              .populate('hotelId', 'name location address');
            
            const user = await UserModel.findById(userId);
            
            if (user && updatedBooking && updatedBooking.hotelId) {
              console.log('📧 Sending cancellation email for pending booking:', bookingId);
              
              const emailTemplate = emailTemplates.cancellationEmail(
                updatedBooking,
                updatedBooking.hotelId,
                { name: user.name, email: user.email },
                null // No refund for pending bookings
              );
              
              sendEmail(
                user.email,
                emailTemplate.subject,
                emailTemplate.html,
                emailTemplate.text,
                {
                  userId: userId,
                  useUserGmail: true
                }
              )
                .then(result => {
                  if (result.success) {
                    console.log(`✅ Cancellation email sent ${result.sentFrom === 'user_gmail' ? 'from user Gmail account' : 'from system account'}`);
                  }
                })
                .catch(err => console.error('❌ Error sending cancellation email:', err));
            }
          } catch (emailError) {
            console.error('Error sending cancellation email:', emailError);
          }

          return res.json({ success: true, message: 'Pending booking removed successfully' });
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
    // This applies to confirmed bookings where payment was processed and coupon usage was incremented
    if (dbBooking.couponId && dbBooking.status === 'confirmed') {
      await CouponModel.findByIdAndUpdate(dbBooking.couponId, {
        $inc: { currentUses: -1 }
      });
      console.log(`Coupon usage decremented for coupon ${dbBooking.couponId} after booking cancellation`);
    }

    const refundAmount = dbBooking.priceSnapshot?.totalPrice || dbBooking.totalPrice;

    await BookingModel.findByIdAndUpdate(bookingId, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationPolicyApplied: '24h-before-check-in',
      cancellationFee: 0,
      refundAmount: refundAmount
    });

    // Send cancellation email to customer (async)
    try {
      const updatedBooking = await BookingModel.findById(bookingId)
        .populate('hotelId', 'name location address')
        .populate('couponId', 'code discountPercentage');
      
      const user = await UserModel.findById(userId);
      
      if (user && updatedBooking && updatedBooking.hotelId) {
        console.log('📧 Sending cancellation email for booking:', bookingId);
        
        const emailTemplate = emailTemplates.cancellationEmail(
          updatedBooking,
          updatedBooking.hotelId,
          { name: user.name, email: user.email },
          refundAmount
        );
        
        sendEmail(
          user.email,
          emailTemplate.subject,
          emailTemplate.html,
          emailTemplate.text,
          {
            userId: userId,
            useUserGmail: true // Try to use user's Gmail account
          }
        )
          .then(result => {
            if (result.success) {
              console.log(`✅ Cancellation email sent ${result.sentFrom === 'user_gmail' ? 'from user Gmail account' : 'from system account'}`);
            } else {
              console.error('❌ Failed to send cancellation email:', result.error || result.message);
            }
          })
          .catch(err => {
            console.error('❌ Error sending cancellation email:', err);
          });
      }
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
      // Don't fail the request if email fails
    }

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
        reviewsGiven: []
      });
    }
    const customerId = customerDoc._id;

        const dbBooking = await BookingModel.findOne({ _id: bookingId, userId: customerId })
          .populate({
            path: 'hotelId',
            select: 'name location contactInfo isSuspended',
            match: { isSuspended: { $ne: true } } // Filter out suspended hotels
          })
          .populate('couponId', 'code discountPercentage');

    if (!dbBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // If hotel is null (suspended), return 404
    if (!dbBooking.hotelId) {
      return res.status(404).json({ success: false, message: 'Booking not found or hotel is suspended' });
    }

    return res.json({ success: true, booking: dbBooking });
  } catch (error) {
    console.error('Get booking details error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching booking details' });
  }
};

// Reschedule Booking Controller
const rescheduleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { checkInDate, checkOutDate } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'checkInDate and checkOutDate are required' 
      });
    }

    // Find customer document
    let customerDoc = await CustomerModel.findOne({ user: userId });
    if (!customerDoc) {
      return res.status(404).json({ success: false, message: 'Customer profile not found' });
    }
    const customerId = customerDoc._id;

    const dbBooking = await BookingModel.findOne({ _id: bookingId, userId: customerId })
      .populate('hotelId');
    if (!dbBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only allow rescheduling for pending or confirmed bookings
    if (dbBooking.status !== 'pending' && dbBooking.status !== 'confirmed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only reschedule pending or confirmed bookings' 
      });
    }

    // Validate new dates
    const newCheckIn = new Date(checkInDate);
    const newCheckOut = new Date(checkOutDate);
    
    // Set time to midnight for date-only comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newCheckInDateOnly = new Date(newCheckIn);
    newCheckInDateOnly.setHours(0, 0, 0, 0);
    const newCheckOutDateOnly = new Date(newCheckOut);
    newCheckOutDateOnly.setHours(0, 0, 0, 0);
    
    if (newCheckInDateOnly >= newCheckOutDateOnly) {
      return res.status(400).json({ 
        success: false, 
        message: 'Check-out date must be after check-in date' 
      });
    }
    
    if (newCheckInDateOnly < today) {
      return res.status(400).json({ 
        success: false, 
        message: 'Check-in date cannot be in the past' 
      });
    }

    // Calculate new nights
    // Use the date-only versions for accurate day calculation
    const daysDiff = (newCheckOutDateOnly - newCheckInDateOnly) / (1000 * 60 * 60 * 24);
    const newNights = Math.max(1, Math.floor(daysDiff));

    // Check availability for new dates
    // Only count confirmed/active bookings (exclude pending bookings since payment wasn't made)
    const hotel = dbBooking.hotelId;
    const totalRooms = hotel.totalRooms || 1;
    const overlappingBookings = await BookingModel.find({
      hotelId: hotel._id,
      _id: { $ne: bookingId }, // Exclude current booking
      status: { $in: ['confirmed', 'active', 'checked-in'] }, // Exclude 'pending' - only count paid bookings
      $or: [
        { checkIn: { $lt: newCheckOut }, checkOut: { $gt: newCheckIn } }
      ]
    });

    // Check room availability for each day in the new booking period
    for (let date = new Date(newCheckIn); date < newCheckOut; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);
      
      const bookingsOnThisDay = overlappingBookings.filter(booking => {
        const bookingCheckIn = new Date(booking.checkIn);
        const bookingCheckOut = new Date(booking.checkOut);
        bookingCheckIn.setHours(0, 0, 0, 0);
        bookingCheckOut.setHours(0, 0, 0, 0);
        
        return currentDate >= bookingCheckIn && currentDate < bookingCheckOut;
      });
      
      const roomsBookedOnThisDay = bookingsOnThisDay.length;
      
      if (roomsBookedOnThisDay >= totalRooms) {
        const dateStr = currentDate.toLocaleDateString();
        return res.status(400).json({ 
          success: false, 
          message: `Hotel is fully booked on ${dateStr}. Please choose different dates.` 
        });
      }
    }

    // Recalculate price if needed (using original pricing)
    const basePrice = dbBooking.priceSnapshot?.basePricePerDay || hotel.pricing?.basePrice || 0;
    const cleaningFee = dbBooking.priceSnapshot?.cleaningFee || hotel.pricing?.cleaningFee || 0;
    const serviceFee = dbBooking.priceSnapshot?.serviceFee || hotel.pricing?.serviceFee || 0;
    const subtotal = (basePrice * newNights) + cleaningFee + serviceFee;
    
    // Apply same discount if coupon was used
    let discounts = 0;
    if (dbBooking.couponId && dbBooking.priceSnapshot?.couponDiscountPercentage) {
      discounts = subtotal * (dbBooking.priceSnapshot.couponDiscountPercentage / 100);
    }
    
    const newTotalPrice = subtotal - discounts;

    // Update booking
    await BookingModel.findByIdAndUpdate(bookingId, {
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      nights: newNights,
      totalPrice: newTotalPrice,
      discounts: discounts,
      'priceSnapshot.nights': newNights,
      'priceSnapshot.basePriceTotal': basePrice * newNights,
      'priceSnapshot.subtotal': subtotal,
      'priceSnapshot.discounts': discounts,
      'priceSnapshot.totalPrice': newTotalPrice
    });

    const updatedBooking = await BookingModel.findById(bookingId)
      .populate('hotelId', 'name location')
      .populate('couponId', 'code discountPercentage');

    // Send reschedule email to customer
    try {
      const user = await UserModel.findById(userId);
      if (user && updatedBooking && updatedBooking.hotelId) {
        console.log('📧 Sending reschedule email for booking:', bookingId);
        
        // Store old dates for email
        const oldCheckIn = dbBooking.checkIn;
        const oldCheckOut = dbBooking.checkOut;
        const oldNights = dbBooking.nights || 1;
        
        const emailTemplate = emailTemplates.rescheduleEmail(
          updatedBooking,
          updatedBooking.hotelId,
          { name: user.name, email: user.email },
          oldCheckIn,
          oldCheckOut,
          oldNights
        );
        
        await sendEmail(
          user.email,
          emailTemplate.subject,
          emailTemplate.html,
          emailTemplate.text,
          {
            userId: userId,
            useUserGmail: true // Try to use user's Gmail account
          }
        );
        
        console.log(`✅ Reschedule email sent to customer: ${user.email}`);
      }
    } catch (emailError) {
      console.error('❌ Error sending reschedule email:', emailError);
      // Don't fail the reschedule if email fails
    }

    // Regenerate invoice if payment was already made
    if (dbBooking.invoicePath) {
      try {
        // Get user information
        const user = await UserModel.findById(userId);
        if (!user) {
          console.error('User not found for invoice generation');
        } else {
          // Get payment information if available
          const payment = await PaymentModel.findOne({ bookingId: bookingId, status: 'completed' })
            .sort({ createdAt: -1 });

          // Create invoice directory if it doesn't exist
          const invoiceDir = path.join(__dirname, '../invoices');
          if (!fs.existsSync(invoiceDir)) {
            fs.mkdirSync(invoiceDir, { recursive: true });
          }

          const invoiceFileName = `invoice-${bookingId}-${Date.now()}.pdf`;
          const invoicePath = path.join(invoiceDir, invoiceFileName);

          // Prepare invoice data
          const invoiceData = {
            invoiceNumber: `INV-${bookingId}-${Date.now()}`,
            date: new Date(),
            bookingId: bookingId,
            customer: {
              name: user.name || 'Customer',
              email: user.email || '',
              phone: user.phone || ''
            },
            hotel: {
              name: updatedBooking.hotelId?.name || 'Hotel',
              address: updatedBooking.hotelId?.location?.address || ''
            },
            checkIn: newCheckIn,
            checkOut: newCheckOut,
            nights: newNights,
            guests: updatedBooking.guests || 1,
            basePrice: basePrice * newNights,
            cleaningFee: cleaningFee,
            serviceFee: serviceFee,
            discount: discounts,
            couponCode: updatedBooking.couponId?.code || dbBooking.priceSnapshot?.couponCode,
            total: newTotalPrice,
            currency: 'PKR',
            payment: payment ? {
              method: payment.method || payment.paymentMethod || 'N/A',
              transactionId: payment.transactionId || 'N/A',
              date: payment.createdAt || payment.processedAt || new Date()
            } : undefined
          };

          // Generate new invoice PDF
          await generateInvoicePDF(invoiceData, invoicePath);

          // Update booking with new invoice path
          await BookingModel.findByIdAndUpdate(bookingId, {
            invoicePath: invoiceFileName
          });

          console.log('Invoice regenerated for rescheduled booking:', invoiceFileName);

          if (payment) {
            const paymentMethodLabelMap = {
              card: 'Credit/Debit Card',
              paypal: 'PayPal',
              wallet: 'Wallet',
              bank_transfer: 'Bank Transfer',
            };
            const paymentMethodLabel = paymentMethodLabelMap[payment.method] || payment.method || 'N/A';
            const invoiceBaseUrl =
              process.env.BACKEND_BASE_URL ||
              process.env.API_BASE_URL ||
              process.env.SERVER_URL ||
              process.env.APP_URL ||
              process.env.BASE_URL ||
              `${req.protocol}://${req.get('host')}`;
            const normalizedInvoiceBaseUrl = invoiceBaseUrl.replace(/\/$/, '');
            const invoicePublicUrl = `${normalizedInvoiceBaseUrl}/invoices/${invoiceFileName}`;
            let invoiceDataUri = null;
            try {
              const fileBuffer = fs.readFileSync(invoicePath);
              if (fileBuffer?.length) {
                invoiceDataUri = `data:application/pdf;base64,${fileBuffer.toString('base64')}`;
              }
            } catch (dataUriErr) {
              console.error('Error creating invoice data URI after reschedule:', dataUriErr);
            }
            const paymentDetailsForInvoice = {
              id: payment._id,
              amount: newTotalPrice,
              method: paymentMethodLabel,
              transactionId: payment.transactionId || 'N/A',
              processedAt: payment.processedAt || payment.createdAt || new Date(),
              currency: 'PKR'
            };

            const invoiceEmailTemplate = emailTemplates.invoiceEmail(
              paymentDetailsForInvoice,
              updatedBooking,
              updatedBooking.hotelId || {},
              { name: user.name, email: user.email },
              invoiceFileName,
              invoicePublicUrl,
              invoiceDataUri
            );

            const attachments = [];
            if (fs.existsSync(invoicePath)) {
              attachments.push({
                filename: `invoice-${bookingId}.pdf`,
                path: invoicePath
              });
            }

            await sendEmail(
              user.email,
              `Updated Invoice - ${invoiceEmailTemplate.subject}`,
              invoiceEmailTemplate.html,
              invoiceEmailTemplate.text,
              {
                userId,
                useUserGmail: true,
                attachments
              }
            );
            console.log(`✅ Updated invoice email sent to customer: ${user.email}`);
          }
        }
      } catch (invoiceError) {
        console.error('Error regenerating invoice after reschedule:', invoiceError);
        // Don't fail the reschedule if invoice generation fails
      }
    }

    return res.json({ 
      success: true, 
      message: 'Booking rescheduled successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while rescheduling booking' 
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  cancelBooking,
  getBookingDetails,
  rescheduleBooking
};

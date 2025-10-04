const BookingModel = require('../models/bookingModel');
const HotelModel = require('../models/hotelModel');
const RoomModel = require('../models/roomModel');
const BookingRoomModel = require('../models/bookingRoomModel');
const CustomerModel = require('../models/customerModel');
const Booking = require('../classes/Booking');

// Create Booking Controller
const createBooking = async (req, res) => {
  try {
    const { hotelId, roomId, checkInDate, checkOutDate, quantity = 1, couponId = null } = req.body;
    const userId = req.user.userId;
    const customerDoc = await CustomerModel.findOne({ user: userId });
    const customerId = customerDoc ? customerDoc._id : null;

    if (!hotelId || !roomId || !checkInDate || !checkOutDate || !customerId) {
      return res.status(400).json({ success: false, message: 'hotelId, roomId, checkInDate, checkOutDate are required' });
    }

    const room = await RoomModel.findById(roomId);
    const hotel = await HotelModel.findById(hotelId);
    if (!room || !hotel) {
      return res.status(404).json({ success: false, message: 'Room or hotel not found' });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));

    // Basic price computation (tax 0, discount 0 for now)
    const pricePerNight = room.pricePerNight;
    const subtotal = pricePerNight * nights * Number(quantity || 1);
    const taxes = 0;
    const discounts = 0;
    const totalPrice = subtotal + taxes - discounts;

    // Create booking
    const newBooking = await BookingModel.create({
      customer: customerId,
      hotel: hotelId,
      checkIn,
      checkOut,
      nights,
      priceSnapshot: {
        subtotal,
        taxes,
        discounts,
        coupon: couponId,
        totalPrice,
        currency: 'USD'
      },
      status: 'pending',
      confirmedBy: null,
      notificationsSent: { email: false, sms: false, push: false },
      availabilityChecked: true
    });

    // Create booking-room link
    const bookingRoom = await BookingRoomModel.create({ booking: newBooking._id, room: roomId, quantity: Number(quantity || 1) });
    await BookingModel.findByIdAndUpdate(newBooking._id, { $push: { rooms: bookingRoom._id } });

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: await BookingModel.findById(newBooking._id).populate('rooms')
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating booking' });
  }
};

// Get User Bookings Controller
const getUserBookings = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { customer: customerId };
    if (status) query.status = status;

    const dbBookings = await BookingModel.find(query)
      .populate('hotel', 'name address')
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
    const customerId = req.user.userId;

    const dbBooking = await BookingModel.findOne({ _id: bookingId, customer: customerId });
    if (!dbBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Simple cancellation rule: allow if >24h before check-in
    const hoursUntilCheckIn = (dbBooking.checkIn - new Date()) / (1000 * 60 * 60);
    if (hoursUntilCheckIn <= 24) {
      return res.status(400).json({ success: false, message: 'Cannot cancel within 24 hours of check-in' });
    }

    await BookingModel.findByIdAndUpdate(bookingId, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationPolicyApplied: '24h-before-check-in',
      cancellationFee: 0,
      refundAmount: dbBooking.priceSnapshot.totalPrice
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
    const customerId = req.user.userId;

    const dbBooking = await BookingModel.findOne({ _id: bookingId, customer: customerId })
      .populate('hotel', 'name address contactInfo');

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

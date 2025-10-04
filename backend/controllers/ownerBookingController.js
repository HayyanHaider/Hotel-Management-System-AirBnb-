const BookingModel = require('../models/bookingModel');
const HotelModel = require('../models/hotelModel');

// Confirm booking (owner)
const confirmBooking = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const hotel = await HotelModel.findById(booking.hotel);
    if (!hotel || String(hotel.owner) !== String(ownerId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await BookingModel.findByIdAndUpdate(bookingId, { status: 'confirmed', confirmedBy: 'hotel', confirmedAt: new Date() });
    return res.json({ success: true, message: 'Booking confirmed' });
  } catch (error) {
    console.error('confirmBooking error:', error);
    return res.status(500).json({ success: false, message: 'Server error while confirming booking' });
  }
};

// Reject booking (owner)
const rejectBooking = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const hotel = await HotelModel.findById(booking.hotel);
    if (!hotel || String(hotel.owner) !== String(ownerId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await BookingModel.findByIdAndUpdate(bookingId, { status: 'rejected' });
    return res.json({ success: true, message: 'Booking rejected' });
  } catch (error) {
    console.error('rejectBooking error:', error);
    return res.status(500).json({ success: false, message: 'Server error while rejecting booking' });
  }
};

// Check-in booking (owner)
const checkIn = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const hotel = await HotelModel.findById(booking.hotel);
    if (!hotel || String(hotel.owner) !== String(ownerId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await BookingModel.findByIdAndUpdate(bookingId, { status: 'checked-in', checkedInAt: new Date() });
    return res.json({ success: true, message: 'Guest checked in' });
  } catch (error) {
    console.error('checkIn error:', error);
    return res.status(500).json({ success: false, message: 'Server error during check-in' });
  }
};

// Check-out booking (owner)
const checkOut = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const hotel = await HotelModel.findById(booking.hotel);
    if (!hotel || String(hotel.owner) !== String(ownerId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await BookingModel.findByIdAndUpdate(bookingId, { status: 'checked-out', checkedOutAt: new Date() });
    return res.json({ success: true, message: 'Guest checked out' });
  } catch (error) {
    console.error('checkOut error:', error);
    return res.status(500).json({ success: false, message: 'Server error during check-out' });
  }
};

module.exports = { confirmBooking, rejectBooking, checkIn, checkOut };



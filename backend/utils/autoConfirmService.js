const BookingModel = require('../models/bookingModel');

// Auto-confirm pending bookings after 24 hours
const AUTO_CONFIRM_HOURS = 24;

const autoConfirmBookings = async () => {
  try {
    const autoConfirmTime = new Date();
    autoConfirmTime.setHours(autoConfirmTime.getHours() - AUTO_CONFIRM_HOURS);

    // Find pending bookings older than 24 hours
    const pendingBookings = await BookingModel.find({
      status: 'pending',
      createdAt: { $lte: autoConfirmTime },
      autoConfirmedAt: null
    })
      .populate('hotelId', 'name location ownerId')
      .populate('userId');

    console.log(`Found ${pendingBookings.length} bookings to auto-confirm`);

    for (const booking of pendingBookings) {
      try {
        // Auto-confirm the booking
        await BookingModel.findByIdAndUpdate(booking._id, {
          status: 'confirmed',
          confirmedAt: new Date(),
          autoConfirmedAt: new Date()
        });


        console.log(`Auto-confirmed booking ${booking._id}`);
      } catch (bookingError) {
        console.error(`Error auto-confirming booking ${booking._id}:`, bookingError);
      }
    }
  } catch (error) {
    console.error('Error in auto-confirm service:', error);
  }
};

// Run auto-confirm check every hour
const startAutoConfirmService = () => {
  // Run immediately on startup
  autoConfirmBookings();
  
  // Then run every hour
  setInterval(autoConfirmBookings, 60 * 60 * 1000);
  
  console.log('Auto-confirm service started (runs every hour)');
};

module.exports = {
  autoConfirmBookings,
  startAutoConfirmService
};


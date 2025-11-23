const BookingModel = require('../models/bookingModel');
const HotelModel = require('../models/hotelModel');
const UserModel = require('../models/userModel');
const CustomerModel = require('../models/customerModel');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// Confirm booking (owner)
const confirmBooking = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId)
      .populate('hotelId', 'name location')
      .populate('userId', 'name email');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const hotel = await HotelModel.findById(booking.hotelId || booking.hotel);
    if (!hotel || String(hotel.ownerId) !== String(ownerId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await BookingModel.findByIdAndUpdate(bookingId, { status: 'confirmed', confirmedBy: 'hotel', confirmedAt: new Date() });

    // Send confirmation email to customer
    try {
      if (booking.userId && booking.userId.email) {
        const customer = booking.userId;
        const updatedBooking = await BookingModel.findById(bookingId)
          .populate('hotelId', 'name location address')
          .populate('couponId', 'code discountPercentage');

        // Create a simple confirmation email (not invoice since payment might not be processed yet)
        const checkIn = new Date(updatedBooking.checkIn).toLocaleDateString();
        const checkOut = new Date(updatedBooking.checkOut).toLocaleDateString();
        const nights = updatedBooking.nights || 1;

        const emailTemplate = {
          subject: `Booking Confirmed - ${hotel.name || 'Hotel'} (${bookingId})`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .booking-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .detail-row:last-child { border-bottom: none; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Booking Confirmed!</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px;">Your reservation has been confirmed</p>
                </div>
                <div class="content">
                  <p>Dear ${customer.name || 'Customer'},</p>
                  <p style="font-size: 16px; color: #28a745; font-weight: bold;">✅ Your booking has been confirmed by the hotel!</p>
                  <p>We're excited to host you! Please find your booking details below:</p>
                  
                  <div class="booking-details">
                    <h2>Booking Information</h2>
                    <div class="detail-row">
                      <strong>Booking ID:</strong>
                      <span>${bookingId}</span>
                    </div>
                    <div class="detail-row">
                      <strong>Hotel:</strong>
                      <span>${hotel.name || 'Hotel'}</span>
                    </div>
                    <div class="detail-row">
                      <strong>Check-in:</strong>
                      <span>${checkIn}</span>
                    </div>
                    <div class="detail-row">
                      <strong>Check-out:</strong>
                      <span>${checkOut}</span>
                    </div>
                    <div class="detail-row">
                      <strong>Nights:</strong>
                      <span>${nights} ${nights === 1 ? 'night' : 'nights'}</span>
                    </div>
                    <div class="detail-row">
                      <strong>Guests:</strong>
                      <span>${updatedBooking.guests || 1} ${updatedBooking.guests === 1 ? 'guest' : 'guests'}</span>
                    </div>
                    <div class="detail-row">
                      <strong>Total Price:</strong>
                      <span>PKR ${updatedBooking.priceSnapshot?.totalPrice || updatedBooking.totalPrice || 0}</span>
                    </div>
                  </div>
                  
                  <p><strong>Hotel Address:</strong><br>${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}</p>
                  
                  <p>We look forward to hosting you!</p>
                  
                  <p>Best regards,<br>The Airbnb Team</p>
                </div>
                <div class="footer">
                  <p>This is an automated email. Please do not reply.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `Booking Confirmed!

Dear ${customer.name || 'Customer'},

✅ Your booking has been confirmed by the hotel!

Booking Information:
- Booking ID: ${bookingId}
- Hotel: ${hotel.name || 'Hotel'}
- Check-in: ${checkIn}
- Check-out: ${checkOut}
- Nights: ${nights} ${nights === 1 ? 'night' : 'nights'}
- Guests: ${updatedBooking.guests || 1} ${updatedBooking.guests === 1 ? 'guest' : 'guests'}
- Total Price: PKR ${updatedBooking.priceSnapshot?.totalPrice || updatedBooking.totalPrice || 0}

Hotel Address: ${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}

We look forward to hosting you!

Best regards,
The Airbnb Team`
        };

        await sendEmail(
          customer.email,
          emailTemplate.subject,
          emailTemplate.html,
          emailTemplate.text
        );

        console.log(`✅ Booking confirmation email sent to customer: ${customer.email}`);
      }
    } catch (emailError) {
      console.error('❌ Error sending booking confirmation email:', emailError);
      // Don't fail the confirmation if email fails
    }

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

    const hotel = await HotelModel.findById(booking.hotelId || booking.hotel);
    if (!hotel || String(hotel.ownerId) !== String(ownerId)) {
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

    const hotel = await HotelModel.findById(booking.hotelId || booking.hotel);
    if (!hotel || String(hotel.ownerId) !== String(ownerId)) {
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

    const hotel = await HotelModel.findById(booking.hotelId || booking.hotel);
    if (!hotel || String(hotel.ownerId) !== String(ownerId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await BookingModel.findByIdAndUpdate(bookingId, { status: 'checked-out', checkedOutAt: new Date() });
    return res.json({ success: true, message: 'Guest checked out' });
  } catch (error) {
    console.error('checkOut error:', error);
    return res.status(500).json({ success: false, message: 'Server error during check-out' });
  }
};

// Get Owner Bookings Controller
const getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { status } = req.query;

    // Get all hotels owned by this owner (excluding suspended hotels)
    const HotelModel = require('../models/hotelModel');
    const hotels = await HotelModel.find({ ownerId, isSuspended: { $ne: true } });
    const hotelIds = hotels.map(h => h._id);

    if (hotelIds.length === 0) {
      return res.json({ success: true, bookings: [] });
    }

    // Get all bookings for owner's hotels (only non-suspended hotels)
    const query = { hotelId: { $in: hotelIds } };
    if (status) {
      query.status = status;
    }

    const bookings = await BookingModel.find(query)
      .populate({
        path: 'hotelId',
        select: 'name address isSuspended',
        match: { isSuspended: { $ne: true } } // Filter out suspended hotels
      })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    // Filter out bookings where hotel is null (suspended hotels)
    const filteredBookings = bookings.filter(booking => booking.hotelId !== null);

    return res.json({ success: true, count: filteredBookings.length, bookings: filteredBookings });
  } catch (error) {
    console.error('getOwnerBookings error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching bookings' });
  }
};

module.exports = { getOwnerBookings, confirmBooking, rejectBooking, checkIn, checkOut };



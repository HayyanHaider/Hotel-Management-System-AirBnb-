const BookingModel = require('../models/bookingModel');
const HotelModel = require('../models/hotelModel');
const PaymentModel = require('../models/paymentModel');

// Get Earnings Dashboard Controller
const getEarningsDashboard = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { period = 'month' } = req.query; // 'day', 'week', 'month', 'year'

    // Get all hotels owned by this owner (excluding suspended hotels)
    const hotels = await HotelModel.find({ ownerId, isSuspended: { $ne: true } });
    const hotelIds = hotels.map(h => h._id);

    if (hotelIds.length === 0) {
      return res.json({
        success: true,
        earnings: {
          totalEarnings: 0,
          totalBookings: 0,
          averageBookingValue: 0,
          periodEarnings: 0,
          periodBookings: 0,
          hotels: []
        }
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get all bookings for owner's hotels (including pending to see all bookings)
    const allBookings = await BookingModel.find({
      hotelId: { $in: hotelIds },
      status: { $in: ['confirmed', 'checked-in', 'checked-out', 'completed'] }
    });

    console.log(`Found ${allBookings.length} confirmed bookings for owner ${ownerId}`);
    console.log(`Hotel IDs: ${hotelIds.map(id => id.toString()).join(', ')}`);

    // Get all payments for these bookings
    const bookingIds = allBookings.map(b => b._id);
    const payments = await PaymentModel.find({
      bookingId: { $in: bookingIds },
      status: 'completed'
    });

    console.log(`Found ${payments.length} completed payments for ${bookingIds.length} bookings`);

    // Calculate total earnings (all time)
    const totalEarnings = payments.reduce((sum, payment) => {
      const booking = allBookings.find(b => String(b._id) === String(payment.bookingId));
      if (booking && booking.hotelId) {
        // Handle both ObjectId and populated object
        const hotelIdStr = booking.hotelId._id ? String(booking.hotelId._id) : String(booking.hotelId);
        const hotel = hotels.find(h => String(h._id) === hotelIdStr);
        const commissionRate = hotel ? (hotel.commissionRate || 0.10) : 0.10;
        const grossAmount = payment.amount || 0;
        const commission = grossAmount * commissionRate;
        return sum + (grossAmount - commission);
      }
      return sum;
    }, 0);

    // Calculate period earnings
    const periodPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.processedAt || payment.createdAt);
      return paymentDate >= startDate;
    });

    const periodEarnings = periodPayments.reduce((sum, payment) => {
      const booking = allBookings.find(b => String(b._id) === String(payment.bookingId));
      if (booking && booking.hotelId) {
        // Handle both ObjectId and populated object
        const hotelIdStr = booking.hotelId._id ? String(booking.hotelId._id) : String(booking.hotelId);
        const hotel = hotels.find(h => String(h._id) === hotelIdStr);
        const commissionRate = hotel ? (hotel.commissionRate || 0.10) : 0.10;
        const grossAmount = payment.amount || 0;
        const commission = grossAmount * commissionRate;
        return sum + (grossAmount - commission);
      }
      return sum;
    }, 0);

    // Calculate earnings per hotel
    const hotelEarnings = hotels.map(hotel => {
      const hotelBookings = allBookings.filter(b => {
        const bookingHotelId = b.hotelId?._id ? String(b.hotelId._id) : String(b.hotelId || b.hotel);
        return bookingHotelId === String(hotel._id);
      });
      const hotelBookingIds = hotelBookings.map(b => b._id);
      const hotelPayments = payments.filter(p => 
        hotelBookingIds.some(bId => String(bId) === String(p.bookingId))
      );

      // Calculate net earnings by applying commission to each payment individually
      const hotelNetEarnings = hotelPayments.reduce((sum, p) => {
        const commissionRate = hotel.commissionRate || 0.10;
        const grossAmount = p.amount || 0;
        const commission = grossAmount * commissionRate;
        return sum + (grossAmount - commission);
      }, 0);

      const hotelPeriodPayments = hotelPayments.filter(p => {
        const paymentDate = new Date(p.processedAt || p.createdAt);
        return paymentDate >= startDate;
      });
      
      const hotelPeriodEarnings = hotelPeriodPayments.reduce((sum, p) => {
        const commissionRate = hotel.commissionRate || 0.10;
        const grossAmount = p.amount || 0;
        const commission = grossAmount * commissionRate;
        return sum + (grossAmount - commission);
      }, 0);

      console.log(`Hotel ${hotel.name}: ${hotelPayments.length} payments, Net Earnings: ${hotelNetEarnings.toFixed(2)}`);

      return {
        hotelId: hotel._id,
        hotelName: hotel.name,
        totalBookings: hotelBookings.length,
        totalEarnings: hotelNetEarnings.toFixed(2),
        periodEarnings: hotelPeriodEarnings.toFixed(2),
        averageBookingValue: hotelBookings.length > 0 
          ? (hotelNetEarnings / hotelBookings.length).toFixed(2)
          : '0.00'
      };
    });

    // Calculate statistics
    const totalBookings = allBookings.length;
    const periodBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.createdAt);
      return bookingDate >= startDate;
    }).length;

    const averageBookingValue = totalBookings > 0 ? totalEarnings / totalBookings : 0;

    res.json({
      success: true,
      earnings: {
        totalEarnings: totalEarnings.toFixed(2),
        totalBookings,
        averageBookingValue: averageBookingValue.toFixed(2),
        periodEarnings: periodEarnings.toFixed(2),
        periodBookings,
        period,
        hotels: hotelEarnings
      }
    });

  } catch (error) {
    console.error('Get earnings dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching earnings dashboard'
    });
  }
};

// Get Earnings by Hotel Controller
const getEarningsByHotel = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { hotelId } = req.params;
    const { period = 'month' } = req.query;

    // Verify hotel ownership
    const hotel = await HotelModel.findOne({ _id: hotelId, ownerId });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found or you do not have permission'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get bookings for this hotel
    const bookings = await BookingModel.find({
      hotelId: hotelId,
      status: { $in: ['confirmed', 'checked-in', 'checked-out', 'completed'] }
    });

    const bookingIds = bookings.map(b => b._id);
    const payments = await PaymentModel.find({
      bookingId: { $in: bookingIds },
      status: 'completed'
    });

    // Calculate earnings
    const totalEarnings = payments.reduce((sum, payment) => {
      const grossAmount = payment.amount;
      const commission = grossAmount * hotel.commissionRate;
      return sum + (grossAmount - commission);
    }, 0);

    const periodPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.processedAt || payment.createdAt);
      return paymentDate >= startDate;
    });

    const periodEarnings = periodPayments.reduce((sum, payment) => {
      const grossAmount = payment.amount;
      const commission = grossAmount * hotel.commissionRate;
      return sum + (grossAmount - commission);
    }, 0);

    res.json({
      success: true,
      hotel: {
        hotelId: hotel._id,
        hotelName: hotel.name,
        totalBookings: bookings.length,
        totalEarnings: totalEarnings.toFixed(2),
        periodEarnings: periodEarnings.toFixed(2),
        periodBookings: periodPayments.length,
        averageBookingValue: bookings.length > 0 
          ? (totalEarnings / bookings.length).toFixed(2)
          : '0.00',
        commissionRate: hotel.commissionRate
      }
    });

  } catch (error) {
    console.error('Get earnings by hotel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hotel earnings'
    });
  }
};

module.exports = {
  getEarningsDashboard,
  getEarningsByHotel
};


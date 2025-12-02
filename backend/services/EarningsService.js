const BaseService = require('./BaseService');
const BookingRepository = require('../repositories/BookingRepository');
const HotelRepository = require('../repositories/HotelRepository');
const PaymentRepository = require('../repositories/PaymentRepository');

/**
 * EarningsService - Handles earnings calculations for hotel owners
 * Follows Single Responsibility Principle - only handles earnings operations
 * Follows Dependency Inversion Principle - depends on repository abstractions
 */
class EarningsService extends BaseService {
  constructor(dependencies = {}) {
    super(dependencies);
    this.bookingRepository = dependencies.bookingRepository || BookingRepository;
    this.hotelRepository = dependencies.hotelRepository || HotelRepository;
    this.paymentRepository = dependencies.paymentRepository || PaymentRepository;
  }

  /**
   * Calculate date range based on period
   * @private
   */
  #calculateDateRange(period) {
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

    return startDate;
  }

  /**
   * Calculate net earnings (after commission)
   * @private
   */
  #calculateNetEarnings(grossAmount, commissionRate = 0.10) {
    const commission = grossAmount * commissionRate;
    return grossAmount - commission;
  }

  /**
   * Get earnings dashboard
   */
  async getEarningsDashboard(ownerId, period = 'month') {
    try {
      // Get all hotels owned by this owner (excluding suspended hotels)
      const hotels = await this.hotelRepository.find({ 
        ownerId, 
        isSuspended: { $ne: true } 
      });

      const hotelIds = hotels.map(h => h._id);

      if (hotelIds.length === 0) {
        return {
          totalEarnings: 0,
          totalBookings: 0,
          averageBookingValue: 0,
          periodEarnings: 0,
          periodBookings: 0,
          hotels: []
        };
      }

      // Calculate date range
      const startDate = this.#calculateDateRange(period);

      // Get all bookings for owner's hotels
      const allBookings = await this.bookingRepository.find({
        hotelId: { $in: hotelIds },
        status: { $in: ['confirmed', 'checked-in', 'checked-out', 'completed'] }
      });

      // Get all payments for these bookings
      const bookingIds = allBookings.map(b => b._id);
      const payments = await this.paymentRepository.findCompleted({
        bookingId: { $in: bookingIds }
      });

      // Calculate total earnings (all time)
      const totalEarnings = payments.reduce((sum, payment) => {
        const booking = allBookings.find(b => String(b._id) === String(payment.bookingId));
        if (booking && booking.hotelId) {
          const hotelIdStr = booking.hotelId._id ? String(booking.hotelId._id) : String(booking.hotelId);
          const hotel = hotels.find(h => String(h._id) === hotelIdStr);
          const commissionRate = hotel ? (hotel.commissionRate || 0.10) : 0.10;
          return sum + this.#calculateNetEarnings(payment.amount || 0, commissionRate);
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
          const hotelIdStr = booking.hotelId._id ? String(booking.hotelId._id) : String(booking.hotelId);
          const hotel = hotels.find(h => String(h._id) === hotelIdStr);
          const commissionRate = hotel ? (hotel.commissionRate || 0.10) : 0.10;
          return sum + this.#calculateNetEarnings(payment.amount || 0, commissionRate);
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

        const hotelNetEarnings = hotelPayments.reduce((sum, p) => {
          const commissionRate = hotel.commissionRate || 0.10;
          return sum + this.#calculateNetEarnings(p.amount || 0, commissionRate);
        }, 0);

        const hotelPeriodPayments = hotelPayments.filter(p => {
          const paymentDate = new Date(p.processedAt || p.createdAt);
          return paymentDate >= startDate;
        });
        
        const hotelPeriodEarnings = hotelPeriodPayments.reduce((sum, p) => {
          const commissionRate = hotel.commissionRate || 0.10;
          return sum + this.#calculateNetEarnings(p.amount || 0, commissionRate);
        }, 0);

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

      return {
        totalEarnings: totalEarnings.toFixed(2),
        totalBookings,
        averageBookingValue: averageBookingValue.toFixed(2),
        periodEarnings: periodEarnings.toFixed(2),
        periodBookings,
        period,
        hotels: hotelEarnings
      };
    } catch (error) {
      this.handleError(error, 'Get earnings dashboard');
    }
  }

  /**
   * Get earnings by hotel
   */
  async getEarningsByHotel(ownerId, hotelId, period = 'month') {
    try {
      // Verify hotel ownership
      const hotel = await this.hotelRepository.findOne({ _id: hotelId, ownerId });
      if (!hotel) {
        throw new Error('Hotel not found or you do not have permission');
      }

      // Calculate date range
      const startDate = this.#calculateDateRange(period);

      // Get bookings for this hotel
      const bookings = await this.bookingRepository.find({
        hotelId: hotelId,
        status: { $in: ['confirmed', 'checked-in', 'checked-out', 'completed'] }
      });

      const bookingIds = bookings.map(b => b._id);
      const payments = await this.paymentRepository.findCompleted({
        bookingId: { $in: bookingIds }
      });

      // Calculate earnings
      const totalEarnings = payments.reduce((sum, payment) => {
        const commissionRate = hotel.commissionRate || 0.10;
        return sum + this.#calculateNetEarnings(payment.amount || 0, commissionRate);
      }, 0);

      const periodPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.processedAt || payment.createdAt);
        return paymentDate >= startDate;
      });

      const periodEarnings = periodPayments.reduce((sum, payment) => {
        const commissionRate = hotel.commissionRate || 0.10;
        return sum + this.#calculateNetEarnings(payment.amount || 0, commissionRate);
      }, 0);

      return {
        hotelId: hotel._id,
        hotelName: hotel.name,
        totalBookings: bookings.length,
        totalEarnings: totalEarnings.toFixed(2),
        periodEarnings: periodEarnings.toFixed(2),
        periodBookings: periodPayments.length,
        averageBookingValue: bookings.length > 0 
          ? (totalEarnings / bookings.length).toFixed(2)
          : '0.00',
        commissionRate: hotel.commissionRate || 0.10
      };
    } catch (error) {
      this.handleError(error, 'Get earnings by hotel');
    }
  }
}

module.exports = new EarningsService();


const BaseController = require('./BaseController');
const OwnerBookingService = require('../services/OwnerBookingService');

/**
 * OwnerBookingController - Handles HTTP requests for owner booking operations
 * Follows Single Responsibility Principle - only handles HTTP concerns
 * Delegates business logic to OwnerBookingService
 */
class OwnerBookingController extends BaseController {
  constructor() {
    super();
    this.ownerBookingService = OwnerBookingService;
  }

  /**
   * Get Owner Bookings
   */
  getOwnerBookings = async (req, res) => {
    try {
      const ownerId = req.user.userId;
      const result = await this.ownerBookingService.getOwnerBookings(ownerId, req.query);
      
      return this.ok(res, {
        count: result.count,
        bookings: result.bookings
      });
    } catch (error) {
      console.error('Get owner bookings error:', error);
      return this.fail(res, 500, error.message || 'Server error while fetching bookings');
    }
  };

  /**
   * Confirm Booking (Owner)
   */
  confirmBooking = async (req, res) => {
    try {
      const ownerId = req.user.userId;
      const { bookingId } = req.params;

      const result = await this.ownerBookingService.confirmBooking(bookingId, ownerId);
      
      return this.ok(res, { message: result.message });
    } catch (error) {
      console.error('Confirm booking error:', error);
      const statusCode = error.message.includes('not found') || 
                        error.message.includes('Not authorized') ? 
                        (error.message.includes('not found') ? 404 : 403) : 500;
      return this.fail(res, statusCode, error.message || 'Server error while confirming booking');
    }
  };

  /**
   * Reject Booking (Owner)
   */
  rejectBooking = async (req, res) => {
    try {
      const ownerId = req.user.userId;
      const { bookingId } = req.params;

      const result = await this.ownerBookingService.rejectBooking(bookingId, ownerId);
      
      return this.ok(res, { message: result.message });
    } catch (error) {
      console.error('Reject booking error:', error);
      const statusCode = error.message.includes('not found') || 
                        error.message.includes('Not authorized') ? 
                        (error.message.includes('not found') ? 404 : 403) : 500;
      return this.fail(res, statusCode, error.message || 'Server error while rejecting booking');
    }
  };

  /**
   * Check-in Booking (Owner)
   */
  checkIn = async (req, res) => {
    try {
      const ownerId = req.user.userId;
      const { bookingId } = req.params;

      const result = await this.ownerBookingService.checkIn(bookingId, ownerId);
      
      return this.ok(res, { message: result.message });
    } catch (error) {
      console.error('Check-in error:', error);
      const statusCode = error.message.includes('not found') || 
                        error.message.includes('Not authorized') ? 
                        (error.message.includes('not found') ? 404 : 403) : 500;
      return this.fail(res, statusCode, error.message || 'Server error during check-in');
    }
  };

  /**
   * Check-out Booking (Owner)
   */
  checkOut = async (req, res) => {
    try {
      const ownerId = req.user.userId;
      const { bookingId } = req.params;

      const result = await this.ownerBookingService.checkOut(bookingId, ownerId);
      
      return this.ok(res, { message: result.message });
    } catch (error) {
      console.error('Check-out error:', error);
      const statusCode = error.message.includes('not found') || 
                        error.message.includes('Not authorized') ? 
                        (error.message.includes('not found') ? 404 : 403) : 500;
      return this.fail(res, statusCode, error.message || 'Server error during check-out');
    }
  };
}

module.exports = new OwnerBookingController();

/**
 * IBookingService - Interface for booking operations
 * Follows Interface Segregation Principle
 */
class IBookingService {
  /**
   * Create a new booking
   * @param {Object} bookingData - Booking data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created booking
   */
  async createBooking(bookingData, userId) {
    throw new Error('createBooking method must be implemented');
  }

  /**
   * Get user bookings
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} User bookings
   */
  async getUserBookings(userId, filters = {}) {
    throw new Error('getUserBookings method must be implemented');
  }

  /**
   * Get booking by ID
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID for authorization
   * @returns {Promise<Object>} Booking details
   */
  async getBookingById(bookingId, userId) {
    throw new Error('getBookingById method must be implemented');
  }

  /**
   * Cancel booking
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelBooking(bookingId, userId, reason = '') {
    throw new Error('cancelBooking method must be implemented');
  }

  /**
   * Reschedule booking
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID
   * @param {Object} newDates - New check-in and check-out dates
   * @returns {Promise<Object>} Rescheduled booking
   */
  async rescheduleBooking(bookingId, userId, newDates) {
    throw new Error('rescheduleBooking method must be implemented');
  }
}

module.exports = IBookingService;


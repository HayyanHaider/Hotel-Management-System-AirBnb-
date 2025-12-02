const BaseRepository = require('./BaseRepository');
const BookingModel = require('../models/bookingModel');

/**
 * BookingRepository - Repository for Booking entities
 * Follows Single Responsibility Principle - only handles Booking data access
 */
class BookingRepository extends BaseRepository {
  constructor() {
    super(BookingModel);
  }

  /**
   * Find bookings by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of bookings
   */
  async findByUser(userId, options = {}) {
    return this.find({ userId }, options);
  }

  /**
   * Find bookings by hotel
   * @param {string} hotelId - Hotel ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of bookings
   */
  async findByHotel(hotelId, options = {}) {
    return this.find({ hotelId }, options);
  }

  /**
   * Find bookings by status
   * @param {string} status - Booking status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of bookings
   */
  async findByStatus(status, options = {}) {
    return this.find({ status }, options);
  }

  /**
   * Find overlapping bookings for a hotel
   * @param {string} hotelId - Hotel ID
   * @param {Date} checkIn - Check-in date
   * @param {Date} checkOut - Check-out date
   * @param {Array} excludeStatuses - Statuses to exclude
   * @returns {Promise<Array>} Array of overlapping bookings
   */
  async findOverlapping(hotelId, checkIn, checkOut, excludeStatuses = ['cancelled']) {
    try {
      const docs = await this.model.find({
        hotelId,
        status: { $nin: excludeStatuses },
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn }
      });
      return docs.map(doc => this.toObject(doc));
    } catch (error) {
      throw new Error(`Error finding overlapping bookings: ${error.message}`);
    }
  }

  /**
   * Find active bookings
   * @param {Object} criteria - Additional criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of active bookings
   */
  async findActive(criteria = {}, options = {}) {
    const now = new Date();
    return this.find({
      ...criteria,
      status: { $in: ['confirmed', 'pending'] },
      checkOut: { $gte: now }
    }, options);
  }
}

module.exports = new BookingRepository();


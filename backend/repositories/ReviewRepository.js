const BaseRepository = require('./BaseRepository');
const ReviewModel = require('../models/reviewsModel');

/**
 * ReviewRepository - Repository for Review entities
 * Follows Single Responsibility Principle - only handles Review data access
 */
class ReviewRepository extends BaseRepository {
  constructor() {
    super(ReviewModel);
  }

  /**
   * Find reviews by hotel
   * @param {string} hotelId - Hotel ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of reviews
   */
  async findByHotel(hotelId, options = {}) {
    return this.find({ hotelId }, options);
  }

  /**
   * Find reviews by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of reviews
   */
  async findByUser(userId, options = {}) {
    return this.find({ userId }, options);
  }

  /**
   * Find review by booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object|null>} Review or null
   */
  async findByBooking(bookingId) {
    return this.findOne({ bookingId });
  }

  /**
   * Calculate hotel rating statistics
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<Object>} Rating statistics
   */
  async getHotelRatingStats(hotelId) {
    try {
      const stats = await this.model.aggregate([
        { $match: { hotelId: this.model.db.base.model('Review').schema.paths.hotelId.caster ? hotelId : hotelId } },
        { $group: { 
          _id: '$hotelId', 
          avg: { $avg: '$rating' }, 
          count: { $sum: 1 },
          min: { $min: '$rating' },
          max: { $max: '$rating' }
        }}
      ]);

      if (stats.length > 0) {
        return {
          average: stats[0].avg,
          count: stats[0].count,
          min: stats[0].min,
          max: stats[0].max
        };
      }

      return {
        average: 0,
        count: 0,
        min: 0,
        max: 0
      };
    } catch (error) {
      // Fallback to manual calculation
      const reviews = await this.findByHotel(hotelId);
      if (reviews.length === 0) {
        return { average: 0, count: 0, min: 0, max: 0 };
      }

      const ratings = reviews.map(r => r.rating);
      return {
        average: ratings.reduce((a, b) => a + b, 0) / ratings.length,
        count: ratings.length,
        min: Math.min(...ratings),
        max: Math.max(...ratings)
      };
    }
  }
}

module.exports = new ReviewRepository();


/**
 * IReviewService - Interface for review operations
 * Follows Interface Segregation Principle
 */
class IReviewService {
  /**
   * Create a new review
   * @param {Object} reviewData - Review data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created review
   */
  async createReview(reviewData, userId) {
    throw new Error('createReview method must be implemented');
  }

  /**
   * Get reviews for a hotel
   * @param {string} hotelId - Hotel ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Hotel reviews
   */
  async getHotelReviews(hotelId, options = {}) {
    throw new Error('getHotelReviews method must be implemented');
  }

  /**
   * Get review by ID
   * @param {string} reviewId - Review ID
   * @returns {Promise<Object>} Review details
   */
  async getReviewById(reviewId) {
    throw new Error('getReviewById method must be implemented');
  }
}

module.exports = IReviewService;


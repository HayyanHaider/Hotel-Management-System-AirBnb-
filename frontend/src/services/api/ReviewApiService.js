import BaseApiService from './BaseApiService';

/**
 * ReviewApiService - Service for review-related API calls
 * Follows Single Responsibility Principle - only handles review API operations
 */
class ReviewApiService extends BaseApiService {
  /**
   * Create a new review
   * @param {Object} reviewData - Review data
   * @returns {Promise} Created review
   */
  async createReview(reviewData) {
    return this.post('/reviews', reviewData);
  }

  /**
   * Get reviews for a hotel
   * @param {string} hotelId - Hotel ID
   * @returns {Promise} Hotel reviews
   */
  async getHotelReviews(hotelId) {
    return this.get(`/reviews/hotel/${hotelId}`);
  }

  /**
   * Reply to a review
   * @param {string} reviewId - Review ID
   * @param {string} text - Reply text
   * @returns {Promise} Updated review
   */
  async replyToReview(reviewId, text) {
    return this.put(`/reviews/${reviewId}/reply`, { text });
  }
}

export default new ReviewApiService();


import BaseApiService from './BaseApiService';

/**
 * UserApiService - Service for user-related API calls
 * Follows Single Responsibility Principle - only handles user API operations
 */
class UserApiService extends BaseApiService {
  /**
   * Get user favorites
   * @returns {Promise} Favorites list
   */
  async getFavorites() {
    return this.get('/users/favorites');
  }

  /**
   * Add favorite hotel
   * @param {string} hotelId - Hotel ID
   * @returns {Promise} Result
   */
  async addFavorite(hotelId) {
    return this.post('/users/favorites', { hotelId });
  }

  /**
   * Remove favorite hotel
   * @param {string} hotelId - Hotel ID
   * @returns {Promise} Result
   */
  async removeFavorite(hotelId) {
    return this.delete(`/users/favorites/${hotelId}`);
  }
}

export default new UserApiService();


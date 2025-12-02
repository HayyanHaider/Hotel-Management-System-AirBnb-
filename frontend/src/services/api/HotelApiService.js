import BaseApiService from './BaseApiService';

/**
 * HotelApiService - Service for hotel-related API calls
 * Follows Single Responsibility Principle - only handles hotel API operations
 * Follows Dependency Inversion Principle - depends on BaseApiService abstraction
 */
class HotelApiService extends BaseApiService {
  /**
   * Get all hotels with filters
   * @param {Object} filters - Search filters
   * @returns {Promise} Hotels data
   */
  async getHotels(filters = {}) {
    return this.get('/hotels', filters);
  }

  /**
   * Get hotel by ID
   * @param {string} hotelId - Hotel ID
   * @returns {Promise} Hotel data
   */
  async getHotelById(hotelId) {
    return this.get(`/hotels/${hotelId}`);
  }

  /**
   * Create a new hotel
   * @param {Object} hotelData - Hotel data
   * @returns {Promise} Created hotel
   */
  async createHotel(hotelData) {
    return this.post('/hotels', hotelData);
  }

  /**
   * Update hotel
   * @param {string} hotelId - Hotel ID
   * @param {Object} hotelData - Update data
   * @returns {Promise} Updated hotel
   */
  async updateHotel(hotelId, hotelData) {
    return this.put(`/hotels/${hotelId}`, hotelData);
  }

  /**
   * Delete hotel
   * @param {string} hotelId - Hotel ID
   * @returns {Promise} Deletion result
   */
  async deleteHotel(hotelId) {
    return this.delete(`/hotels/${hotelId}`);
  }

  /**
   * Get owner's hotels
   * @returns {Promise} Owner's hotels
   */
  async getOwnerHotels() {
    return this.get('/hotels/owner/my-hotels');
  }
}

export default new HotelApiService();


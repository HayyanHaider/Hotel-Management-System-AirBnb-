/**
 * IHotelService - Interface for hotel operations
 * Follows Interface Segregation Principle
 */
class IHotelService {
  /**
   * Create a new hotel
   * @param {Object} hotelData - Hotel data
   * @param {string} ownerId - Owner ID
   * @returns {Promise<Object>} Created hotel
   */
  async createHotel(hotelData, ownerId) {
    throw new Error('createHotel method must be implemented');
  }

  /**
   * Get hotels with filters
   * @param {Object} filters - Search filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Hotels and pagination info
   */
  async getHotels(filters = {}, options = {}) {
    throw new Error('getHotels method must be implemented');
  }

  /**
   * Get hotel by ID
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<Object>} Hotel details
   */
  async getHotelById(hotelId) {
    throw new Error('getHotelById method must be implemented');
  }

  /**
   * Update hotel
   * @param {string} hotelId - Hotel ID
   * @param {Object} updates - Update data
   * @param {string} ownerId - Owner ID for authorization
   * @returns {Promise<Object>} Updated hotel
   */
  async updateHotel(hotelId, updates, ownerId) {
    throw new Error('updateHotel method must be implemented');
  }

  /**
   * Delete hotel
   * @param {string} hotelId - Hotel ID
   * @param {string} ownerId - Owner ID for authorization
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteHotel(hotelId, ownerId) {
    throw new Error('deleteHotel method must be implemented');
  }
}

module.exports = IHotelService;


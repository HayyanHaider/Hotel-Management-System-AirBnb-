const BaseRepository = require('./BaseRepository');
const RoomModel = require('../models/roomModel');

/**
 * RoomRepository - Repository for Room entities
 * Follows Single Responsibility Principle - only handles Room data access
 */
class RoomRepository extends BaseRepository {
  constructor() {
    super(RoomModel);
  }

  /**
   * Find rooms by hotel
   * @param {string} hotelId - Hotel ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of rooms
   */
  async findByHotel(hotelId, options = {}) {
    return this.find({ hotelId }, options);
  }

  /**
   * Find available rooms
   * @param {string} hotelId - Hotel ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of available rooms
   */
  async findAvailable(hotelId, options = {}) {
    return this.find({ hotelId, isAvailable: true, isActive: true }, options);
  }

  /**
   * Find active rooms
   * @param {string} hotelId - Hotel ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of active rooms
   */
  async findActive(hotelId, options = {}) {
    return this.find({ hotelId, isActive: true }, options);
  }
}

module.exports = new RoomRepository();


const BaseRepository = require('./BaseRepository');
const HotelModel = require('../models/hotelModel');

/**
 * HotelRepository - Repository for Hotel entities
 * Follows Single Responsibility Principle - only handles Hotel data access
 */
class HotelRepository extends BaseRepository {
  constructor() {
    super(HotelModel);
  }

  /**
   * Find hotels by owner
   * @param {string} ownerId - Owner ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of hotels
   */
  async findByOwner(ownerId, options = {}) {
    return this.find({ ownerId }, options);
  }

  /**
   * Find approved hotels
   * @param {Object} criteria - Additional search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of approved hotels
   */
  async findApproved(criteria = {}, options = {}) {
    return this.find({ ...criteria, isApproved: true, isSuspended: false }, options);
  }

  /**
   * Find pending hotels
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of pending hotels
   */
  async findPending(options = {}) {
    return this.find({ isApproved: false, isSuspended: false }, options);
  }

  /**
   * Find flagged hotels
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of flagged hotels
   */
  async findFlagged(options = {}) {
    return this.find({ isFlagged: true }, options);
  }

  /**
   * Update hotel approval status
   * @param {string} hotelId - Hotel ID
   * @param {boolean} isApproved - Approval status
   * @param {string} reason - Rejection reason if not approved
   * @returns {Promise<Object|null>} Updated hotel
   */
  async updateApprovalStatus(hotelId, isApproved, reason = '') {
    try {
      const updateData = {
        isApproved,
        updatedAt: new Date()
      };

      if (!isApproved && reason) {
        updateData.rejectionReason = reason;
      } else if (isApproved) {
        updateData.rejectionReason = '';
      }

      const doc = await this.model.findByIdAndUpdate(hotelId, updateData, { new: true });
      return this.toObject(doc);
    } catch (error) {
      throw new Error(`Error updating approval status: ${error.message}`);
    }
  }

  /**
   * Update hotel rating
   * @param {string} hotelId - Hotel ID
   * @param {number} newRating - New rating value
   * @param {number} totalReviews - Total number of reviews
   * @returns {Promise<Object|null>} Updated hotel
   */
  async updateRating(hotelId, newRating, totalReviews) {
    try {
      const doc = await this.model.findByIdAndUpdate(
        hotelId,
        {
          rating: newRating,
          ratingAvg: newRating,
          totalReviews,
          updatedAt: new Date()
        },
        { new: true }
      );
      return this.toObject(doc);
    } catch (error) {
      throw new Error(`Error updating rating: ${error.message}`);
    }
  }
}

module.exports = new HotelRepository();


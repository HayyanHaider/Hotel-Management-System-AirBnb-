const BaseRepository = require('./BaseRepository');
const RefundModel = require('../models/refundModal');

/**
 * RefundRepository - Repository for Refund entities
 * Follows Single Responsibility Principle - only handles Refund data access
 */
class RefundRepository extends BaseRepository {
  constructor() {
    super(RefundModel);
  }

  /**
   * Find refunds by status
   * @param {string} status - Refund status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of refunds
   */
  async findByStatus(status, options = {}) {
    return this.find({ status }, options);
  }

  /**
   * Find refunds by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of refunds
   */
  async findByUser(userId, options = {}) {
    return this.find({ userId }, options);
  }

  /**
   * Find pending refunds
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of pending refunds
   */
  async findPending(options = {}) {
    return this.find({ status: 'pending' }, options);
  }
}

module.exports = new RefundRepository();


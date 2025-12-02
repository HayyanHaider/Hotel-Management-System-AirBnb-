const BaseRepository = require('./BaseRepository');
const PaymentModel = require('../models/paymentModel');

/**
 * PaymentRepository - Repository for Payment entities
 * Follows Single Responsibility Principle - only handles Payment data access
 */
class PaymentRepository extends BaseRepository {
  constructor() {
    super(PaymentModel);
  }

  /**
   * Find payments by booking
   * @param {string} bookingId - Booking ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of payments
   */
  async findByBooking(bookingId, options = {}) {
    return this.find({ bookingId }, options);
  }

  /**
   * Find payments by customer
   * @param {string} customerId - Customer ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of payments
   */
  async findByCustomer(customerId, options = {}) {
    return this.find({ customerId }, options);
  }

  /**
   * Find payments by status
   * @param {string} status - Payment status
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of payments
   */
  async findByStatus(status, options = {}) {
    return this.find({ status }, options);
  }

  /**
   * Find completed payments
   * @param {Object} criteria - Additional criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of completed payments
   */
  async findCompleted(criteria = {}, options = {}) {
    return this.find({ ...criteria, status: 'completed' }, options);
  }
}

module.exports = new PaymentRepository();


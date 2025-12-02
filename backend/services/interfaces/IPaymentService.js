/**
 * IPaymentService - Interface for payment operations
 * Follows Interface Segregation Principle
 */
class IPaymentService {
  /**
   * Process payment
   * @param {Object} paymentData - Payment data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Processed payment
   */
  async processPayment(paymentData, userId) {
    throw new Error('processPayment method must be implemented');
  }

  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID
   * @param {string} userId - User ID for authorization
   * @returns {Promise<Object>} Payment details
   */
  async getPaymentById(paymentId, userId) {
    throw new Error('getPaymentById method must be implemented');
  }

  /**
   * Get user payments
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} User payments
   */
  async getUserPayments(userId, filters = {}) {
    throw new Error('getUserPayments method must be implemented');
  }
}

module.exports = IPaymentService;


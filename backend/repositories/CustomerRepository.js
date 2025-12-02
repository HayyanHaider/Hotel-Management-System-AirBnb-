const BaseRepository = require('./BaseRepository');
const CustomerModel = require('../models/customerModel');

/**
 * CustomerRepository - Repository for Customer entities
 * Follows Single Responsibility Principle - only handles Customer data access
 */
class CustomerRepository extends BaseRepository {
  constructor() {
    super(CustomerModel);
  }

  /**
   * Find customer by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Customer or null
   */
  async findByUser(userId) {
    try {
      const doc = await this.model.findOne({ user: userId });
      return this.toObject(doc);
    } catch (error) {
      throw new Error(`Error finding customer by user: ${error.message}`);
    }
  }

  /**
   * Find or create customer by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Customer document
   */
  async findOrCreateByUser(userId) {
    try {
      let customer = await this.findByUser(userId);
      if (!customer) {
        const doc = await this.model.create({
          user: userId,
          loyaltyPoints: 0,
          bookingHistory: [],
          reviewsGiven: []
        });
        customer = this.toObject(doc);
      }
      return customer;
    } catch (error) {
      throw new Error(`Error finding or creating customer: ${error.message}`);
    }
  }

  /**
   * Update loyalty points
   * @param {string} customerId - Customer ID
   * @param {number} points - Points to add (can be negative)
   * @returns {Promise<Object|null>} Updated customer
   */
  async updateLoyaltyPoints(customerId, points) {
    try {
      const doc = await this.model.findByIdAndUpdate(
        customerId,
        { $inc: { loyaltyPoints: points }, updatedAt: new Date() },
        { new: true }
      );
      return this.toObject(doc);
    } catch (error) {
      throw new Error(`Error updating loyalty points: ${error.message}`);
    }
  }
}

module.exports = new CustomerRepository();


const BaseRepository = require('./BaseRepository');
const UserModel = require('../models/userModel');

/**
 * UserRepository - Repository for User entities
 * Follows Single Responsibility Principle - only handles User data access
 */
class UserRepository extends BaseRepository {
  constructor() {
    super(UserModel);
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmail(email) {
    try {
      const doc = await this.model.findOne({ email: email.toLowerCase().trim() });
      return this.toObject(doc);
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  /**
   * Find users by role
   * @param {string} role - User role
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of users
   */
  async findByRole(role, options = {}) {
    return this.find({ role }, options);
  }

  /**
   * Update user favorites
   * @param {string} userId - User ID
   * @param {Array} favorites - Array of favorite hotel IDs
   * @returns {Promise<Object|null>} Updated user
   */
  async updateFavorites(userId, favorites) {
    try {
      const doc = await this.model.findByIdAndUpdate(
        userId,
        { favorites, updatedAt: new Date() },
        { new: true }
      );
      return this.toObject(doc);
    } catch (error) {
      throw new Error(`Error updating favorites: ${error.message}`);
    }
  }

  /**
   * Add favorite hotel
   * @param {string} userId - User ID
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<Object|null>} Updated user
   */
  async addFavorite(userId, hotelId) {
    try {
      const doc = await this.model.findByIdAndUpdate(
        userId,
        { $addToSet: { favorites: hotelId }, updatedAt: new Date() },
        { new: true }
      );
      return this.toObject(doc);
    } catch (error) {
      throw new Error(`Error adding favorite: ${error.message}`);
    }
  }

  /**
   * Remove favorite hotel
   * @param {string} userId - User ID
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<Object|null>} Updated user
   */
  async removeFavorite(userId, hotelId) {
    try {
      const doc = await this.model.findByIdAndUpdate(
        userId,
        { $pull: { favorites: hotelId }, updatedAt: new Date() },
        { new: true }
      );
      return this.toObject(doc);
    } catch (error) {
      throw new Error(`Error removing favorite: ${error.message}`);
    }
  }
}

module.exports = new UserRepository();


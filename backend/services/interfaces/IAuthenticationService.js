/**
 * IAuthenticationService - Interface for authentication operations
 * Follows Interface Segregation Principle - clients only depend on methods they use
 */
class IAuthenticationService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user and token
   */
  async register(userData) {
    throw new Error('register method must be implemented');
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User and token
   */
  async login(email, password) {
    throw new Error('login method must be implemented');
  }

  /**
   * Verify token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token data
   */
  async verifyToken(token) {
    throw new Error('verifyToken method must be implemented');
  }

  /**
   * Generate token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    throw new Error('generateToken method must be implemented');
  }
}

module.exports = IAuthenticationService;


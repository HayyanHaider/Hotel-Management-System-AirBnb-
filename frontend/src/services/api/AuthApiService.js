import BaseApiService from './BaseApiService';

/**
 * AuthApiService - Service for authentication API calls
 * Follows Single Responsibility Principle - only handles auth API operations
 */
class AuthApiService extends BaseApiService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} User and token
   */
  async register(userData) {
    return this.post('/auth/signup', userData);
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} User and token
   */
  async login(email, password) {
    return this.post('/auth/login', { email, password });
  }

  /**
   * Get user profile
   * @returns {Promise} User profile
   */
  async getProfile() {
    return this.get('/auth/profile');
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile update data
   * @returns {Promise} Updated profile
   */
  async updateProfile(profileData) {
    return this.put('/auth/profile', profileData);
  }

  /**
   * Verify token
   * @returns {Promise} Verification result
   */
  async verifyToken() {
    return this.get('/auth/verify');
  }
}

export default new AuthApiService();


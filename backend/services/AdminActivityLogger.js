// Switched to use Admin model only; activity persistence removed as requested
const AdminModel = require('../models/adminModel');

/**
 * AdminActivityLogger - Centralized activity logging service
 * Follows Single Responsibility Principle
 */
class AdminActivityLogger {
  /**
   * Log an admin activity
   * @param {String} adminId - Admin user ID
   * @param {String} action - Action performed
   * @param {String} targetType - Type of target entity
   * @param {String} targetId - ID of target entity
   * @param {String} description - Description of action
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Created activity log
   */
  async log(adminId, action, targetType, targetId, description, metadata = {}) {
    try {
      // Validate admin exists; do not persist activity
      await AdminModel.findById(adminId).select('_id').lean().exec();
      return null;
    } catch (error) {
      console.error('Error validating admin during log:', error);
      return null;
    }
  }

  /**
   * Get activity logs with filtering and pagination
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Activities and pagination info
   */
  async getActivities({ action, targetType, page = 1, limit = 50 }) {
    return {
      activities: [],
      pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), pages: 0 }
    };
  }

  /**
   * Get recent activities for an admin
   * @param {String} adminId - Admin user ID
   * @param {Number} limit - Number of activities to fetch
   * @returns {Promise<Array>} Recent activities
   */
  async getRecentActivitiesByAdmin(adminId, limit = 10) {
    return [];
  }

  /**
   * Get activity stats for an admin
   * @param {String} adminId - Admin user ID
   * @returns {Promise<Object>} Activity statistics
   */
  async getAdminStats(adminId) {
    return { totalActions: 0, actionBreakdown: [] };
  }
}

module.exports = new AdminActivityLogger();


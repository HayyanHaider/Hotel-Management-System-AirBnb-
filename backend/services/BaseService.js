/**
 * BaseService - Base service class with common functionality
 * Follows Open/Closed Principle - can be extended without modification
 * Follows Single Responsibility Principle - provides common service functionality
 */
class BaseService {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
  }

  /**
   * Get dependency by key
   * @param {string} key - Dependency key
   * @returns {*} Dependency instance
   */
  getDependency(key) {
    const dependency = this.dependencies[key];
    if (!dependency) {
      throw new Error(`Dependency '${key}' not found`);
    }
    return dependency;
  }

  /**
   * Handle service errors
   * @param {Error} error - Error object
   * @param {string} context - Error context
   * @throws {Error} Formatted error
   */
  handleError(error, context = 'Service operation') {
    const message = error.message || 'An unknown error occurred';
    throw new Error(`${context}: ${message}`);
  }

  /**
   * Validate required fields
   * @param {Object} data - Data to validate
   * @param {Array<string>} requiredFields - Required field names
   * @throws {Error} If validation fails
   */
  validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Paginate results
   * @param {Array} items - Items to paginate
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Items per page
   * @returns {Object} Paginated result
   */
  paginate(items, page = 1, limit = 10) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;
    const total = items.length;
    const pages = Math.ceil(total / limitNum);

    return {
      items: items.slice(skip, skip + limitNum),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
        hasNext: pageNum < pages,
        hasPrev: pageNum > 1
      }
    };
  }

  /**
   * Sort array by field
   * @param {Array} items - Items to sort
   * @param {string} field - Field to sort by
   * @param {string} order - Sort order ('asc' or 'desc')
   * @returns {Array} Sorted items
   */
  sort(items, field, order = 'asc') {
    return [...items].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal === bVal) return 0;

      const comparison = aVal > bVal ? 1 : -1;
      return order === 'desc' ? -comparison : comparison;
    });
  }
}

module.exports = BaseService;

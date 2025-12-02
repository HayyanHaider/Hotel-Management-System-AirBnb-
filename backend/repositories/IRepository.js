/**
 * IRepository - Interface for Repository Pattern
 * Follows Interface Segregation Principle (ISP) and Dependency Inversion Principle (DIP)
 */
class IRepository {
  /**
   * Find entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise<Object|null>} Entity or null if not found
   */
  async findById(id) {
    throw new Error('findById method must be implemented');
  }

  /**
   * Find entities by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options (limit, skip, sort, etc.)
   * @returns {Promise<Array>} Array of entities
   */
  async find(criteria = {}, options = {}) {
    throw new Error('find method must be implemented');
  }

  /**
   * Find one entity by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object|null>} Entity or null if not found
   */
  async findOne(criteria = {}) {
    throw new Error('findOne method must be implemented');
  }

  /**
   * Create a new entity
   * @param {Object} data - Entity data
   * @returns {Promise<Object>} Created entity
   */
  async create(data) {
    throw new Error('create method must be implemented');
  }

  /**
   * Update entity by ID
   * @param {string} id - Entity ID
   * @param {Object} data - Update data
   * @returns {Promise<Object|null>} Updated entity or null if not found
   */
  async updateById(id, data) {
    throw new Error('updateById method must be implemented');
  }

  /**
   * Delete entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  async deleteById(id) {
    throw new Error('deleteById method must be implemented');
  }

  /**
   * Count entities matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<number>} Count of entities
   */
  async count(criteria = {}) {
    throw new Error('count method must be implemented');
  }
}

module.exports = IRepository;


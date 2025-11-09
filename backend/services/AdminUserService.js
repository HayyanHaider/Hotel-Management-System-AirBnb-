const UserModel = require('../models/userModel');
const HotelModel = require('../models/hotelModel');
const BookingModel = require('../models/bookingModel');
const ReviewModel = require('../models/reviewsModel');
const BaseService = require('./BaseService');
const AdminActivityLogger = require('./AdminActivityLogger');

/**
 * AdminUserService - Handles all user management operations for admins
 * Follows OOP principles with encapsulation and single responsibility
 */
class AdminUserService extends BaseService {
  /**
   * Get users with filtering, search, and pagination
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Users and pagination info
   */
  async getUsers({ role, status, search, page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;
    const query = this._buildUserQuery(role, status, search);

    const users = await UserModel.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Enrich users with stats
    const enrichedUsers = await this._enrichUsersWithStats(users);

    const total = await UserModel.countDocuments(query);

    return {
      users: enrichedUsers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Suspend a user
   * @param {String} userId - User ID
   * @param {String} adminId - Admin user ID
   * @param {String} reason - Suspension reason
   * @returns {Promise<Object>} Updated user
   */
  async suspendUser(userId, adminId, reason = '') {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        isSuspended: true,
        suspendedReason: reason,
        suspendedAt: new Date()
      },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      throw new Error('User not found');
    }

    await AdminActivityLogger.log(
      adminId,
      'user_suspended',
      'user',
      userId,
      `Suspended user: ${user.name} (${user.email})`,
      { userName: user.name, userEmail: user.email, reason }
    );

    return user;
  }

  /**
   * Unsuspend a user
   * @param {String} userId - User ID
   * @param {String} adminId - Admin user ID
   * @returns {Promise<Object>} Updated user
   */
  async unsuspendUser(userId, adminId) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        isSuspended: false,
        suspendedReason: '',
        suspendedAt: null
      },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      throw new Error('User not found');
    }

    await AdminActivityLogger.log(
      adminId,
      'user_unsuspended',
      'user',
      userId,
      `Unsuspended user: ${user.name} (${user.email})`,
      { userName: user.name, userEmail: user.email }
    );

    return user;
  }

  /**
   * Private method to build user query
   * @private
   */
  _buildUserQuery(role, status, search) {
    const query = { role: { $in: ['customer', 'hotel_owner'] } };

    // Filter by role
    if (role && ['customer', 'hotel_owner'].includes(role)) {
      query.role = role;
    }

    // Filter by status
    if (status === 'active') {
      query.isSuspended = false;
    } else if (status === 'suspended') {
      query.isSuspended = true;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    return query;
  }

  /**
   * Private method to enrich users with statistics
   * Optimized to use bulk queries instead of N+1 queries
   * @private
   */
  async _enrichUsersWithStats(users) {
    if (users.length === 0) return [];

    const userIds = users.map(u => u._id);
    const hotelOwnerIds = users.filter(u => u.role === 'hotel_owner').map(u => u._id);

    // Bulk query for all stats using aggregation
    const [hotelStats, bookingStats, reviewStats] = await Promise.all([
      // Hotel counts for hotel owners
      hotelOwnerIds.length > 0 
        ? HotelModel.aggregate([
            { $match: { ownerId: { $in: hotelOwnerIds } } },
            { $group: { _id: '$ownerId', count: { $sum: 1 } } }
          ])
        : [],
      
      // Booking counts for all users
      BookingModel.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
      ]),
      
      // Review counts for all users
      ReviewModel.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
      ])
    ]);

    // Create lookup maps for O(1) access
    const hotelMap = new Map(hotelStats.map(s => [s._id.toString(), s.count]));
    const bookingMap = new Map(bookingStats.map(s => [s._id.toString(), s.count]));
    const reviewMap = new Map(reviewStats.map(s => [s._id.toString(), s.count]));

    // Enrich users with stats
    return users.map(user => ({
      ...user,
      stats: {
        hotelCount: user.role === 'hotel_owner' ? (hotelMap.get(user._id.toString()) || 0) : 0,
        bookingCount: bookingMap.get(user._id.toString()) || 0,
        reviewCount: reviewMap.get(user._id.toString()) || 0
      }
    }));
  }
}

module.exports = new AdminUserService();


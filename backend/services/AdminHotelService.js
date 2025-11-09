const HotelModel = require('../models/hotelModel');
const BaseService = require('./BaseService');
const AdminActivityLogger = require('./AdminActivityLogger');

/**
 * AdminHotelService - Handles all hotel management operations for admins
 * Follows OOP principles with encapsulation and single responsibility
 */
class AdminHotelService extends BaseService {
  /**
   * Get hotels with filtering, search, and pagination
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Hotels and pagination info
   */
  async getHotels({ status, search, page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;
    const query = this._buildHotelQuery(status, search);

    const [hotels, total] = await Promise.all([
      HotelModel.find(query)
        .populate('ownerId', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      HotelModel.countDocuments(query)
    ]);

    return {
      hotels,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Approve a hotel
   * @param {String} hotelId - Hotel ID
   * @param {String} adminId - Admin user ID
   * @returns {Promise<Object>} Updated hotel
   */
  async approveHotel(hotelId, adminId) {
    const hotel = await HotelModel.findByIdAndUpdate(
      hotelId,
      {
        isApproved: true,
        isSuspended: false,
        rejectionReason: ''
      },
      { new: true }
    );

    if (!hotel) {
      throw new Error('Hotel not found');
    }

    await AdminActivityLogger.log(
      adminId,
      'hotel_approved',
      'hotel',
      hotelId,
      `Approved hotel: ${hotel.name}`,
      { hotelName: hotel.name }
    );

    return hotel;
  }

  /**
   * Reject a hotel
   * @param {String} hotelId - Hotel ID
   * @param {String} adminId - Admin user ID
   * @param {String} reason - Rejection reason
   * @returns {Promise<Object>} Updated hotel
   */
  async rejectHotel(hotelId, adminId, reason = '') {
    const hotel = await HotelModel.findByIdAndUpdate(
      hotelId,
      {
        isApproved: false,
        isSuspended: true,
        rejectionReason: reason
      },
      { new: true }
    );

    if (!hotel) {
      throw new Error('Hotel not found');
    }

    await AdminActivityLogger.log(
      adminId,
      'hotel_rejected',
      'hotel',
      hotelId,
      `Rejected hotel: ${hotel.name}`,
      { hotelName: hotel.name, reason }
    );

    return hotel;
  }

  /**
   * Suspend a hotel
   * @param {String} hotelId - Hotel ID
   * @param {String} adminId - Admin user ID
   * @param {String} reason - Suspension reason
   * @returns {Promise<Object>} Updated hotel
   */
  async suspendHotel(hotelId, adminId, reason = '') {
    const hotel = await HotelModel.findByIdAndUpdate(
      hotelId,
      {
        isSuspended: true,
        suspensionReason: reason
      },
      { new: true }
    );

    if (!hotel) {
      throw new Error('Hotel not found');
    }

    await AdminActivityLogger.log(
      adminId,
      'hotel_suspended',
      'hotel',
      hotelId,
      `Suspended hotel: ${hotel.name}`,
      { hotelName: hotel.name, reason }
    );

    return hotel;
  }

  /**
   * Unsuspend a hotel
   * @param {String} hotelId - Hotel ID
   * @param {String} adminId - Admin user ID
   * @returns {Promise<Object>} Updated hotel
   */
  async unsuspendHotel(hotelId, adminId) {
    const hotel = await HotelModel.findByIdAndUpdate(
      hotelId,
      {
        isSuspended: false,
        suspensionReason: ''
      },
      { new: true }
    );

    if (!hotel) {
      throw new Error('Hotel not found');
    }

    await AdminActivityLogger.log(
      adminId,
      'hotel_unsuspended',
      'hotel',
      hotelId,
      `Unsuspended hotel: ${hotel.name}`,
      { hotelName: hotel.name }
    );

    return hotel;
  }

  /**
   * Get low-rated hotels
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Low-rated hotels and pagination
   */
  async getLowRatedHotels({ page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;

    const [hotels, total] = await Promise.all([
      HotelModel.find({
        rating: { $lt: 2.5 },
        totalReviews: { $gte: 5 }
      })
        .populate('ownerId', 'name email phone')
        .sort({ rating: 1 })
        .limit(parseInt(limit))
        .skip(skip),
      HotelModel.countDocuments({
        rating: { $lt: 2.5 },
        totalReviews: { $gte: 5 }
      })
    ]);

    return {
      hotels,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  }


  /**
   * Private method to build query object
   * @private
   */
  _buildHotelQuery(status, search) {
    const query = {};

    // Filter by status
    if (status === 'pending') {
      query.isApproved = false;
      query.isSuspended = false;
    } else if (status === 'approved') {
      query.isApproved = true;
      query.isSuspended = false;
    } else if (status === 'suspended') {
      query.isSuspended = true;
    } else if (status === 'flagged') {
      query.isFlagged = true;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } }
      ];
    }

    return query;
  }
}

module.exports = new AdminHotelService();


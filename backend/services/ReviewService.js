const BaseService = require('./BaseService');
const IReviewService = require('./interfaces/IReviewService');
const ReviewRepository = require('../repositories/ReviewRepository');
const BookingRepository = require('../repositories/BookingRepository');
const HotelRepository = require('../repositories/HotelRepository');
const Review = require('../classes/Review');
const CustomerModel = require('../models/customerModel');

/**
 * ReviewService - Handles review business logic
 * Follows Single Responsibility Principle - only handles review operations
 * Follows Dependency Inversion Principle - depends on repository abstractions
 * Implements IReviewService interface
 */
class ReviewService extends BaseService {
  constructor(dependencies = {}) {
    super(dependencies);
    this.reviewRepository = dependencies.reviewRepository || ReviewRepository;
    this.bookingRepository = dependencies.bookingRepository || BookingRepository;
    this.hotelRepository = dependencies.hotelRepository || HotelRepository;
  }

  /**
   * Create a new review
   */
  async createReview(reviewData, userId) {
    try {
      this.validateRequired(reviewData, ['bookingId', 'rating']);
      this.validateRequired({ userId }, ['userId']);

      // Ensure customer document exists
      let customerDoc = await CustomerModel.findOne({ user: userId });
      if (!customerDoc) {
        customerDoc = await CustomerModel.create({
          user: userId,
          loyaltyPoints: 0,
          bookingHistory: [],
          reviewsGiven: []
        });
      }
      const customerId = customerDoc._id;

      // Find booking
      const booking = await this.bookingRepository.findOne({ 
        _id: reviewData.bookingId, 
        userId: customerId 
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Validate booking status
      if (booking.status !== 'completed' && booking.status !== 'checked-out') {
        throw new Error('You can review only after stay is completed');
      }

      // Check if review already exists
      const existingReview = await this.reviewRepository.findByBooking(reviewData.bookingId);
      if (existingReview) {
        throw new Error('Review already exists for this booking');
      }

      // Create review instance
      const reviewInstance = new Review({
        bookingId: reviewData.bookingId,
        hotelId: booking.hotelId || booking.hotel,
        userId,
        rating: reviewData.rating,
        comment: reviewData.comment || ''
      });

      // Validate review
      const validationErrors = reviewInstance.validate();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Save review
      const savedReview = await this.reviewRepository.create({
        bookingId: reviewInstance.bookingId,
        hotelId: reviewInstance.hotelId,
        userId: reviewInstance.userId,
        rating: reviewInstance.rating,
        comment: reviewInstance.comment
      });

      reviewInstance.id = savedReview._id || savedReview.id;

      // Update hotel rating
      await this.updateHotelRating(reviewInstance.hotelId);

      return reviewInstance.getPublicInfo();
    } catch (error) {
      this.handleError(error, 'Failed to create review');
    }
  }

  /**
   * Update hotel rating based on reviews
   * @private
   */
  async updateHotelRating(hotelId) {
    try {
      const stats = await this.reviewRepository.getHotelRatingStats(hotelId);
      
      await this.hotelRepository.updateRating(
        hotelId,
        stats.average,
        stats.count
      );
    } catch (error) {
      console.error('Error updating hotel rating:', error);
      // Don't throw - rating update failure shouldn't fail review creation
    }
  }

  /**
   * Get reviews for a hotel
   */
  async getHotelReviews(hotelId, options = {}) {
    try {
      if (!hotelId) {
        throw new Error('Hotel ID is required');
      }

      // Check if hotel is suspended
      const hotel = await this.hotelRepository.findById(hotelId);
      if (hotel && hotel.isSuspended) {
        return [];
      }

      const reviews = await this.reviewRepository.findByHotel(hotelId, {
        sort: { createdAt: -1 },
        populate: 'userId',
        ...options
      });

      // Filter out reviews where hotel is null (suspended hotels)
      const filteredReviews = reviews.filter(review => review.hotelId !== null);

      return filteredReviews.map(review => {
        const reviewInstance = new Review(review);
        return reviewInstance.getPublicInfo();
      });
    } catch (error) {
      this.handleError(error, 'Failed to fetch hotel reviews');
    }
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId) {
    try {
      if (!reviewId) {
        throw new Error('Review ID is required');
      }

      const reviewData = await this.reviewRepository.findById(reviewId);
      if (!reviewData) {
        throw new Error('Review not found');
      }

      const reviewInstance = new Review(reviewData);
      return reviewInstance.getPublicInfo();
    } catch (error) {
      this.handleError(error, 'Failed to fetch review');
    }
  }
}

// Export singleton instance
const reviewService = new ReviewService();

// Expose repository for controller access if needed
reviewService.reviewRepository = ReviewRepository;
reviewService.hotelRepository = HotelRepository;

module.exports = reviewService;


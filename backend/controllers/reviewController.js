const ReviewModel = require('../models/reviewsModel');
const BookingModel = require('../models/bookingModel');
const HotelModel = require('../models/hotelModel');

// Create review (customer, one per booking)
const createReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const CustomerModel = require('../models/customerModel');
    const customerDoc = await CustomerModel.findOne({ user: userId });
    const customerId = customerDoc ? customerDoc._id : null;
    const { bookingId, rating, comment = '' } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'bookingId and rating are required' });
    }

    const booking = await BookingModel.findOne({ _id: bookingId, customer: customerId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'completed' && booking.status !== 'checked-out') {
      return res.status(400).json({ success: false, message: 'You can review only after stay is completed' });
    }

    const existing = await ReviewModel.findOne({ booking: bookingId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Review already exists for this booking' });
    }

    const review = await ReviewModel.create({
      booking: booking._id,
      customer: customerId,
      hotel: booking.hotel,
      rating,
      comment
    });

    // Recompute hotel rating aggregation
    const agg = await ReviewModel.aggregate([
      { $match: { hotel: booking.hotel } },
      { $group: { _id: '$hotel', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (agg.length > 0) {
      await HotelModel.findByIdAndUpdate(booking.hotel, {
        ratingAvg: agg[0].avg,
        ratingCount: agg[0].count
      });
    }

    return res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('createReview error:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating review' });
  }
};

// List reviews for a hotel
const listHotelReviews = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const reviews = await ReviewModel.find({ hotel: hotelId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });
    return res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    console.error('listHotelReviews error:', error);
    return res.status(500).json({ success: false, message: 'Server error while listing reviews' });
  }
};

// Reply to a review (hotel owner or admin)
const replyToReview = async (req, res) => {
  try {
    const user = req.user;
    const { reviewId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }

    const review = await ReviewModel.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Allow admin or hotel owner (ownership check can be added if hotel ownership link exists)
    review.reply = { by: user.userId, text, repliedAt: new Date() };
    await review.save();
    return res.json({ success: true, review });
  } catch (error) {
    console.error('replyToReview error:', error);
    return res.status(500).json({ success: false, message: 'Server error while replying to review' });
  }
};

module.exports = { createReview, listHotelReviews, replyToReview };



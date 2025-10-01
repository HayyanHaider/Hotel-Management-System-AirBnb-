const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { createReview, listHotelReviews, replyToReview } = require('../controllers/reviewController');

// Create review (customer)
router.post('/', authenticateToken, authorizeRoles(['customer']), createReview);

// List reviews for a hotel (public)
router.get('/hotel/:hotelId', listHotelReviews);

// Reply to review (owner or admin)
router.post('/:reviewId/reply', authenticateToken, authorizeRoles(['hotel_owner', 'admin']), replyToReview);

module.exports = router;



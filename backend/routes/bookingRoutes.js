const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createBooking,
  getUserBookings,
  cancelBooking,
  getBookingDetails
} = require('../controllers/bookingController');

// Protected routes - Customer only
router.post('/', authenticateToken, authorizeRoles(['customer']), createBooking);
router.get('/my-bookings', authenticateToken, authorizeRoles(['customer']), getUserBookings);
router.get('/:bookingId', authenticateToken, authorizeRoles(['customer']), getBookingDetails);
router.put('/:bookingId/cancel', authenticateToken, authorizeRoles(['customer']), cancelBooking);

module.exports = router;

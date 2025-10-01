const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { confirmBooking, rejectBooking, checkIn, checkOut } = require('../controllers/ownerBookingController');

router.use(authenticateToken, authorizeRoles(['hotel_owner']));

router.put('/:bookingId/confirm', confirmBooking);
router.put('/:bookingId/reject', rejectBooking);
router.put('/:bookingId/check-in', checkIn);
router.put('/:bookingId/check-out', checkOut);

module.exports = router;



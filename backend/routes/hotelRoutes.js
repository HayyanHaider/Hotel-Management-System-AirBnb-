const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createHotel,
  getHotels,
  getHotelDetails,
  updateHotel
} = require('../controllers/hotelController');

// Public routes
router.get('/', getHotels);
router.get('/:hotelId', getHotelDetails);

// Protected routes - Hotel Owner only
router.post('/', authenticateToken, authorizeRoles(['hotel_owner']), createHotel);
router.put('/:hotelId', authenticateToken, authorizeRoles(['hotel_owner']), updateHotel);

module.exports = router;

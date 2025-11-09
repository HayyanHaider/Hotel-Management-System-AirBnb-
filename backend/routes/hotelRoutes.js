const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createHotel,
  getHotels,
  getHotelDetails,
  getOwnerHotels,
  updateHotel,
  deleteHotel
} = require('../controllers/hotelController');

// Public routes
router.get('/', getHotels);

// Protected routes - Hotel Owner only (must come before /:hotelId to avoid route conflicts)
router.get('/owner/my-hotels', authenticateToken, authorizeRoles(['hotel_owner']), getOwnerHotels);
router.post('/', authenticateToken, authorizeRoles(['hotel_owner']), createHotel);
router.put('/:hotelId', authenticateToken, authorizeRoles(['hotel_owner']), updateHotel);
router.delete('/:hotelId', authenticateToken, authorizeRoles(['hotel_owner']), deleteHotel);

// Public routes (must come after specific routes)
router.get('/:hotelId', getHotelDetails);

module.exports = router;

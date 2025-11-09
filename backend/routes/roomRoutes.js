const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createRoom,
  getHotelRooms,
  getRoomDetails,
  updateRoom,
  deleteRoom,
  toggleRoomAvailability,
  getAvailableRooms
} = require('../controllers/roomController');

// Public route - Get available rooms for hotel (for customers)
router.get('/hotel/:hotelId/available', getAvailableRooms);

// Protected routes - Hotel Owner only
router.post('/', authenticateToken, authorizeRoles(['hotel_owner']), createRoom);
router.get('/hotel/:hotelId', authenticateToken, authorizeRoles(['hotel_owner']), getHotelRooms);
router.get('/:roomId', authenticateToken, authorizeRoles(['hotel_owner']), getRoomDetails);
router.put('/:roomId', authenticateToken, authorizeRoles(['hotel_owner']), updateRoom);
router.delete('/:roomId', authenticateToken, authorizeRoles(['hotel_owner']), deleteRoom);
router.put('/:roomId/toggle-availability', authenticateToken, authorizeRoles(['hotel_owner']), toggleRoomAvailability);

module.exports = router;


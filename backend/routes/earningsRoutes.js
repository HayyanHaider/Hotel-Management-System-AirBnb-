const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getEarningsDashboard,
  getEarningsByHotel
} = require('../controllers/earningsController');

// Protected routes - Hotel Owner only
router.get('/dashboard', authenticateToken, authorizeRoles(['hotel_owner']), getEarningsDashboard);
router.get('/hotel/:hotelId', authenticateToken, authorizeRoles(['hotel_owner']), getEarningsByHotel);

module.exports = router;


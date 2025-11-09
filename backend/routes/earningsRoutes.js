const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getEarningsDashboard,
  getEarningsByHotel
} = require('../controllers/earningsController');

// Protected routes - Hotel only
router.get('/dashboard', authenticateToken, authorizeRoles(['hotel']), getEarningsDashboard);
router.get('/hotel/:hotelId', authenticateToken, authorizeRoles(['hotel']), getEarningsByHotel);

module.exports = router;


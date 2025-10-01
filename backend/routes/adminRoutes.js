const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { approveHotel, suspendHotel, suspendUser } = require('../controllers/adminController');

router.use(authenticateToken, authorizeRoles(['admin']));

router.put('/hotels/:hotelId/approve', approveHotel);
router.put('/hotels/:hotelId/suspend', suspendHotel);
router.put('/users/:userId/suspend', suspendUser);

module.exports = router;



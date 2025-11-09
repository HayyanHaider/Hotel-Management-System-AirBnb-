const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createCoupon,
  getHotelCoupons,
  getCouponDetails,
  updateCoupon,
  deleteCoupon
} = require('../controllers/couponController');

// Protected routes - Hotel Owner only
router.post('/', authenticateToken, authorizeRoles(['hotel_owner']), createCoupon);
router.get('/hotel/:hotelId', authenticateToken, authorizeRoles(['hotel_owner']), getHotelCoupons);
router.get('/:couponId', authenticateToken, authorizeRoles(['hotel_owner']), getCouponDetails);
router.put('/:couponId', authenticateToken, authorizeRoles(['hotel_owner']), updateCoupon);
router.delete('/:couponId', authenticateToken, authorizeRoles(['hotel_owner']), deleteCoupon);

module.exports = router;


const express = require('express');
const router = express.Router();
const { signup, login, getProfile, verifyTokenController } = require('../controllers/authController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.get('/verify-token', verifyToken, verifyTokenController);

// Role-specific routes for testing
router.get('/customer-dashboard', verifyToken, authorize('customer'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Customer Dashboard',
    user: req.user
  });
});

router.get('/admin-dashboard', verifyToken, authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Admin Dashboard',
    user: req.user
  });
});

router.get('/hotel-dashboard', verifyToken, authorize('hotel'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Hotel Dashboard',
    user: req.user
  });
});

module.exports = router;

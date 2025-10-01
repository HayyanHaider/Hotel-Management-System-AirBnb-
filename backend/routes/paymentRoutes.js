const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  processPayment,
  getPaymentHistory,
  processRefund,
  getPaymentDetails
} = require('../controllers/paymentController');

// Protected routes - Customer only
router.post('/process', authenticateToken, authorizeRoles(['customer']), processPayment);
router.get('/history', authenticateToken, authorizeRoles(['customer']), getPaymentHistory);
router.post('/refund', authenticateToken, authorizeRoles(['customer']), processRefund);
router.get('/:paymentId', authenticateToken, authorizeRoles(['customer']), getPaymentDetails);

module.exports = router;

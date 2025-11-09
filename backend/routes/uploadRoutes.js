const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { upload, uploadImage, uploadMultipleImages } = require('../controllers/uploadController');

// Single image upload
router.post('/image', authenticateToken, upload.single('image'), uploadImage);

// Multiple images upload
router.post('/images', authenticateToken, upload.array('images', 10), uploadMultipleImages);

module.exports = router;


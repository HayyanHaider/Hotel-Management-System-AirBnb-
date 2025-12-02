const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// Verify JWT Token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    console.log('Decoded token:', decoded); // Debug log
    
    // Check if user still exists - handle both string and ObjectId
    let userId = decoded.userId;
    
    // If userId is a string, convert to ObjectId if valid
    if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
      userId = new mongoose.Types.ObjectId(userId);
    }
    
    const user = await User.findById(userId);
    
    console.log('Found user:', user ? user._id : 'NOT FOUND'); // Debug log
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is no longer valid.'
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended.'
      });
    }

    // Attach both decoded token and full user to request
    req.user = {
      userId: user._id.toString(),
      role: decoded.role
    };
    req.userData = user;
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Token verification failed.'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Create authorizeRoles function that matches the expected interface
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    // Handle hotel_owner role - treat it as 'hotel' for authorization
    let userRole = req.user.role;
    if (userRole === 'hotel_owner' && roles.includes('hotel')) {
      userRole = 'hotel'; // Allow hotel_owner to access hotel routes
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken: verifyToken,
  authorizeRoles,
  verifyToken,
  authorize
};

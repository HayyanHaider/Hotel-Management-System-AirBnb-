const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const User = require('../classes/User');
const Customer = require('../classes/Customer');
const HotelOwner = require('../classes/HotelOwner'); // Internal class name (kept to avoid conflict with Hotel class)
const Admin = require('../classes/Admin');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Factory function to create user instances based on role
const createUserInstance = (userData) => {
  switch (userData.role) {
    case 'customer':
      return new Customer(userData);
    case 'hotel':
      return new HotelOwner(userData);
    case 'admin':
      return new Admin(userData);
    default:
      return new Customer(userData); // Default to customer
  }
};

// Signup Controller
const signup = async (req, res) => {
  try {
    console.log('Signup request received:', req.body);
    const { name, email, password, phone, role } = req.body;

    // Basic validation for required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate role
    const validRoles = ['customer', 'hotel', 'admin'];
    const userRole = role || 'customer';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Trim and normalize input data (handle null/undefined)
    const trimmedName = (name && typeof name === 'string') ? name.trim() : '';
    const trimmedEmail = (email && typeof email === 'string') ? email.trim().toLowerCase() : '';
    const trimmedPhone = (phone && typeof phone === 'string') ? phone.trim() : '';

    // Additional validation after trimming
    if (!trimmedName || trimmedName.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name is required and cannot be empty'
      });
    }

    if (!trimmedEmail || trimmedEmail.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email is required and cannot be empty'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Create user instance using OOP
    const userData = {
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      role: userRole
    };

    const userInstance = createUserInstance(userData);

    // Validate using OOP method (additional validation)
    const validationErrors = userInstance.validate();
    if (validationErrors.length > 0) {
      console.log('OOP Validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Check if user already exists (using trimmed and normalized email)
    const existingUser = await UserModel.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password using OOP method
    try {
      await userInstance.hashPassword(password);
    } catch (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError.message || 'Invalid password'
      });
    }

    // Create new user in database
    const newUser = new UserModel({
      name: userInstance.name,
      email: userInstance.email,
      passwordHash: userInstance.passwordHash,
      phone: userInstance.phone,
      role: userInstance.role,
      isVerified: true // Auto-verify for demo purposes
    });

    await newUser.save();

    // Create role-specific document if needed
    if (userInstance.role === 'customer') {
      const CustomerModel = require('../models/customerModel');
      const existingCustomer = await CustomerModel.findOne({ user: newUser._id });
      if (!existingCustomer) {
        await CustomerModel.create({
          user: newUser._id,
          loyaltyPoints: 0,
          bookingHistory: [],
          reviewsGiven: []
        });
      }
    }
    // Note: Hotel users don't need a separate model - they're just users with 'hotel' role
    // Hotel-specific data is stored in the Hotel model's ownerId field

    // Generate token using OOP method
    userInstance.id = newUser._id;
    const token = userInstance.generateToken();

    // Send welcome email to user (async, don't block response)
    try {
      const emailTemplate = emailTemplates.accountCreatedEmail(
        { name: userInstance.name, email: userInstance.email },
        userInstance.role
      );
      
      await sendEmail(
        userInstance.email,
        emailTemplate.subject,
        emailTemplate.html,
        emailTemplate.text
      );
      
      console.log(`✅ Account creation email sent to: ${userInstance.email}`);
    } catch (emailError) {
      console.error('❌ Error sending account creation email:', emailError);
      // Don't fail the signup if email fails
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: userInstance.getPublicInfo()
    });

  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }
    
    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Login Controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user in database
    const dbUser = await UserModel.findOne({ email });
    if (!dbUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Create user instance using OOP
    const userData = {
      id: dbUser._id,
      name: dbUser.name,
      email: dbUser.email,
      passwordHash: dbUser.passwordHash,
      phone: dbUser.phone,
      role: dbUser.role,
      isVerified: dbUser.isVerified,
      isSuspended: dbUser.isSuspended,
      suspendedReason: dbUser.suspendedReason,
      walletBalance: dbUser.walletBalance,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    };

    const userInstance = createUserInstance(userData);

    // Check if user is suspended using OOP method
    if (userInstance.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact support.'
      });
    }

    // Verify password using OOP method
    const isPasswordValid = await userInstance.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token using OOP method
    const token = userInstance.generateToken();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userInstance.getPublicInfo()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Get User Profile (Protected Route)
const getProfile = async (req, res) => {
  try {
    const dbUser = await UserModel.findById(req.user.userId).select('-passwordHash');
    
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create user instance using OOP
    const userData = {
      id: dbUser._id,
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      role: dbUser.role,
      isVerified: dbUser.isVerified,
      isSuspended: dbUser.isSuspended,
      suspendedReason: dbUser.suspendedReason,
      walletBalance: dbUser.walletBalance,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    };

    const userInstance = createUserInstance(userData);

    res.json({
      success: true,
      user: userInstance.getPublicInfo()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// Verify Token Controller
const verifyTokenController = async (req, res) => {
  try {
    const dbUser = await UserModel.findById(req.user.userId).select('-passwordHash');
    
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is suspended
    if (dbUser.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended'
      });
    }

    // Create user instance using OOP
    const userData = {
      id: dbUser._id,
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      role: dbUser.role,
      isVerified: dbUser.isVerified,
      isSuspended: dbUser.isSuspended,
      suspendedReason: dbUser.suspendedReason,
      walletBalance: dbUser.walletBalance,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    };

    const userInstance = createUserInstance(userData);

    res.json({
      success: true,
      valid: true,
      user: userInstance.getPublicInfo()
    });

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying token'
    });
  }
};

// Update User Profile (Protected Route)
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.userId;

    const dbUser = await UserModel.findById(userId);
    
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long'
        });
      }
      dbUser.name = trimmedName;
    }

    if (phone !== undefined) {
      dbUser.phone = phone.trim();
    }

    await dbUser.save();

    // Create user instance using OOP
    const userData = {
      id: dbUser._id,
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      role: dbUser.role,
      isVerified: dbUser.isVerified,
      isSuspended: dbUser.isSuspended,
      suspendedReason: dbUser.suspendedReason,
      walletBalance: dbUser.walletBalance,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    };

    const userInstance = createUserInstance(userData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userInstance.getPublicInfo()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  verifyTokenController,
  updateProfile
};

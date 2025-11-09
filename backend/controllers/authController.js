const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const User = require('../classes/User');
const Customer = require('../classes/Customer');
const HotelOwner = require('../classes/HotelOwner');
const Admin = require('../classes/Admin');

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
    case 'hotel_owner':
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

    // Create user instance using OOP
    const userData = {
      name,
      email,
      phone: phone || '',
      role: role || 'customer'
    };

    const userInstance = createUserInstance(userData);

    // Validate using OOP method
    const validationErrors = userInstance.validate();
    if (validationErrors.length > 0) {
      console.log('Validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password using OOP method
    await userInstance.hashPassword(password);

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
          reviewsGiven: [],
          preferredLocations: []
        });
      }
    } else if (userInstance.role === 'hotel_owner') {
      const HotelOwnerModel = require('../models/hotelOwnerModel');
      const existingOwner = await HotelOwnerModel.findOne({ user: newUser._id });
      if (!existingOwner) {
        await HotelOwnerModel.create({
          user: newUser._id,
          ownedHotels: [],
          commissionRate: 0.10,
          totalEarnings: 0,
          monthlyEarnings: 0,
          walletBalance: 0,
          businessLicense: '',
          taxId: ''
        });
      }
    }

    // Generate token using OOP method
    userInstance.id = newUser._id;
    const token = userInstance.generateToken();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: userInstance.getPublicInfo()
    });

  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: error.message
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

module.exports = {
  signup,
  login,
  getProfile,
  verifyTokenController
};

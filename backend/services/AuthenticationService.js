const BaseService = require('./BaseService');
const IAuthenticationService = require('./interfaces/IAuthenticationService');
const UserRepository = require('../repositories/UserRepository');
const User = require('../classes/User');

/**
 * AuthenticationService - Handles authentication operations
 * Follows Single Responsibility Principle - only handles authentication
 * Follows Dependency Inversion Principle - depends on IRepository abstraction
 * Implements IAuthenticationService interface
 */
class AuthenticationService extends BaseService {
  constructor(dependencies = {}) {
    super(dependencies);
    this.userRepository = dependencies.userRepository || UserRepository;
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user and token
   */
  async register(userData) {
    try {
      this.validateRequired(userData, ['name', 'email', 'password']);

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create user instance
      const user = new User({
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        role: userData.role || 'customer'
      });

      // Validate user data
      const validationErrors = user.validate();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Hash password
      await user.hashPassword(userData.password);

      // Save to database
      const savedUser = await this.userRepository.create({
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isSuspended: user.isSuspended,
        favorites: user.favorites,
        walletBalance: user.walletBalance
      });

      user.id = savedUser._id || savedUser.id;

      // Generate token
      const token = user.generateToken();

      return {
        user: user.getPublicInfo(),
        token
      };
    } catch (error) {
      this.handleError(error, 'Registration failed');
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User and token
   */
  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Find user by email
      const userData = await this.userRepository.findByEmail(email);
      if (!userData) {
        throw new Error('Invalid email or password');
      }

      // Create user instance with proper ID from database
      const user = new User({
        ...userData,
        id: userData._id || userData.id, // Ensure ID is set from database
        _id: userData._id // Keep original _id
      });

      // Check if user is suspended
      if (user.isSuspended) {
        throw new Error('Account is suspended. Please contact support.');
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate token with the database ID
      const token = user.generateToken();

      console.log('Login successful - User ID:', user.id, 'Type:', typeof user.id); // Debug log

      return {
        user: user.getPublicInfo(),
        token
      };
    } catch (error) {
      this.handleError(error, 'Login failed');
    }
  }

  /**
   * Verify token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token data
   */
  async verifyToken(token) {
    try {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      
      const decoded = jwt.verify(token, secret);
      
      // Verify user still exists and is not suspended
      const userData = await this.userRepository.findById(decoded.userId);
      if (!userData) {
        throw new Error('User not found');
      }

      if (userData.isSuspended) {
        throw new Error('User account is suspended');
      }

      return {
        userId: decoded.userId,
        role: decoded.role,
        user: userData
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      }
      this.handleError(error, 'Token verification failed');
    }
  }

  /**
   * Generate token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    if (!user || !user.id) {
      throw new Error('User object with id is required');
    }

    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    return jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn: '7d' }
    );
  }
}

module.exports = new AuthenticationService();


const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.name = userData.name;
    this.email = userData.email;
    this.passwordHash = userData.passwordHash;
    this.phone = userData.phone || '';
    this.role = userData.role || 'customer';
    this.isVerified = userData.isVerified || false;
    this.isSuspended = userData.isSuspended || false;
    this.suspendedReason = userData.suspendedReason || '';
    this.suspendedAt = userData.suspendedAt || null;
    this.favorites = userData.favorites || [];
    this.walletBalance = userData.walletBalance || 0;
  }

  // Encapsulation: Private method to validate email
  #validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Encapsulation: Private method to validate password strength
  #validatePassword(password) {
    return password && password.length >= 6;
  }

  // Method to hash password
  async hashPassword(password) {
    if (!this.#validatePassword(password)) {
      throw new Error('Password must be at least 6 characters long');
    }
    const saltRounds = 12;
    this.passwordHash = await bcrypt.hash(password, saltRounds);
  }

  // Method to verify password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.passwordHash);
  }

  // Method to generate JWT token
  generateToken() {
    return jwt.sign(
      { userId: this.id, role: this.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
  }

  // Method to validate user data
  validate() {
    const errors = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Name is required');
    }
    
    if (!this.email || !this.#validateEmail(this.email)) {
      errors.push('Valid email is required');
    }
    
    // Don't validate passwordHash during signup - it will be set after validation
    
    return errors;
  }

  // Method to update profile
  updateProfile(updates) {
    const allowedFields = ['name', 'phone'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        this[field] = updates[field];
      }
    });
    
    this.updatedAt = new Date();
  }

  // Method to suspend user (Admin functionality)
  suspend(reason) {
    this.isSuspended = true;
    this.suspendedReason = reason || '';
    this.suspendedAt = new Date();
    this.updatedAt = new Date();
  }

  // Method to unsuspend user
  unsuspend() {
    this.isSuspended = false;
    this.suspendedReason = '';
    this.suspendedAt = null;
    this.updatedAt = new Date();
  }

  // Method to verify user
  verify() {
    this.isVerified = true;
    this.updatedAt = new Date();
  }

  // Method to get user info (excluding sensitive data)
  getPublicInfo() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      role: this.role,
      isVerified: this.isVerified,
      favorites: this.favorites,
      walletBalance: this.walletBalance || 0
    };
  }

  // Abstract method to be overridden by child classes
  getSpecificCapabilities() {
    throw new Error('getSpecificCapabilities method must be implemented by child classes');
  }

  // Method to check if user has permission
  hasPermission(permission) {
    // Base permissions for all users
    const basePermissions = ['view_profile', 'update_profile'];
    return basePermissions.includes(permission);
  }
}

module.exports = User;

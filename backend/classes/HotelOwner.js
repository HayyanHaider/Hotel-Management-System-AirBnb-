const User = require('./User');

class HotelOwner extends User {
  constructor(userData) {
    super(userData);
    this.businessName = userData.businessName || '';
    this.ownedHotels = userData.ownedHotels || [];
    this.commissionRate = userData.commissionRate || 0.10;
    this.totalEarnings = userData.totalEarnings || 0;
    this.monthlyEarnings = userData.monthlyEarnings || 0;
    this.walletBalance = userData.walletBalance || 0;
    this.rating = userData.rating || 0;
    this.totalReviews = userData.totalReviews || 0;
    this.businessLicense = userData.businessLicense || '';
    this.taxId = userData.taxId || '';
    this.bankDetails = userData.bankDetails || {};
  }

  // Inheritance: Override parent method
  getSpecificCapabilities() {
    return [
      'manage_hotels',
      'add_hotels',
      'update_hotel_info',
      'manage_rooms',
      'view_bookings',
      'respond_to_reviews',
      'view_earnings',
      'manage_availability'
    ];
  }

  // Polymorphism: Override hasPermission method
  hasPermission(permission) {
    // Check base permissions first
    if (super.hasPermission(permission)) {
      return true;
    }
    
    // Hotel-specific permissions
    const hotelPermissions = [
      'manage_hotels',
      'add_hotels',
      'update_hotel_info',
      'manage_rooms',
      'view_bookings',
      'respond_to_reviews',
      'view_earnings',
      'manage_availability'
    ];
    return hotelPermissions.includes(permission);
  }

  // Method to add hotel to owned hotels
  addHotel(hotelId) {
    if (!this.ownedHotels) {
      this.ownedHotels = [];
    }
    if (!this.ownedHotels.includes(hotelId)) {
      this.ownedHotels.push(hotelId);
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // Method to remove hotel from owned hotels
  removeHotel(hotelId) {
    if (!this.ownedHotels) {
      this.ownedHotels = [];
      return false;
    }
    const index = this.ownedHotels.indexOf(hotelId);
    if (index > -1) {
      this.ownedHotels.splice(index, 1);
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // Method to calculate earnings after commission
  calculateNetEarnings(grossAmount) {
    const commission = grossAmount * this.commissionRate;
    return grossAmount - commission;
  }

  // Method to add earnings
  addEarnings(amount) {
    const netAmount = this.calculateNetEarnings(amount);
    this.totalEarnings += netAmount;
    this.monthlyEarnings += netAmount;
    this.walletBalance += netAmount;
    this.updatedAt = new Date();
    return netAmount;
  }

  // Method to reset monthly earnings (called at month end)
  resetMonthlyEarnings() {
    this.monthlyEarnings = 0;
    this.updatedAt = new Date();
  }

  // Method to update business information
  updateBusinessInfo(businessInfo) {
    const allowedFields = ['businessLicense', 'taxId', 'bankDetails'];
    
    allowedFields.forEach(field => {
      if (businessInfo[field] !== undefined) {
        this[field] = businessInfo[field];
      }
    });
    
    this.updatedAt = new Date();
  }

  // Method to update rating
  updateRating(newRating) {
    // Recalculate average rating
    const totalRatingPoints = this.rating * this.totalReviews;
    this.totalReviews += 1;
    this.rating = (totalRatingPoints + newRating) / this.totalReviews;
    this.updatedAt = new Date();
  }

  // Method to check if owner can add more hotels
  canAddMoreHotels() {
    if (!this.ownedHotels) {
      this.ownedHotels = [];
    }
    const maxHotels = this.isVerified ? 10 : 2; // Verified owners can have more hotels
    return this.ownedHotels.length < maxHotels && !this.isSuspended;
  }

  // Method to get business statistics
  getBusinessStats() {
    return {
      totalHotels: (this.ownedHotels && this.ownedHotels.length) || 0,
      totalEarnings: this.totalEarnings || 0,
      monthlyEarnings: this.monthlyEarnings || 0,
      averageRating: this.rating || 0,
      totalReviews: this.totalReviews || 0,
      commissionRate: this.commissionRate || 0.10
    };
  }

  // Method to calculate commission for platform
  calculateCommission(amount) {
    return amount * this.commissionRate;
  }

  // Method to check business verification status
  isBusinessVerified() {
    return this.businessLicense && this.taxId && this.isVerified;
  }

  // Method to withdraw earnings
  withdrawEarnings(amount) {
    if (this.walletBalance >= amount && amount > 0) {
      this.walletBalance -= amount;
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // Method to get payout information
  getPayoutInfo() {
    return {
      availableBalance: this.walletBalance,
      totalEarnings: this.totalEarnings,
      monthlyEarnings: this.monthlyEarnings,
      bankDetails: this.bankDetails,
      canWithdraw: this.isBusinessVerified() && this.walletBalance > 0
    };
  }

  // Override getPublicInfo to include hotel specific data
  getPublicInfo() {
    const baseInfo = super.getPublicInfo();
    return {
      ...baseInfo,
      totalHotels: (this.ownedHotels && this.ownedHotels.length) || 0,
      rating: this.rating || 0,
      totalReviews: this.totalReviews || 0,
      isBusinessVerified: this.isBusinessVerified()
    };
  }
}

module.exports = HotelOwner;

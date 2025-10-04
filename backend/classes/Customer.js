const User = require('./User');

class Customer extends User {
  constructor(userData) {
    super(userData);
    this.loyaltyPoints = userData.loyaltyPoints || 0;
  }

  // Inheritance: Override parent method
  getSpecificCapabilities() {
    return [
      'book_rooms',
      'cancel_bookings',
      'write_reviews',
      'add_favorites',
      'view_booking_history',
      'earn_loyalty_points'
    ];
  }

  // Polymorphism: Override hasPermission method
  hasPermission(permission) {
    const customerPermissions = [
      ...super.hasPermission(permission) ? ['view_profile', 'update_profile'] : [],
      'book_rooms',
      'cancel_bookings',
      'write_reviews',
      'add_favorites',
      'view_booking_history'
    ];
    return customerPermissions.includes(permission);
  }

  // Method to add hotel to favorites
  addToFavorites(hotelId) {
    if (!this.favorites.includes(hotelId)) {
      this.favorites.push(hotelId);
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // Method to remove hotel from favorites
  removeFromFavorites(hotelId) {
    const index = this.favorites.indexOf(hotelId);
    if (index > -1) {
      this.favorites.splice(index, 1);
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // Method to check if hotel is in favorites
  isFavorite(hotelId) {
    return this.favorites.includes(hotelId);
  }

  // Method to add booking to history
  addBookingToHistory(bookingId) {
    if (!this.bookingHistory.includes(bookingId)) {
      this.bookingHistory.push(bookingId);
      this.updatedAt = new Date();
    }
  }

  // Method to add review
  addReview(reviewId) {
    if (!this.reviewsGiven.includes(reviewId)) {
      this.reviewsGiven.push(reviewId);
      this.earnLoyaltyPoints(10); // Earn points for writing reviews
      this.updatedAt = new Date();
    }
  }

  // Method to earn loyalty points
  earnLoyaltyPoints(points) {
    this.loyaltyPoints += points;
    this.updatedAt = new Date();
  }

  // Method to redeem loyalty points
  redeemLoyaltyPoints(points) {
    if (this.loyaltyPoints >= points) {
      this.loyaltyPoints -= points;
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // Method to add preferred location
  addPreferredLocation(location) {
    if (!this.preferredLocations.includes(location)) {
      this.preferredLocations.push(location);
      this.updatedAt = new Date();
    }
  }

  // Method to get booking statistics
  getBookingStats() {
    return {
      totalBookings: this.bookingHistory.length,
      totalReviews: this.reviewsGiven.length,
      loyaltyPoints: this.loyaltyPoints,
      favoriteCount: this.favorites.length
    };
  }

  // Method to check if customer can book (business logic)
  canBook() {
    return this.isVerified && !this.isSuspended;
  }

  // Method to calculate discount based on loyalty points
  calculateLoyaltyDiscount() {
    if (this.loyaltyPoints >= 1000) return 0.15; // 15% discount
    if (this.loyaltyPoints >= 500) return 0.10;  // 10% discount
    if (this.loyaltyPoints >= 200) return 0.05;  // 5% discount
    return 0; // No discount
  }

  // Override getPublicInfo to include customer-specific data
  getPublicInfo() {
    const baseInfo = super.getPublicInfo();
    return {
      ...baseInfo,
      loyaltyPoints: this.loyaltyPoints,
      favoriteCount: this.favorites.length,
      totalBookings: this.bookingHistory.length,
      totalReviews: this.reviewsGiven.length
    };
  }
}

module.exports = Customer;

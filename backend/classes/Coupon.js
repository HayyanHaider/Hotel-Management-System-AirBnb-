class Coupon {
  constructor(couponData) {
    this.id = couponData.id;
    this.hotelId = couponData.hotelId;
    this.code = couponData.code;
    this.discountPercentage = couponData.discountPercentage;
    this.validFrom = couponData.validFrom;
    this.validTo = couponData.validTo;
    this.isActive = couponData.isActive !== undefined ? couponData.isActive : true;
    this.maxUses = couponData.maxUses || null;
    this.currentUses = couponData.currentUses || 0;
    this.createdAt = couponData.createdAt;
    this.updatedAt = couponData.updatedAt;
  }

  // Encapsulation: Private method to validate coupon data
  #validateCouponData() {
    const errors = [];
    
    if (!this.code || this.code.trim().length === 0) {
      errors.push('Coupon code is required');
    }
    
    if (!this.discountPercentage || this.discountPercentage < 0 || this.discountPercentage > 100) {
      errors.push('Discount percentage must be between 0 and 100');
    }
    
    if (!this.validFrom || !this.validTo) {
      errors.push('Valid from and to dates are required');
    }
    
    if (this.validFrom && this.validTo && new Date(this.validFrom) >= new Date(this.validTo)) {
      errors.push('Valid from date must be before valid to date');
    }
    
    if (this.maxUses !== null && this.maxUses <= 0) {
      errors.push('Max uses must be greater than 0');
    }
    
    return errors;
  }

  // Method to validate coupon information
  validate() {
    return this.#validateCouponData();
  }

  // Method to check if coupon is currently valid
  isValid() {
    if (!this.isActive) {
      return false;
    }
    
    // Check if max uses reached
    if (this.maxUses !== null && this.currentUses >= this.maxUses) {
      return false;
    }
    
    const now = new Date();
    const validFrom = new Date(this.validFrom);
    const validTo = new Date(this.validTo);
    
    return now >= validFrom && now <= validTo;
  }

  // Method to check if coupon is expired
  isExpired() {
    const now = new Date();
    const validTo = new Date(this.validTo);
    return now > validTo || (this.maxUses !== null && this.currentUses >= this.maxUses);
  }

  // Method to check if coupon is not yet active
  isNotYetActive() {
    const now = new Date();
    const validFrom = new Date(this.validFrom);
    return now < validFrom;
  }

  // Method to calculate discount amount
  calculateDiscount(originalAmount) {
    if (!this.isValid()) {
      return 0;
    }
    
    return originalAmount * (this.discountPercentage / 100);
  }

  // Method to apply coupon to an amount
  applyCoupon(originalAmount) {
    const discount = this.calculateDiscount(originalAmount);
    return {
      originalAmount: originalAmount,
      discountAmount: discount,
      finalAmount: originalAmount - discount,
      couponCode: this.code,
      discountPercentage: this.discountPercentage
    };
  }

  // Method to increment usage count
  incrementUsage() {
    if (this.maxUses === null || this.currentUses < this.maxUses) {
      this.currentUses += 1;
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // Method to get coupon summary
  getSummary() {
    return {
      id: this.id,
      code: this.code,
      discountPercentage: this.discountPercentage,
      validFrom: this.validFrom,
      validTo: this.validTo,
      isActive: this.isActive,
      isValid: this.isValid(),
      isExpired: this.isExpired(),
      isNotYetActive: this.isNotYetActive(),
      maxUses: this.maxUses,
      currentUses: this.currentUses,
      remainingUses: this.maxUses !== null ? this.maxUses - this.currentUses : null
    };
  }

  // Static method to validate coupon code format
  static isValidCodeFormat(code) {
    // Coupon codes should be uppercase, alphanumeric, and 3-20 characters
    const codeRegex = /^[A-Z0-9]{3,20}$/;
    return codeRegex.test(code);
  }

  // Static method to search coupons by criteria
  static searchByCriteria(coupons, criteria) {
    if (!coupons) return [];
    
    return coupons.filter(coupon => {
      let matches = true;
      
      if (criteria.hotelId && coupon.hotelId !== criteria.hotelId) {
        matches = false;
      }
      
      if (criteria.code && coupon.code.toLowerCase() !== criteria.code.toLowerCase()) {
        matches = false;
      }
      
      if (criteria.minDiscount && coupon.discountPercentage < criteria.minDiscount) {
        matches = false;
      }
      
      if (criteria.maxDiscount && coupon.discountPercentage > criteria.maxDiscount) {
        matches = false;
      }
      
      if (criteria.isActive !== undefined && coupon.isActive !== criteria.isActive) {
        matches = false;
      }
      
      if (criteria.isValid !== undefined && coupon.isValid() !== criteria.isValid) {
        matches = false;
      }
      
      if (criteria.isExpired !== undefined && coupon.isExpired() !== criteria.isExpired) {
        matches = false;
      }
      
      return matches;
    });
  }
}

module.exports = Coupon;

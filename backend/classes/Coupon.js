class Coupon {
  constructor(couponData) {
    this.id = couponData.id;
    this.code = couponData.code;
    this.discountPercentage = couponData.discountPercentage;
    this.validFrom = couponData.validFrom;
    this.validTo = couponData.validTo;
  }

  // Method to validate coupon data
  validate() {
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
    
    if (this.validFrom >= this.validTo) {
      errors.push('Valid from date must be before valid to date');
    }
    
    return errors;
  }

  // Method to check if coupon is currently valid
  isValid() {
    const now = new Date();
    return now >= this.validFrom && now <= this.validTo;
  }

  // Method to check if coupon is expired
  isExpired() {
    const now = new Date();
    return now > this.validTo;
  }

  // Method to check if coupon is not yet active
  isNotYetActive() {
    const now = new Date();
    return now < this.validFrom;
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

  // Method to get coupon summary
  getSummary() {
    return {
      id: this.id,
      code: this.code,
      discountPercentage: this.discountPercentage,
      validFrom: this.validFrom,
      validTo: this.validTo,
      isValid: this.isValid(),
      isExpired: this.isExpired(),
      isNotYetActive: this.isNotYetActive()
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
    return coupons.filter(coupon => {
      let matches = true;
      
      if (criteria.code && coupon.code.toLowerCase() !== criteria.code.toLowerCase()) {
        matches = false;
      }
      
      if (criteria.minDiscount && coupon.discountPercentage < criteria.minDiscount) {
        matches = false;
      }
      
      if (criteria.maxDiscount && coupon.discountPercentage > criteria.maxDiscount) {
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

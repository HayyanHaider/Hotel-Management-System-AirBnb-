class Booking {
  constructor(bookingData) {
    this.id = bookingData.id;
    this.checkIn = bookingData.checkIn;
    this.checkOut = bookingData.checkOut;
    this.nights = bookingData.nights;
    this.taxes = bookingData.taxes || 0;
    this.discounts = bookingData.discounts || 0;
    this.totalPrice = bookingData.totalPrice;
    this.status = bookingData.status;
    this.confirmedAt = bookingData.confirmedAt || null;
    this.cancelledAt = bookingData.cancelledAt || null;
  }

  // Encapsulation: Private method to validate booking data
  #validateBookingData() {
    const errors = [];
    
    if (!this.customerId) {
      errors.push('Customer ID is required');
    }
    
    if (!this.hotelId) {
      errors.push('Hotel ID is required');
    }
    
    if (!this.roomId) {
      errors.push('Room ID is required');
    }
    
    if (!this.checkInDate || !this.checkOutDate) {
      errors.push('Check-in and check-out dates are required');
    }
    
    if (this.checkInDate >= this.checkOutDate) {
      errors.push('Check-out date must be after check-in date');
    }
    
    if (this.guestCount <= 0) {
      errors.push('Guest count must be greater than 0');
    }
    
    if (!this.totalAmount || this.totalAmount <= 0) {
      errors.push('Valid total amount is required');
    }
    
    return errors;
  }

  // Method to validate booking information
  validate() {
    return this.#validateBookingData();
  }

  // Method to calculate number of nights
  getNights() {
    return Math.ceil((this.checkOutDate - this.checkInDate) / (1000 * 60 * 60 * 24));
  }

  // Method to check if booking is active
  isActive() {
    return this.status === 'confirmed' && this.paymentStatus === 'paid';
  }

  // Method to check if booking can be cancelled
  canBeCancelled() {
    const now = new Date();
    const hoursUntilCheckIn = (this.checkInDate - now) / (1000 * 60 * 60);
    
    return (this.status === 'confirmed' || this.status === 'pending') && 
           hoursUntilCheckIn > 24; // Can cancel up to 24 hours before check-in
  }

  // Method to confirm booking
  confirm() {
    if (this.status !== 'pending') {
      throw new Error('Only pending bookings can be confirmed');
    }
    
    this.status = 'confirmed';
    this.confirmedAt = new Date();
    this.updatedAt = new Date();
  }

  // Method to cancel booking
  cancel(reason = '') {
    if (!this.canBeCancelled()) {
      throw new Error('Booking cannot be cancelled');
    }
    
    this.status = 'cancelled';
    this.cancellationReason = reason;
    this.cancelledAt = new Date();
    this.updatedAt = new Date();
    
    // Calculate refund amount based on cancellation policy
    this.calculateRefund();
  }

  // Method to complete booking (after checkout)
  complete() {
    if (this.status !== 'confirmed') {
      throw new Error('Only confirmed bookings can be completed');
    }
    
    const now = new Date();
    if (now < this.checkOutDate) {
      throw new Error('Booking cannot be completed before checkout date');
    }
    
    this.status = 'completed';
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  // Method to calculate refund amount
  calculateRefund() {
    const now = new Date();
    const hoursUntilCheckIn = (this.checkInDate - now) / (1000 * 60 * 60);
    
    if (hoursUntilCheckIn > 168) { // More than 7 days
      this.refundAmount = this.totalAmount; // Full refund
    } else if (hoursUntilCheckIn > 72) { // 3-7 days
      this.refundAmount = this.totalAmount * 0.75; // 75% refund
    } else if (hoursUntilCheckIn > 24) { // 1-3 days
      this.refundAmount = this.totalAmount * 0.50; // 50% refund
    } else {
      this.refundAmount = 0; // No refund
    }
  }

  // Method to process refund
  processRefund() {
    if (this.status !== 'cancelled') {
      throw new Error('Only cancelled bookings can be refunded');
    }
    
    if (this.refundAmount > 0) {
      this.paymentStatus = 'refunded';
      this.updatedAt = new Date();
      return this.refundAmount;
    }
    
    return 0;
  }

  // Method to update payment status
  updatePaymentStatus(status, paymentId = null) {
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid payment status');
    }
    
    this.paymentStatus = status;
    if (paymentId) {
      this.paymentId = paymentId;
    }
    this.updatedAt = new Date();
  }

  // Method to add special requests
  addSpecialRequest(request) {
    if (this.specialRequests) {
      this.specialRequests += '; ' + request;
    } else {
      this.specialRequests = request;
    }
    this.updatedAt = new Date();
  }

  // Method to check if booking is in the past
  isPast() {
    const now = new Date();
    return this.checkOutDate < now;
  }

  // Method to check if booking is current (guest is checked in)
  isCurrent() {
    const now = new Date();
    return this.checkInDate <= now && now < this.checkOutDate && this.status === 'confirmed';
  }

  // Method to check if booking is upcoming
  isUpcoming() {
    const now = new Date();
    return this.checkInDate > now && this.status === 'confirmed';
  }

  // Method to get booking duration in days
  getDuration() {
    return this.getNights();
  }

  // Method to calculate average price per night
  getAveragePricePerNight() {
    const nights = this.getNights();
    return nights > 0 ? this.totalAmount / nights : 0;
  }

  // Static method to search bookings by criteria
  static searchByCriteria(bookings, criteria) {
    return bookings.filter(booking => {
      let matches = true;
      
      if (criteria.customerId && booking.customerId !== criteria.customerId) {
        matches = false;
      }
      
      if (criteria.hotelId && booking.hotelId !== criteria.hotelId) {
        matches = false;
      }
      
      if (criteria.status && booking.status !== criteria.status) {
        matches = false;
      }
      
      if (criteria.paymentStatus && booking.paymentStatus !== criteria.paymentStatus) {
        matches = false;
      }
      
      if (criteria.dateFrom && booking.checkInDate < new Date(criteria.dateFrom)) {
        matches = false;
      }
      
      if (criteria.dateTo && booking.checkOutDate > new Date(criteria.dateTo)) {
        matches = false;
      }
      
      return matches;
    });
  }

  // Method to get booking statistics
  getStats() {
    return {
      nights: this.getNights(),
      totalAmount: this.totalAmount,
      averagePricePerNight: this.getAveragePricePerNight(),
      guestCount: this.guestCount,
      status: this.status,
      paymentStatus: this.paymentStatus,
      isActive: this.isActive(),
      canBeCancelled: this.canBeCancelled()
    };
  }

  // Method to get public booking information
  getPublicInfo() {
    return {
      id: this.id,
      hotelId: this.hotelId,
      roomId: this.roomId,
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      guestCount: this.guestCount,
      totalAmount: this.totalAmount,
      currency: this.currency,
      status: this.status,
      nights: this.getNights(),
      createdAt: this.createdAt
    };
  }

  // Method to get detailed information (for customer/owner/admin)
  getDetailedInfo() {
    return {
      ...this.getPublicInfo(),
      customerId: this.customerId,
      paymentStatus: this.paymentStatus,
      paymentId: this.paymentId,
      specialRequests: this.specialRequests,
      cancellationReason: this.cancellationReason,
      refundAmount: this.refundAmount,
      confirmedAt: this.confirmedAt,
      cancelledAt: this.cancelledAt,
      completedAt: this.completedAt,
      updatedAt: this.updatedAt
    };
  }

  // Method to generate booking confirmation details
  getConfirmationDetails() {
    return {
      bookingId: this.id,
      checkIn: this.checkInDate.toDateString(),
      checkOut: this.checkOutDate.toDateString(),
      nights: this.getNights(),
      guests: this.guestCount,
      totalAmount: this.totalAmount,
      currency: this.currency,
      status: this.status,
      specialRequests: this.specialRequests
    };
  }
}

module.exports = Booking;

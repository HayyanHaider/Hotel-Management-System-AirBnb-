class Payment {
  constructor(paymentData) {
    this.id = paymentData.id;
    this.bookingId = paymentData.bookingId;
    this.customerId = paymentData.customerId;
    this.amount = paymentData.amount;
    this.method = paymentData.method || paymentData.paymentMethod;
    this.paymentMethod = paymentData.paymentMethod || paymentData.method;
    this.status = paymentData.status || 'pending';
    this.refundStatus = paymentData.refundStatus || 'not_refunded';
    this.refundedAt = paymentData.refundedAt || null;
    this.type = paymentData.type || 'booking_payment';
    this.transactionId = paymentData.transactionId || null;
    this.failureReason = paymentData.failureReason || null;
    this.refundReason = paymentData.refundReason || null;
    this.refundAmount = paymentData.refundAmount || null;
    this.processedAt = paymentData.processedAt || null;
    this.completedAt = paymentData.completedAt || null;
    this.createdAt = paymentData.createdAt || new Date();
    this.updatedAt = paymentData.updatedAt || new Date();
    this.currency = paymentData.currency || 'USD';
  }

  // Encapsulation: Private method to validate payment data
  #validatePaymentData() {
    const errors = [];
    
    if (!this.bookingId) {
      errors.push('Booking ID is required');
    }
    
    if (!this.customerId) {
      errors.push('Customer ID is required');
    }
    
    if (!this.amount || this.amount <= 0) {
      errors.push('Valid payment amount is required');
    }
    
    if (!this.paymentMethod) {
      errors.push('Payment method is required');
    }
    
    return errors;
  }

  // Method to validate payment information
  validate() {
    return this.#validatePaymentData();
  }

  // Method to calculate processing fee
  calculateProcessingFee() {
    const feePercentage = this.#getProcessingFeeRate();
    this.processingFee = this.amount * feePercentage;
    this.netAmount = this.amount - this.processingFee;
    this.updatedAt = new Date();
  }

  // Encapsulation: Private method to get processing fee rate based on payment method
  #getProcessingFeeRate() {
    const feeRates = {
      'card': 0.029, // 2.9%
      'paypal': 0.034, // 3.4%
      'bank_transfer': 0.01, // 1%
      'crypto': 0.015 // 1.5%
    };
    
    return feeRates[this.paymentMethod] || 0.03; // Default 3%
  }

  // Method to process payment
  async processPayment(cardDetails = null) {
    // Allow processing if status is pending or not set
    if (this.status && this.status !== 'pending') {
      throw new Error('Only pending payments can be processed');
    }
    
    this.status = 'processing';
    this.updatedAt = new Date();
    
    try {
      // Calculate processing fee
      this.calculateProcessingFee();
      
      // Simulate payment gateway processing
      const result = await this.#callPaymentGateway();
      
      if (result.success) {
        this.status = 'completed';
        this.transactionId = result.transactionId;
        this.completedAt = new Date();
        this.gatewayResponse = result;
      } else {
        this.status = 'failed';
        this.failureReason = result.error;
        this.gatewayResponse = result;
      }
      
      this.updatedAt = new Date();
      
      // Return result object with success, error, and transactionId
      if (result.success) {
        return {
          success: true,
          transactionId: result.transactionId,
          message: result.message || 'Payment processed successfully'
        };
      } else {
        return {
          success: false,
          error: result.error || 'Payment processing failed',
          transactionId: result.transactionId || null
        };
      }
      
    } catch (error) {
      this.status = 'failed';
      this.failureReason = error.message;
      this.updatedAt = new Date();
      return {
        success: false,
        error: error.message,
        transactionId: null
      };
    }
  }

  // Encapsulation: Private method to simulate payment gateway call
  async #callPaymentGateway() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate payment processing (90% success rate)
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Payment processed successfully'
      };
    } else {
      return {
        success: false,
        error: 'Payment declined by bank',
        code: 'CARD_DECLINED'
      };
    }
  }

  // Method to refund payment
  async refundPayment(refundAmount = null, reason = '') {
    if (this.status !== 'completed') {
      throw new Error('Only completed payments can be refunded');
    }
    
    const amountToRefund = refundAmount || this.amount;
    
    if (amountToRefund > this.amount) {
      throw new Error('Refund amount cannot exceed original payment amount');
    }
    
    try {
      // Simulate refund processing
      const result = await this.#processRefund(amountToRefund);
      
      if (result.success) {
        this.status = 'refunded';
        this.refundAmount = amountToRefund;
        this.refundReason = reason;
        this.refundedAt = new Date();
        this.updatedAt = new Date();
        return true;
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      this.failureReason = `Refund failed: ${error.message}`;
      this.updatedAt = new Date();
      return false;
    }
  }

  // Encapsulation: Private method to process refund
  async #processRefund(amount) {
    // Simulate refund API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate refund processing (95% success rate)
    const success = Math.random() > 0.05;
    
    if (success) {
      return {
        success: true,
        refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Refund processed successfully'
      };
    } else {
      return {
        success: false,
        error: 'Refund processing failed'
      };
    }
  }

  // Method to retry failed payment
  async retryPayment() {
    if (this.status !== 'failed') {
      throw new Error('Only failed payments can be retried');
    }
    
    // Reset payment status
    this.status = 'pending';
    this.failureReason = '';
    this.gatewayResponse = {};
    this.updatedAt = new Date();
    
    // Process payment again
    return await this.processPayment();
  }

  // Method to check if payment is successful
  isSuccessful() {
    return this.status === 'completed';
  }

  // Method to check if payment is pending
  isPending() {
    return this.status === 'pending' || this.status === 'processing';
  }

  // Method to check if payment failed
  isFailed() {
    return this.status === 'failed';
  }

  // Method to check if payment is refunded
  isRefunded() {
    return this.status === 'refunded';
  }

  // Method to get payment summary
  getSummary() {
    return {
      amount: this.amount,
      processingFee: this.processingFee,
      netAmount: this.netAmount,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      status: this.status,
      refundAmount: this.refundAmount
    };
  }

  // Static method to search payments by criteria
  static searchByCriteria(payments, criteria) {
    return payments.filter(payment => {
      let matches = true;
      
      if (criteria.customerId && payment.customerId !== criteria.customerId) {
        matches = false;
      }
      
      if (criteria.bookingId && payment.bookingId !== criteria.bookingId) {
        matches = false;
      }
      
      if (criteria.status && payment.status !== criteria.status) {
        matches = false;
      }
      
      if (criteria.paymentMethod && payment.paymentMethod !== criteria.paymentMethod) {
        matches = false;
      }
      
      if (criteria.minAmount && payment.amount < criteria.minAmount) {
        matches = false;
      }
      
      if (criteria.maxAmount && payment.amount > criteria.maxAmount) {
        matches = false;
      }
      
      if (criteria.dateFrom && payment.createdAt < new Date(criteria.dateFrom)) {
        matches = false;
      }
      
      if (criteria.dateTo && payment.createdAt > new Date(criteria.dateTo)) {
        matches = false;
      }
      
      return matches;
    });
  }

  // Method to get payment statistics
  getStats() {
    return {
      amount: this.amount,
      processingFee: this.processingFee,
      netAmount: this.netAmount,
      status: this.status,
      paymentMethod: this.paymentMethod,
      isSuccessful: this.isSuccessful(),
      isPending: this.isPending(),
      isFailed: this.isFailed(),
      isRefunded: this.isRefunded(),
      refundAmount: this.refundAmount
    };
  }

  // Method to get public payment information
  getPublicInfo() {
    return {
      id: this.id,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      paymentMethod: this.paymentMethod,
      createdAt: this.createdAt,
      completedAt: this.completedAt
    };
  }

  // Method to get detailed information (for customer/admin)
  getDetailedInfo() {
    return {
      ...this.getPublicInfo(),
      bookingId: this.bookingId,
      customerId: this.customerId,
      transactionId: this.transactionId,
      processingFee: this.processingFee,
      netAmount: this.netAmount,
      refundAmount: this.refundAmount,
      refundReason: this.refundReason,
      failureReason: this.failureReason,
      refundedAt: this.refundedAt,
      updatedAt: this.updatedAt
    };
  }

  // Method to generate payment receipt
  generateReceipt() {
    return {
      paymentId: this.id,
      transactionId: this.transactionId,
      amount: this.amount,
      processingFee: this.processingFee,
      netAmount: this.netAmount,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      status: this.status,
      paidAt: this.completedAt,
      bookingId: this.bookingId
    };
  }
}

module.exports = Payment;

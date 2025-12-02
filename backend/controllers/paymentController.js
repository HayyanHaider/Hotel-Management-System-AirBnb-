const BaseController = require('./BaseController');
const PaymentService = require('../services/PaymentService');

/**
 * PaymentController - Handles HTTP requests for payment operations
 * Follows Single Responsibility Principle - only handles HTTP concerns
 * Delegates business logic to PaymentService
 */
class PaymentController extends BaseController {
  constructor() {
    super();
    this.paymentService = PaymentService;
  }

  /**
   * Process Payment
   */
  processPayment = async (req, res) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return this.fail(res, 401, 'User not authenticated');
      }

      const result = await this.paymentService.processPayment(req.body, userId);
      
      return this.ok(res, {
      message: 'Payment processed successfully',
        payment: result.payment,
        booking: result.booking
      });
  } catch (error) {
    console.error('Process payment error:', error);
      const statusCode = error.message.includes('not found') ||
                        error.message.includes('already completed') ||
                        error.message.includes('required') ||
                        error.message.includes('Insufficient') ? 400 : 500;
      return this.fail(res, statusCode, error.message || 'Server error while processing payment');
    }
  };

  /**
   * Get Payment History
   */
  getPaymentHistory = async (req, res) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return this.fail(res, 401, 'User not authenticated');
      }

      const result = await this.paymentService.getUserPayments(userId, req.query);
      
      return this.ok(res, {
        count: result.count,
        payments: result.payments
      });
    } catch (error) {
      console.error('Get payment history error:', error);
      return this.fail(res, 500, error.message || 'Server error while fetching payment history');
    }
  };

  /**
   * Get Payment by ID
   */
  getPaymentById = async (req, res) => {
    try {
    const userId = req.user?.userId;
      const { paymentId } = req.params;
    
    if (!userId) {
        return this.fail(res, 401, 'User not authenticated');
      }

      const payment = await this.paymentService.getPaymentById(paymentId, userId);
      
      return this.ok(res, { payment });
    } catch (error) {
      console.error('Get payment by ID error:', error);
      const statusCode = error.message.includes('not found') || 
                        error.message.includes('Not authorized') ? 404 : 500;
      return this.fail(res, statusCode, error.message || 'Server error while fetching payment');
    }
  };
}

module.exports = new PaymentController();

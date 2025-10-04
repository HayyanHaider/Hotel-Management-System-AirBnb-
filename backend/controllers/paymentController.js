const PaymentModel = require('../models/paymentModel');
const BookingModel = require('../models/bookingModel');
const CustomerModel = require('../models/customerModel');
const Payment = require('../classes/Payment');
const Booking = require('../classes/Booking');

// Process Payment Controller
const processPayment = async (req, res) => {
  try {
    const { bookingId, paymentMethod, cardDetails } = req.body;
    const userId = req.user.userId;
    const customerDoc = await CustomerModel.findOne({ user: userId });
    const customerId = customerDoc ? customerDoc._id : null;

    // Validate required fields
    if (!bookingId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and payment method are required'
      });
    }

    // Find booking
    const dbBooking = await BookingModel.findOne({ _id: bookingId, customer: customerId });
    if (!dbBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (dbBooking.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this booking'
      });
    }

    // Create payment instance using OOP
    const paymentData = {
      bookingId: dbBooking._id,
      customerId,
      amount: dbBooking.priceSnapshot.totalPrice,
      paymentMethod,
      type: 'booking_payment'
    };

    const paymentInstance = new Payment(paymentData);

    // Validate payment using OOP method
    const validationErrors = paymentInstance.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Process payment using OOP method
    const paymentResult = await paymentInstance.processPayment(cardDetails);

    if (!paymentResult.success) {
      // Save failed payment attempt
      const failedPayment = new PaymentModel({
        bookingId: paymentInstance.bookingId,
        customerId: paymentInstance.customerId,
        amount: paymentInstance.amount,
        method: paymentMethod,
        type: paymentInstance.type,
        status: 'failed',
        failureReason: paymentResult.error,
        transactionId: paymentResult.transactionId
      });
      await failedPayment.save();

      return res.status(400).json({
        success: false,
        message: paymentResult.error
      });
    }

    // Save successful payment
    const successfulPayment = new PaymentModel({
      bookingId: paymentInstance.bookingId,
      customerId: paymentInstance.customerId,
      amount: paymentInstance.amount,
      method: paymentMethod,
      type: paymentInstance.type,
      status: 'completed',
      transactionId: paymentResult.transactionId,
      processedAt: new Date()
    });

    await successfulPayment.save();
    paymentInstance.id = successfulPayment._id;

    // Update booking status
    await BookingModel.findByIdAndUpdate(bookingId, {
      'payment.status': 'success',
      status: 'confirmed',
      confirmedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      payment: {
        id: paymentInstance.id,
        transactionId: paymentResult.transactionId,
        amount: paymentInstance.amount,
        method: paymentMethod,
        status: 'completed'
      },
      booking: {
        id: bookingId,
        status: 'confirmed'
      }
    });

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing payment'
    });
  }
};

// Get Payment History Controller
const getPaymentHistory = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { page = 1, limit = 10, type } = req.query;

    // Build query
    const query = { customerId };
    if (type) {
      query.type = type;
    }

    const dbPayments = await PaymentModel.find(query)
      .populate('bookingId', 'hotelDetails roomDetails checkInDate checkOutDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Convert to OOP instances
    const paymentInstances = dbPayments.map(dbPayment => {
      const paymentData = {
        id: dbPayment._id,
        bookingId: dbPayment.bookingId,
        customerId: dbPayment.customerId,
        amount: dbPayment.amount,
        method: dbPayment.method,
        type: dbPayment.type,
        status: dbPayment.status,
        transactionId: dbPayment.transactionId,
        failureReason: dbPayment.failureReason,
        processedAt: dbPayment.processedAt,
        createdAt: dbPayment.createdAt
      };
      return new Payment(paymentData);
    });

    const paymentsData = paymentInstances.map(payment => payment.getPaymentDetails());

    res.json({
      success: true,
      count: paymentsData.length,
      payments: paymentsData
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment history'
    });
  }
};

// Process Refund Controller
const processRefund = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;
    const customerId = req.user.userId;

    // Find original payment
    const dbPayment = await PaymentModel.findOne({ _id: paymentId, customerId });
    if (!dbPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (dbPayment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    // Create payment instance for refund
    const refundData = {
      bookingId: dbPayment.bookingId,
      customerId: dbPayment.customerId,
      amount: dbPayment.amount,
      method: dbPayment.method,
      type: 'refund',
      originalPaymentId: dbPayment._id
    };

    const refundInstance = new Payment(refundData);

    // Process refund using OOP method
    const refundResult = await refundInstance.processRefund(reason);

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: refundResult.error
      });
    }

    // Save refund record
    const refundPayment = new PaymentModel({
      bookingId: refundInstance.bookingId,
      customerId: refundInstance.customerId,
      amount: refundInstance.amount,
      method: refundInstance.method,
      type: 'refund',
      status: 'completed',
      transactionId: refundResult.refundId,
      refundReason: reason,
      originalPaymentId: dbPayment._id,
      processedAt: new Date()
    });

    await refundPayment.save();
    refundInstance.id = refundPayment._id;

    // Update original payment status
    await PaymentModel.findByIdAndUpdate(paymentId, {
      refundStatus: 'refunded',
      refundedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        id: refundInstance.id,
        refundId: refundResult.refundId,
        amount: refundInstance.amount,
        method: refundInstance.method,
        status: 'completed',
        processingTime: '3-5 business days'
      }
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing refund'
    });
  }
};

// Get Payment Details Controller
const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const customerId = req.user.userId;

    const dbPayment = await PaymentModel.findOne({ _id: paymentId, customerId })
      .populate('bookingId', 'hotelDetails roomDetails checkInDate checkOutDate totalAmount');

    if (!dbPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Create payment instance using OOP
    const paymentData = {
      id: dbPayment._id,
      bookingId: dbPayment.bookingId,
      customerId: dbPayment.customerId,
      amount: dbPayment.amount,
      method: dbPayment.method,
      type: dbPayment.type,
      status: dbPayment.status,
      transactionId: dbPayment.transactionId,
      failureReason: dbPayment.failureReason,
      refundReason: dbPayment.refundReason,
      processedAt: dbPayment.processedAt,
      createdAt: dbPayment.createdAt
    };

    const paymentInstance = new Payment(paymentData);

    res.json({
      success: true,
      payment: paymentInstance.getDetailedInfo()
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment details'
    });
  }
};

module.exports = {
  processPayment,
  getPaymentHistory,
  processRefund,
  getPaymentDetails
};

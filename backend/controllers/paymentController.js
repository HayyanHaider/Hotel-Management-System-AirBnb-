const PaymentModel = require('../models/paymentModel');
const BookingModel = require('../models/bookingModel');
const CustomerModel = require('../models/customerModel');
const CouponModel = require('../models/couponModel');
const HotelModel = require('../models/hotelModel');
const UserModel = require('../models/userModel');
const Payment = require('../classes/Payment');
const Booking = require('../classes/Booking');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const { generateInvoicePDF } = require('../utils/pdfService');
const path = require('path');
const fs = require('fs');

// Process Payment Controller
const processPayment = async (req, res) => {
  try {
    const { bookingId, paymentMethod, cardDetails, walletBalance } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find customer document
    let customerDoc = await CustomerModel.findOne({ user: userId });
    if (!customerDoc) {
      // Create customer document if it doesn't exist
      customerDoc = await CustomerModel.create({
        user: userId,
        loyaltyPoints: 0,
        bookingHistory: [],
        reviewsGiven: [],
      });
    }
    const customerId = customerDoc._id;

    // Validate required fields
    if (!bookingId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and payment method are required'
      });
    }

    // Find booking - use userId field which stores the Customer document ID
    const dbBooking = await BookingModel.findOne({ _id: bookingId, userId: customerId });
    if (!dbBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if payment already exists for this booking
    const existingPayment = await PaymentModel.findOne({ 
      bookingId: dbBooking._id, 
      status: 'completed' 
    });
    
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this booking'
      });
    }

    // Create payment instance using OOP
    const paymentData = {
      bookingId: dbBooking._id,
      customerId,
      amount: dbBooking.totalPrice || dbBooking.priceSnapshot?.totalPrice || 0,
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
    const paymentResult = await paymentInstance.processPayment(
      cardDetails, 
      walletBalance, 
      userId
    );

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

    // Handle wallet payment deduction
    if (paymentMethod === 'wallet' && paymentResult.requiresWalletDeduction) {
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.walletBalance < paymentInstance.amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance'
        });
      }

      // Deduct from wallet
      user.walletBalance -= paymentInstance.amount;
      await user.save();
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

    // Update booking with payment information
    await BookingModel.findByIdAndUpdate(bookingId, {
      paymentId: successfulPayment._id,
      status: 'confirmed',
      confirmedAt: new Date()
    });

    // Increment coupon usage count only after payment is confirmed
    if (dbBooking.couponId) {
      await CouponModel.findByIdAndUpdate(dbBooking.couponId, {
        $inc: { currentUses: 1 }
      });
      console.log(`Coupon usage incremented for coupon ${dbBooking.couponId} after payment confirmation`);
    }

    // Generate PDF invoice and send invoice email to customer (async)
    try {
      console.log('📧 Starting email sending process for booking:', bookingId);
      const updatedBooking = await BookingModel.findById(bookingId)
        .populate('hotelId', 'name location address')
        .populate('couponId', 'code discountPercentage');
      const user = await UserModel.findById(userId);
      
      if (!user) {
        console.error('❌ User not found for email sending:', userId);
      }
      if (!updatedBooking) {
        console.error('❌ Booking not found for email sending:', bookingId);
      }
      
      if (user && updatedBooking) {
        console.log('📧 User and booking found, proceeding with email:', { userEmail: user.email, bookingId: bookingId });
        // Generate PDF invoice
        const invoiceDir = path.join(__dirname, '../invoices');
        if (!fs.existsSync(invoiceDir)) {
          fs.mkdirSync(invoiceDir, { recursive: true });
        }
        
        const invoiceFileName = `invoice-${bookingId}-${Date.now()}.pdf`;
        const invoicePath = path.join(invoiceDir, invoiceFileName);
        const invoiceData = {
          invoiceNumber: `INV-${bookingId}-${Date.now()}`,
          date: new Date(),
          bookingId: bookingId,
          customer: {
            name: user.name,
            email: user.email,
            phone: user.phone
          },
          hotel: {
            name: updatedBooking.hotelId?.name || 'Hotel',
            address: updatedBooking.hotelId?.location?.address || ''
          },
          checkIn: updatedBooking.checkIn,
          checkOut: updatedBooking.checkOut,
          nights: updatedBooking.nights || 1,
          guests: updatedBooking.guests || 1,
          basePrice: updatedBooking.priceSnapshot?.basePriceTotal || 0,
          cleaningFee: updatedBooking.priceSnapshot?.cleaningFee || 0,
          serviceFee: updatedBooking.priceSnapshot?.serviceFee || 0,
          discount: updatedBooking.priceSnapshot?.discounts || 0,
          couponCode: updatedBooking.priceSnapshot?.couponCode,
          total: paymentInstance.amount,
          payment: {
            method: paymentMethod,
            transactionId: paymentResult.transactionId,
            date: new Date()
          }
        };
        
        // Generate PDF invoice and send invoice email to customer
        generateInvoicePDF(invoiceData, invoicePath)
          .then(async () => {
            console.log('PDF invoice generated:', invoicePath);
            // Store invoice filename (relative path) in booking record
            await BookingModel.findByIdAndUpdate(bookingId, {
              invoicePath: invoiceFileName
            });
            
            // Send invoice email to customer
            // Try to send from user's Gmail account if authorized, otherwise use system email
            const emailTemplate = emailTemplates.invoiceEmail(
              successfulPayment,
              updatedBooking,
              updatedBooking.hotelId || {},
              { name: user.name, email: user.email },
              invoiceFileName
            );
            
            // Attach PDF invoice if available
            const attachments = [];
            if (invoicePath && fs.existsSync(invoicePath)) {
              attachments.push({
                filename: `invoice-${bookingId}.pdf`,
                path: invoicePath
              });
            }
            
            sendEmail(
              user.email, 
              emailTemplate.subject, 
              emailTemplate.html, 
              emailTemplate.text,
              {
                userId: userId,
                useUserGmail: true, // Try to use user's Gmail account
                attachments: attachments
              }
            )
              .then(result => {
                if (result.success) {
                  console.log(`✅ Booking confirmation email sent ${result.sentFrom === 'user_gmail' ? 'from user Gmail account' : 'from system account'}`);
                } else {
                  console.error('❌ Failed to send booking confirmation email:', result.error || result.message);
                }
              })
              .catch(err => {
                console.error('❌ Error sending invoice email:', err);
                console.error('❌ Error stack:', err.stack);
              });
          })
          .catch(err => {
            console.error('Error generating PDF invoice:', err);
            // Still send email even if PDF generation fails
            const emailTemplate = emailTemplates.invoiceEmail(
              successfulPayment,
              updatedBooking,
              updatedBooking.hotelId || {},
              { name: user.name, email: user.email },
              null
            );
            sendEmail(
              user.email, 
              emailTemplate.subject, 
              emailTemplate.html, 
              emailTemplate.text,
              {
                userId: userId,
                useUserGmail: true // Try to use user's Gmail account
              }
            )
              .then(result => {
                if (result.success) {
                  console.log(`✅ Booking confirmation email sent ${result.sentFrom === 'user_gmail' ? 'from user Gmail account' : 'from system account'}`);
                } else {
                  console.error('❌ Failed to send booking confirmation email:', result.error || result.message);
                }
              })
              .catch(emailErr => {
                console.error('❌ Error sending invoice email:', emailErr);
                console.error('❌ Error stack:', emailErr.stack);
              });
          });
      }
    } catch (emailError) {
      console.error('Error sending invoice email:', emailError);
      // Don't fail the request if email fails
    }

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

// Download Invoice Controller
const downloadInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find customer document
    let customerDoc = await CustomerModel.findOne({ user: userId });
    if (!customerDoc) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    const customerId = customerDoc._id;

    // Find booking
    const booking = await BookingModel.findOne({ 
      _id: bookingId, 
      userId: customerId 
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!booking.invoicePath) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found for this booking'
      });
    }

    // Construct full path to invoice file
    const invoiceDir = path.join(__dirname, '../invoices');
    const invoicePath = path.join(invoiceDir, booking.invoicePath);

    // Check if file exists
    if (!fs.existsSync(invoicePath)) {
      return res.status(404).json({
        success: false,
        message: 'Invoice file not found'
      });
    }

    // Send file
    res.download(invoicePath, `invoice-${bookingId}.pdf`, (err) => {
      if (err) {
        console.error('Error downloading invoice:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error downloading invoice'
          });
        }
      }
    });
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while downloading invoice'
    });
  }
};

module.exports = {
  processPayment,
  getPaymentHistory,
  processRefund,
  getPaymentDetails,
  downloadInvoice
};

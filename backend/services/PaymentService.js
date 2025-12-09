const BaseService = require('./BaseService');
const IPaymentService = require('./interfaces/IPaymentService');
const PaymentRepository = require('../repositories/PaymentRepository');
const BookingRepository = require('../repositories/BookingRepository');
const CustomerRepository = require('../repositories/CustomerRepository');
const UserRepository = require('../repositories/UserRepository');
const Payment = require('../classes/Payment');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const { generateInvoicePDF } = require('../utils/pdfService');
const { uploadInvoiceToCloudinary, downloadInvoiceFromCloudinary, hasCloudinaryConfig } = require('../utils/cloudinaryInvoiceService');
const path = require('path');
const fs = require('fs');

class PaymentService extends BaseService {
  constructor(dependencies = {}) {
    super(dependencies);
    this.paymentRepository = dependencies.paymentRepository || PaymentRepository;
    this.bookingRepository = dependencies.bookingRepository || BookingRepository;
    this.customerRepository = dependencies.customerRepository || CustomerRepository;
    this.userRepository = dependencies.userRepository || UserRepository;
  }

  async processPayment(paymentData, userId) {
    try {
      this.validateRequired(paymentData, ['bookingId', 'paymentMethod']);

      const customerDoc = await this.customerRepository.findOrCreateByUser(userId);
      const customerId = customerDoc._id;

      const booking = await this.bookingRepository.findOne({ 
        _id: paymentData.bookingId, 
        userId: customerId 
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      const existingPayment = await this.paymentRepository.findCompleted(
        { bookingId: booking._id }
      );

      if (existingPayment.length > 0) {
        throw new Error('Payment already completed for this booking');
      }

      if (paymentData.paymentMethod === 'paypal') {
        if (!paymentData.paypalDetails?.email || !paymentData.paypalDetails?.password) {
          throw new Error('PayPal email and password are required');
        }
      }

      const paymentInstanceData = {
        bookingId: booking._id,
        customerId,
        amount: booking.totalPrice || booking.priceSnapshot?.totalPrice || 0,
        paymentMethod: paymentData.paymentMethod,
        type: 'booking_payment'
      };

      const paymentInstance = new Payment(paymentInstanceData);

      const validationErrors = paymentInstance.validate();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const paymentResult = await paymentInstance.processPayment({
        cardDetails: paymentData.cardDetails,
        walletBalance: paymentData.walletBalance,
        userId,
        paypalDetails: paymentData.paypalDetails
      });

      if (!paymentResult.success) {
        const failedPaymentData = {
          bookingId: paymentInstance.bookingId,
          customerId: paymentInstance.customerId,
          amount: paymentInstance.amount,
          method: paymentData.paymentMethod,
          type: paymentInstance.type,
          status: 'failed',
          failureReason: paymentResult.error
        };
        
        if (paymentResult.transactionId) {
          failedPaymentData.transactionId = paymentResult.transactionId;
        }
        
        await this.paymentRepository.create(failedPaymentData);

        throw new Error(paymentResult.error);
      }

      if (paymentData.paymentMethod === 'wallet' && paymentResult.requiresWalletDeduction) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
          throw new Error('User not found');
        }

        if (user.walletBalance < paymentInstance.amount) {
          throw new Error('Insufficient wallet balance');
        }

        await this.userRepository.updateById(userId, {
          walletBalance: user.walletBalance - paymentInstance.amount
        });
      }

      const successfulPaymentData = {
        bookingId: paymentInstance.bookingId,
        customerId: paymentInstance.customerId,
        amount: paymentInstance.amount,
        method: paymentData.paymentMethod,
        type: paymentInstance.type,
        status: 'completed',
        processedAt: new Date()
      };
      
      if (paymentResult.transactionId) {
        successfulPaymentData.transactionId = paymentResult.transactionId;
      }
      
      const successfulPayment = await this.paymentRepository.create(successfulPaymentData);

      paymentInstance.id = successfulPayment._id;

      await this.bookingRepository.updateById(paymentData.bookingId, {
        paymentId: successfulPayment._id,
        status: 'confirmed',
        confirmedAt: new Date()
      });

      this.#generateAndSendInvoice(
        paymentData.bookingId,
        userId,
        successfulPayment,
        paymentData.paymentMethod,
        paymentData.paypalDetails?.email
      ).catch(err => console.error('Error generating invoice:', err));

      return {
        payment: {
          id: successfulPayment._id,
          transactionId: paymentResult.transactionId,
          amount: paymentInstance.amount,
          method: paymentData.paymentMethod,
          status: 'completed'
        },
        booking: {
          id: paymentData.bookingId,
          status: 'confirmed'
        }
      };
    } catch (error) {
      this.handleError(error, 'Process payment');
    }
  }

  async getPaymentById(paymentId, userId) {
    try {
      const customerDoc = await this.customerRepository.findByUser(userId);
      if (!customerDoc) {
        throw new Error('Customer profile not found');
      }

      const payment = await this.paymentRepository.findById(paymentId, {
        populate: [{ path: 'bookingId' }]
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (String(payment.customerId) !== String(customerDoc._id)) {
        throw new Error('Not authorized to view this payment');
      }

      return payment;
    } catch (error) {
      this.handleError(error, 'Get payment by ID');
    }
  }

  async getUserPayments(userId, filters = {}) {
    try {
      const customerDoc = await this.customerRepository.findByUser(userId);
      if (!customerDoc) {
        throw new Error('Customer profile not found');
      }

      const query = { customerId: customerDoc._id };
      if (filters.type) {
        query.type = filters.type;
      }

      const options = {
        populate: [{ path: 'bookingId', select: 'hotelDetails roomDetails checkInDate checkOutDate' }],
        sort: { createdAt: -1 },
        limit: parseInt(filters.limit) || 10,
        skip: ((parseInt(filters.page) || 1) - 1) * (parseInt(filters.limit) || 10)
      };

      const payments = await this.paymentRepository.find(query, options);

      const paymentInstances = payments.map(payment => {
        const paymentData = {
          id: payment._id,
          bookingId: payment.bookingId,
          customerId: payment.customerId,
          amount: payment.amount,
          method: payment.method,
          type: payment.type,
          status: payment.status,
          transactionId: payment.transactionId,
          failureReason: payment.failureReason,
          processedAt: payment.processedAt,
          createdAt: payment.createdAt
        };
        return new Payment(paymentData);
      });

      const paymentsData = paymentInstances.map(payment => payment.getPaymentDetails());

      return {
        count: paymentsData.length,
        payments: paymentsData
      };
    } catch (error) {
      this.handleError(error, 'Get user payments');
    }
  }

  async getInvoicePath(bookingId, userId) {
    try {
      this.validateRequired({ bookingId, userId }, ['bookingId', 'userId']);

      const customerDoc = await this.customerRepository.findOrCreateByUser(userId);
      const customerId = customerDoc._id;

      const booking = await this.bookingRepository.findById(bookingId, {
        populate: [{ path: 'hotelId', select: 'name' }]
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (String(booking.userId) !== String(customerId)) {
        throw new Error('Not authorized to access this invoice');
      }

      if (!booking.invoiceUrl) {
        throw new Error('Invoice not found for this booking');
      }

      // If using Cloudinary, download the invoice to a temp location
      if (booking.invoiceUrl.includes('cloudinary.com')) {
        const tempDir = path.join(__dirname, '../temp_invoices');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempFilePath = path.join(tempDir, `temp-invoice-${bookingId}.pdf`);
        const buffer = await downloadInvoiceFromCloudinary(booking.invoiceUrl);
        fs.writeFileSync(tempFilePath, buffer);
        
        return tempFilePath;
      }

      // Legacy: Local file system path
      const invoicePath = path.join(__dirname, '../invoices', booking.invoicePath || booking.invoiceUrl);

      if (!fs.existsSync(invoicePath)) {
        throw new Error('Invoice file not found');
      }

      return invoicePath;
    } catch (error) {
      this.handleError(error, 'Failed to get invoice path');
    }
  }

  async #generateAndSendInvoice(bookingId, userId, payment, paymentMethod, paypalEmail) {
    try {
      const booking = await this.bookingRepository.findById(bookingId, {
        populate: [
          { path: 'hotelId', select: 'name location address' },
          { path: 'couponId', select: 'code discountPercentage' }
        ]
      });

      const user = await this.userRepository.findById(userId);
      if (!user || !booking) {
        return;
      }

      const paymentMethodLabelMap = {
        card: 'Credit/Debit Card',
        paypal: 'PayPal',
        wallet: 'Wallet',
        bank_transfer: 'Bank Transfer',
      };
      const paymentMethodLabel = paymentMethodLabelMap[paymentMethod] || paymentMethod;
      const sanitizedPaypalEmail = paymentMethod === 'paypal' ? (paypalEmail || '').trim() : '';

      const invoiceDir = path.join(__dirname, '../invoices');
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
      }

      const invoiceFileName = `invoice-${bookingId}-${Date.now()}.pdf`;
      const invoicePath = path.join(invoiceDir, invoiceFileName);

      const fallbackBaseUrl = process.env.BACKEND_BASE_URL || 
        process.env.API_BASE_URL || 
        process.env.SERVER_URL || 
        process.env.APP_URL || 
        process.env.BASE_URL || 
        'http://localhost:5000';
      const normalizedInvoiceBaseUrl = fallbackBaseUrl.replace(/\/$/, '');

      const buildInvoiceDataUri = (filePath) => {
        try {
          const fileBuffer = fs.readFileSync(filePath);
          if (!fileBuffer || !fileBuffer.length) {
            return null;
          }
          return `data:application/pdf;base64,${fileBuffer.toString('base64')}`;
        } catch (err) {
          console.error('Error generating invoice data URI:', err);
          return null;
        }
      };

      const paymentDetailsForInvoice = {
        id: payment._id,
        amount: payment.amount,
        method: paymentMethodLabel,
        transactionId: payment.transactionId,
        processedAt: payment.processedAt || new Date(),
        paypalEmail: sanitizedPaypalEmail || null,
        currency: 'PKR'
      };

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
          name: booking.hotelId?.name || 'Hotel',
          address: booking.hotelId?.location?.address || ''
        },
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights || 1,
        guests: booking.guests || 1,
        basePrice: booking.priceSnapshot?.basePriceTotal || 0,
        cleaningFee: booking.priceSnapshot?.cleaningFee || 0,
        serviceFee: booking.priceSnapshot?.serviceFee || 0,
        discount: booking.priceSnapshot?.discounts || 0,
        couponCode: booking.priceSnapshot?.couponCode,
        total: payment.amount,
        currency: 'PKR',
        payment: paymentDetailsForInvoice
      };

      try {
        await generateInvoicePDF(invoiceData, invoicePath);
        console.log('PDF invoice generated locally:', invoicePath);

        let invoiceUrl = '';
        let cloudinaryPublicId = '';

        // Upload to Cloudinary if configured
        if (hasCloudinaryConfig) {
          try {
            const cloudinaryResult = await uploadInvoiceToCloudinary(invoicePath, bookingId);
            invoiceUrl = cloudinaryResult.url;
            cloudinaryPublicId = cloudinaryResult.publicId;
            console.log('✅ Invoice uploaded to Cloudinary:', invoiceUrl);
          } catch (cloudinaryError) {
            console.error('❌ Failed to upload to Cloudinary, using local storage:', cloudinaryError);
            invoiceUrl = `${normalizedInvoiceBaseUrl}/invoices/${invoiceFileName}`;
          }
        } else {
          // Fallback to local storage
          invoiceUrl = `${normalizedInvoiceBaseUrl}/invoices/${invoiceFileName}`;
        }

        // Update booking with invoice URL
        await this.bookingRepository.updateById(bookingId, {
          invoiceUrl: invoiceUrl,
          invoicePath: invoiceFileName, // Keep for backwards compatibility
          cloudinaryPublicId: cloudinaryPublicId || undefined
        });

        const invoiceDataUri = buildInvoiceDataUri(invoicePath);
        const emailTemplate = emailTemplates.invoiceEmail(
          paymentDetailsForInvoice,
          booking,
          booking.hotelId || {},
          { name: user.name, email: user.email },
          invoiceFileName,
          invoiceUrl,
          invoiceDataUri
        );

        const attachments = [];
        if (fs.existsSync(invoicePath)) {
          attachments.push({
            filename: `invoice-${bookingId}.pdf`,
            path: invoicePath
          });
        }

        await sendEmail(
          user.email,
          emailTemplate.subject,
          emailTemplate.html,
          emailTemplate.text,
          {
            userId: userId,
            useUserGmail: true,
            attachments
          }
        );

        console.log(`✅ Booking confirmation email sent to customer: ${user.email}`);
      } catch (pdfError) {
        console.error('Error generating PDF invoice:', pdfError);
        
        const emailTemplate = emailTemplates.invoiceEmail(
          paymentDetailsForInvoice,
          booking,
          booking.hotelId || {},
          { name: user.name, email: user.email },
          null,
          null,
          null
        );

        await sendEmail(
          user.email,
          emailTemplate.subject,
          emailTemplate.html,
          emailTemplate.text,
          {
            userId: userId,
            useUserGmail: true
          }
        );

        console.log(`✅ Booking confirmation email sent to customer: ${user.email}`);
      }
    } catch (error) {
      console.error('Error generating and sending invoice:', error);
    }
  }
}

module.exports = new PaymentService();

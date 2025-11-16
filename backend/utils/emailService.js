const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { getAuthenticatedClient } = require('./gmailOAuthService');
const UserModel = require('../models/userModel');

// Create reusable transporter (configure with your email service)
const createTransporter = () => {
  // For development, you can use Gmail or a service like Mailtrap
  // For production, use a service like SendGrid, AWS SES, or Mailgun
  
  // Gmail example (requires app password)
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Alternative: SMTP configuration
  // return nodemailer.createTransporter({
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT || 587,
  //   secure: false,
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASSWORD
  //   }
  // });
};

// Create Gmail OAuth2 transporter for user's account
const createGmailOAuth2Transporter = async (userId) => {
  try {
    const oauth2Client = await getAuthenticatedClient(userId);
    const user = await UserModel.findById(userId);
    
    if (!user || !user.email) {
      throw new Error('User email not found');
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: user.email,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: user.gmailTokens.refresh_token,
        accessToken: user.gmailTokens.access_token
      }
    });
  } catch (error) {
    console.error('Error creating Gmail OAuth2 transporter:', error);
    throw error;
  }
};

// Send email function (fallback to system email if user Gmail not authorized)
const sendEmail = async (to, subject, html, text = '', options = {}) => {
  try {
    console.log('📧 Attempting to send email:', { to, subject, hasAttachments: options.attachments?.length > 0 });
    const { userId, useUserGmail = false, attachments = [] } = options;
    
    // Try to use user's Gmail account if requested and authorized
    if (useUserGmail && userId) {
      try {
        const user = await UserModel.findById(userId);
        if (user && user.gmailAuthorized && user.gmailTokens) {
          console.log('📧 User has Gmail authorized, attempting to send from user account');
          const transporter = await createGmailOAuth2Transporter(userId);
          
          const mailOptions = {
            from: `"${user.name}" <${user.email}>`,
            to,
            subject,
            text,
            html,
            attachments
          };

          const info = await transporter.sendMail(mailOptions);
          console.log('✅ Email sent from user Gmail account:', info.messageId);
          return { success: true, messageId: info.messageId, sentFrom: 'user_gmail' };
        } else {
          console.log('⚠️  User Gmail not authorized, falling back to system email');
        }
      } catch (gmailError) {
        console.error('❌ Failed to send from user Gmail:', gmailError);
        console.warn('⚠️  Falling back to system email:', gmailError.message);
      }
    }

    // Fallback to system email service
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('❌ Email not sent - EMAIL_USER or EMAIL_PASSWORD not configured in environment variables');
      console.log('📧 Email details that would have been sent:', { to, subject });
      return { success: false, error: 'Email service not configured', message: 'EMAIL_USER and EMAIL_PASSWORD must be set in .env file' };
    }

    console.log('📧 Using system email account to send email');
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Airbnb Booking" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent from system account:', info.messageId);
    return { success: true, messageId: info.messageId, sentFrom: 'system' };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  // Invoice email sent to customer after booking payment is processed
  invoiceEmail: (payment, booking, hotel, customer, invoiceFileName = null) => {
    const checkIn = new Date(booking.checkIn).toLocaleDateString();
    const checkOut = new Date(booking.checkOut).toLocaleDateString();
    const nights = booking.nights || 1;
    const invoiceUrl = invoiceFileName 
      ? `http://localhost:5000/api/payments/invoice/${booking.id || booking._id}`
      : null;
    
    return {
      subject: `Booking Confirmation & Invoice - ${hotel.name || 'Hotel'} (${booking.id || booking._id})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF385C; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .invoice-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #FF385C; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .price-breakdown { margin: 15px 0; }
            .price-item { display: flex; justify-content: space-between; padding: 5px 0; }
            .total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Booking Confirmed!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your reservation is confirmed</p>
            </div>
            <div class="content">
              <p>Dear ${customer.name},</p>
              <p style="font-size: 16px; color: #28a745; font-weight: bold;">✅ Your booking has been confirmed and payment has been processed successfully!</p>
              <p>We're excited to host you! Please find your booking confirmation and invoice details below:</p>
              
              <div class="invoice-details">
                <h2>Booking Information</h2>
                <div class="detail-row">
                  <strong>Booking ID:</strong>
                  <span>${booking.id || booking._id}</span>
                </div>
                <div class="detail-row">
                  <strong>Hotel:</strong>
                  <span>${hotel.name || 'Hotel'}</span>
                </div>
                <div class="detail-row">
                  <strong>Check-in:</strong>
                  <span>${checkIn}</span>
                </div>
                <div class="detail-row">
                  <strong>Check-out:</strong>
                  <span>${checkOut}</span>
                </div>
                <div class="detail-row">
                  <strong>Nights:</strong>
                  <span>${nights}</span>
                </div>
                <div class="detail-row">
                  <strong>Guests:</strong>
                  <span>${booking.guests || 1}</span>
                </div>
                
                <h3 style="margin-top: 20px;">Price Breakdown</h3>
                <div class="price-breakdown">
                  <div class="price-item">
                    <span>Base Price (${nights} nights):</span>
                    <span>$${(booking.priceSnapshot?.basePriceTotal || 0).toFixed(2)}</span>
                  </div>
                  ${booking.priceSnapshot?.cleaningFee ? `
                  <div class="price-item">
                    <span>Cleaning Fee:</span>
                    <span>$${(booking.priceSnapshot.cleaningFee || 0).toFixed(2)}</span>
                  </div>
                  ` : ''}
                  ${booking.priceSnapshot?.serviceFee ? `
                  <div class="price-item">
                    <span>Service Fee:</span>
                    <span>$${(booking.priceSnapshot.serviceFee || 0).toFixed(2)}</span>
                  </div>
                  ` : ''}
                  ${booking.priceSnapshot?.discounts > 0 ? `
                  <div class="price-item" style="color: #28a745;">
                    <span>Discount (${booking.priceSnapshot.couponCode || 'Coupon'}):</span>
                    <span>-$${(booking.priceSnapshot.discounts || 0).toFixed(2)}</span>
                  </div>
                  ` : ''}
                  <div class="price-item total">
                    <span>Total:</span>
                    <span>$${payment.amount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
                
                <div class="detail-row" style="margin-top: 15px;">
                  <strong>Payment Method:</strong>
                  <span>${payment.method || payment.paymentMethod}</span>
                </div>
                <div class="detail-row">
                  <strong>Transaction ID:</strong>
                  <span>${payment.transactionId || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <strong>Payment Date:</strong>
                  <span>${new Date(payment.processedAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
              
              <p><strong>Hotel Address:</strong><br>${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}</p>
              
              ${invoiceUrl ? `
              <p style="text-align: center; margin: 20px 0;">
                <a href="${invoiceUrl}" class="button">Download PDF Invoice</a>
              </p>
              ` : ''}
              
              <p>We look forward to hosting you!</p>
              
              <p>Best regards,<br>The Airbnb Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Invoice

Dear ${customer.name},

Thank you for your booking! Your payment has been processed successfully.

Booking Information:
- Booking ID: ${booking.id || booking._id}
- Hotel: ${hotel.name || 'Hotel'}
- Check-in: ${checkIn}
- Check-out: ${checkOut}
- Nights: ${nights}
- Guests: ${booking.guests || 1}

Price Breakdown:
- Base Price: $${(booking.priceSnapshot?.basePriceTotal || 0).toFixed(2)}
${booking.priceSnapshot?.cleaningFee ? `- Cleaning Fee: $${(booking.priceSnapshot.cleaningFee || 0).toFixed(2)}\n` : ''}
${booking.priceSnapshot?.serviceFee ? `- Service Fee: $${(booking.priceSnapshot.serviceFee || 0).toFixed(2)}\n` : ''}
${booking.priceSnapshot?.discounts > 0 ? `- Discount: -$${(booking.priceSnapshot.discounts || 0).toFixed(2)}\n` : ''}
- Total: $${payment.amount?.toFixed(2) || '0.00'}

Payment Method: ${payment.method || payment.paymentMethod}
Transaction ID: ${payment.transactionId || 'N/A'}
Payment Date: ${new Date(payment.processedAt || Date.now()).toLocaleDateString()}

Hotel Address: ${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}

${invoiceUrl ? `Download PDF Invoice: ${invoiceUrl}` : ''}

We look forward to hosting you!

Best regards,
The Airbnb Team`
    };
  },

  // Cancellation email sent to customer when booking is cancelled
  cancellationEmail: (booking, hotel, customer, refundAmount = null) => {
    const checkIn = new Date(booking.checkIn).toLocaleDateString();
    const checkOut = new Date(booking.checkOut).toLocaleDateString();
    const nights = booking.nights || 1;
    const cancelledAt = booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleDateString() : new Date().toLocaleDateString();
    
    return {
      subject: `Booking Cancelled - ${hotel.name || 'Hotel'} (${booking.id || booking._id})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .cancellation-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc3545; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .refund-box { background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 15px 0; }
            .refund-amount { font-size: 24px; font-weight: bold; color: #155724; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Cancelled</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your reservation has been cancelled</p>
            </div>
            <div class="content">
              <p>Dear ${customer.name},</p>
              <p>We're sorry to inform you that your booking has been cancelled. Please find the cancellation details below:</p>
              
              <div class="cancellation-details">
                <h2>Booking Information</h2>
                <div class="detail-row">
                  <strong>Booking ID:</strong>
                  <span>${booking.id || booking._id}</span>
                </div>
                <div class="detail-row">
                  <strong>Hotel:</strong>
                  <span>${hotel.name || 'Hotel'}</span>
                </div>
                <div class="detail-row">
                  <strong>Check-in:</strong>
                  <span>${checkIn}</span>
                </div>
                <div class="detail-row">
                  <strong>Check-out:</strong>
                  <span>${checkOut}</span>
                </div>
                <div class="detail-row">
                  <strong>Nights:</strong>
                  <span>${nights}</span>
                </div>
                <div class="detail-row">
                  <strong>Guests:</strong>
                  <span>${booking.guests || 1}</span>
                </div>
                <div class="detail-row">
                  <strong>Cancelled On:</strong>
                  <span>${cancelledAt}</span>
                </div>
                ${booking.cancellationPolicyApplied ? `
                <div class="detail-row">
                  <strong>Cancellation Policy:</strong>
                  <span>${booking.cancellationPolicyApplied}</span>
                </div>
                ` : ''}
              </div>

              ${refundAmount !== null && refundAmount > 0 ? `
              <div class="refund-box">
                <h3 style="margin-top: 0; color: #155724;">Refund Information</h3>
                <p>Your refund has been processed:</p>
                <div class="refund-amount">$${refundAmount.toFixed(2)}</div>
                <p style="margin-bottom: 0; font-size: 14px; color: #666;">
                  The refund will be processed to your original payment method within 3-5 business days.
                </p>
              </div>
              ` : ''}
              
              <p><strong>Hotel Address:</strong><br>${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}</p>
              
              <p>If you have any questions or would like to make a new booking, please don't hesitate to contact us.</p>
              
              <p>We hope to serve you again in the future.</p>
              
              <p>Best regards,<br>The Airbnb Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Booking Cancelled

Dear ${customer.name},

We're sorry to inform you that your booking has been cancelled.

Booking Information:
- Booking ID: ${booking.id || booking._id}
- Hotel: ${hotel.name || 'Hotel'}
- Check-in: ${checkIn}
- Check-out: ${checkOut}
- Nights: ${nights}
- Guests: ${booking.guests || 1}
- Cancelled On: ${cancelledAt}
${booking.cancellationPolicyApplied ? `- Cancellation Policy: ${booking.cancellationPolicyApplied}\n` : ''}

${refundAmount !== null && refundAmount > 0 ? `Refund Information:
Your refund of $${refundAmount.toFixed(2)} has been processed and will be credited to your original payment method within 3-5 business days.

` : ''}Hotel Address: ${hotel.location?.address || ''}, ${hotel.location?.city || ''}, ${hotel.location?.country || ''}

If you have any questions or would like to make a new booking, please don't hesitate to contact us.

We hope to serve you again in the future.

Best regards,
The Airbnb Team`
    };
  }
};

module.exports = {
  sendEmail,
  emailTemplates
};

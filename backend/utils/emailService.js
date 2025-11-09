const nodemailer = require('nodemailer');

// Create reusable transporter (configure with your email service)
const createTransporter = () => {
  // For development, you can use Gmail or a service like Mailtrap
  // For production, use a service like SendGrid, AWS SES, or Mailgun
  
  // Gmail example (requires app password)
  return nodemailer.createTransporter({
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

// Send email function
const sendEmail = async (to, subject, html, text = '') => {
  try {
    // If email service is not configured, log and return
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('📧 Email not sent (email service not configured):', { to, subject });
      return { success: true, message: 'Email service not configured (development mode)' };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Airbnb Booking" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
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
      subject: `Invoice - Booking ${booking.id || booking._id}`,
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
              <h1>Invoice</h1>
            </div>
            <div class="content">
              <p>Dear ${customer.name},</p>
              <p>Thank you for your booking! Your payment has been processed successfully. Please find your invoice details below:</p>
              
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
  }
};

module.exports = {
  sendEmail,
  emailTemplates
};

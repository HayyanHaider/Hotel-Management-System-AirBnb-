const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Color constants
const COLORS = {
  primary: '#FF385C',      // Airbnb red
  primaryDark: '#E61E4D',
  secondary: '#222222',
  text: '#222222',
  textLight: '#717171',
  border: '#DDDDDD',
  background: '#F7F7F7',
  success: '#00A699',
  white: '#FFFFFF',
  accent: '#FF5A5F',
  lightGray: '#F5F5F5',
  mediumGray: '#B0B0B0'
};

// Create PDF invoice
const generateInvoicePDF = (invoiceData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document with better margins
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });
      
      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Create write stream
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      const currency = invoiceData.currency || invoiceData.payment?.currency || 'PKR';
      const formatCurrency = (value) => `${currency} ${(Number(value || 0)).toFixed(2)}`;

      // Helper function to convert hex to RGB
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255
        } : null;
      };

      const primaryColor = hexToRgb(COLORS.primary);
      const primaryDarkColor = hexToRgb(COLORS.primaryDark);
      const secondaryColor = hexToRgb(COLORS.secondary);
      const textLightColor = hexToRgb(COLORS.textLight);
      const borderColor = hexToRgb(COLORS.border);
      const bgColor = hexToRgb(COLORS.background);
      const lightGrayColor = hexToRgb(COLORS.lightGray);
      const mediumGrayColor = hexToRgb(COLORS.mediumGray);

      // Header Section with gradient-like effect
      const headerHeight = 140;
      
      // Main header background
      doc.rect(0, 0, doc.page.width, headerHeight)
         .fillColor(primaryColor.r, primaryColor.g, primaryColor.b)
         .fill();
      
      // Decorative accent line
      doc.rect(0, headerHeight - 8, doc.page.width, 8)
         .fillColor(primaryDarkColor.r, primaryDarkColor.g, primaryDarkColor.b)
         .fill();
      
      // Logo/Brand section
      doc.fillColor(1, 1, 1) // White
         .fontSize(36)
         .font('Helvetica-Bold')
         .text('airbnb', 50, 35, { align: 'left' });
      
      // Invoice title with better styling
      doc.fontSize(28)
         .font('Helvetica-Bold')
         .text('INVOICE', 50, 80, { align: 'left' });
      
      // Invoice number and date in styled boxes (right side)
      const rightInfoX = doc.page.width - 280;
      const infoBoxY = 40;
      const infoBoxHeight = 45;
      
      // Background box for invoice info
      doc.rect(rightInfoX - 10, infoBoxY, 270, infoBoxHeight)
         .fillColor(1, 1, 1, 0.15) // Semi-transparent white
         .fill()
         .strokeColor(1, 1, 1, 0.3)
         .lineWidth(1)
         .stroke();
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(1, 1, 1, 1)
         .text('INVOICE NUMBER', rightInfoX, infoBoxY + 8, { width: 250, align: 'right' });
      
      doc.fontSize(11)
         .font('Helvetica')
         .text(invoiceData.invoiceNumber || invoiceData.bookingId, rightInfoX, infoBoxY + 20, { width: 250, align: 'right' });
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('DATE', rightInfoX, infoBoxY + 35, { width: 250, align: 'right' });
      
      doc.fontSize(11)
         .font('Helvetica')
         .text(new Date(invoiceData.date || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), rightInfoX, infoBoxY + 47, { width: 250, align: 'right' });
      
      // Reset to black text
      doc.fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
      doc.y = headerHeight + 40;

      // Two-column layout for customer and hotel info with better styling
      const leftColumnX = 50;
      const rightColumnX = 300;
      const columnWidth = 220;
      const boxHeight = 100;

      // Customer Information Box with accent
      doc.rect(leftColumnX, doc.y, columnWidth, boxHeight)
         .fillColor(lightGrayColor.r, lightGrayColor.g, lightGrayColor.b)
         .fill()
         .strokeColor(borderColor.r, borderColor.g, borderColor.b)
         .lineWidth(1.5)
         .stroke();
      
      // Accent bar on left
      doc.rect(leftColumnX, doc.y, 4, boxHeight)
         .fillColor(primaryColor.r, primaryColor.g, primaryColor.b)
         .fill();
      
      doc.fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('BILL TO', leftColumnX + 15, doc.y + 12);
      
      // Divider line
      doc.strokeColor(borderColor.r, borderColor.g, borderColor.b)
         .lineWidth(0.5)
         .moveTo(leftColumnX + 15, doc.y + 25)
         .lineTo(leftColumnX + columnWidth - 15, doc.y + 25)
         .stroke();
      
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(invoiceData.customer.name || 'Customer', leftColumnX + 15, doc.y + 32);
      
      if (invoiceData.customer.email) {
        doc.fillColor(textLightColor.r, textLightColor.g, textLightColor.b)
           .fontSize(9)
           .font('Helvetica')
           .text(invoiceData.customer.email, leftColumnX + 15, doc.y + 48);
      }
      
      if (invoiceData.customer.phone) {
        doc.text(invoiceData.customer.phone, leftColumnX + 15, doc.y + 62);
      }
      
      doc.fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);

      // Hotel Information Box with accent
      doc.rect(rightColumnX, doc.y, columnWidth, boxHeight)
         .fillColor(lightGrayColor.r, lightGrayColor.g, lightGrayColor.b)
         .fill()
         .strokeColor(borderColor.r, borderColor.g, borderColor.b)
         .lineWidth(1.5)
         .stroke();
      
      // Accent bar on left
      doc.rect(rightColumnX, doc.y, 4, boxHeight)
         .fillColor(primaryColor.r, primaryColor.g, primaryColor.b)
         .fill();
      
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
         .text('HOTEL INFORMATION', rightColumnX + 15, doc.y + 12);
      
      // Divider line
      doc.strokeColor(borderColor.r, borderColor.g, borderColor.b)
         .lineWidth(0.5)
         .moveTo(rightColumnX + 15, doc.y + 25)
         .lineTo(rightColumnX + columnWidth - 15, doc.y + 25)
         .stroke();
      
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(invoiceData.hotel.name || 'Hotel', rightColumnX + 15, doc.y + 32);
      
      if (invoiceData.hotel.address) {
        doc.fillColor(textLightColor.r, textLightColor.g, textLightColor.b)
           .fontSize(9)
           .font('Helvetica')
           .text(invoiceData.hotel.address, rightColumnX + 15, doc.y + 48, { width: columnWidth - 30 });
      }
      
      doc.fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
      doc.y += boxHeight + 20;

      // Booking Details Box with better layout
      const bookingBoxHeight = 95;
      doc.rect(50, doc.y, doc.page.width - 100, bookingBoxHeight)
         .fillColor(lightGrayColor.r, lightGrayColor.g, lightGrayColor.b)
         .fill()
         .strokeColor(borderColor.r, borderColor.g, borderColor.b)
         .lineWidth(1.5)
         .stroke();
      
      // Accent bar
      doc.rect(50, doc.y, 4, bookingBoxHeight)
         .fillColor(primaryColor.r, primaryColor.g, primaryColor.b)
         .fill();
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
         .text('BOOKING DETAILS', 65, doc.y + 12);
      
      // Divider
      doc.strokeColor(borderColor.r, borderColor.g, borderColor.b)
         .lineWidth(0.5)
         .moveTo(65, doc.y + 25)
         .lineTo(doc.page.width - 65, doc.y + 25)
         .stroke();
      
      doc.fontSize(10)
         .font('Helvetica');
      
      const bookingDetailsY = doc.y + 35;
      const detailSpacing = 18;
      let detailY = bookingDetailsY;
      
      // Two-column layout for booking details
      const leftDetailX = 65;
      const rightDetailX = 350;
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(textLightColor.r, textLightColor.g, textLightColor.b)
         .text('BOOKING ID', leftDetailX, detailY);
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
         .text(invoiceData.bookingId, leftDetailX, detailY + 12);
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(textLightColor.r, textLightColor.g, textLightColor.b)
         .text('CHECK-IN', rightDetailX, detailY);
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
         .text(new Date(invoiceData.checkIn).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), rightDetailX, detailY + 12);
      
      detailY += 35;
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(textLightColor.r, textLightColor.g, textLightColor.b)
         .text('CHECK-OUT', leftDetailX, detailY);
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
         .text(new Date(invoiceData.checkOut).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), leftDetailX, detailY + 12);
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(textLightColor.r, textLightColor.g, textLightColor.b)
         .text('DURATION', rightDetailX, detailY);
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
         .text(`${invoiceData.nights || 1} ${invoiceData.nights === 1 ? 'Night' : 'Nights'} • ${invoiceData.guests || 1} ${invoiceData.guests === 1 ? 'Guest' : 'Guests'}`, rightDetailX, detailY + 12);
      
      doc.y += bookingBoxHeight + 25;

      // Items Table with styled header
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
         .text('PAYMENT BREAKDOWN', 50, doc.y);
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(textLightColor.r, textLightColor.g, textLightColor.b)
         .text('Detailed breakdown of charges and fees', 50, doc.y + 12);
      
      doc.y += 25;

      const tableTop = doc.y;
      const tableLeft = 50;
      const tableWidth = doc.page.width - 100;
      
      // Table header background with gradient effect
      doc.rect(tableLeft, tableTop, tableWidth, 35)
         .fillColor(primaryColor.r, primaryColor.g, primaryColor.b)
         .fill();
      
      // Subtle shadow effect
      doc.rect(tableLeft + 2, tableTop + 2, tableWidth, 35)
         .fillColor(primaryDarkColor.r, primaryDarkColor.g, primaryDarkColor.b, 0.3)
         .fill();
      
      // Table header text with better spacing
      doc.fillColor(1, 1, 1) // White
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('DESCRIPTION', tableLeft + 15, tableTop + 10)
         .text('QTY', tableLeft + 280, tableTop + 10)
         .text('PRICE', tableLeft + 330, tableTop + 10, { width: 80, align: 'right' })
         .text('AMOUNT', tableLeft + 420, tableTop + 10, { width: 80, align: 'right' });
      
      doc.fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
      let currentY = tableTop + 35;
      let rowIndex = 0;

      // Base price
      if (invoiceData.basePrice) {
        const isEven = rowIndex % 2 === 0;
        if (isEven) {
          doc.rect(tableLeft, currentY - 5, tableWidth, 25)
             .fillColor(bgColor.r, bgColor.g, bgColor.b)
             .fill();
        }
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
           .text(`Room (${invoiceData.nights || 1} nights)`, tableLeft + 10, currentY)
           .text(`${invoiceData.nights || 1}`, tableLeft + 280, currentY)
           .text(formatCurrency(invoiceData.basePrice / (invoiceData.nights || 1)), tableLeft + 330, currentY, { width: 80, align: 'right' })
           .text(formatCurrency(invoiceData.basePrice), tableLeft + 420, currentY, { width: 80, align: 'right' });
        currentY += 25;
        rowIndex++;
      }
      
      // Cleaning fee
      if (invoiceData.cleaningFee > 0) {
        const isEven = rowIndex % 2 === 0;
        if (isEven) {
          doc.rect(tableLeft, currentY - 5, tableWidth, 25)
             .fillColor(bgColor.r, bgColor.g, bgColor.b)
             .fill();
        }
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
           .text('Cleaning Fee', tableLeft + 10, currentY)
           .text('1', tableLeft + 280, currentY)
           .text('-', tableLeft + 330, currentY, { width: 80, align: 'right' })
           .text(formatCurrency(invoiceData.cleaningFee), tableLeft + 420, currentY, { width: 80, align: 'right' });
        currentY += 25;
        rowIndex++;
      }
      
      // Service fee
      if (invoiceData.serviceFee > 0) {
        const isEven = rowIndex % 2 === 0;
        if (isEven) {
          doc.rect(tableLeft, currentY - 5, tableWidth, 25)
             .fillColor(bgColor.r, bgColor.g, bgColor.b)
             .fill();
        }
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
           .text('Service Fee', tableLeft + 10, currentY)
           .text('1', tableLeft + 280, currentY)
           .text('-', tableLeft + 330, currentY, { width: 80, align: 'right' })
           .text(formatCurrency(invoiceData.serviceFee), tableLeft + 420, currentY, { width: 80, align: 'right' });
        currentY += 25;
        rowIndex++;
      }
      
      // Discount
      if (invoiceData.discount > 0) {
        const isEven = rowIndex % 2 === 0;
        if (isEven) {
          doc.rect(tableLeft, currentY - 5, tableWidth, 25)
             .fillColor(bgColor.r, bgColor.g, bgColor.b)
             .fill();
        }
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(0.2, 0.7, 0.3) // Green for discount
           .text(`Discount${invoiceData.couponCode ? ` (${invoiceData.couponCode})` : ''}`, tableLeft + 10, currentY)
           .text('1', tableLeft + 280, currentY)
           .text('-', tableLeft + 330, currentY, { width: 80, align: 'right' })
           .text(`-${formatCurrency(invoiceData.discount)}`, tableLeft + 420, currentY, { width: 80, align: 'right' });
        currentY += 25;
        rowIndex++;
        doc.fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
      }
      
      // Total section with prominent highlight
      currentY += 15;
      
      // Background with stronger color
      doc.rect(tableLeft, currentY, tableWidth, 45)
         .fillColor(primaryColor.r * 0.12, primaryColor.g * 0.12, primaryColor.b * 0.12)
         .fill()
         .strokeColor(primaryColor.r, primaryColor.g, primaryColor.b)
         .lineWidth(2.5)
         .stroke();
      
      // Accent line on left
      doc.rect(tableLeft, currentY, 5, 45)
         .fillColor(primaryColor.r, primaryColor.g, primaryColor.b)
         .fill();
      
      doc.fontSize(13)
         .font('Helvetica-Bold')
         .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
         .text('TOTAL AMOUNT', tableLeft + 15, currentY + 8);
      
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor(primaryColor.r, primaryColor.g, primaryColor.b)
         .text('Total:', tableLeft + 330, currentY + 12, { width: 80, align: 'right' })
         .text(formatCurrency(invoiceData.total), tableLeft + 420, currentY + 12, { width: 80, align: 'right' });
      
      doc.y = currentY + 50;
      
      // Payment information box with better styling
      if (invoiceData.payment) {
        const paymentBoxHeight = 100;
        doc.rect(50, doc.y, doc.page.width - 100, paymentBoxHeight)
           .fillColor(lightGrayColor.r, lightGrayColor.g, lightGrayColor.b)
           .fill()
           .strokeColor(borderColor.r, borderColor.g, borderColor.b)
           .lineWidth(1.5)
           .stroke();
        
        // Accent bar
        doc.rect(50, doc.y, 4, paymentBoxHeight)
           .fillColor(primaryColor.r, primaryColor.g, primaryColor.b)
           .fill();
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
           .text('PAYMENT INFORMATION', 65, doc.y + 12);
        
        // Divider
        doc.strokeColor(borderColor.r, borderColor.g, borderColor.b)
           .lineWidth(0.5)
           .moveTo(65, doc.y + 25)
           .lineTo(doc.page.width - 65, doc.y + 25)
           .stroke();
        
        doc.fontSize(10)
           .font('Helvetica');
        
        const paymentY = doc.y + 35;
        let paymentDetailY = paymentY;
        const paymentLeftX = 65;
        const paymentRightX = 350;
        
        // Two-column layout
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor(textLightColor.r, textLightColor.g, textLightColor.b)
           .text('PAYMENT METHOD', paymentLeftX, paymentDetailY);
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
           .text(invoiceData.payment.method || 'N/A', paymentLeftX, paymentDetailY + 12);
        
        if (invoiceData.payment.paypalEmail) {
          doc.fontSize(9)
             .font('Helvetica-Bold')
             .fillColor(textLightColor.r, textLightColor.g, textLightColor.b)
             .text('PAYPAL EMAIL', paymentRightX, paymentDetailY);
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
             .text(invoiceData.payment.paypalEmail, paymentRightX, paymentDetailY + 12);
        }
        
        paymentDetailY += 35;
        
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor(textLightColor.r, textLightColor.g, textLightColor.b)
           .text('TRANSACTION ID', paymentLeftX, paymentDetailY);
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
           .text(invoiceData.payment.transactionId || 'N/A', paymentLeftX, paymentDetailY + 12, { width: 250 });
        
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor(textLightColor.r, textLightColor.g, textLightColor.b)
           .text('PAYMENT DATE', paymentRightX, paymentDetailY);
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
           .text(new Date(invoiceData.payment.processedAt || invoiceData.payment.date || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), paymentRightX, paymentDetailY + 12);
        
        doc.y += paymentBoxHeight + 20;
      }
      
      // Footer with styled message and branding
      const footerY = doc.page.height - 90;
      
      // Footer background
      doc.rect(0, footerY - 20, doc.page.width, 90)
         .fillColor(lightGrayColor.r, lightGrayColor.g, lightGrayColor.b)
         .fill();
      
      // Top border with accent
      doc.rect(0, footerY - 20, doc.page.width, 3)
         .fillColor(primaryColor.r, primaryColor.g, primaryColor.b)
         .fill();
      
      doc.strokeColor(borderColor.r, borderColor.g, borderColor.b)
         .lineWidth(0.5)
         .moveTo(50, footerY)
         .lineTo(doc.page.width - 50, footerY)
         .stroke();
      
      doc.fontSize(13)
         .font('Helvetica-Bold')
         .fillColor(primaryColor.r, primaryColor.g, primaryColor.b)
         .text('Thank you for choosing Airbnb!', 50, footerY + 10, { align: 'center' });
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(textLightColor.r, textLightColor.g, textLightColor.b)
         .text('This is a computer-generated invoice. No signature required.', 50, footerY + 28, { align: 'center' });
      
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(mediumGrayColor.r, mediumGrayColor.g, mediumGrayColor.b)
         .text('For inquiries, please contact our support team.', 50, footerY + 42, { align: 'center' });
      
      // Small branding at bottom
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor(mediumGrayColor.r, mediumGrayColor.g, mediumGrayColor.b)
         .text('© ' + new Date().getFullYear() + ' Airbnb. All rights reserved.', 50, footerY + 58, { align: 'center' });
      
      // Finalize PDF
      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF
};


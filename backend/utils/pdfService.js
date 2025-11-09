const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create PDF invoice
const generateInvoicePDF = (invoiceData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Create write stream
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20).text('INVOICE', { align: 'center' });
      doc.moveDown();
      
      // Invoice details
      doc.fontSize(12);
      doc.text(`Invoice Number: ${invoiceData.invoiceNumber || invoiceData.bookingId}`, { align: 'left' });
      doc.text(`Date: ${new Date(invoiceData.date || Date.now()).toLocaleDateString()}`, { align: 'left' });
      doc.moveDown();
      
      // Customer information
      doc.fontSize(14).text('Bill To:', { underline: true });
      doc.fontSize(12);
      doc.text(invoiceData.customer.name || 'Customer');
      doc.text(invoiceData.customer.email || '');
      if (invoiceData.customer.phone) {
        doc.text(invoiceData.customer.phone);
      }
      doc.moveDown();
      
      // Hotel information
      doc.fontSize(14).text('Hotel Information:', { underline: true });
      doc.fontSize(12);
      doc.text(invoiceData.hotel.name || 'Hotel');
      if (invoiceData.hotel.address) {
        doc.text(invoiceData.hotel.address);
      }
      doc.moveDown();
      
      // Booking details
      doc.fontSize(14).text('Booking Details:', { underline: true });
      doc.fontSize(12);
      doc.text(`Booking ID: ${invoiceData.bookingId}`);
      doc.text(`Check-in: ${new Date(invoiceData.checkIn).toLocaleDateString()}`);
      doc.text(`Check-out: ${new Date(invoiceData.checkOut).toLocaleDateString()}`);
      doc.text(`Nights: ${invoiceData.nights || 1}`);
      doc.text(`Guests: ${invoiceData.guests || 1}`);
      doc.moveDown();
      
      // Items table
      doc.fontSize(14).text('Items:', { underline: true });
      doc.moveDown(0.5);
      
      // Table header
      const tableTop = doc.y;
      doc.fontSize(10);
      doc.text('Description', 50, tableTop);
      doc.text('Quantity', 250, tableTop);
      doc.text('Price', 320, tableTop, { width: 100, align: 'right' });
      doc.text('Amount', 420, tableTop, { width: 100, align: 'right' });
      
      // Draw line under header
      doc.moveTo(50, tableTop + 15).lineTo(520, tableTop + 15).stroke();
      doc.moveDown();
      
      let currentY = doc.y;
      
      // Base price
      if (invoiceData.basePrice) {
        doc.text(`Room (${invoiceData.nights || 1} nights)`, 50, currentY);
        doc.text(`${invoiceData.nights || 1}`, 250, currentY);
        doc.text(`$${(invoiceData.basePrice / (invoiceData.nights || 1)).toFixed(2)}`, 320, currentY, { width: 100, align: 'right' });
        doc.text(`$${invoiceData.basePrice.toFixed(2)}`, 420, currentY, { width: 100, align: 'right' });
        currentY += 20;
      }
      
      // Cleaning fee
      if (invoiceData.cleaningFee > 0) {
        doc.text('Cleaning Fee', 50, currentY);
        doc.text('1', 250, currentY);
        doc.text('-', 320, currentY, { width: 100, align: 'right' });
        doc.text(`$${invoiceData.cleaningFee.toFixed(2)}`, 420, currentY, { width: 100, align: 'right' });
        currentY += 20;
      }
      
      // Service fee
      if (invoiceData.serviceFee > 0) {
        doc.text('Service Fee', 50, currentY);
        doc.text('1', 250, currentY);
        doc.text('-', 320, currentY, { width: 100, align: 'right' });
        doc.text(`$${invoiceData.serviceFee.toFixed(2)}`, 420, currentY, { width: 100, align: 'right' });
        currentY += 20;
      }
      
      // Discount
      if (invoiceData.discount > 0) {
        doc.text(`Discount (${invoiceData.couponCode || 'Applied'})`, 50, currentY);
        doc.text('1', 250, currentY);
        doc.text('-', 320, currentY, { width: 100, align: 'right' });
        doc.text(`-$${invoiceData.discount.toFixed(2)}`, 420, currentY, { width: 100, align: 'right' });
        currentY += 20;
      }
      
      // Draw line before total
      doc.moveTo(50, currentY + 5).lineTo(520, currentY + 5).stroke();
      currentY += 15;
      
      // Total
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Total:', 320, currentY, { width: 100, align: 'right' });
      doc.text(`$${invoiceData.total.toFixed(2)}`, 420, currentY, { width: 100, align: 'right' });
      doc.font('Helvetica');
      
      doc.moveDown(2);
      
      // Payment information
      if (invoiceData.payment) {
        doc.fontSize(14).text('Payment Information:', { underline: true });
        doc.fontSize(12);
        doc.text(`Payment Method: ${invoiceData.payment.method || 'N/A'}`);
        doc.text(`Transaction ID: ${invoiceData.payment.transactionId || 'N/A'}`);
        doc.text(`Payment Date: ${new Date(invoiceData.payment.date || Date.now()).toLocaleDateString()}`);
        doc.moveDown();
      }
      
      // Footer
      doc.fontSize(10);
      doc.text('Thank you for your business!', { align: 'center' });
      doc.text('This is a computer-generated invoice.', { align: 'center' });
      
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


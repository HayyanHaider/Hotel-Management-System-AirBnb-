const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                          process.env.CLOUDINARY_API_KEY && 
                          process.env.CLOUDINARY_API_SECRET;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('✅ Cloudinary configured for invoice storage');
} else {
  console.warn('⚠️  Cloudinary credentials not configured for invoice storage');
}

/**
 * Upload invoice PDF to Cloudinary
 * @param {string} localFilePath - Path to the local PDF file
 * @param {string} bookingId - Booking ID for unique identification
 * @returns {Promise<Object>} - Cloudinary upload result with secure_url
 */
const uploadInvoiceToCloudinary = async (localFilePath, bookingId) => {
  try {
    if (!hasCloudinaryConfig) {
      throw new Error('Cloudinary is not configured');
    }

    if (!fs.existsSync(localFilePath)) {
      throw new Error('Local invoice file not found');
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: 'airbnb/invoices',
      resource_type: 'raw', // For non-image files like PDFs
      public_id: `invoice-${bookingId}-${Date.now()}`,
      format: 'pdf',
      access_mode: 'public'
    });

    console.log(`✅ Invoice uploaded to Cloudinary: ${result.secure_url}`);

    // Delete local file after successful upload
    try {
      fs.unlinkSync(localFilePath);
      console.log(`🗑️  Local invoice file deleted: ${localFilePath}`);
    } catch (deleteError) {
      console.warn(`⚠️  Could not delete local file: ${deleteError.message}`);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      cloudinaryId: result.public_id,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('❌ Error uploading invoice to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete invoice from Cloudinary
 * @param {string} publicId - Cloudinary public_id of the invoice
 * @returns {Promise<Object>} - Deletion result
 */
const deleteInvoiceFromCloudinary = async (publicId) => {
  try {
    if (!hasCloudinaryConfig) {
      throw new Error('Cloudinary is not configured');
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });

    console.log(`🗑️  Invoice deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    console.error('❌ Error deleting invoice from Cloudinary:', error);
    throw error;
  }
};

/**
 * Get invoice URL from Cloudinary public ID
 * @param {string} publicId - Cloudinary public_id
 * @returns {string} - Secure URL
 */
const getInvoiceUrl = (publicId) => {
  if (!hasCloudinaryConfig) {
    return null;
  }
  
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    secure: true
  });
};

/**
 * Download invoice from Cloudinary to buffer
 * @param {string} url - Cloudinary secure URL
 * @returns {Promise<Buffer>} - Invoice file buffer
 */
const downloadInvoiceFromCloudinary = async (url) => {
  try {
    const https = require('https');
    
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download invoice: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
  } catch (error) {
    console.error('❌ Error downloading invoice from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  uploadInvoiceToCloudinary,
  deleteInvoiceFromCloudinary,
  getInvoiceUrl,
  downloadInvoiceFromCloudinary,
  hasCloudinaryConfig
};

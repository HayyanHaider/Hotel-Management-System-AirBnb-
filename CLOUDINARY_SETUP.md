# Cloudinary Image Upload Setup

## Overview
The application uses Cloudinary to store and manage hotel images. All hotel images are uploaded to Cloudinary cloud storage and displayed to customers.

## Setup Instructions

### 1. Create Cloudinary Account

1. Go to [Cloudinary Website](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Get Cloudinary Credentials

1. Log in to your Cloudinary account
2. Go to the Dashboard
3. Copy the following credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 3. Configure Backend Environment Variables

Create or update the `.env` file in the `backend` directory:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=my-hotel-app
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### 4. Restart Backend Server

After adding the environment variables, restart your backend server:

```bash
cd backend
npm start
# or
npm run dev
```

## Features

### For Hotel Owners:
- **Upload Multiple Images**: Upload up to 10 images at once
- **Image Validation**: Only JPEG, PNG, GIF, and WebP formats are allowed
- **File Size Limit**: Maximum 10MB per image
- **Automatic Optimization**: Images are automatically optimized by Cloudinary
- **Cloud Storage**: Images are stored securely in Cloudinary cloud storage
- **Remove Images**: Remove uploaded images before saving the hotel

### For Customers:
- **View Hotel Images**: See all uploaded hotel images on the hotel details page
- **Image Gallery**: Browse through hotel images in an organized gallery
- **High-Quality Images**: Images are optimized and delivered in high quality

## Image Upload Process

1. Hotel owner selects images using the file input
2. Images are uploaded to Cloudinary via the backend API
3. Cloudinary returns URLs for the uploaded images
4. Image URLs are stored in the hotel record in the database
5. Images are displayed to customers when viewing hotels

## Image Storage

- **Folder Structure**: Images are stored in `airbnb/hotels/` folder in Cloudinary
- **Image Optimization**: Images are automatically resized and optimized
- **CDN Delivery**: Images are delivered via Cloudinary's CDN for fast loading
- **Transformations**: Images are limited to 1000x1000px and optimized for web

## API Endpoints

### Upload Multiple Images
- **Endpoint**: `POST /api/upload/images`
- **Authentication**: Required (Bearer token)
- **Max Files**: 10 images per request
- **Max Size**: 10MB per image
- **Response**: Array of image URLs

### Upload Single Image
- **Endpoint**: `POST /api/upload/image`
- **Authentication**: Required (Bearer token)
- **Max Size**: 10MB
- **Response**: Single image URL

### Delete Image
- **Endpoint**: `DELETE /api/upload/image`
- **Authentication**: Required (Bearer token)
- **Body**: `{ "publicId": "image_public_id" }`
- **Response**: Success message

## Troubleshooting

### Images not uploading
- Check if Cloudinary credentials are set in `.env` file
- Verify the credentials are correct
- Check backend server logs for errors
- Ensure images are in supported formats (JPEG, PNG, GIF, WebP)
- Verify images are under 10MB

### Images not displaying
- Check if image URLs are stored correctly in the database
- Verify image URLs are accessible
- Check browser console for CORS or loading errors
- Ensure Cloudinary account is active

### Upload errors
- Verify file size is under 10MB
- Check file format is supported
- Ensure you're authenticated (token is valid)
- Check backend server is running

## Free Tier Limits

Cloudinary free tier includes:
- 25GB storage
- 25GB monthly bandwidth
- Unlimited transformations
- CDN delivery

This should be sufficient for development and small-scale production use.

## Production Considerations

For production:
1. Set up Cloudinary account with appropriate plan
2. Configure image upload limits and transformations
3. Set up image backup and recovery
4. Monitor usage and costs
5. Configure CORS settings if needed
6. Set up image optimization settings

## Security

- API keys are stored in environment variables (never commit to git)
- Images are uploaded only by authenticated hotel owners
- File type and size validation on both frontend and backend
- Images are stored in a private folder structure

## Notes

- Images are automatically optimized for web delivery
- Cloudinary provides automatic image transformations
- Images are delivered via CDN for fast loading
- Old images are not automatically deleted (manual cleanup may be needed)


# Gmail OAuth2 Email System Setup Guide

## Overview
This system allows users to send booking confirmation emails from their own Gmail accounts. When a user completes a booking, the system will automatically send a confirmation email with an invoice attachment from their Gmail account (if authorized), or fall back to the system email account.

## Features
- ✅ Gmail OAuth2 authentication
- ✅ Automatic token refresh
- ✅ Secure token storage
- ✅ Fallback to system email if user Gmail not authorized
- ✅ PDF invoice attachment
- ✅ Professional email templates

## Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Gmail API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### Step 2: Create OAuth 2.0 Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External (for testing) or Internal (for organization)
   - App name: "Hotel Booking System" (or your app name)
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Add test users (if in testing mode): Add your Gmail address
   - Save and continue

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Hotel Booking System Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/gmail/callback` (for development)
     - `https://yourdomain.com/api/auth/gmail/callback` (for production)
   - Click "Create"

5. Copy the **Client ID** and **Client Secret**

### Step 3: Configure Environment Variables

Add these variables to your `backend/.env` file:

```env
# Gmail OAuth2 Configuration
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:5000/api/auth/gmail/callback

# Frontend URL (for redirects after OAuth)
FRONTEND_URL=http://localhost:5173

# System Email (fallback if user Gmail not authorized)
EMAIL_SERVICE=gmail
EMAIL_USER=your_system_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
```

**Note:** For `EMAIL_PASSWORD`, you need to use a Gmail App Password:
1. Go to your Google Account settings
2. Security > 2-Step Verification (must be enabled)
3. App passwords > Generate app password
4. Use the generated password

### Step 4: Restart Backend Server

```bash
cd backend
npm start
# or
npm run dev
```

## How It Works

### User Flow

1. **User Authorization:**
   - User visits settings/profile page
   - Clicks "Connect Gmail" button
   - Redirected to Google OAuth consent screen
   - User grants permission
   - Redirected back with authorization code
   - System exchanges code for tokens and stores them securely

2. **Booking Confirmation:**
   - User completes booking and payment
   - System checks if user has Gmail authorized
   - If authorized: Sends email from user's Gmail account
   - If not authorized: Falls back to system email account
   - Email includes booking details and PDF invoice attachment

### API Endpoints

#### 1. Initiate Gmail Authorization
```
GET /api/auth/gmail/authorize
Headers: Authorization: Bearer <token>
Response: { success: true, authUrl: "https://..." }
```

#### 2. Gmail OAuth Callback (handled automatically)
```
GET /api/auth/gmail/callback?code=...&state=...
Redirects to: FRONTEND_URL/settings?gmail_auth=success
```

#### 3. Check Gmail Status
```
GET /api/auth/gmail/status
Headers: Authorization: Bearer <token>
Response: { success: true, authorized: true/false, authorizedAt: "...", email: "..." }
```

#### 4. Revoke Gmail Authorization
```
POST /api/auth/gmail/revoke
Headers: Authorization: Bearer <token>
Response: { success: true, message: "Gmail authorization revoked" }
```

## Security Considerations

### Token Storage
- OAuth tokens are stored encrypted in the database
- Refresh tokens are used to automatically renew access tokens
- Tokens are never exposed to the frontend

### Data Flow
1. User credentials are never stored
2. Only OAuth tokens are stored (encrypted)
3. Tokens are scoped to email sending only
4. Users can revoke access at any time

### Best Practices
- ✅ Use HTTPS in production
- ✅ Store sensitive data in environment variables
- ✅ Regularly rotate OAuth credentials
- ✅ Monitor token usage
- ✅ Implement rate limiting
- ✅ Log email sending activities

## Troubleshooting

### "Gmail OAuth2 not configured"
- Check that `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` are set in `.env`
- Restart the server after adding environment variables

### "Invalid redirect URI"
- Ensure the redirect URI in Google Cloud Console matches exactly
- Check `GMAIL_REDIRECT_URI` in `.env`

### "Access denied"
- Check OAuth consent screen configuration
- Ensure test users are added (if in testing mode)
- Verify scopes are correctly configured

### "Token expired"
- System automatically refreshes tokens
- If refresh fails, user needs to re-authorize

### Email not sending from user Gmail
- Check if user has authorized Gmail (`/api/auth/gmail/status`)
- Verify tokens are valid
- System will automatically fall back to system email

## Testing

1. **Test Authorization:**
   ```bash
   # Get auth URL
   curl -H "Authorization: Bearer <token>" http://localhost:5000/api/auth/gmail/authorize
   
   # Visit the authUrl in browser
   # Complete OAuth flow
   ```

2. **Check Status:**
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:5000/api/auth/gmail/status
   ```

3. **Test Booking:**
   - Complete a booking
   - Check email inbox
   - Verify email is from user's Gmail (if authorized) or system email

## Production Deployment

1. Update redirect URIs in Google Cloud Console
2. Update `FRONTEND_URL` and `GMAIL_REDIRECT_URI` in production `.env`
3. Ensure OAuth consent screen is published (if using external users)
4. Use environment-specific credentials
5. Enable monitoring and logging

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify environment variables are correctly set
- Ensure Google Cloud project is properly configured
- Review OAuth consent screen settings


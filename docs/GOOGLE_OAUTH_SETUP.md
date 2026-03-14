# Google OAuth Setup Guide

## Prerequisites
- Google Cloud Project with OAuth enabled
- Frontend application credentials

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown and select "New Project"
3. Enter a project name (e.g., "Bhaluke Bhature")
4. Click "Create"

## Step 2: Enable OAuth 2.0

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and select "Enable"
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "OAuth Client ID"
6. If prompted, configure the OAuth consent screen first:
   - Select "External" for User Type
   - Fill in the required information
   - Add required scopes: `email`, `profile`
   - Add test users if needed

## Step 3: Create OAuth Credentials

1. After configuring consent screen, return to "Create Credentials" > "OAuth Client ID"
2. Select "Web application"
3. Add Authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (for development)
   - `https://your-domain.com/api/auth/google/callback` (for production)
   - `http://localhost:5173/auth/callback` (for frontend redirect)
4. Click "Create"
5. Copy the Client ID and Client Secret

## Step 4: Configure Environment Variables

Add the following to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

For production:
```env
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
```

## API Endpoints

### Get Google Auth URL
```bash
GET /api/auth/google
```
Returns: `{ success: true, data: { authUrl: "https://accounts.google.com/o/oauth2/v2/auth?..." } }`

### Google Login (ID Token)
```bash
POST /api/auth/google-login
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE..."
}
```

### Google OAuth Callback
```
GET /api/auth/google/callback?code=...
```
Redirects to frontend with token and user data.

## Frontend Integration Example

### Using Google Sign-In Button

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
<div id="g_id_onload"
     data-client_id="YOUR_CLIENT_ID"
     data-callback="handleCredentialResponse">
</div>
<div class="g_id_signin" data-type="standard"></div>

<script>
  function handleCredentialResponse(response) {
    // Send token to backend
    fetch('http://localhost:5000/api/auth/google-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idToken: response.credential
      })
    })
    .then(res => res.json())
    .then(data => {
      // Save token to localStorage
      localStorage.setItem('authToken', data.data.token);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    });
  }
</script>
```

### Using OAuth Flow

```javascript
// 1. Get auth URL
const authUrlResponse = await fetch('http://localhost:5000/api/auth/google');
const { authUrl } = await authUrlResponse.json();

// 2. Redirect user to Google login
window.location.href = authUrl;

// 3. Backend handles callback and redirects to frontend with token
```

## Troubleshooting

### Invalid Client ID
- Verify the Client ID matches in `.env` and Google Cloud Console
- Check that the redirect URI is registered in Google Cloud Console

### Redirect URI Mismatch
- Ensure `GOOGLE_REDIRECT_URI` in `.env` exactly matches the authorized redirect URI in Google Cloud Console
- Include the full path: `http://localhost:5000/api/auth/google/callback`

### Token Verification Failed
- Check that JWT_SECRET is set in `.env`
- Verify Google Client ID in environment variables

## Production Deployment

1. Create separate OAuth credentials for production
2. Update redirect URIs to your production domain
3. Set environment variables on your EC2/deployment platform
4. Use HTTPS for all OAuth callbacks
5. Store credentials securely using AWS Secrets Manager or similar

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Web](https://developers.google.com/identity/sign-in/web)
- [Google Cloud Console](https://console.cloud.google.com/)
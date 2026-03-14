# Setup Guide

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (for local development) or access to AWS RDS
- **Git**

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bhalukebhature
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration (see Environment Setup below)
   ```

4. **Set up the database**
   ```bash
   npm run migrate
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Detailed Setup

### 1. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Database Configuration
DB_HOST=localhost          # or your RDS endpoint
DB_PORT=5432
DB_NAME=bhalukebhature_db
DB_USER=postgres           # or your RDS username
DB_PASSWORD=your_password  # or your RDS password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# AWS Configuration (for production)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Application Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 2. Database Setup

#### Local PostgreSQL
If using local PostgreSQL:

1. Install PostgreSQL
2. Create a database:
   ```sql
   CREATE DATABASE bhalukebhature_db;
   ```
3. Update `.env` with your local credentials

#### AWS RDS
If using AWS RDS:

1. Create an RDS PostgreSQL instance
2. Update `.env` with RDS endpoint and credentials
3. Ensure security groups allow connections from your IP

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - Your production callback URL
6. Copy Client ID and Client Secret to `.env`

### 4. AWS S3 Setup (Optional for development)

For file uploads in production:

1. Create an S3 bucket
2. Create IAM user with S3 permissions
3. Update `.env` with AWS credentials

### 5. Running the Application

#### Development Mode
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
```

#### Production Mode
```bash
# Build the application
npm run build

# Start production servers
npm run start
```

## Testing

### API Testing
```bash
cd backend
npm test
```

### Manual Testing
Use tools like Postman or curl to test API endpoints:

```bash
# Test health endpoint
curl http://localhost:5000/health

# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","role":"student","password":"password123"}'
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 5000
   lsof -ti:5000 | xargs kill -9

   # Or use different port
   PORT=5001 npm run dev:backend
   ```

2. **Database connection failed**
   - Check PostgreSQL is running
   - Verify connection credentials in `.env`
   - Ensure database exists

3. **Google OAuth not working**
   - Verify redirect URIs in Google Console
   - Check client ID and secret in `.env`
   - Ensure HTTPS in production

4. **File upload issues**
   - Check AWS credentials for S3
   - Verify bucket permissions
   - Check file size limits

### Logs
Check logs for debugging:
- Backend logs: `backend/logs/`
- Frontend: Browser developer console

## Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
cd backend
docker-compose up -d
```

### AWS Deployment
1. Set up EC2 instance
2. Configure RDS and S3
3. Deploy backend to EC2
4. Serve frontend statically or deploy to S3

### Environment Variables for Production
```env
NODE_ENV=production
DB_HOST=your-rds-endpoint
AWS_ACCESS_KEY_ID=your-production-key
AWS_SECRET_ACCESS_KEY=your-production-secret
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
FRONTEND_URL=https://yourdomain.com
```

## Development Workflow

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and test locally
3. Run tests: `npm test`
4. Commit changes: `git commit -m "Add new feature"`
5. Push and create PR: `git push origin feature/new-feature`

## Support

For issues or questions:
- Check the [API documentation](API.md)
- Review [architecture documentation](ARCHITECTURE.md)
- Create an issue in the repository
# Bhaluke Bhature Backend

A scalable backend API for the Bhaluke Bhature platform, built with Node.js, Express, and TypeScript. Supports AWS RDS PostgreSQL database and S3 file storage.

## Features

- **Authentication**: JWT-based authentication with role-based access (MSME/Student)
- **Google OAuth**: Secure Google Sign-In integration
- **Bounty Management**: Create, apply, assign, and complete bounties
- **Social Feed**: Post and view community updates
- **B2B Catalog**: Manage bulk product listings
- **File Upload**: AWS S3 integration for user avatars and submissions
- **Scalable Architecture**: Modular design with proper error handling and logging

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (AWS RDS)
- **File Storage**: AWS S3
- **Authentication**: JWT
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js 18+
- PostgreSQL database (AWS RDS)
- AWS account with S3 bucket
- AWS credentials with appropriate permissions

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```env
   DB_HOST=your-rds-endpoint
   DB_PORT=5432
   DB_NAME=your-db-name
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   JWT_SECRET=your-jwt-secret
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-bucket-name
   PORT=5000
   ```

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Google OAuth Setup

To enable Google OAuth login, follow the detailed setup guide: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

Quick setup:
1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/)
2. Add to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
   ```
3. Frontend can use Google Sign-In button or OAuth flow

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login with email/password
- `POST /api/auth/register` - User registration
- `GET /api/auth/google` - Get Google OAuth authorization URL
- `POST /api/auth/google-login` - Login with Google ID token
- `GET /api/auth/google/callback` - Google OAuth callback (redirects to frontend)

### Bounties
- `GET /api/bounties` - Get all bounties
- `POST /api/bounties` - Create new bounty (MSME only)
- `POST /api/bounties/:id/apply` - Apply for bounty (Student only)
- `POST /api/bounties/:id/assign` - Assign bounty to student (MSME only)
- `POST /api/bounties/:id/submit` - Submit work for bounty
- `POST /api/bounties/:id/finalize` - Finalize completed bounty

### Social
- `GET /api/social/feed` - Get feed posts
- `POST /api/social/feed` - Create new post

### Catalog
- `GET /api/catalog` - Get catalog items
- `POST /api/catalog` - Add catalog item (MSME only)

### Users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users?ids=1,2,3` - Get multiple users by IDs

## Deployment to AWS EC2

### Prerequisites
- AWS account with EC2, RDS, and S3 access
- RDS PostgreSQL instance
- S3 bucket for file storage
- IAM user with appropriate permissions

### Steps

1. **Launch EC2 Instance**:
   - Choose Amazon Linux 2 or Ubuntu
   - t2.micro or t3.small for development
   - Configure security groups (allow SSH, HTTP/HTTPS on port 80/443, app port 5000)

2. **Connect to EC2**:
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

3. **Install Docker and Docker Compose**:
   ```bash
   sudo yum update -y
   sudo amazon-linux-extras install docker
   sudo service docker start
   sudo usermod -a -G docker ec2-user
   sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

4. **Clone and configure**:
   ```bash
   git clone your-repo-url
   cd bhalukebhature/Backend
   cp .env.example .env
   # Edit .env with your AWS credentials and RDS details
   ```

5. **Run database migrations** (if using local DB for testing):
   ```bash
   docker-compose up -d db
   docker-compose run --rm app npm run migrate
   ```

6. **Deploy the application**:
   ```bash
   docker-compose up -d
   ```

7. **Set up reverse proxy with Nginx** (optional):
   ```bash
   sudo yum install nginx
   sudo systemctl start nginx
   # Configure nginx.conf to proxy to port 5000
   ```

8. **SSL Certificate** (recommended):
   - Use AWS Certificate Manager or Let's Encrypt
   - Configure HTTPS

### Environment Variables for Production

Ensure these are set in your `.env` file:

```env
NODE_ENV=production
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_NAME=your_database_name
DB_USER=your_db_username
DB_PASSWORD=your_secure_db_password
JWT_SECRET=your_very_secure_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
FRONTEND_URL=https://your-frontend-domain.com
```

### Monitoring and Scaling

- **Health Checks**: The app includes a `/health` endpoint
- **Logs**: Check logs with `docker-compose logs app`
- **Scaling**: Use AWS Auto Scaling Groups for production
- **Load Balancing**: AWS ALB or ELB for multiple instances

## Database Schema

The application uses the following main tables:
- `users` - User accounts and profiles
- `bounties` - Bounty listings and management
- `feed_posts` - Social media posts
- `catalog_items` - B2B product catalog
- `sales` - Sales tracking data
- `connections` - MSME-Student connections
- `tasks` - Student task management
- `jobs` - Job board listings

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation with Joi
- Rate limiting
- CORS configuration
- Helmet security headers
- SQL injection prevention with parameterized queries

## Development

- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Start development server with hot reload
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run migrate` - Run database migrations

## Contributing

1. Follow the existing code structure
2. Add proper TypeScript types
3. Include input validation for new endpoints
4. Add appropriate error handling
5. Update this README for new features

## License

ISC
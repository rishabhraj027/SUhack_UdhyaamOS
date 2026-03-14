# System Architecture

## Overview

Bhaluke Bhature is a full-stack web application built with a modern tech stack, designed to connect MSMEs with student freelancers through a bounty-based system.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (Express)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - Components    │    │ - Controllers   │    │ - Users         │
│ - Pages         │    │ - Routes        │    │ - Bounties      │
│ - State Mgmt    │    │ - Middleware    │    │ - Feed Posts    │
│ - API Client    │    │ - Services      │    │ - Catalog Items │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ▼
                    ┌─────────────────┐
                    │   External      │
                    │   Services      │
                    │                 │
                    │ - AWS S3        │
                    │ - Google OAuth  │
                    └─────────────────┘
```

## Frontend Architecture

### Technology Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Client-side routing

### Directory Structure
```
frontend/src/
├── components/     # Reusable UI components
│   ├── ui/        # Base UI components (Button, Input, etc.)
│   └── ...
├── pages/         # Page components
├── layouts/       # Layout wrappers
├── hooks/         # Custom React hooks
├── services/      # API service functions
├── store/         # Zustand stores
├── utils/         # Helper functions
├── types/         # TypeScript type definitions
├── App.tsx        # Main app component
└── main.tsx       # App entry point
```

### State Management
- **Zustand** for global state
- Stores for: Auth, Bounties, Catalog, Social Feed
- Local component state with React hooks

## Backend Architecture

### Technology Stack
- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **JWT** - Authentication
- **AWS S3** - File storage
- **Google OAuth** - Social login

### Directory Structure
```
backend/src/
├── config/        # Configuration files
│   ├── db.ts     # Database connection
│   └── env.ts    # Environment variables
├── controllers/   # Business logic
├── routes/        # API route definitions
├── middleware/    # Express middleware
├── models/        # Database models
├── services/      # External service integrations
├── utils/         # Helper functions
├── types/         # TypeScript definitions
├── app.ts         # Express app setup
└── server.ts      # Server entry point
```

### API Design
- RESTful API endpoints
- JSON request/response format
- JWT-based authentication
- Role-based access control (MSME/Student)
- Input validation with Joi
- Error handling middleware

## Database Design

### Core Tables
- **users** - User accounts and profiles
- **bounties** - Task postings with rewards
- **feed_posts** - Social media content
- **catalog_items** - MSME product/service listings
- **sales** - Transaction records
- **connections** - User relationships
- **trade_offers** - B2B trade proposals
- **network_connections** - Professional network
- **tasks** - Task assignments
- **jobs** - Job postings

### Relationships
- Users can create bounties (MSME) or apply for them (Student)
- Users can create feed posts and catalog items
- Bounties have one creator and one assignee
- Catalog items belong to MSMEs

## Security

### Authentication
- JWT tokens for session management
- Password hashing with bcrypt
- Google OAuth 2.0 integration
- Role-based permissions

### Authorization
- Middleware for route protection
- User role validation
- API rate limiting
- CORS configuration

### Data Protection
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- Secure file upload handling

## External Integrations

### AWS S3
- File storage for user uploads
- Avatar images and submission files
- Configurable bucket and region

### Google OAuth
- Social login functionality
- User profile data retrieval
- Secure token exchange

## Deployment

### Development
- Local PostgreSQL database
- File system storage for uploads
- Concurrent frontend/backend dev servers

### Production
- AWS RDS PostgreSQL
- AWS S3 for file storage
- Docker containerization
- Environment-based configuration

## Performance Considerations

- Database connection pooling
- API response caching
- File upload size limits
- Rate limiting for API endpoints
- Optimized database queries
- Lazy loading for frontend assets
# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student", // or "msme"
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### Google OAuth Login
```http
GET /api/auth/google
```
Redirects to Google OAuth consent screen

```http
GET /api/auth/google/callback
```
Handles OAuth callback and returns JWT token

## Bounties

### Get All Bounties
```http
GET /api/bounties
```

### Create Bounty (MSME only)
```http
POST /api/bounties
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Website Development",
  "description": "Build a responsive website",
  "price": 5000
}
```

### Apply for Bounty (Student only)
```http
POST /api/bounties/:id/apply
Authorization: Bearer <token>
```

### Assign Bounty (MSME only)
```http
POST /api/bounties/:id/assign
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentId": "student-uuid"
}
```

## Social Feed

### Get Feed Posts
```http
GET /api/social/feed
```

### Create Post
```http
POST /api/social/feed
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Excited to start a new project!",
  "tags": ["project", "excited"]
}
```

## Catalog

### Get Catalog Items
```http
GET /api/catalog
```

### Create Catalog Item (MSME only)
```http
POST /api/catalog
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Custom T-shirts",
  "quantity": 100,
  "bulk_price": 500
}
```

## File Upload

### Upload Avatar
```http
POST /api/upload/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `avatar`: File (image)

### Upload Submission File
```http
POST /api/upload/submission
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File
- `bountyId`: UUID

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
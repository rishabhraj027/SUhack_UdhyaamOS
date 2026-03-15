# UdhyaamOS

A B2B marketplace and talent platform connecting MSMEs with Junior Professionals — built with React, Express, PostgreSQL, and Prisma.

## Architecture

| Component | Technology | Deployed On |
|-----------|-----------|-------------|
| Frontend  | React + Vite + TailwindCSS | [Vercel](https://vercel.com) |
| Backend   | Express + TypeScript + Prisma | AWS EC2 (Docker) |
| Database  | PostgreSQL | AWS RDS |
| Storage   | S3 pre-signed URLs | AWS S3 |

## Quick Start (Local Development)

```bash
# Install dependencies
npm run install:all

# Copy and configure environment variables
cp .env.example backend/.env
# Edit backend/.env with your DATABASE_URL, JWT_SECRET, etc.

# Run database migrations
npm run migrate

# Start both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Deployment

- **AWS EC2 Setup (Backend)**: See [docs/AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md) for the full step-by-step guide covering EC2, RDS, S3, Docker, Nginx, SSL, and Vercel frontend deployment.
- **Docker**: `docker compose up -d --build` (see [docker-compose.yml](docker-compose.yml))

## Documentation

| Document | Description |
|----------|-------------|
| [AWS Deployment Guide](docs/AWS_DEPLOYMENT.md) | Full EC2 + Vercel production setup |
| [Setup Guide](docs/SETUP.md) | Local development setup |
| [API Reference](docs/API.md) | Backend API endpoints |
| [Architecture](docs/ARCHITECTURE.md) | System architecture overview |
| [Google OAuth Setup](docs/GOOGLE_OAUTH_SETUP.md) | OAuth configuration |

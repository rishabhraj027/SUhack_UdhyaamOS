# Bhaluke Bhature - MSME & Student Freelance Platform

## Overview

A comprehensive platform connecting Micro, Small, and Medium Enterprises (MSMEs) with student freelancers for collaborative work opportunities.

## Features

- **Bounty System**: MSMEs can post tasks with rewards
- **Talent Matching**: Students can apply for bounties and build their portfolio
- **Social Feed**: Community interaction and networking
- **Catalog Management**: MSMEs can showcase their products/services
- **Authentication**: Secure login with email/password and Google OAuth

## Tech Stack

### Backend
- Node.js + Express.js
- TypeScript
- PostgreSQL (AWS RDS)
- JWT Authentication
- Google OAuth 2.0
- AWS S3 for file storage

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand for state management
- React Router for navigation

## Project Structure

```
project-root/
├── backend/                 # Backend API server
├── frontend/                # React frontend application
├── docs/                    # Documentation
├── scripts/                 # Automation scripts
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── README.md               # Project overview
└── package.json            # Root package management
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bhalukebhature
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   npm run migrate
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm run start` - Start both frontend and backend in production mode
- `npm run install:all` - Install dependencies for all workspaces

## API Documentation

See [docs/API.md](docs/API.md) for detailed API documentation.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system architecture details.

## Setup Guide

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

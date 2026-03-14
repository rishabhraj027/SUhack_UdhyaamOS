#!/bin/bash

# Backend Setup Script
# This script will help you set up the Bhaluke Bhature backend

echo "🚀 Bhaluke Bhature Backend Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"
echo ""

# Check if npm packages are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
    echo ""
    echo "📋 Checking for missing packages..."
    npm install --legacy-peer-deps 2>&1 | grep -q "added" && echo "📦 Some packages were missing and have been installed"
fi

echo ""
echo "🔍 Checking required packages:"
echo ""

# Array of required packages
packages=(
    "express"
    "pg"
    "jsonwebtoken"
    "bcryptjs"
    "cors"
    "helmet"
    "express-rate-limit"
    "multer"
    "aws-sdk"
    "joi"
    "winston"
    "dotenv"
    "uuid"
    "google-auth-library"
)

# Check each package
all_installed=true
for package in "${packages[@]}"; do
    if npm list "$package" > /dev/null 2>&1; then
        version=$(npm list "$package" 2>/dev/null | grep "$package@" | head -1 | sed 's/.*@//' | cut -d' ' -f1)
        echo "✅ $package@$version"
    else
        echo "❌ $package - NOT INSTALLED"
        all_installed=false
    fi
done

echo ""

if [ "$all_installed" = false ]; then
    echo "⚠️  Some packages are missing. Installing..."
    npm install --legacy-peer-deps
fi

# Check environment file
echo ""
echo "📝 Checking environment configuration:"
echo ""

if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    if [ -f ".env.example" ]; then
        echo "📋 Found .env.example - copying to .env"
        cp .env.example .env
        echo "✅ .env file created from template"
        echo "⚠️  Please update .env with your actual configuration:"
        echo "   - Database credentials (RDS)"
        echo "   - AWS S3 bucket information"
        echo "   - Google OAuth credentials"
        echo "   - JWT secret"
    fi
else
    echo "✅ .env file exists"
fi

# Check if required env variables are set
echo ""
echo "🔐 Checking critical environment variables:"

if grep -q "^DB_HOST=" .env && [ "$(grep '^DB_HOST=' .env | cut -d= -f2)" != "your-rds-endpoint" ]; then
    echo "✅ DB_HOST is configured"
else
    echo "⚠️  DB_HOST not configured (update .env)"
fi

if grep -q "^JWT_SECRET=" .env && [ "$(grep '^JWT_SECRET=' .env | cut -d= -f2)" != "your-jwt-secret" ]; then
    echo "✅ JWT_SECRET is configured"
else
    echo "⚠️  JWT_SECRET not configured (update .env)"
fi

if grep -q "^GOOGLE_CLIENT_ID=" .env && [ "$(grep '^GOOGLE_CLIENT_ID=' .env | cut -d= -f2)" != "your-google-client-id" ]; then
    echo "✅ GOOGLE_CLIENT_ID is configured"
else
    echo "⚠️  GOOGLE_CLIENT_ID not configured (update .env)"
fi

echo ""
echo "📦 TypeScript compilation check:"
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful"
else
    echo "⚠️  TypeScript compilation has errors"
    echo "   Run 'npm run build' to see details"
fi

echo ""
echo "=================================="
echo "✅ Setup check complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your credentials"
echo "2. Run migrations: npm run migrate"
echo "3. Start development: npm run dev"
echo ""
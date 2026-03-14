@echo off
REM Backend Setup Script for Windows
REM This script will help you set up the Bhaluke Bhature backend

echo.
echo 🚀 Bhaluke Bhature Backend Setup
echo ==================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ NPM version: %NPM_VERSION%
echo.

REM Check if npm packages are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 🔍 Checking required packages:
echo.

REM Check each package
setlocal enabledelayedexpansion
for %%p in (express pg jsonwebtoken bcryptjs cors helmet express-rate-limit multer aws-sdk joi winston dotenv uuid google-auth-library) do (
    npm list %%p >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ %%p
    ) else (
        echo ❌ %%p - NOT INSTALLED
    )
)

echo.
echo 📝 Checking environment configuration:
echo.

if not exist ".env" (
    echo ⚠️  .env file not found
    if exist ".env.example" (
        echo 📋 Found .env.example - copying to .env
        copy .env.example .env
        echo ✅ .env file created from template
        echo ⚠️  Please update .env with your actual configuration:
        echo    - Database credentials (RDS)
        echo    - AWS S3 bucket information
        echo    - Google OAuth credentials
        echo    - JWT secret
    )
) else (
    echo ✅ .env file exists
)

echo.
echo =================================="
echo ✅ Setup check complete!"
echo.
echo Next steps:
echo 1. Update .env with your credentials
echo 2. Run migrations: npm run migrate
echo 3. Start development: npm run dev
echo.
pause
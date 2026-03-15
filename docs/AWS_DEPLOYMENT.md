# AWS EC2 Deployment Guide

> **Architecture**: Backend (Docker) on AWS EC2 · Frontend on Vercel · Database on AWS RDS · Files on AWS S3

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [AWS RDS — PostgreSQL Database](#2-aws-rds--postgresql-database)
3. [AWS S3 — File Storage](#3-aws-s3--file-storage)
4. [AWS EC2 — Backend Server](#4-aws-ec2--backend-server)
5. [Deploy Backend with Docker](#5-deploy-backend-with-docker)
6. [Vercel — Frontend Deployment](#6-vercel--frontend-deployment)
7. [Domain & SSL Setup](#7-domain--ssl-setup)
8. [Google OAuth Configuration](#8-google-oauth-configuration)
9. [Monitoring & Maintenance](#9-monitoring--maintenance)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

- An **AWS account** with access to EC2, RDS, and S3
- A **Vercel account** (free tier works)
- A **domain name** (optional but recommended)
- A local terminal with SSH access
- The repository cloned locally

---

## 2. AWS RDS — PostgreSQL Database

### 2.1 Create the RDS Instance

1. Open **AWS Console → RDS → Create database**
2. Settings:
   - **Engine**: PostgreSQL 15+
   - **Template**: Free tier (for dev) or Production
   - **DB instance identifier**: `udhyaamos-db`
   - **Master username**: `udhyaam_admin`
   - **Master password**: *(choose a strong password)*
   - **Instance class**: `db.t3.micro` (dev) or `db.t3.small` (prod)
   - **Storage**: 20 GB gp3
   - **Public access**: Yes *(only during initial setup — restrict later)*
3. Under **Additional configuration**:
   - **Initial database name**: `udhyaamos`
4. Click **Create database**

### 2.2 Configure Security Group

1. Go to the RDS instance → **Connectivity & security**
2. Click the **VPC security group**
3. Edit **Inbound rules** → Add:
   | Type       | Port | Source                          |
   |------------|------|---------------------------------|
   | PostgreSQL | 5432 | Your EC2 security group ID      |
4. **Remove** any `0.0.0.0/0` rules once setup is complete

### 2.3 Note Your Connection Details

After the instance is available, note:
```
Endpoint:  udhyaamos-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com
Port:      5432
Database:  udhyaamos
Username:  udhyaam_admin
Password:  (your chosen password)
```

Your `DATABASE_URL` will be:
```
postgresql://udhyaam_admin:YOUR_PASSWORD@udhyaamos-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com:5432/udhyaamos
```

---

## 3. AWS S3 — File Storage

### 3.1 Create the S3 Bucket

1. Open **AWS Console → S3 → Create bucket**
2. Settings:
   - **Bucket name**: `udhyaamos-uploads` (must be globally unique)
   - **Region**: Same as your EC2 (e.g. `us-east-1`)
   - **Block all public access**: Keep **enabled** (the app uses pre-signed URLs)
3. Click **Create bucket**

### 3.2 Create IAM Credentials

1. Go to **IAM → Users → Create user**
   - **User name**: `udhyaamos-backend`
   - **Access type**: Programmatic access
2. Attach the following inline policy (or create a custom one):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::udhyaamos-uploads/*"
       }
     ]
   }
   ```
3. Save the **Access Key ID** and **Secret Access Key**

---

## 4. AWS EC2 — Backend Server

### 4.1 Launch an EC2 Instance

1. Open **AWS Console → EC2 → Launch instance**
2. Settings:
   - **Name**: `udhyaamos-backend`
   - **AMI**: Ubuntu 24.04 LTS (or Amazon Linux 2023)
   - **Instance type**: `t3.small` (recommended) or `t2.micro` (free tier)
   - **Key pair**: Create or select an existing `.pem` key
   - **Network**: Same VPC as your RDS
3. **Security Group** — create a new one with these inbound rules:

   | Type        | Port  | Source      | Purpose           |
   |-------------|-------|-------------|-------------------|
   | SSH         | 22    | Your IP     | SSH access        |
   | HTTP        | 80    | 0.0.0.0/0  | Nginx redirect    |
   | HTTPS       | 443   | 0.0.0.0/0  | Nginx with SSL    |
   | Custom TCP  | 5000  | 0.0.0.0/0  | API (direct, optional) |

4. **Storage**: 20 GB gp3
5. Click **Launch instance**

### 4.2 Allocate an Elastic IP (Recommended)

1. Go to **EC2 → Elastic IPs → Allocate**
2. Associate it with your instance
3. Note the IP (e.g. `3.xx.xx.xx`) — this stays the same after reboots

### 4.3 Connect via SSH

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

### 4.4 Install Docker & Docker Compose

Run these commands on the EC2 instance:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io

# Start Docker and enable on boot
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to the docker group (avoids needing sudo)
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install -y docker-compose-v2

# Log out and back in for group changes to take effect
exit
```

SSH back in and verify:

```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
docker --version
docker compose version
```

---

## 5. Deploy Backend with Docker

### 5.1 Clone the Repository

```bash
git clone https://github.com/rishabhraj027/SUhack_UdhyaamOS.git
cd SUhack_UdhyaamOS
```

### 5.2 Create the Environment File

```bash
cp .env.example backend/.env
nano backend/.env
```

Fill in your **real** values:

```env
# Database — use your RDS endpoint from Step 2
DATABASE_URL=postgresql://udhyaam_admin:YOUR_PASSWORD@udhyaamos-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com:5432/udhyaamos

# JWT — generate a strong random secret
JWT_SECRET=GENERATE_A_64_CHAR_RANDOM_STRING
JWT_EXPIRES_IN=7d

# AWS S3 — from Step 3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=udhyaamos-uploads

# Google OAuth — from Google Cloud Console
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/auth/google/callback

# Server
PORT=5000
NODE_ENV=production

# CORS — your Vercel frontend URL (from Step 6)
FRONTEND_URL=https://your-app.vercel.app
```

> **Tip**: Generate a secure JWT secret:
> ```bash
> openssl rand -hex 32
> ```

### 5.3 Build and Start the Container

```bash
# Build the Docker image and start in detached mode
docker compose up -d --build
```

This will:
1. Build the multi-stage Docker image (deps → build → production)
2. Run `prisma migrate deploy` to apply database migrations
3. Start the Node.js server on port 5000

### 5.4 Verify the Deployment

```bash
# Check container status
docker compose ps

# Check logs
docker compose logs -f api

# Test health endpoint
curl http://localhost:5000/api/health
```

You should see:
```json
{"status":"ok","timestamp":"2026-03-15T..."}
```

### 5.5 Set Up Nginx Reverse Proxy with SSL

Install Nginx and Certbot:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create the Nginx config:

```bash
sudo nano /etc/nginx/sites-available/udhyaamos-api
```

Paste:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your domain

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase body size for file uploads
        client_max_body_size 10M;
    }
}
```

Enable the site and get SSL:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/udhyaamos-api /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Get SSL certificate (your domain must point to this IP first)
sudo certbot --nginx -d api.yourdomain.com
```

Certbot will automatically configure HTTPS and set up auto-renewal.

---

## 6. Vercel — Frontend Deployment

### 6.1 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New → Project**
3. Import the `SUhack_UdhyaamOS` repository
4. Configure the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add the **Environment Variable**:

   | Name           | Value                                      |
   |----------------|--------------------------------------------|
   | `VITE_API_URL` | `https://api.yourdomain.com/api`           |

   > If you don't have a domain yet, use `http://YOUR_EC2_ELASTIC_IP:5000/api`

6. Click **Deploy**

### 6.2 Update Backend CORS

After Vercel deployment, copy the Vercel URL (e.g. `https://udhyaamos.vercel.app`) and update `backend/.env` on your EC2:

```bash
# On EC2
cd ~/SUhack_UdhyaamOS
nano backend/.env
# Set FRONTEND_URL=https://udhyaamos.vercel.app
```

Restart the container:

```bash
docker compose down
docker compose up -d
```

---

## 7. Domain & SSL Setup

### 7.1 DNS Records

If you have a domain (e.g. `yourdomain.com`), add these DNS records:

| Type  | Name  | Value                     | Purpose          |
|-------|-------|---------------------------|------------------|
| A     | api   | YOUR_EC2_ELASTIC_IP       | Backend API      |
| CNAME | app   | cname.vercel-dns.com      | Vercel frontend  |

> Vercel provides the CNAME value in **Project → Settings → Domains**

### 7.2 SSL Certificates

- **Backend (EC2)**: Handled by Certbot/Let's Encrypt (Step 5.5)
- **Frontend (Vercel)**: Automatic — Vercel provides SSL for all deployments

---

## 8. Google OAuth Configuration

After deployment, update your **Google Cloud Console** credentials:

1. Go to **APIs & Services → Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add **Authorized redirect URIs**:
   ```
   https://api.yourdomain.com/api/auth/google/callback
   ```
4. Add **Authorized JavaScript origins**:
   ```
   https://your-app.vercel.app
   https://app.yourdomain.com
   ```
5. Update `GOOGLE_REDIRECT_URI` in `backend/.env` on EC2 to match

---

## 9. Monitoring & Maintenance

### View Logs

```bash
# Live logs
docker compose logs -f api

# Last 100 lines
docker compose logs --tail 100 api
```

### Restart / Rebuild

```bash
# Restart without rebuilding
docker compose restart api

# Pull latest code and rebuild
cd ~/SUhack_UdhyaamOS
git pull origin main
docker compose up -d --build
```

### Health Check

The container has a built-in health check. View status:

```bash
docker compose ps
# STATUS column shows "healthy" or "unhealthy"
```

### Database Migrations

Migrations run automatically on container start (`prisma migrate deploy`). To run manually:

```bash
docker compose exec api npx prisma migrate deploy
```

### Auto-restart on Reboot

The `restart: unless-stopped` policy in `docker-compose.yml` means the container restarts automatically if the EC2 instance reboots. Ensure Docker starts on boot:

```bash
sudo systemctl enable docker
```

### Update Deployment

```bash
cd ~/SUhack_UdhyaamOS
git pull origin main
docker compose up -d --build
```

---

## 10. Troubleshooting

### Container won't start

```bash
# Check logs for errors
docker compose logs api

# Common issues:
# - DATABASE_URL incorrect → check RDS endpoint & credentials
# - Port 5000 already in use → check with: sudo lsof -i :5000
# - Prisma migration failed → check database connectivity
```

### Cannot connect to RDS from EC2

1. Ensure both are in the **same VPC**
2. Check the RDS security group allows inbound from the EC2 security group on port `5432`
3. Test connectivity:
   ```bash
   sudo apt install -y postgresql-client
   psql "postgresql://udhyaam_admin:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/udhyaamos"
   ```

### CORS errors on frontend

1. Verify `FRONTEND_URL` in `backend/.env` matches your Vercel URL exactly (including `https://`, no trailing slash)
2. Restart the container after changes:
   ```bash
   docker compose down && docker compose up -d
   ```

### Google OAuth callback fails

1. Ensure `GOOGLE_REDIRECT_URI` in `backend/.env` matches **exactly** what's in Google Cloud Console
2. The redirect URI must use HTTPS in production
3. After updating `.env`, restart the container

### Out of disk space

```bash
# Clean up old Docker images
docker system prune -af

# Check disk usage
df -h
```

### Container shows "unhealthy"

```bash
# Check if the app is responding
docker compose exec api node -e "require('http').get('http://localhost:5000/api/health',(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(d))}).on('error',console.error)"

# Check logs for errors
docker compose logs --tail 50 api
```

---

## Quick Reference

| Service  | URL                                        | Where            |
|----------|--------------------------------------------|------------------|
| Backend  | `https://api.yourdomain.com`               | AWS EC2 (Docker) |
| Frontend | `https://your-app.vercel.app`              | Vercel           |
| Database | `*.rds.amazonaws.com:5432`                 | AWS RDS          |
| Storage  | `udhyaamos-uploads.s3.amazonaws.com`       | AWS S3           |
| Health   | `https://api.yourdomain.com/api/health`    | EC2 health check |

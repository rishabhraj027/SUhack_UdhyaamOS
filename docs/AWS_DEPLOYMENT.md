# AWS EC2 Deployment Guide

> **Architecture**: Backend (Docker) on AWS EC2 · Frontend on Vercel · Database on AWS RDS · Files on AWS S3

---

## ⚡ Free Tier Quick Fix — "Docker Not Connecting"

> **If Docker fails or hangs on EC2 free tier (t2.micro), the #1 cause is running out of RAM.**  
> t2.micro only has **1 GB RAM**. The multi-stage TypeScript Docker build needs ~1.5 GB.  
> **Fix: Add swap space FIRST before running any Docker command.**

```bash
# SSH into your EC2 instance first, then run ALL of these:

# 1. Add 2 GB swap (critical for t2.micro)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 2. Confirm swap is active
free -h
# Should show: Swap: 2.0Gi

# 3. Now install Docker
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2
sudo systemctl start docker && sudo systemctl enable docker
sudo usermod -aG docker $USER

# 4. Log out and back in (REQUIRED for docker group)
exit
```

SSH back in, then continue from [Step 5](#5-deploy-backend-with-docker).

---

## Common "Not Connecting" Checklist

Before diving in, check these in order:

| # | Check | How to verify |
|---|-------|---------------|
| 1 | **Swap added on EC2** | `free -h` → Swap row should show 2G |
| 2 | **EC2 Security Group has port 5000 open** | AWS Console → EC2 → Security Groups → Inbound rules |
| 3 | **`backend/.env` file exists on EC2** | `ls -la ~/SUhack_UdhyaamOS/backend/.env` |
| 4 | **`FRONTEND_URL` matches Vercel URL exactly** | No trailing slash, must be `https://your-app.vercel.app` |
| 5 | **RDS Security Group allows EC2** | RDS → Security Group → Inbound → PostgreSQL from EC2 SG |
| 6 | **Docker daemon is running** | `sudo systemctl status docker` |

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

### 4.4 Install Docker & Docker Compose (with Swap for Free Tier)

> ⚠️ **Free tier (t2.micro) only has 1 GB RAM.** The Docker build will silently OOM and die.  
> **Always add swap BEFORE running any Docker command.**

Run these commands on the EC2 instance:

```bash
# ── Step A: Add 2 GB swap (REQUIRED on t2.micro / free tier) ──────────────────
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify swap is active (you should see "Swap: 2.0Gi")
free -h

# ── Step B: Install Docker ─────────────────────────────────────────────────────
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2

# Start Docker and enable on boot
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to the docker group (avoids needing sudo)
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
exit
```

SSH back in and verify:

```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
docker --version       # Should print: Docker version 24.x.x
docker compose version # Should print: Docker Compose version v2.x.x
free -h                # Swap row should show 2.0Gi
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
# Create the .env file directly (there is no .env.example — create from scratch)
nano backend/.env
```

Paste the following and **replace every `YOUR_*` value** with your real values:

```env
# ── Database ──────────────────────────────────────────────────────────────────
# Use your RDS endpoint from Step 2
DATABASE_URL=postgresql://udhyaam_admin:YOUR_PASSWORD@udhyaamos-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com:5432/udhyaamos

# ── JWT ───────────────────────────────────────────────────────────────────────
# Generate with: openssl rand -hex 32
JWT_SECRET=PASTE_64_CHAR_RANDOM_STRING_HERE
JWT_EXPIRES_IN=7d

# ── AWS S3 ────────────────────────────────────────────────────────────────────
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=udhyaamos-uploads

# ── Google OAuth ──────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
# If you have a domain:
#   GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/auth/google/callback
# If NO domain (free tier, use EC2 IP directly):
GOOGLE_REDIRECT_URI=http://YOUR_EC2_ELASTIC_IP:5000/api/auth/google/callback

# ── Server ────────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=production

# ── CORS — MUST match your Vercel frontend URL exactly ────────────────────────
# No trailing slash. Get this from Vercel dashboard after deploying frontend.
# Example: https://udhyaamos.vercel.app
FRONTEND_URL=https://YOUR-APP-NAME.vercel.app
```

> **Generate a secure JWT secret:**
> ```bash
> openssl rand -hex 32
> ```

> ⚠️ **CORS will break** if `FRONTEND_URL` has a trailing slash or wrong casing.  
> Copy the URL directly from Vercel → Project → Deployment URL.

### 5.3 Build and Start the Container

> ⚠️ **Free tier (t2.micro):** The build takes 5–10 minutes and uses ~1.5 GB RAM.  
> Make sure swap is active (`free -h` shows Swap: 2.0Gi) or the build will silently OOM.

```bash
# Build the Docker image and start in detached mode
docker compose up -d --build
```

If the build is too slow or runs out of memory on t2.micro, use this alternative — **build locally, push to Docker Hub, pull on EC2**:

```bash
# --- On your LOCAL machine (not EC2) ---
# Login to Docker Hub (free account at hub.docker.com)
docker login

# Build and push from your project root
docker build -f backend/Dockerfile --target production -t YOUR_DOCKERHUB_USERNAME/udhyaamos-backend:latest .
docker push YOUR_DOCKERHUB_USERNAME/udhyaamos-backend:latest

# --- On EC2 ---
# Pull and run (no build required, uses very little RAM)
docker pull YOUR_DOCKERHUB_USERNAME/udhyaamos-backend:latest
docker run -d \
  --name udhyaamos-api \
  --restart unless-stopped \
  --env-file backend/.env \
  -p 5000:5000 \
  YOUR_DOCKERHUB_USERNAME/udhyaamos-backend:latest
```

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
sudo certbot --nginx -d api.yourdomain.com
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
   | `VITE_API_URL` | See options below                          |

   **Option A — No domain (free tier, fastest setup):**
   ```
   VITE_API_URL=http://YOUR_EC2_ELASTIC_IP:5000/api
   ```
   > ⚠️ This uses plain HTTP. Google OAuth won't work without HTTPS.  
   > Port `5000` must be open in EC2 security group (Inbound: Custom TCP 5000 from 0.0.0.0/0).

   **Option B — With a custom domain + SSL (recommended):**
   ```
   VITE_API_URL=https://api.yourdomain.com/api
   ```

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

### ❌ Docker build hangs or OOM-killed (most common on free tier)

```bash
# Check if swap is active
free -h
# If Swap row shows 0, add it:
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Check if a previous build was killed
docker compose ps          # container may not exist
docker ps -a               # look for "Exited" status
docker compose logs api    # check for OOM errors

# Retry the build
docker compose up -d --build
```

### ❌ Container won't start / exits immediately

```bash
# Check logs for the real error message
docker compose logs api

# Common causes and fixes:
# 1. "DATABASE_URL" error → check RDS endpoint in backend/.env
#    Test connection:
sudo apt install -y postgresql-client
psql "$DATABASE_URL"   # $DATABASE_URL from backend/.env

# 2. "Cannot find module" → Prisma issue, try:
docker compose down
docker compose up -d --build --no-cache

# 3. ".env file not found":
ls -la ~/SUhack_UdhyaamOS/backend/.env   # must exist
```

### ❌ Frontend (Vercel) can't reach backend — Network Error / CORS

This is almost always one of three things:

**1. EC2 Security Group port 5000 not open**
```
AWS Console → EC2 → Security Groups → your SG → Inbound rules → Edit
Add: Custom TCP | Port 5000 | Source 0.0.0.0/0
```

**2. FRONTEND_URL in backend/.env is wrong**
```bash
# On EC2:
cat ~/SUhack_UdhyaamOS/backend/.env | grep FRONTEND_URL
# Must be EXACTLY: https://your-app.vercel.app  (no trailing slash)

# Fix it:
nano ~/SUhack_UdhyaamOS/backend/.env
# After saving:
docker compose down && docker compose up -d
```

**3. Vercel VITE_API_URL points to wrong address**
```
Vercel → Project → Settings → Environment Variables
VITE_API_URL = http://YOUR_EC2_ELASTIC_IP:5000/api
Redeploy the Vercel project after changing env vars.
```

### ❌ Cannot SSH to EC2

```bash
# Make sure your .pem key has correct permissions
chmod 400 your-key.pem

# Use the correct username (Ubuntu AMI = "ubuntu", Amazon Linux = "ec2-user")
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP

# Check EC2 Security Group has SSH port 22 open for your IP:
# AWS Console → EC2 → Security Groups → Inbound: SSH | 22 | Your IP
```

### ❌ Cannot connect to RDS from EC2

```bash
# 1. Test from EC2:
sudo apt install -y postgresql-client
psql "postgresql://udhyaam_admin:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/udhyaamos"

# 2. If it hangs/times out → RDS Security Group issue:
#    AWS Console → RDS → your DB → Connectivity → VPC Security Group
#    Edit Inbound → Add: PostgreSQL | 5432 | Source = your EC2 security group ID
#    (NOT 0.0.0.0/0 — use the EC2 SG ID for security)
```

### ❌ Google OAuth callback fails

1. Google OAuth requires HTTPS for redirect URIs in production
2. For free tier without a domain, use `http://` only for testing — Google may block it
3. Add `http://YOUR_EC2_ELASTIC_IP:5000/api/auth/google/callback` to Google Cloud Console → Credentials → Authorized redirect URIs (for testing only)
4. After updating `.env`, always restart: `docker compose down && docker compose up -d`

### ❌ Out of disk space (t2.micro has 8 GB by default)

```bash
# Check disk
df -h

# Clean up old Docker layers (safe — only removes unused images)
docker system prune -af

# EC2 free tier comes with 8 GB. Increase to 20 GB in EC2 → Volumes → Modify volume.
# (Still free tier eligible up to 30 GB)
```

### ❌ Container shows "unhealthy"

```bash
# Test the health endpoint directly
curl http://localhost:5000/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Check logs
docker compose logs --tail 50 api

# Manual health check inside container
docker compose exec api node -e \
  "require('http').get('http://localhost:5000/api/health',(r)=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(d))}).on('error',console.error)"
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

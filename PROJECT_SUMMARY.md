# UdhyaamOS — Detailed Project Summary

## 1. What Is UdhyaamOS?

**UdhyaamOS** is a full-stack web platform built as an *operating system for India's MSMEs* (Micro, Small & Medium Enterprises). It was created for the **SUhack hackathon**.

India has 63 million MSMEs that are digitally underserved — they struggle to hire affordable talent, discover B2B suppliers, and build professional networks. On the other side, millions of students and junior professionals lack real-world project experience and income. UdhyaamOS bridges this gap with three tightly integrated product modules delivered on a single platform.

---

## 2. Core Modules

### 2.1 TalentBridge (Bounty Freelance Marketplace)
A task-bounty system where MSMEs post paid work and JuniorPros bid, negotiate, and deliver.

| Step | What Happens |
|---|---|
| Post | Business creates a bounty with title, description, budget, deadline, required skills, and tags |
| Bid | JuniorPros browse the job board, view their AI-computed match %, and place a bid with a custom price + message |
| Negotiate | Business can make a counter-offer; JuniorPro can accept, reject, or counter back |
| POC | Business can request a Proof-of-Concept sample before committing; JuniorPro submits a link + screenshot |
| Award | Business awards the bounty to one bidder — a private chat room is auto-created |
| Milestones | Business (or JuniorPro) adds sub-tasks with statuses (PENDING → IN_PROGRESS → COMPLETED) |
| Deliver | JuniorPro submits the final project (link + screenshot) |
| Review | Business either approves (→ COMPLETED) or requests a revision (JuniorPro can resubmit) |
| Rating | Business leaves a star rating and comment for the JuniorPro |

**Bounty lifecycle state machine:**
```
OPEN → BIDDING → IN_PROGRESS → REVIEW → [REVISION_REQUESTED →] COMPLETED
```

### 2.2 TradeSync (B2B Marketplace)
A B2B product marketplace for MSMEs to list bulk inventory and negotiate pricing with buyers.

- Sellers list products with category, location, bulk quantity, minimum order, and price per unit
- Buyers start a negotiation with an offer price, quantity, and message
- Sellers accept, reject, or counter; buyers can counter back
- After a deal is closed, either party can leave a review

### 2.3 Udhyaam Network (Social Feed)
A lightweight professional social feed for community building.

- Any user (Business or JuniorPro) can post text content with hashtags
- Posts can be liked (toggle) and replied to
- A trending-tags endpoint surfaces the most active topics
- Users can filter the feed by tag

---

## 3. Platform-Wide Features

| Feature | Details |
|---|---|
| **Dual-role auth** | Register as *Business* or *JuniorPro*; role is set at signup and gates every route |
| **Google OAuth** | One-click sign-in via Google; works alongside email/password auth |
| **JWT sessions** | 7-day tokens; every API call requires `Authorization: Bearer <token>` |
| **File uploads** | Avatars, POC screenshots, and project submissions are stored in AWS S3 |
| **AI Match %** | GPT-4o-mini scores how well a JuniorPro's skills/experience fits a bounty (0–100 %) |
| **AI Best Match** | GPT-4o-mini ranks all bidders on a bounty across skill overlap, price, experience, and profile completeness |
| **Real-time chat** | Per-bounty chat conversation (REST polling); supports text + image messages |
| **Public profiles** | Each user has a public profile page with bio, skills, ratings, and completed project stats |
| **Digital Vault** | Private profile editor — avatar, bio, skills, portfolio URL, business details (CIN, GSTIN) |
| **Private catalog** | Business-only private inventory of items (not publicly visible) |

---

## 4. Tech Stack

### Frontend

| Concern | Technology |
|---|---|
| Framework | React 19 + TypeScript 5 |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| UI components | shadcn/ui (Radix primitives) + lucide-react icons |
| Animation | Framer Motion 12 |
| Global state | Zustand 5 with localStorage persistence |
| Routing | React Router DOM 7 |
| HTTP client | Axios 1.x |

### Backend

| Concern | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 5 |
| Language | TypeScript 5.8 |
| ORM | Prisma 6 |
| Database | PostgreSQL (AWS RDS in production) |
| Auth | JWT + bcrypt + Google OAuth 2.0 |
| File storage | AWS S3 (v3 SDK) |
| AI | OpenAI SDK → GitHub Models endpoint (GPT-4o-mini) |
| Dev server | tsx + nodemon |

### Infrastructure

| Component | Choice |
|---|---|
| Backend containerisation | Docker (multi-stage Dockerfile) |
| Backend hosting | AWS EC2 via docker-compose |
| Frontend hosting | Vercel (static SPA) |
| Database | AWS RDS PostgreSQL |
| Object storage | AWS S3 |
| AI inference | GitHub Models (Azure-hosted) |

---

## 5. Repository Structure

```
SUhack_UdhyaamOS/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Express app entry point, route mounting
│   │   ├── config/
│   │   │   ├── index.ts           # Centralised environment config
│   │   │   └── db.ts              # Singleton PrismaClient
│   │   ├── routes/                # One file per resource (auth, bounties, …)
│   │   ├── controllers/           # Business logic — called by routes
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT validation middleware
│   │   │   └── errorHandler.ts    # Global error handler
│   │   └── services/
│   │       ├── s3.ts              # S3 presigned-upload helper
│   │       └── ai.ts              # GPT-4o-mini match scoring
│   ├── prisma/
│   │   ├── schema.prisma          # Full DB schema
│   │   └── migrations/            # SQL migration history
│   ├── Dockerfile                 # Multi-stage build
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx               # React entry point
│   │   ├── App.tsx                # Router + all route declarations
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx # Role-guarded route wrapper
│   │   │   └── ui/                # shadcn/ui + custom components
│   │   ├── pages/
│   │   │   ├── Login.tsx          # Shared login / register page
│   │   │   ├── LoginSuccess.tsx   # Google OAuth callback handler
│   │   │   ├── business/          # All business-role pages
│   │   │   │   ├── TalentBridge.tsx
│   │   │   │   ├── TradeSync.tsx
│   │   │   │   ├── UdhyaamNetwork.tsx
│   │   │   │   ├── ProjectTimelines.tsx
│   │   │   │   ├── Messages.tsx
│   │   │   │   ├── DigitalVault.tsx
│   │   │   │   └── BusinessProfile.tsx
│   │   │   └── junior-pro/        # All JuniorPro-role pages
│   │   │       ├── JobBoard.tsx
│   │   │       ├── ActiveTasks.tsx
│   │   │       ├── Messages.tsx
│   │   │       ├── DigitalVault.tsx
│   │   │       ├── PublicProfile.tsx
│   │   │       ├── BiddingModal.tsx
│   │   │       └── EditProfileModal.tsx
│   │   ├── layouts/               # Role-specific sidebar layouts
│   │   ├── services/
│   │   │   └── api.ts             # Axios instance + all API functions + TS types
│   │   └── store/                 # Zustand stores
│   │       ├── useAuthStore.ts
│   │       ├── useBountyStore.ts
│   │       ├── useB2BStore.ts
│   │       ├── useCatalogStore.ts
│   │       ├── useChatStore.ts
│   │       └── useSocialStore.ts
│   └── package.json
│
├── docs/
│   ├── SETUP.md                   # Step-by-step local setup guide
│   ├── ARCHITECTURE.md            # System architecture overview
│   ├── API.md                     # API reference
│   ├── AWS_DEPLOYMENT.md          # EC2 + RDS + S3 deployment guide
│   ├── GOOGLE_OAUTH_SETUP.md      # OAuth app creation guide
│   └── FRONTEND_GOOGLE_OAUTH_EXAMPLE.md
│
├── scripts/
│   ├── setup.sh                   # One-command setup for Linux/macOS
│   └── setup.bat                  # One-command setup for Windows
│
├── docker-compose.yml             # Backend container orchestration
├── package.json                   # Monorepo root (npm workspaces)
└── .env.example                   # Template for all environment variables
```

---

## 6. Database Schema

### Enums

| Enum | Values |
|---|---|
| `UserRole` | `Business`, `JuniorPro` |
| `BountyStatus` | `OPEN`, `BIDDING`, `IN_PROGRESS`, `REVIEW`, `REVISION_REQUESTED`, `COMPLETED` |
| `BidPocStatus` | `PENDING`, `ACCEPTED`, `DECLINED`, `SUBMITTED` |
| `MilestoneStatus` | `PENDING`, `IN_PROGRESS`, `COMPLETED` |
| `NegotiationStatus` | `PENDING`, `ACCEPTED`, `REJECTED`, `COUNTERED` |
| `ListingStatus` | `ACTIVE`, `SOLD_OUT`, `PAUSED` |
| `CatalogStatus` | `IN_STOCK`, `OUT_OF_STOCK` |

### Tables

| Table | Purpose |
|---|---|
| `users` | All users — shared + role-specific fields (CIN/GSTIN for Business; skills/score/portfolio for JuniorPro) |
| `bounties` | Freelance task postings: title, budget, deadline, status, tags, submission links |
| `bids` | JuniorPro bids including counter-offer fields and full POC workflow fields |
| `milestones` | Sub-tasks within a bounty (optional, added by either party) |
| `bounty_feedbacks` | Revision requests and final star ratings on a bounty |
| `marketplace_listings` | Public B2B product listings with category, location, quantity, price |
| `negotiations` | Buyer → seller offer with counter-offer JSON; tied to a listing |
| `reviews` | Post-deal rating tied to a closed negotiation |
| `business_catalog` | Private inventory items per business (not visible to buyers) |
| `chat_conversations` | One conversation per bounty; auto-created when bounty is awarded |
| `chat_messages` | Individual messages: text + optional image URL |
| `feed_posts` | Social posts with hashtags and a denormalized `likes_count` |
| `feed_replies` | Replies to feed posts |
| `post_likes` | Composite-PK join table tracking which user liked which post |

---

## 7. API Overview

All endpoints are prefixed `/api`. Authenticated routes require `Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Email + password + role registration |
| POST | `/login` | Email + password login |
| POST | `/google` | Google Sign-In with `idToken` (frontend SDK flow) |
| GET | `/google/init` | Server-side OAuth redirect (append `?role=Business|JuniorPro`) |
| GET | `/google/callback` | OAuth callback — redirects to frontend with JWT |

### Users — `/api/users`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Get own full profile |
| PUT | `/me` | Update profile fields |
| GET | `/:userId/profile` | Public profile + stats + reviews |

### Bounties — `/api/bounties`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Role-filtered list (Business sees own; JuniorPro sees all OPEN/BIDDING) |
| POST | `/` | Create a bounty (Business only) |
| DELETE | `/:id` | Delete bounty when OPEN or BIDDING (Business only) |
| POST | `/:id/bids` | Place a bid (JuniorPro) |
| POST | `/:id/bids/:studentId/counter` | Founder counter-offer |
| PUT | `/:id/bids/:studentId/respond` | JuniorPro responds to counter |
| POST | `/:id/bids/:studentId/poc/request` | Request a POC sample |
| PUT | `/:id/bids/:studentId/poc/respond` | Accept/decline POC request |
| POST | `/:id/bids/:studentId/poc/submit` | Submit POC link + screenshot |
| POST | `/:id/award/:studentId` | Award bounty (auto-creates chat) |
| POST | `/:id/milestones` | Add a milestone |
| PUT | `/:id/milestones/:milestoneId` | Update milestone status |
| POST | `/:id/submit` | Submit final project (JuniorPro) |
| POST | `/:id/revision` | Request revision (Business) |
| POST | `/:id/resubmit` | Resubmit after revision (JuniorPro) |
| POST | `/:id/approve` | Approve + mark COMPLETED (Business) |
| POST | `/:id/review` | Leave star rating + comment |

### Marketplace — `/api/marketplace`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | All active listings |
| POST | `/` | Create a listing |
| DELETE | `/:id` | Delete own listing |

### Negotiations — `/api/negotiations`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | My negotiations as buyer or seller |
| POST | `/` | Start a negotiation |
| PUT | `/:id/respond` | Accept / reject / counter |

### Catalog — `/api/catalog`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Own private catalog items |
| POST | `/` | Add a catalog item |

### Chats — `/api/chats`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | My conversations |
| GET | `/:id/messages` | Messages in a conversation |
| POST | `/:id/messages` | Send a message |

### Feed — `/api/feed`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/trending` | Top trending hashtags |
| GET | `/` | Posts (`?tag=` filter) |
| POST | `/` | Create a post |
| POST | `/:id/like` | Toggle like |
| POST | `/:id/replies` | Reply to a post |
| DELETE | `/:id/replies/:replyId` | Delete own reply |
| DELETE | `/:id` | Delete own post |

### Upload — `/api/upload`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Upload image to S3 (`?folder=avatars|submissions|screenshots|uploads`) → `{ url }` |

### AI — `/api/ai`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/match-percentage` | 0–100 % compatibility score for current user vs. bounty |
| POST | `/best-match` | AI-ranked leaderboard of all bidders for a bounty |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | `{ status: "ok", timestamp }` |

---

## 8. Authentication & Security

- **JWT** (HS256, 7-day expiry) is issued on login/register and validated by `middleware/auth.ts` on every protected route.
- **bcrypt** hashes passwords before storage; plain-text passwords are never stored.
- **Google OAuth 2.0** supports two flows: a frontend-SDK flow (POST `/google` with `idToken`) and a server-side redirect flow (`/google/init` → `/google/callback`).
- **Role-based access control** — every controller checks `req.user.role` and rejects cross-role actions (e.g., a JuniorPro cannot create a bounty).
- **CORS** is configured to allow only `FRONTEND_URL`.
- File uploads are validated for type and size before being sent to S3.

---

## 9. AI Features

Both AI endpoints are powered by **GPT-4o-mini** accessed via the **GitHub Models** endpoint (`https://models.inference.ai.azure.com`) using the OpenAI SDK. A `GITHUB_TOKEN` (personal access token with GitHub Models access) is required.

**Match Percentage** (`POST /api/ai/match-percentage`)
- Input: JuniorPro's skills, rating, completed project count + bounty's title, description, required skills
- Output: a single integer 0–100 representing compatibility

**Best Match Ranking** (`POST /api/ai/best-match`)
- Input: bounty details + all bidders' profiles and bids
- Output: bidders ranked by a composite AI score across skill overlap, price competitiveness, experience, and profile completeness

---

## 10. State Management (Frontend)

| Zustand Store | Manages |
|---|---|
| `useAuthStore` | Logged-in user object, JWT token, login/logout actions |
| `useBountyStore` | Bounty list, active bounty detail, bids, milestones |
| `useB2BStore` | Marketplace listings and negotiations |
| `useCatalogStore` | Business private catalog items |
| `useChatStore` | Conversations and messages |
| `useSocialStore` | Feed posts, replies, trending tags |

All stores use Zustand's `persist` middleware to survive page refreshes via `localStorage`.

---

## 11. User Flows

### Business (MSME) Flow
```
Register as Business
  ├─ TalentBridge  → post bounty → review bids → counter / request POC → award → track milestones → approve / revise → rate
  ├─ TradeSync     → list products → respond to buyer negotiations
  ├─ Catalog       → maintain private inventory
  ├─ Messages      → chat with awarded JuniorPros
  ├─ Udhyaam Net.  → post updates, like, reply
  └─ Digital Vault → edit profile, business details (CIN, GSTIN), avatar
```

### JuniorPro (Student / Freelancer) Flow
```
Register as JuniorPro
  ├─ Job Board    → browse bounties → view AI match % → bid → negotiate → submit POC
  ├─ Active Tasks → track milestones → submit project → resubmit after revision
  ├─ Messages     → chat with founder per bounty
  └─ Digital Vault → edit skills, portfolio URL, bio, avatar
```

---

## 12. Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"

# JWT
JWT_SECRET="your-64-char-secret"
JWT_EXPIRES_IN="7d"

# AWS
AWS_ACCESS_KEY_ID="your-key-id"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="ap-south-1"
AWS_S3_BUCKET_NAME="your-bucket-name"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/auth/google/callback"

# GitHub Models (AI)
GITHUB_TOKEN="github_pat_your_token"

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 13. Local Development Setup

```bash
# 1. Clone and install all dependencies (monorepo)
git clone <repo-url>
cd SUhack_UdhyaamOS
npm run install:all

# 2. Configure environment
cp .env.example backend/.env
# Edit backend/.env with your credentials

# 3. Run database migrations
npm run migrate

# 4. Start both servers concurrently
npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:5000
# Health   → http://localhost:5000/api/health
```

Useful database commands (run from `backend/`):

```bash
npx prisma migrate dev      # Apply migrations in dev
npx prisma migrate deploy   # Apply migrations in production
npx prisma generate         # Re-generate Prisma client
npx prisma studio           # Open database browser UI
```

---

## 14. Deployment

### Backend — AWS EC2 + Docker

The backend ships as a multi-stage Docker image:

```
Stage 1 (deps)        – install production dependencies
Stage 2 (builder)     – compile TypeScript
Stage 3 (production)  – minimal Node.js image with compiled output
```

```bash
# From project root
docker-compose up -d
```

The Docker context is the monorepo root so that npm workspaces resolve correctly.

### Frontend — Vercel

The frontend is a static SPA deployed to Vercel:

```bash
cd frontend
npm run build   # outputs to frontend/dist/
```

Point Vercel to the `frontend/` directory and set `VITE_API_URL` to the EC2 backend URL.

### Database — AWS RDS PostgreSQL

Use `npx prisma migrate deploy` (from the backend container or a migration job) to apply schema changes in production.

### File Storage — AWS S3

Create an S3 bucket in `ap-south-1` (or your preferred region) and grant the IAM user `s3:PutObject` permission on that bucket. Set the bucket name and credentials in `backend/.env`.

---

## 15. Documentation Index

| File | Contents |
|---|---|
| `README.md` | Project overview, quick-start, API reference, schema, user flows |
| `docs/SETUP.md` | Detailed local setup walkthrough |
| `docs/ARCHITECTURE.md` | Architecture diagram and component descriptions |
| `docs/API.md` | Full API endpoint reference |
| `docs/AWS_DEPLOYMENT.md` | Step-by-step EC2 + RDS + S3 deployment guide |
| `docs/GOOGLE_OAUTH_SETUP.md` | How to create and configure the Google OAuth app |
| `docs/FRONTEND_GOOGLE_OAUTH_EXAMPLE.md` | Frontend code example for Google Sign-In |
| `PROJECT_SUMMARY.md` | This file — consolidated project summary |

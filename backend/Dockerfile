# ── Stage 1: Install dependencies ──────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

# Copy root package files for npm workspace resolution
COPY package.json package-lock.json ./

# Copy backend package.json
COPY backend/package.json ./backend/

# Create a stub frontend package.json so npm workspaces doesn't error
RUN mkdir -p frontend && echo '{"name":"frontend","version":"1.0.0","private":true}' > frontend/package.json

# Install ALL dependencies (dev deps needed for prisma generate & tsc build)
RUN npm install

# Copy Prisma schema and generate the client
COPY backend/prisma ./backend/prisma
WORKDIR /app/backend
RUN npx prisma generate

# ── Stage 2: Build TypeScript → JavaScript ────────────────────────────────────
FROM deps AS builder

WORKDIR /app

# Copy backend source and TypeScript config
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/

# Compile TypeScript to dist/
WORKDIR /app/backend
RUN npx tsc

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install OpenSSL (required by Prisma at runtime)
RUN apk add --no-cache openssl

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy backend package.json
COPY backend/package.json ./backend/

# Create a stub frontend package.json for workspace resolution
RUN mkdir -p frontend && echo '{"name":"frontend","version":"1.0.0","private":true}' > frontend/package.json

# Install production-only dependencies
RUN npm install --omit=dev

# Copy generated Prisma client and schema/migrations from deps stage
COPY --from=deps /app/backend/node_modules/.prisma ./backend/node_modules/.prisma
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY backend/prisma ./backend/prisma

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/backend/dist ./backend/dist

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Run migrations then start the compiled server
WORKDIR /app/backend
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

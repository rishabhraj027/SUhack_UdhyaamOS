-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Business', 'JuniorPro');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "bio" TEXT,
    "website" TEXT,
    "portfolio_url" TEXT,
    "banner_color" TEXT,
    "wallet_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "score" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cin" TEXT,
    "gstin" TEXT,
    "year_established" TEXT,
    "industry" TEXT,
    "official_email" TEXT,
    "contact_phone" TEXT,
    "address" TEXT,
    "company_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateEnum
CREATE TYPE "CatalogStatus" AS ENUM ('IN_STOCK', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD_OUT', 'PAUSED');

-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED');

-- CreateTable
CREATE TABLE "business_catalog" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "bulk_quantity" TEXT NOT NULL,
    "price_per_unit" DECIMAL(65,30) NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'IN_STOCK',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_listings" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'Other',
    "location" TEXT NOT NULL DEFAULT '',
    "bulk_quantity" TEXT NOT NULL,
    "min_order_qty" TEXT NOT NULL DEFAULT '1',
    "price_per_unit" DECIMAL(65,30) NOT NULL,
    "seller_contact_config" JSONB,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiations" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "from_buyer_id" TEXT NOT NULL,
    "to_seller_id" TEXT NOT NULL,
    "original_price" DECIMAL(65,30) NOT NULL,
    "offer_price" DECIMAL(65,30) NOT NULL,
    "quantity" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "status" "NegotiationStatus" NOT NULL DEFAULT 'PENDING',
    "counter_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negotiations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "business_catalog" ADD CONSTRAINT "business_catalog_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_from_buyer_id_fkey" FOREIGN KEY ("from_buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_to_seller_id_fkey" FOREIGN KEY ("to_seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

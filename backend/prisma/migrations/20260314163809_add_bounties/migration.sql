-- CreateEnum
CREATE TYPE "BountyStatus" AS ENUM ('OPEN', 'BIDDING', 'IN_PROGRESS', 'REVIEW', 'REVISION_REQUESTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BidPocStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "bounties" (
    "id" TEXT NOT NULL,
    "founder_id" TEXT NOT NULL,
    "claimed_by_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Miscellaneous',
    "price" DECIMAL(12,2) NOT NULL,
    "deadline" TIMESTAMP(3),
    "status" "BountyStatus" NOT NULL DEFAULT 'OPEN',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "submission_link" TEXT,
    "submission_screenshot_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bounties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "bounty_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "bidPrice" DECIMAL(12,2) NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "counter_offer_price" DECIMAL(12,2),
    "counter_offer_message" TEXT,
    "poc_requested" BOOLEAN NOT NULL DEFAULT false,
    "poc_status" "BidPocStatus",
    "poc_submission_link" TEXT,
    "poc_submission_screenshot_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "bounty_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bounty_feedbacks" (
    "id" TEXT NOT NULL,
    "bounty_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "screenshot_url" TEXT,
    "rating" DECIMAL(2,1),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bounty_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bids_bounty_id_student_id_key" ON "bids"("bounty_id", "student_id");

-- AddForeignKey
ALTER TABLE "bounties" ADD CONSTRAINT "bounties_founder_id_fkey" FOREIGN KEY ("founder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounties" ADD CONSTRAINT "bounties_claimed_by_id_fkey" FOREIGN KEY ("claimed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_bounty_id_fkey" FOREIGN KEY ("bounty_id") REFERENCES "bounties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_bounty_id_fkey" FOREIGN KEY ("bounty_id") REFERENCES "bounties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounty_feedbacks" ADD CONSTRAINT "bounty_feedbacks_bounty_id_fkey" FOREIGN KEY ("bounty_id") REFERENCES "bounties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounty_feedbacks" ADD CONSTRAINT "bounty_feedbacks_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

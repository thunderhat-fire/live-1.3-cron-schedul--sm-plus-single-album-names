/*
  Warnings:

  - A unique constraint covering the columns `[isrc]` on the table `Track` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_nftId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropIndex
DROP INDEX "NFT_isRadioEligible_idx";

-- DropIndex
DROP INDEX "NFT_lastRadioPlay_idx";

-- DropIndex
DROP INDEX "NFT_totalPressings_idx";

-- DropIndex
DROP INDEX "NFT_userId_idx";

-- AlterTable
ALTER TABLE "NFT" ADD COLUMN     "brevoListId" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "artistStripeAccountId" TEXT,
ADD COLUMN     "buyerCity" TEXT,
ADD COLUMN     "buyerCountry" TEXT,
ADD COLUMN     "buyerIP" TEXT,
ADD COLUMN     "capturedAt" TIMESTAMP(3),
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "isPresaleOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "platformFeeAmount" DOUBLE PRECISION,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingCountry" TEXT,
ADD COLUMN     "shippingPostcode" TEXT,
ADD COLUMN     "transferAmount" DOUBLE PRECISION,
ADD COLUMN     "transferId" TEXT,
ADD COLUMN     "transferStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "transferredAt" TIMESTAMP(3),
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "isrc" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeConnectAccountId" TEXT,
ADD COLUMN     "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeOnboardingUrl" TEXT,
ADD COLUMN     "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeTosAcceptance" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PlayerEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "nftId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "playPosition" INTEGER NOT NULL,
    "trackDuration" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptureAttempt" (
    "id" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "successfulCaptures" INTEGER NOT NULL DEFAULT 0,
    "failedCaptures" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CaptureAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapturedPayment" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapturedPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresaleThreshold" (
    "id" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "targetOrders" INTEGER NOT NULL,
    "currentOrders" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresaleThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerEvent_userId_idx" ON "PlayerEvent"("userId");

-- CreateIndex
CREATE INDEX "PlayerEvent_nftId_idx" ON "PlayerEvent"("nftId");

-- CreateIndex
CREATE INDEX "PlayerEvent_eventType_idx" ON "PlayerEvent"("eventType");

-- CreateIndex
CREATE INDEX "PlayerEvent_sessionId_idx" ON "PlayerEvent"("sessionId");

-- CreateIndex
CREATE INDEX "PlayerEvent_createdAt_idx" ON "PlayerEvent"("createdAt");

-- CreateIndex
CREATE INDEX "CaptureAttempt_nftId_idx" ON "CaptureAttempt"("nftId");

-- CreateIndex
CREATE INDEX "CaptureAttempt_status_idx" ON "CaptureAttempt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CapturedPayment_paymentIntentId_key" ON "CapturedPayment"("paymentIntentId");

-- CreateIndex
CREATE INDEX "CapturedPayment_nftId_idx" ON "CapturedPayment"("nftId");

-- CreateIndex
CREATE INDEX "CapturedPayment_status_idx" ON "CapturedPayment"("status");

-- CreateIndex
CREATE INDEX "CapturedPayment_paymentIntentId_idx" ON "CapturedPayment"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "PresaleThreshold_nftId_key" ON "PresaleThreshold"("nftId");

-- CreateIndex
CREATE INDEX "PresaleThreshold_nftId_idx" ON "PresaleThreshold"("nftId");

-- CreateIndex
CREATE INDEX "PresaleThreshold_status_idx" ON "PresaleThreshold"("status");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_isPresaleOrder_idx" ON "Order"("isPresaleOrder");

-- CreateIndex
CREATE INDEX "Order_buyerCountry_idx" ON "Order"("buyerCountry");

-- CreateIndex
CREATE INDEX "Order_transferStatus_idx" ON "Order"("transferStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Track_isrc_key" ON "Track"("isrc");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerEvent" ADD CONSTRAINT "PlayerEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerEvent" ADD CONSTRAINT "PlayerEvent_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaptureAttempt" ADD CONSTRAINT "CaptureAttempt_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapturedPayment" ADD CONSTRAINT "CapturedPayment_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresaleThreshold" ADD CONSTRAINT "PresaleThreshold_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

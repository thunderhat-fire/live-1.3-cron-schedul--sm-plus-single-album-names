-- CreateTable
CREATE TABLE "PayAsYouGoPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PayAsYouGoPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayAsYouGoPayment_paymentIntentId_key" ON "PayAsYouGoPayment"("paymentIntentId");

-- CreateIndex
CREATE INDEX "PayAsYouGoPayment_userId_idx" ON "PayAsYouGoPayment"("userId");

-- CreateIndex
CREATE INDEX "PayAsYouGoPayment_status_idx" ON "PayAsYouGoPayment"("status");

-- CreateIndex
CREATE INDEX "PayAsYouGoPayment_paymentIntentId_idx" ON "PayAsYouGoPayment"("paymentIntentId");

-- AddForeignKey
ALTER TABLE "PayAsYouGoPayment" ADD CONSTRAINT "PayAsYouGoPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DigitalDownloadRoyalty" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalDownloadRoyalty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DigitalDownloadRoyalty_userId_idx" ON "DigitalDownloadRoyalty"("userId");

-- CreateIndex
CREATE INDEX "DigitalDownloadRoyalty_nftId_idx" ON "DigitalDownloadRoyalty"("nftId");

-- AddForeignKey
ALTER TABLE "DigitalDownloadRoyalty" ADD CONSTRAINT "DigitalDownloadRoyalty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalDownloadRoyalty" ADD CONSTRAINT "DigitalDownloadRoyalty_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

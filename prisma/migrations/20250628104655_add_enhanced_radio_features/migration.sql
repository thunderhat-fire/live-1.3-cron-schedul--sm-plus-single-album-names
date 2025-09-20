-- AlterTable
ALTER TABLE "RadioStream" ADD COLUMN     "currentTrackIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentTrackStartTime" TIMESTAMP(3),
ADD COLUMN     "peakListeners" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalListeners" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPlayTime" INTEGER NOT NULL DEFAULT 0;

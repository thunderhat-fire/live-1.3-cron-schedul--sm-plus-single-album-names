-- AlterTable
ALTER TABLE "PlaylistTrack" ADD COLUMN     "isAd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ttsAudioUrl" TEXT;

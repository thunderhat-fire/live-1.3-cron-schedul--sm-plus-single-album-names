-- AlterTable
ALTER TABLE "NFT" ADD COLUMN     "isRadioEligible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastRadioPlay" TIMESTAMP(3),
ADD COLUMN     "radioPlayCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "radioSampleEnd" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "radioSampleStart" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "albumsSentToFans" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RadioStream" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "currentPlaylistId" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "youtubeStreamId" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadioStream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "trackCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "radioStreamId" TEXT,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "ttsAudioId" TEXT,
    "sampleStart" INTEGER NOT NULL DEFAULT 0,
    "sampleEnd" INTEGER NOT NULL DEFAULT 30,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TTSAudio" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TTSAudio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RadioStream_status_idx" ON "RadioStream"("status");

-- CreateIndex
CREATE INDEX "RadioStream_isLive_idx" ON "RadioStream"("isLive");

-- CreateIndex
CREATE INDEX "Playlist_status_idx" ON "Playlist"("status");

-- CreateIndex
CREATE INDEX "Playlist_radioStreamId_idx" ON "Playlist"("radioStreamId");

-- CreateIndex
CREATE INDEX "PlaylistTrack_playlistId_idx" ON "PlaylistTrack"("playlistId");

-- CreateIndex
CREATE INDEX "PlaylistTrack_nftId_idx" ON "PlaylistTrack"("nftId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistTrack_playlistId_position_key" ON "PlaylistTrack"("playlistId", "position");

-- CreateIndex
CREATE INDEX "TTSAudio_status_idx" ON "TTSAudio"("status");

-- CreateIndex
CREATE INDEX "TTSAudio_voiceId_idx" ON "TTSAudio"("voiceId");

-- CreateIndex
CREATE INDEX "NFT_isRadioEligible_idx" ON "NFT"("isRadioEligible");

-- CreateIndex
CREATE INDEX "NFT_lastRadioPlay_idx" ON "NFT"("lastRadioPlay");

-- AddForeignKey
ALTER TABLE "RadioStream" ADD CONSTRAINT "RadioStream_currentPlaylistId_fkey" FOREIGN KEY ("currentPlaylistId") REFERENCES "Playlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_radioStreamId_fkey" FOREIGN KEY ("radioStreamId") REFERENCES "RadioStream"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_ttsAudioId_fkey" FOREIGN KEY ("ttsAudioId") REFERENCES "TTSAudio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

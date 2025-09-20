-- Drop existing columns if they exist
ALTER TABLE "User" DROP COLUMN IF EXISTS "recordLabel";
ALTER TABLE "User" DROP COLUMN IF EXISTS "recordLabelImage";

-- Add record label fields to User table with proper type
ALTER TABLE "User" ADD COLUMN "recordLabel" VARCHAR(255);
ALTER TABLE "User" ADD COLUMN "recordLabelImage" VARCHAR(255); 
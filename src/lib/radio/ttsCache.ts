import { prisma } from '@/lib/prisma';
import { generateTTSAdAndSave } from '@/lib/tts/elevenlabs';
import crypto from 'crypto';

interface CachedTTS {
  id: string;
  text: string;
  audioUrl: string;
  duration: number;
  voiceId: string;
  type: 'ad' | 'intro';
  textHash: string;
}

export class TTSCache {
  private static instance: TTSCache;
  // If you have pre-generated ad MP3s in public/tts-ads you can list them here.
  private staticAdUrls: string[] = [
    '/tts-ads/ad-1.mp3',
    '/tts-ads/ad-2.mp3',
  ];

  // Text variants kept only for future ElevenLabs regeneration. They are ignored when static ads exist.
  private genericAds: string[] = [];

  public static getInstance(): TTSCache {
    if (!TTSCache.instance) {
      TTSCache.instance = new TTSCache();
    }
    return TTSCache.instance;
  }

  /**
   * Generate a hash for text content to use as cache key
   */
  private generateTextHash(text: string, voiceId: string): string {
    return crypto.createHash('md5').update(`${text}:${voiceId}`).digest('hex');
  }

  /**
   * Get cached TTS audio or generate if not exists
   */
  async getTTSAudio(text: string, type: 'ad' | 'intro', voiceId: string = 'EXAVITQu4vr4xnSDxMaL'): Promise<string> {
    const textHash = this.generateTextHash(text, voiceId);

    // Check if we have this TTS cached in database
    const cachedTTS = await prisma.tTSAudio.findFirst({
      where: {
        text: text,
        voiceId: voiceId,
        status: 'completed'
      }
    });

    if (cachedTTS && cachedTTS.audioUrl) {
      console.log(`TTSCache: Using cached audio for ${type}:`, text.substring(0, 50) + '...');
      return cachedTTS.audioUrl;
    }

    // Generate new TTS audio
    console.log(`TTSCache: Generating new ${type} TTS:`, text.substring(0, 50) + '...');
    try {
      const audioUrl = await generateTTSAdAndSave(text, voiceId);
      
      // Store in database for future use
      await prisma.tTSAudio.create({
        data: {
          text: text,
          voiceId: voiceId,
          audioUrl: audioUrl,
          duration: Math.ceil(text.length / 150), // Approximate duration
          status: 'completed'
        }
      });

      return audioUrl;
    } catch (error) {
      console.error(`TTSCache: Failed to generate ${type} TTS:`, error);
      throw error;
    }
  }

  /**
   * Pre-generate all generic ads and store them
   */
  async preGenerateGenericAds(voiceId: string = 'EXAVITQu4vr4xnSDxMaL'): Promise<void> {
    console.log('TTSCache: Pre-generating generic ads...');
    
    for (let i = 0; i < this.genericAds.length; i++) {
      const adText = this.genericAds[i];
      try {
        await this.getTTSAudio(adText, 'ad', voiceId);
        console.log(`TTSCache: Pre-generated ad ${i + 1}/${this.genericAds.length}`);
      } catch (error) {
        console.error(`TTSCache: Failed to pre-generate ad ${i + 1}:`, error);
      }
    }
    
    console.log('TTSCache: Finished pre-generating generic ads');
  }

  /**
   * Get a random generic ad (cached)
   */
  async getRandomGenericAd(_voiceId: string = 'noop'): Promise<string> {
    // Prefer static ads if present
    if (this.staticAdUrls.length) {
      const url = this.staticAdUrls[Math.floor(Math.random() * this.staticAdUrls.length)];
      console.log('TTSCache: Serving static ad', url);
      return url;
    }

    // Fallback to dynamic generation if static list empty
    const randomAd = this.genericAds[Math.floor(Math.random() * this.genericAds.length)];
    return await this.getTTSAudio(randomAd, 'ad', _voiceId);
  }

  /**
   * Generate track intro text (same logic as before)
   */
  private generateTrackIntroText(track: { name: string; artist: string; genre: string; recordLabel: string }): string {
    const templates = [
      `Up next on VinylFunders Radio, ${track.name} by ${track.artist}. This ${track.genre} masterpiece is available for vinyl presale. Support independent music!`,
      `You're listening to ${track.name} from ${track.artist}. This incredible ${track.genre} album from ${track.recordLabel} is ready for vinyl pressing. Get your copy on VinylFunders!`,
      `Coming up, ${track.name} by ${track.artist}. This ${track.genre} gem is available for presale now. Visit VinylFunders to secure your vinyl copy!`,
      `Now featuring ${track.name} from ${track.artist}. This ${track.genre} album from ${track.recordLabel} is available for vinyl presale. Support the artist today!`,
      `Next on the air, ${track.name} by ${track.artist}. This ${track.genre} masterpiece is ready for vinyl. Pre-order on VinylFunders and own the music!`,
      `You're about to hear ${track.name} from ${track.artist}. This ${track.genre} album from ${track.recordLabel} is available for presale. Get it on vinyl!`,
      `Coming through your speakers, ${track.name} by ${track.artist}. This ${track.genre} gem is available for vinyl presale. Support independent artists on VinylFunders!`,
      `Up next, ${track.name} from ${track.artist}. This ${track.genre} masterpiece from ${track.recordLabel} is ready for vinyl pressing. Pre-order now!`,
      `You're listening to ${track.name} by ${track.artist}. This ${track.genre} album is available for presale. Visit VinylFunders to get your vinyl copy!`,
      `Now playing, ${track.name} from ${track.artist}. This ${track.genre} gem from ${track.recordLabel} is available for vinyl presale. Support the music!`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Get cached track intro or generate if not exists
   */
  async getTrackIntro(track: { name: string; artist: string; genre: string; recordLabel: string }, voiceId: string = 'EXAVITQu4vr4xnSDxMaL'): Promise<string> {
    const introText = this.generateTrackIntroText(track);
    return await this.getTTSAudio(introText, 'intro', voiceId);
  }

  /**
   * Clean up old cached TTS files (older than 30 days)
   */
  async cleanupOldCache(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const deletedCount = await prisma.tTSAudio.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          status: 'completed'
        }
      });

      console.log(`TTSCache: Cleaned up ${deletedCount.count} old TTS cache entries`);
    } catch (error) {
      console.error('TTSCache: Error cleaning up old cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ totalCached: number; ads: number; intros: number }> {
    const totalCached = await prisma.tTSAudio.count({
      where: { status: 'completed' }
    });

    const ads = await prisma.tTSAudio.count({
      where: {
        status: 'completed',
        text: { in: this.genericAds }
      }
    });

    const intros = totalCached - ads;

    return { totalCached, ads, intros };
  }
} 
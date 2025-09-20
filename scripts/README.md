# YouTube Streaming Service

A standalone service that automatically streams your VinylFunders music to YouTube Live with album art, QR codes, and ElevenLabs TTS announcements.

## Features

- **Auto-playlist generation** from your database
- **ElevenLabs TTS announcements** for track intros and ads
- **Album art + QR code overlays** for each track
- **Automatic monitoring** for new albums
- **Continuous streaming** to YouTube Live

## Setup

### 1. YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create a service account and download credentials JSON
5. Set environment variables:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

### 2. ElevenLabs TTS Setup

1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Get your API key from the dashboard
3. Set environment variable:
   ```bash
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

**Available Voices:**
- Rachel (default): `21m00Tcm4TlvDq8ikWAM`
- Domi: `AZnzlk1XvdvUeBnXmlld`
- Bella: `EXAVITQu4vr4xnSDxMaL`
- And many more...

### 3. FFmpeg Installation

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**Render:**
- FFmpeg is pre-installed on Render

## Environment Variables

```bash
# Required
DATABASE_URL=your_database_url
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
YOUTUBE_API_KEY=your_youtube_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
NEXT_PUBLIC_APP_URL=https://your-app-url.com

# Optional
GOOGLE_CLOUD_PROJECT_ID=your_project_id
```

## Local Development

```bash
# Install dependencies
npm install

# Run the service
node scripts/youtube-stream-service.js
```

## Render Deployment

1. Push your code to GitHub
2. Connect your repository to Render
3. Create a new **Worker Service**
4. Set the environment variables
5. Deploy

The service will automatically:
- Start streaming when deployed
- Monitor for new albums every 5 minutes
- Update playlist every 30 minutes
- Generate video with album art and QR codes
- Stream to YouTube Live with ElevenLabs TTS

## Service Architecture

```
YouTubeStreamService
├── Database Monitor (checks for new albums)
├── Playlist Manager (generates playlists with TTS)
├── Video Generator (creates video with album art + QR)
├── ElevenLabs TTS Service (generates audio announcements)
└── YouTube API (manages live broadcasts)
```

## File Structure

```
scripts/
├── youtube-stream-service.js    # Main service
├── tts-service.js              # ElevenLabs TTS service
└── README.md                   # This file
```

## Troubleshooting

### Common Issues

1. **YouTube API Quota Exceeded**
   - Check your Google Cloud Console quotas
   - Consider upgrading your plan

2. **ElevenLabs API Issues**
   - Verify your API key is correct
   - Check your ElevenLabs account balance
   - Ensure you have enough characters remaining

3. **FFmpeg Not Found**
   - Ensure FFmpeg is installed and in PATH
   - On Render, FFmpeg should be pre-installed

4. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check database permissions

### Logs

The service logs all activities:
- Playlist updates
- Stream status
- TTS generation
- YouTube API calls

Check Render logs for debugging.

## Customization

### Modify Playlist Logic
Edit `updatePlaylist()` in `youtube-stream-service.js`

### Change TTS Voice
Modify voice options in `tts-service.js`:
```javascript
const audioPath = await this.ttsService.generateTTSAudio(text, {
  voiceId: '21m00Tcm4TlvDq8ikWAM', // Change this
  stability: 0.5,
  similarityBoost: 0.75
});
```

### Adjust Video Layout
Update `generateTrackVideo()` and `generateTTSVideo()`

### Change Monitoring Frequency
Modify cron schedules in `startMonitoring()`

## ElevenLabs Voice Settings

- **Stability** (0-1): Higher = more consistent voice
- **Similarity Boost** (0-1): Higher = more similar to original voice
- **Voice ID**: Unique identifier for each voice

Popular voices for radio:
- Rachel: Professional, clear
- Domi: Energetic, engaging
- Bella: Warm, friendly 
# YouTube Live Streaming Setup Guide

## Prerequisites

1. **YouTube Channel Requirements**:
   - Channel must be verified with a phone number
   - No live streaming restrictions in past 90 days
   - Channel must have more than 50 subscribers OR be verified with a phone number

2. **Google Cloud Project Setup**:
   - Create a Google Cloud Project
   - Enable YouTube Data API v3
   - Enable YouTube Live Streaming API
   - Create OAuth 2.0 credentials

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable APIs:
   - YouTube Data API v3
   - YouTube Live Streaming API

## Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/youtube/callback`
   - `https://your-domain.com/api/youtube/callback`
5. Download the JSON file

## Step 3: Environment Variables

Add these to your `.env` file:

```env
# YouTube API Configuration
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REFRESH_TOKEN=your_refresh_token_here
YOUTUBE_CHANNEL_ID=your_channel_id_here

# Optional: YouTube streaming configuration
YOUTUBE_STREAM_TITLE="VinylFunders Radio - Live Independent Music"
YOUTUBE_STREAM_DESCRIPTION="24/7 streaming of independent music from VinylFunders. Discover new artists and support the vinyl revival!"
YOUTUBE_PRIVACY_STATUS=public
```

## Step 4: Get Refresh Token

Run the setup script to get your refresh token:

```bash
node scripts/youtube-setup.js
```

This will:
1. Open a browser for OAuth authentication
2. Get your refresh token
3. Test the connection
4. Display your channel information

## Step 5: Test Live Streaming

Once configured, test the streaming:

1. Go to `/admin/radio/live-stream`
2. Enable "YouTube Live Streaming"
3. Configure stream settings
4. Click "Start Stream"

## FFmpeg Requirements

Make sure FFmpeg is installed:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

## Stream Output Format

The system will generate:
- 1920x1080 video with album artwork
- QR codes linking to NFT pages
- Track information overlay
- Smooth transitions between tracks

## Troubleshooting

### Common Issues:

1. **"Live streaming not available"**:
   - Verify your channel meets YouTube requirements
   - Check for any strikes or restrictions

2. **"OAuth token expired"**:
   - Re-run the setup script to get a new refresh token

3. **"FFmpeg not found"**:
   - Install FFmpeg and ensure it's in your PATH

4. **"Stream not appearing"**:
   - Check YouTube Studio → Content → Live
   - Verify stream status in admin panel

### Debug Commands:

```bash
# Test YouTube API connection
curl -X GET "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=YOUR_ACCESS_TOKEN"

# Check FFmpeg installation
ffmpeg -version

# Test local streaming
ffmpeg -f lavfi -i testsrc=duration=10:size=1920x1080:rate=30 -f flv rtmp://your-stream-url
```

## Security Notes

- Keep your OAuth credentials secure
- Use environment variables, never commit credentials
- Regularly rotate your refresh tokens
- Monitor your API usage quotas

## Advanced Configuration

### Custom Stream Overlays

Modify the video generation in `src/lib/radio/liveStreamService.ts`:

```typescript
// Customize album art size
const albumSize = Math.min(width, height) * 0.6;

// Customize QR code position
const qrSize = albumSize * 0.3;

// Customize text styling
const textColor = '#ffffff';
const fontSize = 24;
```

### Stream Quality Settings

In the admin panel, configure:
- Resolution: 720p, 1080p, or 4K
- Bitrate: 1500k-6000k (depending on resolution)
- Frame rate: 30fps or 60fps
- Audio bitrate: 128k or 256k

### Automated Scheduling

Set up automated streaming with cron jobs:

```javascript
// Start stream at 8 AM daily
cron.schedule('0 8 * * *', async () => {
  await startAutomatedStream();
});

// Stop stream at 2 AM daily
cron.schedule('0 2 * * *', async () => {
  await stopAutomatedStream();
});
```


# 🤖 Social Media Automation Setup

Automated daily posting of VinylFunders presales to social media platforms.

## 🔧 Environment Variables

Add these to your `.env` file:

### Facebook Integration
```bash
# Facebook Page Access Token (required)
FACEBOOK_PAGE_ACCESS_TOKEN=your_facebook_page_access_token_here

# Facebook Page ID (required)
FACEBOOK_PAGE_ID=your_facebook_page_id_here
```

### Future Platforms (Coming Soon)
```bash
# Twitter/X API (not yet implemented)
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret

# Instagram API (not yet implemented)
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
```

## 📋 Facebook Setup Steps

### 1. Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Pages" permission
4. Get your app ID and app secret

### 2. Get Page Access Token
1. Go to Graph API Explorer
2. Select your app
3. Get User Access Token with `pages_manage_posts` permission
4. Use this to get a Page Access Token:
   ```bash
   curl "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_USER_TOKEN"
   ```
5. Copy the `access_token` for your page

### 3. Get Page ID
1. Go to your Facebook page
2. Click "About"
3. Scroll down to find "Page ID"
4. Or use Graph API: `https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_USER_TOKEN`

## 🕘 Cron Job Setup

### Option 1: Daily Posting (Recommended)
```bash
# Add to crontab (crontab -e)
0 9 * * * curl -X POST "https://www.vinylfunders.com/api/social/scheduler" -H "Content-Type: application/json" -d '{"platforms": ["facebook"]}' >> /var/log/vinylfunders-social.log 2>&1
```

### Option 2: Twice Daily
```bash
# Post at 9 AM and 6 PM daily
0 9,18 * * * curl -X POST "https://www.vinylfunders.com/api/social/scheduler" -H "Content-Type: application/json" -d '{"platforms": ["facebook"]}' >> /var/log/vinylfunders-social.log 2>&1
```

### Option 3: Weekdays Only
```bash
# Post weekdays at 9 AM
0 9 * * 1-5 curl -X POST "https://www.vinylfunders.com/api/social/scheduler" -H "Content-Type: application/json" -d '{"platforms": ["facebook"]}' >> /var/log/vinylfunders-social.log 2>&1
```

## 🧪 Testing

### Test Facebook Integration
```bash
curl -X POST "https://www.vinylfunders.com/api/social/facebook/post" \
  -H "Content-Type: application/json"
```

### Test Full Scheduler
```bash
curl -X POST "https://www.vinylfunders.com/api/social/scheduler" \
  -H "Content-Type: application/json" \
  -d '{"platforms": ["facebook"], "force": true}'
```

### Check Configuration
```bash
curl "https://www.vinylfunders.com/api/social/scheduler"
```

## 📊 Monitoring

### View Logs
```bash
tail -f /var/log/vinylfunders-social.log
```

### Check Last Run
```bash
curl "https://www.vinylfunders.com/api/social/facebook/post"
```

## 📝 Post Content Format

The system automatically generates engaging posts like:

```
🎵 NEW VINYL PRESALE ALERT! 🎵

"Einstein" by jox
7 inch Vinyl Record

💿 Target: 100 orders
📈 Progress: 15/100 (15%)
⏰ Only 18 days left!

This is a clever little tune - by our mate Ninja Reflex...

Support independent music and get exclusive vinyl! 🔥

#VinylFunders #IndependentMusic #VinylRecord #Presale #xtransit
```

## 🔄 How It Works

1. **Daily Cron Job** runs at scheduled time
2. **Finds Active Presales** (not ended, vinyl presales only)
3. **Generates Content** with progress, days left, hashtags
4. **Posts to Facebook** with image and link
5. **Logs Results** for monitoring
6. **Limits Posts** to avoid spam (max 5 per run)

## 🎯 Benefits

- **Automated Marketing** - No manual posting needed
- **Consistent Presence** - Regular updates keep audience engaged  
- **Progress Updates** - Shows funding progress to create urgency
- **Professional Content** - Consistent formatting and hashtags
- **Traffic Generation** - Direct links to presale pages
- **Multi-Platform Ready** - Easy to extend to Twitter, Instagram

## 🚀 Future Enhancements

- Twitter/X integration
- Instagram integration  
- LinkedIn company page posting
- Custom posting schedules per platform
- A/B testing of post formats
- Analytics and engagement tracking
- Smart scheduling based on audience activity

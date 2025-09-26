#!/bin/bash

# VinylFunders Social Media Cron Script
# This script runs the social media automation

echo "🤖 Starting VinylFunders social media automation..."
echo "📅 $(date)"

# Make the API call to trigger social media posting
curl -X POST "https://www.vinylfunders.com/api/social/scheduler" \
  -H "Content-Type: application/json" \
  -d '{"platforms": ["facebook"], "force": false}' \
  --max-time 60 \
  --retry 3 \
  --fail \
  --silent \
  --show-error

# Check if the curl command was successful
if [ $? -eq 0 ]; then
  echo "✅ Social media automation completed successfully"
else
  echo "❌ Social media automation failed"
  exit 1
fi


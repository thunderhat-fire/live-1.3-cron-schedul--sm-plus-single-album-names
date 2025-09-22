# Google Merchant Center Integration for VinylFunders

This integration automatically syncs VinylFunders presales and digital releases to Google Merchant Center, making them discoverable through Google Shopping and search results.

## 🎯 Features

- **Auto-sync new presales** to Google Shopping
- **Dynamic pricing** based on record size (7-inch: £13, 12-inch: tiered)
- **Real-time status updates** (preorder → out of stock → digital)
- **Batch sync** for existing products
- **Smart categorization** with custom labels for genre, format, artist tier
- **SEO optimization** with rich product descriptions
- **Error handling** with detailed logging

## 📋 Prerequisites

1. **Google Merchant Center Account**
   - Sign up at [merchants.google.com](https://merchants.google.com)
   - Verify and claim your website
   - Set up shipping and return policies

2. **Google Cloud Console Project**
   - Create project at [console.cloud.google.com](https://console.cloud.google.com)
   - Enable Content API for Shopping
   - Create service account with appropriate permissions

## 🔧 Setup Instructions

### 1. Google Cloud Console Setup

1. **Create a new project** or select existing project
2. **Enable Content API for Shopping**:
   ```
   Navigation: APIs & Services > Library
   Search: "Content API for Shopping"
   Click: Enable
   ```

3. **Create Service Account**:
   ```
   Navigation: IAM & Admin > Service Accounts
   Click: Create Service Account
   Name: vinyl-funders-merchant-sync
   Description: Service account for Google Merchant Center API
   ```

4. **Generate Private Key**:
   ```
   Click: on the created service account
   Go to: Keys tab
   Click: Add Key > Create new key
   Type: JSON
   Download: Save the JSON file securely
   ```

5. **Grant Permissions**:
   ```
   Navigation: IAM & Admin > IAM
   Add: your service account email
   Role: Content API for Shopping > Content API User
   ```

### 2. Google Merchant Center Setup

1. **Link Google Cloud Project**:
   ```
   Navigation: Tools > API Setup
   Click: Link Google Cloud Project
   Select: Your project
   ```

2. **Add Service Account**:
   ```
   Navigation: Account > Users
   Add User: your-service-account@your-project.iam.gserviceaccount.com
   Access Level: Standard
   ```

3. **Configure Policies**:
   - Set up shipping policies (UK included, overseas additional fees)
   - Set up return policies for vinyl records
   - Add business information

### 3. Environment Variables

Add these to your `.env` file:

```env
# Google Merchant Center Integration
GOOGLE_MERCHANT_CENTER_ID=your_merchant_center_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-google-cloud-project-id

# Optional: Disable auto-sync (default: enabled)
GOOGLE_MERCHANT_AUTO_SYNC=true
```

**Finding your Merchant Center ID**:
1. Go to [merchants.google.com](https://merchants.google.com)
2. Your Merchant ID is displayed in the top-left corner

**Private Key Format**:
- Copy the `private_key` field from your JSON file
- Keep the `\n` characters as literal `\n` in the environment variable
- Wrap the entire key in quotes

## 🚀 API Endpoints

### Sync Individual Product
```bash
POST /api/google-merchant/sync
{
  "nftId": "nft_id_here",
  "action": "sync" // or "remove"
}
```

### Update Product
```bash
PATCH /api/google-merchant/product/{nftId}
```

### Remove Product
```bash
DELETE /api/google-merchant/product/{nftId}
```

### Get Product Status
```bash
GET /api/google-merchant/product/{nftId}
```

### Bulk Sync All Products
```bash
POST /api/google-merchant/bulk-sync
{
  "forceResync": false,
  "onlyActive": true
}
```

### Get Sync Status
```bash
GET /api/google-merchant/bulk-sync
```

## 🔄 Automatic Sync Events

The integration automatically syncs products when:

- ✅ **New NFT created** → Adds to Google Shopping
- 🔄 **Presale status changes** → Updates availability
- 💰 **Price changes** → Updates pricing
- 🗑️ **NFT deleted** → Removes from Google Shopping
- ⏰ **Presale expires** → Updates to digital download
- ✅ **Presale completes** → Updates to digital download

## 📊 Product Data Mapping

| VinylFunders Field | Google Merchant Field | Example |
|-------------------|----------------------|---------|
| NFT Name + Artist | title | "Deep Blue Sea by xtransit - 7 inch Vinyl Record (Presale)" |
| Description | description | Enhanced with presale info and platform details |
| Side A Image | imageLink | High-resolution album artwork |
| Dynamic Price | price | £13 for 7-inch, £20-26 for 12-inch |
| Presale Status | availability | preorder, in stock, out of stock |
| Genre | customLabel0 | Folk, Rock, Electronic, etc. |
| Record Size | customLabel1 | 7 inch, 12 inch |
| Artist Tier | customLabel2 | Independent, Plus, Gold |
| Presale Status | customLabel3 | Presale, Digital |
| Order Progress | customLabel4 | "45/100" orders |

## 🏷️ Google Shopping Categories

- **Primary Category**: `55` (Media > Music)
- **Product Type**: `Music > Vinyl Records > Independent Artists`
- **Brand**: `VinylFunders`
- **Condition**: `new`
- **Currency**: `GBP`

## 🧪 Testing

### 1. Test Single Product Sync
```bash
curl -X POST https://your-domain.com/api/google-merchant/sync \
  -H "Content-Type: application/json" \
  -d '{"nftId": "test_nft_id", "action": "sync"}'
```

### 2. Verify in Google Merchant Center
1. Go to Products > All products
2. Search for "VinylFunders" or your NFT name
3. Check product details and any errors

### 3. Test Bulk Sync
```bash
curl -X POST https://your-domain.com/api/google-merchant/bulk-sync \
  -H "Content-Type: application/json" \
  -d '{"onlyActive": true}'
```

## 🔍 Monitoring

### Check Sync Status
```bash
curl https://your-domain.com/api/google-merchant/bulk-sync
```

### View Logs
Check your application logs for:
- `🛍️ Syncing product to Google Merchant Center`
- `✅ Product synced successfully`
- `❌ Error syncing product`

### Google Merchant Center Dashboard
- Monitor product approval status
- Check for policy violations
- View search performance data

## 🚨 Troubleshooting

### Common Issues

**1. "Authentication failed"**
- Verify service account email and private key
- Check that service account has proper permissions
- Ensure private key format is correct with `\n` characters

**2. "Product already exists"**
- The system automatically handles this by updating existing products
- Check logs for update confirmation

**3. "Invalid price format"**
- Ensure prices are numeric
- Check currency is set to GBP

**4. "Missing required field"**
- Verify NFT has title, description, and image
- Check that all required Google Merchant fields are mapped

### Debug Mode

Add this to your environment for detailed logging:
```env
DEBUG=google-merchant:*
```

### Rate Limiting

The integration includes automatic rate limiting:
- 100ms delay between batch operations
- Exponential backoff on errors
- Automatic retry on temporary failures

## 📈 Performance Impact

- **Sync time**: ~100ms per product
- **Batch operations**: Processes in chunks of 50
- **Memory usage**: Minimal additional overhead
- **Database queries**: Optimized with selective fetching

## 🔒 Security

- Service account credentials stored as environment variables
- No sensitive data exposed in API responses
- Request validation and sanitization
- Rate limiting to prevent abuse

## 📞 Support

For issues with this integration:

1. **Check application logs** for detailed error messages
2. **Verify Google Merchant Center** product status
3. **Test API endpoints** individually
4. **Review environment variables** configuration

### Google Resources
- [Content API for Shopping Documentation](https://developers.google.com/shopping-content/reference/rest)
- [Google Merchant Center Help](https://support.google.com/merchants)
- [Product Data Specification](https://support.google.com/merchants/answer/7052112)

---

🎵 **Happy selling on Google Shopping!** Your VinylFunders presales will now reach millions of potential customers through Google's shopping platform.

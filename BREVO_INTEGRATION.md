# Brevo Email List Integration for Presales

This document explains the hybrid approach implemented for automatically organizing presale buyers into dedicated Brevo email marketing lists.

## 🎯 Overview

The system automatically:
1. **Creates a Brevo email list** when a new presale is set up
2. **Adds buyers to the specific list** when they purchase from that presale
3. **Handles fallbacks** if lists don't exist during purchase

## 🏗️ Architecture

### Hybrid Approach
- **Setup Phase**: Auto-create Brevo lists during presale creation
- **Runtime Phase**: Add buyers to pre-created lists via webhook
- **Fallback**: Create lists on-demand if they don't exist

## 📋 Implementation Details

### 1. Database Changes
Added `brevoListId` field to the `NFT` table:
```sql
ALTER TABLE "NFT" ADD COLUMN "brevoListId" INTEGER;
CREATE INDEX "NFT_brevoListId_idx" ON "NFT"("brevoListId");
```

### 2. Presale Creation (`/api/nft/create`)
When a presale is created:
- Calls `createPresaleList(presaleName, nftId)`
- Stores the returned `listId` in the NFT record
- Continues even if Brevo fails (non-blocking)

### 3. Buyer Processing (Stripe Webhook)
When a buyer purchases:
- Extracts buyer info from the order
- Gets the NFT's `brevoListId`
- If no list exists, creates one dynamically
- Adds buyer to the list with rich metadata

### 4. Contact Data Structure
Each buyer contact includes:
```javascript
{
  email: "buyer@example.com",
  attributes: {
    FIRSTNAME: "John",
    LASTNAME: "Doe", 
    PRESALE_CAMPAIGN: "Album Name",
    NFT_NAME: "Album Name",
    PURCHASE_AMOUNT: 26.00,
    FORMAT: "vinyl",
    PURCHASE_DATE: "2024-01-15"
  },
  listIds: [123] // Specific presale list
}
```

## 🔧 Functions

### `createPresaleList(presaleName, nftId)`
Creates a new Brevo list for a presale campaign.
- **Returns**: `{ success: boolean, listId: number, listName: string }`
- **Naming**: `"Presale - {presaleName}"`

### `addContactToPresaleList(contactData)`
Adds a buyer to a specific presale list.
- **Updates existing contacts** if they already exist
- **Rich metadata** for segmentation and personalization

### `getOrCreatePresaleList(presaleName, nftId)`
Gets existing list or creates new one (fallback).
- **Checks** if list exists first
- **Creates** if not found
- **Returns** list info with `isNew` flag

## 🚀 Usage

### For New Presales
Lists are created automatically during presale setup. No manual intervention needed.

### For Existing Presales
The system will create lists on-demand when the first buyer purchases.

### Manual Testing
```bash
node scripts/test-brevo-integration.js
```

## 📊 Benefits

✅ **Automatic Segmentation**: Each presale gets its own email list
✅ **Rich Contact Data**: Buyers include purchase info and metadata  
✅ **Fallback Handling**: Works even if lists weren't pre-created
✅ **Non-blocking**: Brevo failures don't break presale purchases
✅ **Real-time**: Buyers added immediately after purchase

## 🔍 Monitoring

### Logs to Watch
- `✅ Created Brevo list for presale: {name}` - List creation
- `✅ Added buyer to Brevo list: {email}` - Contact addition
- `❌ Failed to add buyer to Brevo: {error}` - Integration errors

### Webhook Logs
Look for `📧 Adding buyer to Brevo list` in Stripe webhook logs.

## 🛠️ Configuration

### Required Environment Variables
```env
BREVO_API_KEY=your_brevo_api_key_here
```

### Brevo Setup
1. Get API key from Brevo → Profile → SMTP & API → API Keys
2. Optionally create folder structure for organization
3. Set up contact attributes in Brevo (auto-created on first use)

## 🔄 Flow Diagram

```
Presale Creation → Create Brevo List → Store List ID
                                    ↓
Buyer Purchase → Webhook → Get List ID → Add Contact to List
                     ↓
                 No List ID? → Create List → Add Contact
```

## 🚨 Error Handling

- **Brevo API failures**: Logged but don't break presale creation/purchases
- **Missing list IDs**: Auto-create lists on-demand
- **Invalid contact data**: Graceful degradation with basic info
- **Rate limiting**: Built-in retry logic (future enhancement)

## 📈 Future Enhancements

- **Automated campaigns** triggered by list membership
- **Segmentation** by purchase amount, format, date
- **Analytics** on list growth and engagement
- **Bulk operations** for existing data migration 
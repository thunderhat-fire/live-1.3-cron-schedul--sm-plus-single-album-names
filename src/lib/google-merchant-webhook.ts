// Helper function to trigger Google Merchant Center webhook (can be called from other parts of the app)
export async function triggerGoogleMerchantWebhook(nftId: string, event: string, data?: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-merchant/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nftId,
        event,
        data,
      }),
    });

    if (response.ok) {
      console.log(`✅ Google Merchant webhook triggered: ${event} for NFT ${nftId}`);
    } else {
      console.error(`❌ Failed to trigger Google Merchant webhook: ${event} for NFT ${nftId}`);
    }
  } catch (error) {
    console.error('Error triggering Google Merchant webhook:', error);
  }
}

// Event types for type safety
export type GoogleMerchantWebhookEvent = 
  | 'nft.updated'
  | 'nft.price_changed'
  | 'nft.presale_status_changed'
  | 'nft.deleted'
  | 'nft.presale_expired'
  | 'nft.presale_completed';

// Convenience functions for common webhook triggers
export const googleMerchantWebhooks = {
  nftUpdated: (nftId: string, data?: any) => 
    triggerGoogleMerchantWebhook(nftId, 'nft.updated', data),
  
  priceChanged: (nftId: string, data?: any) => 
    triggerGoogleMerchantWebhook(nftId, 'nft.price_changed', data),
  
  presaleStatusChanged: (nftId: string, data?: any) => 
    triggerGoogleMerchantWebhook(nftId, 'nft.presale_status_changed', data),
  
  nftDeleted: (nftId: string, data?: any) => 
    triggerGoogleMerchantWebhook(nftId, 'nft.deleted', data),
  
  presaleExpired: (nftId: string, data?: any) => 
    triggerGoogleMerchantWebhook(nftId, 'nft.presale_expired', data),
  
  presaleCompleted: (nftId: string, data?: any) => 
    triggerGoogleMerchantWebhook(nftId, 'nft.presale_completed', data),
};

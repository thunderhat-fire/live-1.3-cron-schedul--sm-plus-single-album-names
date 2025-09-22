import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import GoogleMerchantService from '@/lib/google-merchant';

// Webhook to handle NFT updates that should trigger Google Merchant Center sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nftId, event, data } = body;

    if (!nftId || !event) {
      return NextResponse.json(
        { success: false, error: 'NFT ID and event type are required' },
        { status: 400 }
      );
    }

    console.log(`🔔 Google Merchant webhook triggered: ${event} for NFT ${nftId}`);

    const googleMerchant = new GoogleMerchantService();

    switch (event) {
      case 'nft.updated':
      case 'nft.price_changed':
      case 'nft.presale_status_changed':
        // Update the product in Google Merchant Center
        const result = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-merchant/product/${nftId}`, {
          method: 'PATCH',
        });
        
        if (result.ok) {
          console.log('✅ Google Merchant product updated via webhook');
        } else {
          console.error('❌ Failed to update Google Merchant product via webhook');
        }
        break;

      case 'nft.deleted':
      case 'nft.presale_expired':
        // Remove the product from Google Merchant Center
        const removeResult = await googleMerchant.removeProduct(nftId);
        console.log('🗑️ Product removal result:', removeResult);
        break;

      case 'nft.presale_completed':
        // Update availability status to show as digital download
        const updateResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-merchant/product/${nftId}`, {
          method: 'PATCH',
        });
        
        if (updateResult.ok) {
          console.log('✅ Presale completion updated in Google Merchant Center');
        }
        break;

      default:
        console.log(`ℹ️ Unhandled webhook event: ${event}`);
        break;
    }

    return NextResponse.json({ success: true, event, nftId });
  } catch (error: any) {
    console.error('Error in Google Merchant webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


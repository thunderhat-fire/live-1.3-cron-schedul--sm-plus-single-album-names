import { google } from 'googleapis';
import { getGoogleMerchantConfig } from '@/lib/google-merchant-config';

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  recordSize: string;
  genre?: string;
  imageUrl: string;
  sideAImage?: string;
  artistName: string;
  isVinylPresale: boolean;
  targetOrders: number;
  currentOrders: number;
  endDate?: string;
}

interface GoogleMerchantProduct {
  offerId: string;
  title: string;
  description: string;
  link: string;
  image_link: string;  // Changed from imageLink to image_link
  availability: 'in stock' | 'out of stock' | 'preorder';
  price: {
    value: string;
    currency: string;
  };
  gtin?: string;
  brand: string;
  condition: 'new' | 'refurbished' | 'used';
  google_product_category: string;  // Changed from googleProductCategory to google_product_category
  product_type: string;  // Changed from productType to product_type
  custom_label_0?: string; // Genre - Changed from customLabel0 to custom_label_0
  custom_label_1?: string; // Record Size - Changed from customLabel1 to custom_label_1
  custom_label_2?: string; // Artist Tier - Changed from customLabel2 to custom_label_2
  custom_label_3?: string; // Presale Status - Changed from customLabel3 to custom_label_3
  custom_label_4?: string; // Target Orders - Changed from customLabel4 to custom_label_4
}

class GoogleMerchantService {
  private contentApi: any;
  private merchantId: string;
  private baseUrl: string;

  constructor() {
    // Use the robust config function that handles private key formatting
    const config = getGoogleMerchantConfig();
    
    this.merchantId = config.merchantId;
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vinylfunders.com';
    
    // Initialize Google Content API using JWT (same as test-auth)
    const authClient = new google.auth.JWT(
      config.clientEmail,
      undefined,
      config.privateKey,
      ['https://www.googleapis.com/auth/content'],
      undefined
    );

    this.contentApi = google.content({
      version: 'v2.1',
      auth: authClient,
    });
  }

  /**
   * Convert VinylFunders NFT data to Google Merchant product format
   */
  private transformToGoogleProduct(productData: ProductData): GoogleMerchantProduct {
    const { id, name, description, price, recordSize, genre, imageUrl, sideAImage, artistName, isVinylPresale, targetOrders, currentOrders, endDate } = productData;
    
    // Determine availability status
    let availability: 'in stock' | 'out of stock' | 'preorder' = 'preorder';
    if (isVinylPresale) {
      const isCompleted = currentOrders >= targetOrders;
      const isExpired = endDate && new Date(endDate) < new Date();
      availability = isCompleted || isExpired ? 'out of stock' : 'preorder';
    } else {
      availability = 'in stock'; // Digital downloads
    }

    // Create product title with artist and format info
    const title = `${name} by ${artistName} - ${recordSize} Vinyl Record${isVinylPresale ? ' (Presale)' : ''}`;
    
    // Enhanced description with presale info
    const enhancedDescription = `${description}\n\n${isVinylPresale ? 
      `🎵 VINYL PRESALE: This ${recordSize} vinyl record will be pressed once we reach ${targetOrders} orders. Currently ${currentOrders} of ${targetOrders} orders placed.` : 
      '🎵 DIGITAL DOWNLOAD: Instant access to high-quality digital tracks.'
    }\n\nSupport independent artists on VinylFunders - where music dreams become vinyl reality!`;

    return {
      offerId: `vinylfunders_${id}`,
      title: title.substring(0, 150), // Google limit
      description: enhancedDescription.substring(0, 5000), // Google limit
      link: `${this.baseUrl}/nft-detail/${id}`,
      image_link: sideAImage || imageUrl,
      availability,
      price: {
        value: price.toString(),
        currency: 'GBP',
      },
      brand: 'VinylFunders',
      condition: 'new',
      google_product_category: '55', // Media > Music
      product_type: 'Music > Vinyl Records > Independent Artists',
      custom_label_0: genre || 'Music',
      custom_label_1: recordSize,
      custom_label_2: 'Independent', // Could be dynamic based on artist tier
      custom_label_3: isVinylPresale ? 'Presale' : 'Digital',
      custom_label_4: `${currentOrders}/${targetOrders}`,
    };
  }

  /**
   * Add or update a product in Google Merchant Center
   */
  async syncProduct(productData: ProductData): Promise<{ success: boolean; error?: string; productId?: string }> {
    try {
      if (!this.merchantId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
        throw new Error('Google Merchant Center configuration missing');
      }

      const googleProduct = this.transformToGoogleProduct(productData);
      
      console.log('🛍️ Syncing product to Google Merchant Center:', {
        offerId: googleProduct.offerId,
        title: googleProduct.title,
        price: googleProduct.price,
        availability: googleProduct.availability,
      });

      const response = await this.contentApi.products.insert({
        merchantId: this.merchantId,
        requestBody: googleProduct,
      });

      console.log('✅ Product synced successfully:', response.data.id);

      return {
        success: true,
        productId: response.data.id,
      };
    } catch (error: any) {
      console.error('❌ Error syncing product to Google Merchant Center:', error);
      
      // If product already exists, try to update it
      if (error.code === 409 || error.message?.includes('already exists')) {
        return this.updateProduct(productData);
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Update an existing product in Google Merchant Center
   */
  async updateProduct(productData: ProductData): Promise<{ success: boolean; error?: string; productId?: string }> {
    try {
      const googleProduct = this.transformToGoogleProduct(productData);
      
      console.log('🔄 Updating product in Google Merchant Center:', googleProduct.offerId);

      const response = await this.contentApi.products.update({
        merchantId: this.merchantId,
        productId: googleProduct.offerId,
        requestBody: googleProduct,
      });

      console.log('✅ Product updated successfully:', response.data.id);

      return {
        success: true,
        productId: response.data.id,
      };
    } catch (error: any) {
      console.error('❌ Error updating product:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Remove a product from Google Merchant Center
   */
  async removeProduct(nftId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const offerId = `vinylfunders_${nftId}`;
      
      console.log('🗑️ Removing product from Google Merchant Center:', offerId);

      await this.contentApi.products.delete({
        merchantId: this.merchantId,
        productId: offerId,
      });

      console.log('✅ Product removed successfully');

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error removing product:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Get product status from Google Merchant Center
   */
  async getProductStatus(nftId: string): Promise<{ success: boolean; product?: any; error?: string }> {
    try {
      const offerId = `vinylfunders_${nftId}`;
      
      const response = await this.contentApi.products.get({
        merchantId: this.merchantId,
        productId: offerId,
      });

      return {
        success: true,
        product: response.data,
      };
    } catch (error: any) {
      console.error('❌ Error fetching product status:', error);
      return {
        success: false,
        error: error.message || 'Product not found',
      };
    }
  }

  /**
   * Batch sync multiple products
   */
  async batchSyncProducts(products: ProductData[]): Promise<{ success: boolean; results: any[]; errors: any[] }> {
    const results: any[] = [];
    const errors: any[] = [];

    console.log(`🔄 Batch syncing ${products.length} products to Google Merchant Center`);

    for (const product of products) {
      try {
        const result = await this.syncProduct(product);
        results.push({ id: product.id, ...result });
        
        if (!result.success) {
          errors.push({ id: product.id, error: result.error });
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        errors.push({ id: product.id, error: error.message });
      }
    }

    console.log(`✅ Batch sync completed. Success: ${results.filter(r => r.success).length}, Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      results,
      errors,
    };
  }
}

export default GoogleMerchantService;
export type { ProductData, GoogleMerchantProduct };

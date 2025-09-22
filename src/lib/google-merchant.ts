import { google } from 'googleapis';

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
  imageLink: string;
  availability: 'in stock' | 'out of stock' | 'preorder';
  price: {
    value: string;
    currency: string;
  };
  gtin?: string;
  brand: string;
  condition: 'new' | 'refurbished' | 'used';
  googleProductCategory: string;
  productType: string;
  customLabel0?: string; // Genre
  customLabel1?: string; // Record Size
  customLabel2?: string; // Artist Tier
  customLabel3?: string; // Presale Status
  customLabel4?: string; // Target Orders
}

class GoogleMerchantService {
  private contentApi: any;
  private merchantId: string;
  private baseUrl: string;

  constructor() {
    this.merchantId = process.env.GOOGLE_MERCHANT_CENTER_ID || '';
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vinylfunders.com';
    
    // Initialize Google Content API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/content'],
    });

    this.contentApi = google.content({
      version: 'v2.1',
      auth,
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
      imageLink: sideAImage || imageUrl,
      availability,
      price: {
        value: price.toString(),
        currency: 'GBP',
      },
      brand: 'VinylFunders',
      condition: 'new',
      googleProductCategory: '55', // Media > Music
      productType: 'Music > Vinyl Records > Independent Artists',
      customLabel0: genre || 'Music',
      customLabel1: recordSize,
      customLabel2: 'Independent', // Could be dynamic based on artist tier
      customLabel3: isVinylPresale ? 'Presale' : 'Digital',
      customLabel4: `${currentOrders}/${targetOrders}`,
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

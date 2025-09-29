/**
 * Pricing utilities for vinyl records and digital downloads
 */

export interface NFTPricingData {
  recordSize?: string;
  targetOrders?: number;
  isVinylPresale?: boolean;
  showAsDigital?: boolean;
}

/**
 * Get digital download price based on record size
 * @param recordSize - '7 inch' or '12 inch'
 * @returns Digital price in GBP
 */
export function getDigitalPrice(recordSize?: string): number {
  if (recordSize === '7 inch') {
    return 4.00; // £4 for 7-inch digital
  }
  return 13.00; // £13 for 12-inch digital (default)
}

/**
 * Get vinyl presale price based on record size and target orders
 * @param recordSize - '7 inch' or '12 inch'  
 * @param targetOrders - Target number of orders for tiered pricing
 * @returns Vinyl presale price in GBP
 */
export function getVinylPrice(recordSize?: string, targetOrders?: number): number {
  if (recordSize === '7 inch') {
    return 13.00; // Fixed price for 7-inch vinyl
  }
  
  // 12-inch tiered pricing based on target orders
  if (targetOrders === 100) return 26.00;
  if (targetOrders === 200) return 22.00;
  if (targetOrders === 500) return 20.00;
  return 26.00; // Default for 12-inch
}

/**
 * Get current price based on NFT state (vinyl vs digital)
 * @param nft - NFT data including record size, presale status, etc.
 * @returns Current price in GBP
 */
export function getCurrentPrice(nft: NFTPricingData): number {
  // If showing as digital or not a presale, use digital pricing
  if (nft.showAsDigital || !nft.isVinylPresale) {
    return getDigitalPrice(nft.recordSize);
  }
  
  // Otherwise use vinyl pricing
  return getVinylPrice(nft.recordSize, nft.targetOrders);
}

/**
 * Format price for display
 * @param price - Price in GBP
 * @returns Formatted price string (e.g., "£13.00")
 */
export function formatPrice(price: number): string {
  return `£${price.toFixed(2)}`;
}

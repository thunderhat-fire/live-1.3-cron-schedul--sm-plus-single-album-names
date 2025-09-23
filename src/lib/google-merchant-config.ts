interface GoogleMerchantConfig {
  merchantId: string;
  projectId: string;
  clientEmail: string;
  privateKey: string;
  autoSync: boolean;
}

export function getGoogleMerchantConfig(): GoogleMerchantConfig {
  const merchantId = process.env.GOOGLE_MERCHANT_CENTER_ID;
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const autoSync = process.env.GOOGLE_MERCHANT_AUTO_SYNC === 'true';

  if (!merchantId || !projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Google Merchant Center environment variables');
  }

  // Handle different private key formats more robustly
  let formattedPrivateKey = privateKey;
  
  // If the key doesn't contain actual newlines, replace \n with real newlines
  if (!formattedPrivateKey.includes('\n') && formattedPrivateKey.includes('\\n')) {
    formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
  }
  
  // Remove quotes if they exist
  formattedPrivateKey = formattedPrivateKey.replace(/^["']|["']$/g, '');
  
  // Ensure proper BEGIN/END format
  if (!formattedPrivateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format: must start with -----BEGIN PRIVATE KEY-----');
  }
  
  if (!formattedPrivateKey.endsWith('-----END PRIVATE KEY-----')) {
    throw new Error('Invalid private key format: must end with -----END PRIVATE KEY-----');
  }

  return {
    merchantId,
    projectId,
    clientEmail,
    privateKey: formattedPrivateKey,
    autoSync,
  };
}

// Legacy export for backwards compatibility
export const GOOGLE_MERCHANT_CONFIG = {
  // Required environment variables
  MERCHANT_ID: process.env.GOOGLE_MERCHANT_CENTER_ID,
  SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
  
  // Base URL for product links
  BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://vinylfunders.com',
  
  // Google Shopping category for vinyl records
  GOOGLE_PRODUCT_CATEGORY: '55', // Media > Music
  
  // Custom product type for better categorization
  PRODUCT_TYPE: 'Music > Vinyl Records > Independent Artists',
  
  // Default values
  BRAND: 'VinylFunders',
  CONDITION: 'new' as const,
  CURRENCY: 'GBP',
  
  // Auto-sync settings
  AUTO_SYNC_ON_CREATE: process.env.GOOGLE_MERCHANT_AUTO_SYNC !== 'false',
  AUTO_SYNC_ON_UPDATE: process.env.GOOGLE_MERCHANT_AUTO_SYNC !== 'false',
  AUTO_REMOVE_ON_DELETE: process.env.GOOGLE_MERCHANT_AUTO_SYNC !== 'false',
};

// Validation function to check if all required config is present
export function validateGoogleMerchantConfig(): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  if (!GOOGLE_MERCHANT_CONFIG.MERCHANT_ID) {
    missingFields.push('GOOGLE_MERCHANT_CENTER_ID');
  }
  
  if (!GOOGLE_MERCHANT_CONFIG.SERVICE_ACCOUNT_EMAIL) {
    missingFields.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  }
  
  if (!GOOGLE_MERCHANT_CONFIG.SERVICE_ACCOUNT_PRIVATE_KEY) {
    missingFields.push('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
  }
  
  if (!GOOGLE_MERCHANT_CONFIG.PROJECT_ID) {
    missingFields.push('GOOGLE_PROJECT_ID');
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields
  };
}

// Environment variable template for .env file
export const ENV_TEMPLATE = `
# Google Merchant Center Integration
GOOGLE_MERCHANT_CENTER_ID=your_merchant_center_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
GOOGLE_PROJECT_ID=your-google-cloud-project-id

# Optional: Disable auto-sync (default: enabled)
# GOOGLE_MERCHANT_AUTO_SYNC=false
`;

export default GOOGLE_MERCHANT_CONFIG;

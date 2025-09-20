// Brevo configuration IDs
// Update these values with the actual IDs from your Brevo account

export const BREVO_CONFIG = {
  // Contact Lists - Updated to match actual Brevo account
  LISTS: {
    ALL_USERS: 9 as number,       // "Default list for all users"
    STARTER_TIER: 10 as number,   // "Starter tier users" (£19)
    PLUS_TIER: 11 as number,      // "Plus tier users" (£73)
    GOLD_TIER: 12 as number,      // "Gold tier users" (£130)
    // Note: No separate basic tier list - basic users will go to starter list for now
  },

  // Email Templates
  TEMPLATES: {
    WELCOME: 11,              // Welcome email for new users
    ORDER_CONFIRMATION: 4,   // NFT purchase confirmation
    SHIPPING_UPDATE: 5,      // Vinyl shipping updates
    ABANDONED_CART: 8,       // Abandoned cart recovery
    SUBSCRIPTION_UPGRADE: 13, // Subscription upgrade confirmation
    PASSWORD_RESET: 14,       // Password reset emails
    VINYL_CREATED: 12,       // Vinyl album creation confirmation
    SOCIAL_SHARE: 15,        // Social share template for NFTs
    PRESALE_TO_DIGITAL: 16,  // Presale conversion to digital notification
    PRESALE_SUCCESS_BUYER: 18, // Presale success for buyer
    PRESALE_SUCCESS_ARTIST: 19, // Presale success for artist
    PRESALE_FAILED_ARTIST: 20, // Presale failed for artist
    PRESALE_FAILED_BUYER: 21, // Presale failed for buyer
  },

  // Automation Workflows
  WORKFLOWS: {
    NEW_USER_ONBOARDING: 2,    // Welcome series
    SUBSCRIPTION_UPGRADE: 3,    // Upgrade celebration & onboarding
  }
} as const;

// Template parameters for each email type
export const EMAIL_PARAMS = {
  WELCOME: {
    required: ['USER_NAME'],
    optional: ['SUBSCRIPTION_TIER']
  },
  ORDER_CONFIRMATION: {
    required: ['ORDER_ID', 'PRODUCT_NAME', 'AMOUNT'],
    optional: ['SHIPPING_ADDRESS', 'ESTIMATED_DELIVERY']
  },
  SHIPPING_UPDATE: {
    required: ['ORDER_ID', 'SHIPPING_STATUS', 'TRACKING_NUMBER'],
    optional: ['ESTIMATED_DELIVERY']
  },
  SUBSCRIPTION_UPGRADE: {
    required: ['USER_NAME', 'SUBSCRIPTION_TIER', 'SUBSCRIPTION_END_DATE'],
    optional: ['AI_MASTERING_CREDITS', 'PROMOTIONAL_CREDITS']
  },
  PASSWORD_RESET: {
    required: ['RESET_LINK'],
    optional: ['USER_NAME']
  },
  ABANDONED_CART: {
    required: ['PRODUCT_NAME', 'CART_URL'],
    optional: ['DISCOUNT_CODE']
  },
  REENGAGEMENT: {
    required: ['USER_NAME'],
    optional: ['LAST_LOGIN_DATE', 'SPECIAL_OFFER']
  },
  VINYL_CREATED: {
    required: [
      'USER_NAME',
      'VINYL_NAME',
      'GENRE',
      'RECORD_SIZE',
      'PRICE',
      'RECORD_LABEL'
    ],
    optional: [
      'SIDE_A_TRACKS',
      'SIDE_B_TRACKS',
      'DESCRIPTION',
      'NFT_URL'
    ]
  },
  SOCIAL_SHARE: {
    required: [
      'SENDER_NAME',
      'NFT_NAME',
      'NFT_IMAGE_URL',
      'NFT_URL',
      'SHARE_MESSAGE'
    ],
    optional: [
      'GENRE',
      'RECORD_SIZE',
      'PRICE',
      'RECORD_LABEL',
      'DESCRIPTION'
    ]
  },
  PRESALE_SUCCESS_BUYER: {
    required: [
      'BUYER_NAME',
      'PROJECT_NAME',
      'ARTIST_NAME',
      'TARGET_ORDERS',
      'ACTUAL_ORDERS',
      'PROJECT_URL',
      'ORDER_AMOUNT',
      'ORDER_QUANTITY',
      'SUCCESS_MESSAGE'
    ],
    optional: []
  },
  PRESALE_SUCCESS_ARTIST: {
    required: [
      'ARTIST_NAME',
      'PROJECT_NAME',
      'TARGET_ORDERS',
      'ACTUAL_ORDERS',
      'PROJECT_URL',
      'TOTAL_REVENUE',
      'SUCCESS_MESSAGE'
    ],
    optional: [
      'MANUFACTURING_TIMELINE'
    ]
  },
  PRESALE_FAILED_BUYER: {
    required: [
      'BUYER_NAME',
      'PROJECT_NAME',
      'ARTIST_NAME',
      'TARGET_ORDERS',
      'ACTUAL_ORDERS',
      'ORDERS_NEEDED',
      'PROJECT_URL',
      'REFUND_AMOUNT',
      'FAILED_MESSAGE'
    ],
    optional: [
      'REFUND_TIMELINE',
      'DIGITAL_AVAILABLE'
    ]
  }
} as const; 
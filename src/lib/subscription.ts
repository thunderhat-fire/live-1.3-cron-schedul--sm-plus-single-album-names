import { User } from '@prisma/client';

export interface SubscriptionBenefits {
  aiMasteringLimit: number;
  promotionalCredit: number;
  analyticsAccess: boolean;
  fullAnalyticsAccess: boolean; // New field for full analytics
  premiumPlacement: boolean;
  promotionalStrategy: boolean;
}

const SUBSCRIPTION_BENEFITS: Record<string, SubscriptionBenefits> = {
  basic: {
    aiMasteringLimit: 0,
    promotionalCredit: 0,
    analyticsAccess: false, // No analytics for basic
    fullAnalyticsAccess: false,
    premiumPlacement: false,
    promotionalStrategy: false,
  },
  starter: {
    aiMasteringLimit: 0,
    promotionalCredit: 0,
    analyticsAccess: true, // Basic analytics
    fullAnalyticsAccess: false,
    premiumPlacement: false,
    promotionalStrategy: false,
  },
  indie: {
    aiMasteringLimit: 0,
    promotionalCredit: 0,
    analyticsAccess: true, // Basic analytics
    fullAnalyticsAccess: false,
    premiumPlacement: true,
    promotionalStrategy: false,
  },
  plus: {
    aiMasteringLimit: 8,
    promotionalCredit: 50,
    analyticsAccess: true, // Basic analytics
    fullAnalyticsAccess: false,
    premiumPlacement: true,
    promotionalStrategy: true,
  },
  gold: {
    aiMasteringLimit: 8,
    promotionalCredit: 50,
    analyticsAccess: true, // Basic analytics
    fullAnalyticsAccess: true, // Full analytics with views, player counts, buyer locations
    premiumPlacement: true,
    promotionalStrategy: true,
  },
};

export function getUserBenefits(user: User): SubscriptionBenefits {
  if (!user || !user.subscriptionTier || user.subscriptionStatus !== 'active') {
    return SUBSCRIPTION_BENEFITS.starter;
  }
  return SUBSCRIPTION_BENEFITS[user.subscriptionTier.toLowerCase()];
}

export function canAccessAnalytics(user: User): boolean {
  const benefits = getUserBenefits(user);
  return benefits.analyticsAccess;
}

export function canAccessFullAnalytics(user: User): boolean {
  const benefits = getUserBenefits(user);
  return benefits.fullAnalyticsAccess;
}

export function canAccessPremiumPlacement(user: User): boolean {
  const benefits = getUserBenefits(user);
  return benefits.premiumPlacement;
}

export function getRemainingAIMasteringCredits(user: User): number {
  return user.aiMasteringCredits;
}

export function getRemainingPromotionalCredits(user: User): number {
  return user.promotionalCredits;
}

export function canAccessPromotionalStrategy(user: User): boolean {
  const benefits = getUserBenefits(user);
  return benefits.promotionalStrategy;
}

// Helper to check if subscription is active
export function hasActiveSubscription(user: User): boolean {
  return user.subscriptionStatus === 'active' && 
         (!user.subscriptionEndDate || new Date(user.subscriptionEndDate) > new Date());
} 
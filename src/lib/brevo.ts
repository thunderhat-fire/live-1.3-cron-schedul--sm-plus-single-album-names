// src/lib/brevo.ts
import * as SibApiV3Sdk from '@sendinblue/client';
import { BREVO_CONFIG } from './brevo-config';

// Initialize API instances
const contactsApi = new SibApiV3Sdk.ContactsApi();
const emailsApi = new SibApiV3Sdk.TransactionalEmailsApi();

// Configure API key authorization
contactsApi.setApiKey(SibApiV3Sdk.ContactsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');
emailsApi.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

interface ContactAttributes {
  FIRSTNAME?: string;
  LASTNAME?: string;
  SUBSCRIPTION_TIER?: string;
  SUBSCRIPTION_STATUS?: string;
}

interface Track {
  name: string;
  duration: number;
}

interface VinylNFT {
  id: string;
  name: string | null | undefined;
  description?: string | null;
  genre?: string | null;
  recordSize?: string | null;
  price?: number | null;
  recordLabel?: string | null;
  sideATracks: Track[];
  sideBTracks: Track[];
  sideAImage?: string;
}

interface EmailParams {
  USER_NAME: string;
  VINYL_NAME: string;
  DESCRIPTION: string;
  GENRE: string;
  RECORD_SIZE: string;
  PRICE: string;
  RECORD_LABEL: string;
  SIDE_A_TRACKS: string;
  SIDE_B_TRACKS: string;
  NFT_URL: string;
  NFT_IMAGE_URL: string;
}

interface SocialShareParams {
  senderName: string;
  recipientEmail: string;
  nft: {
    id: string;
    name: string;
    imageUrl: string;
    description?: string;
    genre?: string;
    recordSize?: string;
    price?: number;
    recordLabel?: string;
  };
  shareMessage?: string;
}

export async function addOrUpdateContact(email: string, attributes: ContactAttributes) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Brevo API key is not set. Skipping contact update.');
    return false;
  }

  try {
    console.log('Creating/updating contact with attributes:', { email, attributes });
    
    // ⚠️ WARNING: This function only ADDS users to lists, doesn't remove from old tier lists
    // For subscription tier changes, use updateContactSubscriptionTier() instead
    
    // Determine which lists the user should be in based on subscription tier
    const listIds = [BREVO_CONFIG.LISTS.ALL_USERS]; // Always add to all users list
    
    // Add to tier-specific list based on subscription tier
    if (attributes.SUBSCRIPTION_TIER) {
      const tier = attributes.SUBSCRIPTION_TIER.toLowerCase();
      switch (tier) {
        case 'basic':
        case 'free':
          listIds.push(BREVO_CONFIG.LISTS.STARTER_TIER); // Basic users go to starter list for now
          break;
        case 'starter':
          listIds.push(BREVO_CONFIG.LISTS.STARTER_TIER); // List ID: 10 (starter - £19)
          break;
        case 'plus':
          listIds.push(BREVO_CONFIG.LISTS.PLUS_TIER); // List ID: 11 (plus - £73)
          break;
        case 'gold':
          listIds.push(BREVO_CONFIG.LISTS.GOLD_TIER); // List ID: 12 (gold - £130)
          break;
      }
    }
    
    console.log(`Adding contact to lists: ${listIds.join(', ')} for tier: ${attributes.SUBSCRIPTION_TIER}`);
    
    const createContact = new SibApiV3Sdk.CreateContact();
    createContact.email = email;
    createContact.attributes = attributes;
    createContact.listIds = listIds;
    createContact.updateEnabled = true;

    await contactsApi.createContact(createContact);
    console.log('Contact created/updated successfully with tier-specific lists');
    return true;
  } catch (error: any) {
    console.error('Error creating/updating contact:', {
      error: error.message,
      code: error.code,
      response: error.response?.body,
    });
    return false;
  }
}

export async function sendTransactionalEmail(
  to: string,
  templateId: number,
  params: Record<string, string>
) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Brevo API key is not set. Skipping email send.');
    return null;
  }

  try {
    console.log('Sending transactional email:', { 
      to, 
      templateId, 
      params,
      apiKeyExists: !!process.env.BREVO_API_KEY 
    });
    
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.templateId = templateId;
    sendSmtpEmail.params = params;
    
    // Add consistent sender information
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'Vinyl Funders',
      email: process.env.BREVO_SENDER_EMAIL || 'no-reply@vinylfunders.co.uk'
    };

    const result = await emailsApi.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', result);
    return result;
  } catch (error: any) {
    console.error('Error sending email:', {
      error: error.message,
      code: error.code,
      response: error.response?.body,
    });
    return null;
  }
}

export async function sendVinylCreationEmail(
  to: string,
  userName: string,
  nft: VinylNFT
): Promise<SibApiV3Sdk.CreateSmtpEmail | null> {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Brevo API key is not set. Skipping email send.');
    return null;
  }

  try {
    // Format tracks for email with simple text
    const formatTracks = (tracks: Track[]): string => {
      return tracks.map((track, index) => {
        const minutes = Math.floor(track.duration / 60);
        const seconds = track.duration % 60;
        return `${index + 1}. ${track.name} (${minutes}:${seconds.toString().padStart(2, '0')})`;
      }).join('\n');
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const nftUrl = `${baseUrl}/nft-detail/${nft.id}`;

    // Log the initial data with more detail
    console.log('Vinyl creation email preparation:', {
      timestamp: new Date().toISOString(),
      recipient: to,
      userName,
      nftDetails: {
        id: nft.id,
        name: nft.name,
        trackCounts: {
          sideA: nft.sideATracks.length,
          sideB: nft.sideBTracks.length
        }
      },
      templateId: EMAIL_TEMPLATES.VINYL_CREATED,
      baseUrl,
      nftUrl
    });

    // Prepare email parameters
    const emailParams: EmailParams = {
      USER_NAME: String(userName || 'User').trim(),
      VINYL_NAME: String(nft.name || 'Untitled Vinyl').trim(),
      GENRE: String(nft.genre || 'Not specified').trim(),
      RECORD_SIZE: String(nft.recordSize || 'Not specified').trim(),
      PRICE: nft.price ? `£${Number(nft.price).toFixed(2)}` : 'Not specified',
      RECORD_LABEL: String(nft.recordLabel || 'Not specified').trim(),
      DESCRIPTION: String(nft.description || '').trim(),
      SIDE_A_TRACKS: formatTracks(nft.sideATracks),
      SIDE_B_TRACKS: formatTracks(nft.sideBTracks),
      NFT_URL: nftUrl,
      NFT_IMAGE_URL: nft.sideAImage || ''
    };

    // Log the exact parameters being sent
    console.log('Sending Brevo email with parameters:', {
      timestamp: new Date().toISOString(),
      templateId: EMAIL_TEMPLATES.VINYL_CREATED,
      recipient: to,
      params: emailParams,
      apiKeyLength: process.env.BREVO_API_KEY?.length
    });

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.templateId = EMAIL_TEMPLATES.VINYL_CREATED;
    sendSmtpEmail.params = emailParams;
    // Add sender information
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'Vinyl Funders',
      email: process.env.BREVO_SENDER_EMAIL || 'no-reply@vinylfunders.co.uk'
    };

    // Add tracking
    sendSmtpEmail.tags = ['vinyl_creation'];
    sendSmtpEmail.headers = {
      'X-Mailin-Tag': 'vinyl_creation',
      'X-Mailin-Custom': `nft_${nft.id}`,
      'X-Mailin-Track': 'true',
      'X-Mailin-Track-Click': 'true',
      'X-Mailin-Track-Open': 'true'
    };

    // Attempt to send the email
    const result = await emailsApi.sendTransacEmail(sendSmtpEmail);
    
    // Log successful send with more details
    console.log('Vinyl creation email sent successfully:', {
      timestamp: new Date().toISOString(),
      recipient: to,
      templateId: EMAIL_TEMPLATES.VINYL_CREATED,
      nftId: nft.id,
      emailParams: Object.keys(emailParams),
      response: result.body
    });

    return result.body;
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error sending vinyl creation email:', {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        response: error.response?.body,
        stack: error.stack
      },
      emailDetails: {
        recipient: to,
        templateId: EMAIL_TEMPLATES.VINYL_CREATED,
        nftId: nft.id,
        userName
      },
      requestBody: error.response?.request?.body,
      apiKeyPresent: !!process.env.BREVO_API_KEY
    });
    return null;
  }
}

export async function sendSocialShareEmail({
  senderName,
  recipientEmail,
  nft,
  shareMessage
}: SocialShareParams): Promise<SibApiV3Sdk.CreateSmtpEmail | null> {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Brevo API key is not set. Skipping email send.');
    return null;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const nftUrl = `${baseUrl}/nft-detail/${nft.id}`;

    // Log the initial data
    console.log('Social share email preparation:', {
      timestamp: new Date().toISOString(),
      recipient: recipientEmail,
      senderName,
      nftDetails: {
        id: nft.id,
        name: nft.name,
      },
      templateId: EMAIL_TEMPLATES.SOCIAL_SHARE,
      baseUrl,
      nftUrl
    });

    // Prepare email parameters
    const emailParams = {
      SENDER_NAME: String(senderName || 'A Vinyl Funders User').trim(),
      NFT_NAME: String(nft.name || 'Untitled Vinyl').trim(),
      NFT_IMAGE_URL: nft.imageUrl || '',
      NFT_URL: nftUrl,
      SHARE_MESSAGE: shareMessage || `Check out this vinyl on Vinyl Funders!`,
      GENRE: nft.genre || '',
      RECORD_SIZE: nft.recordSize || '',
      PRICE: nft.price ? `£${Number(nft.price).toFixed(2)}` : '',
      RECORD_LABEL: nft.recordLabel || '',
      DESCRIPTION: nft.description || ''
    };

    // Log the exact parameters being sent
    console.log('Sending Brevo social share email with parameters:', {
      timestamp: new Date().toISOString(),
      templateId: EMAIL_TEMPLATES.SOCIAL_SHARE,
      recipient: recipientEmail,
      params: emailParams,
      apiKeyLength: process.env.BREVO_API_KEY?.length
    });

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: recipientEmail }];
    sendSmtpEmail.templateId = EMAIL_TEMPLATES.SOCIAL_SHARE;
    sendSmtpEmail.params = emailParams;
    
    // Add sender information
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'Vinyl Funders',
      email: process.env.BREVO_SENDER_EMAIL || 'no-reply@vinylfunders.co.uk'
    };

    // Add tracking
    sendSmtpEmail.tags = ['social_share'];
    sendSmtpEmail.headers = {
      'X-Mailin-Tag': 'social_share',
      'X-Mailin-Custom': `nft_${nft.id}`,
      'X-Mailin-Track': 'true',
      'X-Mailin-Track-Click': 'true',
      'X-Mailin-Track-Open': 'true'
    };

    // Send the email
    const result = await emailsApi.sendTransacEmail(sendSmtpEmail);
    
    // Log successful send
    console.log('Social share email sent successfully:', {
      timestamp: new Date().toISOString(),
      recipient: recipientEmail,
      templateId: EMAIL_TEMPLATES.SOCIAL_SHARE,
      nftId: nft.id,
      emailParams: Object.keys(emailParams),
      response: result.body
    });

    return result.body;
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error sending social share email:', {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        response: error.response?.body,
        stack: error.stack
      },
      emailDetails: {
        recipient: recipientEmail,
        templateId: EMAIL_TEMPLATES.SOCIAL_SHARE,
        nftId: nft.id,
        senderName
      },
      requestBody: error.response?.request?.body,
      apiKeyPresent: !!process.env.BREVO_API_KEY
    });
    return null;
  }
}

/**
 * Create a new email list in Brevo for a presale campaign
 */
export async function createPresaleList(presaleName: string, nftId: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('BREVO_API_KEY not found');
    return { success: false, error: 'Brevo API key not configured' };
  }

  try {
    const listData = {
      name: `Presale - ${presaleName}`,
      folderId: 1 // Optional: organize in folders
    };

    const response = await fetch('https://api.brevo.com/v3/contacts/lists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(listData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create Brevo list:', error);
      return { success: false, error: `Failed to create list: ${error}` };
    }

    const result = await response.json();
    console.log(`✅ Created Brevo list for presale: ${presaleName}`, result);

    return {
      success: true,
      listId: result.id,
      listName: result.name,
    };
  } catch (error) {
    console.error('Error creating Brevo list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add a contact to a specific Brevo list (for presale buyers)
 */
export async function addContactToPresaleList({
  email,
  firstName,
  lastName,
  listId,
  presaleName,
  nftName,
  purchaseAmount,
  format,
}: {
  email: string;
  firstName?: string;
  lastName?: string;
  listId: number;
  presaleName: string;
  nftName: string;
  purchaseAmount: number;
  format: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('BREVO_API_KEY not found');
    return { success: false, error: 'Brevo API key not configured' };
  }

  try {
    const contactData = {
      updateEnabled: true,
      email: email,
      emailBlacklisted: false,
      smsBlacklisted: false,
      attributes: {
        FIRSTNAME: firstName || '',
        LASTNAME: lastName || '',
        PRESALE_CAMPAIGN: presaleName,
        NFT_NAME: nftName,
        PURCHASE_AMOUNT: purchaseAmount,
        FORMAT: format,
        PURCHASE_DATE: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      },
      listIds: [listId],
    };

    const response = await fetch('https://api.brevo.com/v3/contacts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to add contact to Brevo list:', error);
      return { success: false, error: `Failed to add contact: ${error}` };
    }

    const result = await response.json();
    console.log(`✅ Added contact to Brevo presale list: ${email} -> List ${listId}`);

    return {
      success: true,
      contactId: result.id,
    };
  } catch (error) {
    console.error('Error adding contact to Brevo list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get or create a Brevo list for a presale (used when first buyer comes in)
 */
export async function getOrCreatePresaleList(presaleName: string, nftId: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('BREVO_API_KEY not found');
    return { success: false, error: 'Brevo API key not configured' };
  }

  try {
    const listName = `Presale - ${presaleName}`;

    // First, check if list exists
    const response = await fetch('https://api.brevo.com/v3/contacts/lists', {
      headers: { 'api-key': apiKey },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch Brevo lists:', error);
      return { success: false, error: `Failed to fetch lists: ${error}` };
    }

    const listsData = await response.json();
    const existingList = listsData.lists?.find((list: any) => list.name === listName);

    if (existingList) {
      console.log(`📋 Found existing Brevo list: ${listName} (ID: ${existingList.id})`);
      return {
        success: true,
        listId: existingList.id,
        listName: existingList.name,
        isNew: false,
      };
    }

    // Create new list if it doesn't exist
    const createResult = await createPresaleList(presaleName, nftId);
    if (createResult.success) {
      return {
        success: true,
        listId: createResult.listId,
        listName: createResult.listName,
        isNew: true,
      };
    }

    return createResult;
  } catch (error) {
    console.error('Error getting or creating Brevo list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Migrate existing users to proper Brevo tier lists
 * This should be run once to fix existing users who weren't assigned to tier lists
 */
export async function migrateUsersToTierLists() {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Brevo API key is not set. Skipping user migration.');
    return { success: false, error: 'API key not configured' };
  }

  try {
    // Import prisma here to avoid circular dependencies
    const { prisma } = await import('@/lib/prisma');
    
    // Get all users with their subscription tiers
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
      },
      where: {
        subscriptionStatus: 'active'
      }
    });

    console.log(`🔄 Migrating ${users.length} users to proper Brevo tier lists...`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const nameParts = user.name?.split(' ') || [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const success = await updateContactSubscriptionTier(
          user.email, 
          user.subscriptionTier || 'starter',
          firstName, 
          lastName
        );

        if (success) {
          successCount++;
          console.log(`✅ Migrated: ${user.email} (${user.subscriptionTier})`);
        } else {
          errorCount++;
          console.error(`❌ Failed to migrate: ${user.email}`);
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating user ${user.email}:`, error);
      }
    }

    console.log(`🎉 Migration complete: ${successCount} successful, ${errorCount} errors`);
    
    return {
      success: true,
      totalUsers: users.length,
      successCount,
      errorCount
    };

  } catch (error) {
    console.error('Error in user migration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function updateContactSubscriptionTier(
  email: string, 
  newTier: string, 
  firstName?: string, 
  lastName?: string
) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Brevo API key is not set. Skipping contact tier update.');
    return false;
  }

  try {
    console.log(`🔄 Updating contact tier: ${email} -> ${newTier}`);
    
    // First, remove user from all tier-specific lists using direct API calls
    const allTierLists = [
      BREVO_CONFIG.LISTS.STARTER_TIER, // 10 (starter - also used for basic)
      BREVO_CONFIG.LISTS.PLUS_TIER,    // 11 (plus)
      BREVO_CONFIG.LISTS.GOLD_TIER,    // 12 (gold)
    ];
    
    // Remove from all tier lists using direct API
    for (const listId of allTierLists) {
      try {
        const response = await fetch(`https://api.brevo.com/v3/contacts/lists/${listId}/contacts/remove`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.BREVO_API_KEY!,
          },
          body: JSON.stringify({
            emails: [email]
          }),
        });

        if (response.ok) {
          console.log(`➖ Removed ${email} from list ${listId}`);
        } else if (response.status === 404) {
          // Contact wasn't in this list, that's fine
          console.log(`ℹ️ ${email} wasn't in list ${listId} (expected)`);
        } else {
          console.warn(`⚠️ Failed to remove ${email} from list ${listId}: ${response.status}`);
        }
      } catch (error: any) {
        console.warn(`Warning removing ${email} from list ${listId}:`, error.message);
      }
    }
    
    // Now add to the correct tier list and update attributes
    const attributes = {
      SUBSCRIPTION_TIER: newTier.toUpperCase(),
      SUBSCRIPTION_STATUS: 'ACTIVE',
      ...(firstName && { FIRSTNAME: firstName }),
      ...(lastName && { LASTNAME: lastName }),
    };
    
    // Determine correct list for new tier
    const listIds = [BREVO_CONFIG.LISTS.ALL_USERS]; // Always in all users
    const tier = newTier.toLowerCase();
    switch (tier) {
      case 'basic':
      case 'free':
        listIds.push(BREVO_CONFIG.LISTS.STARTER_TIER);
        break;
      case 'starter':
        listIds.push(BREVO_CONFIG.LISTS.STARTER_TIER);
        break;
      case 'plus':
        listIds.push(BREVO_CONFIG.LISTS.PLUS_TIER);
        break;
      case 'gold':
        listIds.push(BREVO_CONFIG.LISTS.GOLD_TIER);
        break;
    }
    
    console.log(`➕ Adding ${email} to lists: ${listIds.join(', ')} for tier: ${newTier}`);
    
    // Update contact with new attributes and correct list
    const createContact = new SibApiV3Sdk.CreateContact();
    createContact.email = email;
    createContact.attributes = attributes;
    createContact.listIds = listIds;
    createContact.updateEnabled = true;

    await contactsApi.createContact(createContact);
    console.log(`✅ Successfully updated contact tier: ${email} -> ${newTier}`);
    return true;
    
  } catch (error: any) {
    console.error('Error updating contact subscription tier:', {
      email,
      newTier,
      error: error.message,
      code: error.code,
      response: error.response?.body,
    });
    return false;
  }
}

/**
 * Send presale success email to buyer (template 18)
 */
export async function sendPresaleSuccessBuyerEmail({
  buyerEmail,
  buyerName,
  projectName,
  artistName,
  targetOrders,
  actualOrders,
  projectUrl,
  orderAmount,
  orderQuantity
}: {
  buyerEmail: string;
  buyerName: string;
  projectName: string;
  artistName: string;
  targetOrders: number;
  actualOrders: number;
  projectUrl: string;
  orderAmount: number;
  orderQuantity: number;
}): Promise<SibApiV3Sdk.CreateSmtpEmail | null> {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Brevo API key is not set. Skipping presale success buyer email.');
    return null;
  }

  try {
    console.log('Presale success buyer email preparation:', {
      timestamp: new Date().toISOString(),
      recipient: buyerEmail,
      buyerName,
      projectName,
      artistName,
      templateId: EMAIL_TEMPLATES.PRESALE_SUCCESS_BUYER
    });

    const emailParams = {
      BUYER_NAME: String(buyerName || 'Music Fan').trim(),
      PROJECT_NAME: String(projectName || 'Vinyl Release').trim(),
      ARTIST_NAME: String(artistName || 'Artist').trim(),
      TARGET_ORDERS: targetOrders.toString(),
      ACTUAL_ORDERS: actualOrders.toString(),
      PROJECT_URL: projectUrl,
      ORDER_AMOUNT: `£${orderAmount.toFixed(2)}`,
      ORDER_QUANTITY: orderQuantity.toString(),
      SUCCESS_MESSAGE: `Great news! The vinyl presale for "${projectName}" has reached its target and will be manufactured.`
    };

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: buyerEmail }];
    sendSmtpEmail.templateId = EMAIL_TEMPLATES.PRESALE_SUCCESS_BUYER;
    sendSmtpEmail.params = emailParams;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'Vinyl Funders',
      email: process.env.BREVO_SENDER_EMAIL || 'no-reply@vinylfunders.co.uk'
    };
    sendSmtpEmail.tags = ['presale_success_buyer'];

    const result = await emailsApi.sendTransacEmail(sendSmtpEmail);
    console.log('Presale success buyer email sent successfully:', {
      timestamp: new Date().toISOString(),
      recipient: buyerEmail,
      templateId: EMAIL_TEMPLATES.PRESALE_SUCCESS_BUYER,
      projectName
    });

    return result.body;
  } catch (error) {
    console.error('Failed to send presale success buyer email:', {
      timestamp: new Date().toISOString(),
      recipient: buyerEmail,
      error: error instanceof Error ? error.message : 'Unknown error',
      templateId: EMAIL_TEMPLATES.PRESALE_SUCCESS_BUYER,
      projectName
    });
    return null;
  }
}

/**
 * Send presale success email to artist (template 19)
 */
export async function sendPresaleSuccessArtistEmail({
  artistEmail,
  artistName,
  projectName,
  targetOrders,
  actualOrders,
  projectUrl,
  totalRevenue,
  manufacturingTimeline
}: {
  artistEmail: string;
  artistName: string;
  projectName: string;
  targetOrders: number;
  actualOrders: number;
  projectUrl: string;
  totalRevenue: number;
  manufacturingTimeline?: string;
}): Promise<SibApiV3Sdk.CreateSmtpEmail | null> {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Brevo API key is not set. Skipping presale success artist email.');
    return null;
  }

  try {
    console.log('Presale success artist email preparation:', {
      timestamp: new Date().toISOString(),
      recipient: artistEmail,
      artistName,
      projectName,
      templateId: EMAIL_TEMPLATES.PRESALE_SUCCESS_ARTIST
    });

    const emailParams = {
      ARTIST_NAME: String(artistName || 'Artist').trim(),
      PROJECT_NAME: String(projectName || 'Vinyl Release').trim(),
      TARGET_ORDERS: targetOrders.toString(),
      ACTUAL_ORDERS: actualOrders.toString(),
      PROJECT_URL: projectUrl,
      TOTAL_REVENUE: `£${totalRevenue.toFixed(2)}`,
      MANUFACTURING_TIMELINE: manufacturingTimeline || '6-8 weeks',
      SUCCESS_MESSAGE: `Congratulations! Your vinyl presale "${projectName}" has reached its target of ${targetOrders} orders and will now be manufactured.`
    };

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: artistEmail }];
    sendSmtpEmail.templateId = EMAIL_TEMPLATES.PRESALE_SUCCESS_ARTIST;
    sendSmtpEmail.params = emailParams;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'Vinyl Funders',
      email: process.env.BREVO_SENDER_EMAIL || 'no-reply@vinylfunders.co.uk'
    };
    sendSmtpEmail.tags = ['presale_success_artist'];

    const result = await emailsApi.sendTransacEmail(sendSmtpEmail);
    console.log('Presale success artist email sent successfully:', {
      timestamp: new Date().toISOString(),
      recipient: artistEmail,
      templateId: EMAIL_TEMPLATES.PRESALE_SUCCESS_ARTIST,
      projectName
    });

    return result.body;
  } catch (error) {
    console.error('Failed to send presale success artist email:', {
      timestamp: new Date().toISOString(),
      recipient: artistEmail,
      error: error instanceof Error ? error.message : 'Unknown error',
      templateId: EMAIL_TEMPLATES.PRESALE_SUCCESS_ARTIST,
      projectName
    });
    return null;
  }
}

/**
 * Send presale failed email to buyer (template 21)
 */
export async function sendPresaleFailedBuyerEmail({
  buyerEmail,
  buyerName,
  projectName,
  artistName,
  targetOrders,
  actualOrders,
  projectUrl,
  refundAmount,
  refundTimeline
}: {
  buyerEmail: string;
  buyerName: string;
  projectName: string;
  artistName: string;
  targetOrders: number;
  actualOrders: number;
  projectUrl: string;
  refundAmount: number;
  refundTimeline?: string;
}): Promise<SibApiV3Sdk.CreateSmtpEmail | null> {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Brevo API key is not set. Skipping presale failed buyer email.');
    return null;
  }

  try {
    console.log('Presale failed buyer email preparation:', {
      timestamp: new Date().toISOString(),
      recipient: buyerEmail,
      buyerName,
      projectName,
      templateId: EMAIL_TEMPLATES.PRESALE_FAILED_BUYER
    });

    const emailParams = {
      BUYER_NAME: String(buyerName || 'Music Fan').trim(),
      PROJECT_NAME: String(projectName || 'Vinyl Release').trim(),
      ARTIST_NAME: String(artistName || 'Artist').trim(),
      TARGET_ORDERS: targetOrders.toString(),
      ACTUAL_ORDERS: actualOrders.toString(),
      ORDERS_NEEDED: Math.max(0, targetOrders - actualOrders).toString(),
      PROJECT_URL: projectUrl,
      REFUND_AMOUNT: `£${refundAmount.toFixed(2)}`,
      REFUND_TIMELINE: refundTimeline || '5-7 business days',
      DIGITAL_AVAILABLE: 'Yes - now available as digital download',
      FAILED_MESSAGE: `Unfortunately, the vinyl presale for "${projectName}" did not reach its target of ${targetOrders} orders and will not be manufactured. Your refund is being processed.`
    };

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: buyerEmail }];
    sendSmtpEmail.templateId = EMAIL_TEMPLATES.PRESALE_FAILED_BUYER;
    sendSmtpEmail.params = emailParams;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'Vinyl Funders',
      email: process.env.BREVO_SENDER_EMAIL || 'no-reply@vinylfunders.co.uk'
    };
    sendSmtpEmail.tags = ['presale_failed_buyer'];

    const result = await emailsApi.sendTransacEmail(sendSmtpEmail);
    console.log('Presale failed buyer email sent successfully:', {
      timestamp: new Date().toISOString(),
      recipient: buyerEmail,
      templateId: EMAIL_TEMPLATES.PRESALE_FAILED_BUYER,
      projectName
    });

    return result.body;
  } catch (error) {
    console.error('Failed to send presale failed buyer email:', {
      timestamp: new Date().toISOString(),
      recipient: buyerEmail,
      error: error instanceof Error ? error.message : 'Unknown error',
      templateId: EMAIL_TEMPLATES.PRESALE_FAILED_BUYER,
      projectName
    });
    return null;
  }
}

export async function sendPresaleToDigitalEmail({
  creatorEmail,
  creatorName,
  projectName,
  targetOrders,
  actualOrders,
  endDate,
  digitalPrice,
  projectUrl,
  conversionReason
}: {
  creatorEmail: string;
  creatorName: string;
  projectName: string;
  targetOrders: number;
  actualOrders: number;
  endDate: Date;
  digitalPrice: number;
  projectUrl: string;
  conversionReason?: 'time_expired' | 'threshold_reached' | 'manual';
}): Promise<SibApiV3Sdk.CreateSmtpEmail | null> {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Brevo API key is not set. Skipping email send.');
    return null;
  }

  try {
    console.log('Presale to digital email preparation:', {
      timestamp: new Date().toISOString(),
      recipient: creatorEmail,
      creatorName,
      projectName,
      targetOrders,
      actualOrders,
      conversionReason,
      templateId: EMAIL_TEMPLATES.PRESALE_TO_DIGITAL
    });

    // Determine conversion status and messaging
    const thresholdMet = actualOrders >= targetOrders;
    const conversionStatus = thresholdMet ? 'SUCCESS' : 'TIME_EXPIRED';
    const conversionMessage = thresholdMet 
      ? 'Congratulations! Your vinyl presale was successful and is now being manufactured.'
      : 'Your vinyl presale period has ended and is now available as a digital release.';

    // Prepare email parameters
    const emailParams = {
      CREATOR_NAME: String(creatorName || 'Artist').trim(),
      PROJECT_NAME: String(projectName || 'Your Project').trim(),
      TARGET_ORDERS: targetOrders.toString(),
      ACTUAL_ORDERS: actualOrders.toString(),
      END_DATE: endDate.toLocaleDateString('en-GB'),
      DIGITAL_PRICE: `£${digitalPrice.toFixed(2)}`,
      PROJECT_URL: projectUrl,
      ORDERS_NEEDED: Math.max(0, targetOrders - actualOrders).toString(),
      COMPLETION_PERCENTAGE: Math.round((actualOrders / targetOrders) * 100).toString(),
      CONVERSION_STATUS: conversionStatus,
      CONVERSION_MESSAGE: conversionMessage,
      THRESHOLD_MET: thresholdMet ? 'YES' : 'NO'
    };

    console.log('Sending Brevo presale to digital email with parameters:', {
      timestamp: new Date().toISOString(),
      templateId: EMAIL_TEMPLATES.PRESALE_TO_DIGITAL,
      recipient: creatorEmail,
      params: emailParams,
      apiKeyLength: process.env.BREVO_API_KEY?.length
    });

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: creatorEmail }];
    sendSmtpEmail.templateId = EMAIL_TEMPLATES.PRESALE_TO_DIGITAL;
    sendSmtpEmail.params = emailParams;
    
    // Add sender information
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'Vinyl Funders',
      email: process.env.BREVO_SENDER_EMAIL || 'no-reply@vinylfunders.co.uk'
    };

    // Add tracking
    sendSmtpEmail.tags = ['presale_to_digital'];
    sendSmtpEmail.headers = {
      'X-Mailin-Tag': 'presale_to_digital',
      'X-Mailin-Custom': `project_${projectName}`,
      'X-Mailin-Track': 'true',
      'X-Mailin-Track-Click': 'true',
      'X-Mailin-Track-Open': 'true'
    };

    // Send the email
    const result = await emailsApi.sendTransacEmail(sendSmtpEmail);
    
    console.log('Presale to digital email sent successfully:', {
      timestamp: new Date().toISOString(),
      recipient: creatorEmail,
      templateId: EMAIL_TEMPLATES.PRESALE_TO_DIGITAL,
      projectName,
      conversionStatus,
      emailParams: Object.keys(emailParams),
      response: result.body
    });

    return result.body;
  } catch (error: any) {
    console.error('Error sending presale to digital email:', {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        response: error.response?.body,
        stack: error.stack
      },
      emailDetails: {
        recipient: creatorEmail,
        templateId: EMAIL_TEMPLATES.PRESALE_TO_DIGITAL,
        projectName,
        creatorName
      },
      apiKeyPresent: !!process.env.BREVO_API_KEY
    });
    return null;
  }
}

/**
 * Send order confirmation email (template 4)
 */
export async function sendOrderConfirmationEmail({
  customerEmail,
  customerName,
  orderId,
  productName,
  amount,
  orderQuantity,
  format,
  projectUrl
}: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  productName: string;
  amount: number;
  orderQuantity: number;
  format: string;
  projectUrl?: string;
}): Promise<SibApiV3Sdk.CreateSmtpEmail | null> {
  // Enhanced environment variable checking
  const envCheck = {
    brevoApiKey: !!process.env.BREVO_API_KEY,
    brevoSenderName: !!process.env.BREVO_SENDER_NAME,
    brevoSenderEmail: !!process.env.BREVO_SENDER_EMAIL
  };
  
  console.log('Order confirmation email environment check:', {
    ...envCheck,
    allRequired: envCheck.brevoApiKey && envCheck.brevoSenderName && envCheck.brevoSenderEmail
  });
  
  if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY is not set. Order confirmation email cannot be sent.');
    return null;
  }
  
  if (!process.env.BREVO_SENDER_NAME || !process.env.BREVO_SENDER_EMAIL) {
    console.warn('⚠️ BREVO_SENDER_NAME or BREVO_SENDER_EMAIL not set. Using defaults.');
  }

  try {
    console.log('Order confirmation email preparation:', {
      timestamp: new Date().toISOString(),
      recipient: customerEmail,
      customerName,
      orderId,
      productName,
      templateId: EMAIL_TEMPLATES.ORDER_CONFIRMATION
    });

    const emailParams = {
      CUSTOMER_NAME: String(customerName || 'Valued Customer').trim(),
      ORDER_ID: String(orderId).trim(),
      PRODUCT_NAME: String(productName).trim(),
      AMOUNT: `£${amount.toFixed(2)}`,
      ORDER_QUANTITY: orderQuantity.toString(),
      FORMAT: format.toUpperCase(),
      PROJECT_URL: projectUrl || '',
      ORDER_TYPE: format === 'digital' ? 'Digital Download' : 'Vinyl Presale'
    };

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: customerEmail }];
    sendSmtpEmail.templateId = EMAIL_TEMPLATES.ORDER_CONFIRMATION;
    sendSmtpEmail.params = emailParams;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'Vinyl Funders',
      email: process.env.BREVO_SENDER_EMAIL || 'no-reply@vinylfunders.co.uk'
    };
    sendSmtpEmail.tags = ['order_confirmation'];

    console.log('🚀 Attempting to send order confirmation email...');
    const result = await emailsApi.sendTransacEmail(sendSmtpEmail);
    
    console.log('✅ Order confirmation email sent successfully:', {
      timestamp: new Date().toISOString(),
      recipient: customerEmail,
      templateId: EMAIL_TEMPLATES.ORDER_CONFIRMATION,
      orderId,
      productName,
      messageId: result.body?.messageId || 'Unknown',
      resultStatus: result.response?.statusCode || 'Unknown'
    });

    return result.body;
  } catch (error: any) {
    console.error('❌ Error sending order confirmation email:', {
      timestamp: new Date().toISOString(),
      error: error.message,
      errorCode: error.code || 'Unknown',
      errorStatus: error.status || 'Unknown',
      recipient: customerEmail,
      templateId: EMAIL_TEMPLATES.ORDER_CONFIRMATION,
      orderId,
      productName,
      apiKeyPresent: !!process.env.BREVO_API_KEY,
      senderConfigured: !!(process.env.BREVO_SENDER_NAME && process.env.BREVO_SENDER_EMAIL)
    });
    return null;
  }
}

export async function sendAbandonedCartEmail({
  userEmail,
  userName,
  cartItems,
  cartUrl
}: {
  userEmail: string;
  userName: string;
  cartItems: Array<{ name: string; price: number; format: string }>;
  cartUrl: string;
}): Promise<SibApiV3Sdk.CreateSmtpEmail | null> {
  if (!process.env.BREVO_API_KEY) {
    console.warn('Brevo API key is not set. Skipping email send.');
    return null;
  }

  try {
    console.log('Abandoned cart email preparation:', {
      timestamp: new Date().toISOString(),
      recipient: userEmail,
      userName,
      itemCount: cartItems.length,
      templateId: EMAIL_TEMPLATES.ABANDONED_CART
    });

    // Calculate total value
    const totalValue = cartItems.reduce((sum, item) => sum + item.price, 0);
    
    // Create product list
    const productNames = cartItems.map(item => `${item.name} (${item.format})`).join(', ');

    // Prepare email parameters
    const emailParams = {
      USER_NAME: String(userName || 'Music Lover').trim(),
      PRODUCT_NAME: productNames,
      CART_URL: cartUrl,
      TOTAL_VALUE: `£${totalValue.toFixed(2)}`,
      ITEM_COUNT: cartItems.length.toString(),
      DISCOUNT_CODE: 'COMEBACK10' // Simple 10% discount
    };

    console.log('Sending abandoned cart email with parameters:', {
      timestamp: new Date().toISOString(),
      templateId: EMAIL_TEMPLATES.ABANDONED_CART,
      recipient: userEmail,
      params: emailParams,
      apiKeyLength: process.env.BREVO_API_KEY?.length
    });

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: userEmail }];
    sendSmtpEmail.templateId = EMAIL_TEMPLATES.ABANDONED_CART;
    sendSmtpEmail.params = emailParams;
    
    // Add sender information
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'Vinyl Funders',
      email: process.env.BREVO_SENDER_EMAIL || 'no-reply@vinylfunders.co.uk'
    };

    // Add tracking
    sendSmtpEmail.tags = ['abandoned_cart'];
    sendSmtpEmail.headers = {
      'X-Mailin-Tag': 'abandoned_cart',
      'X-Mailin-Custom': `user_${userEmail}`,
      'X-Mailin-Track': 'true',
      'X-Mailin-Track-Click': 'true',
      'X-Mailin-Track-Open': 'true'
    };

    // Send the email
    const result = await emailsApi.sendTransacEmail(sendSmtpEmail);
    
    console.log('Abandoned cart email sent successfully:', {
      timestamp: new Date().toISOString(),
      recipient: userEmail,
      templateId: EMAIL_TEMPLATES.ABANDONED_CART,
      itemCount: cartItems.length,
      totalValue,
      response: result.body
    });

    return result.body;
  } catch (error: any) {
    console.error('Error sending abandoned cart email:', {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        response: error.response?.body,
        stack: error.stack
      },
      emailDetails: {
        recipient: userEmail,
        templateId: EMAIL_TEMPLATES.ABANDONED_CART,
        userName
      },
      apiKeyPresent: !!process.env.BREVO_API_KEY
    });
    return null;
  }
}

// Export template IDs for use in the application
export const EMAIL_TEMPLATES = BREVO_CONFIG.TEMPLATES;
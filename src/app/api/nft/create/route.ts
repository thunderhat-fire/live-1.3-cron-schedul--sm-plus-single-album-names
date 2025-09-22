import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPresaleList } from '@/lib/brevo';
import { Prisma } from '@prisma/client';
import { sendVinylCreationEmail } from '@/lib/brevo';
// Cloudinary helper (default export already configured)
import { moveObject, getPublicUrl } from '@/lib/wasabi';
import { radioService } from '@/lib/radio/radioService';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        payAsYouGoCredits: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can create presales
    const isPaidTier = user.subscriptionTier && 
      ['starter', 'plus', 'gold'].includes(user.subscriptionTier) &&
      user.subscriptionStatus === 'active';

    // For starter tier users, check if they have pay-as-you-go credits
    if (user.subscriptionTier === 'starter') {
      if (user.payAsYouGoCredits <= 0) {
        return NextResponse.json({ 
          error: 'Pay-as-you-go credit required',
          details: 'You need to purchase a pay-as-you-go credit (£30) to create presales on the starter tier.',
          requiresPayAsYouGo: true,
          subscriptionStatus: {
            currentTier: user.subscriptionTier,
            subscriptionStatus: user.subscriptionStatus,
            payAsYouGoCredits: user.payAsYouGoCredits,
          }
        }, { status: 403 });
      }
    } else if (user.subscriptionTier === 'basic') {
      // Basic tier users with pay-as-you-go credits can create presales
      if (user.payAsYouGoCredits <= 0) {
        return NextResponse.json({ 
          error: 'Pay-as-you-go credit required',
          details: 'You need to purchase a pay-as-you-go credit (£30) to create presales.',
          requiresPayAsYouGo: true,
          subscriptionStatus: {
            currentTier: user.subscriptionTier,
            subscriptionStatus: user.subscriptionStatus,
            payAsYouGoCredits: user.payAsYouGoCredits,
          }
        }, { status: 403 });
      }
    } else if (!isPaidTier) {
      // For other non-paid tiers, require active subscription
      return NextResponse.json({ 
        error: 'Paid subscription required',
        details: 'You must upgrade to a paid subscription tier (Starter, Plus, or Gold) to create presales. Visit the subscription page to upgrade.',
        requiresSubscription: true,
        subscriptionStatus: {
          currentTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
        }
      }, { status: 403 });
    }

    const data = await request.json();

    // Create NFT with tracks in a transaction
    const result = await prisma.$transaction(async (tx) => {
      try {
        console.log('Starting NFT creation transaction...');
        
        // Create NFT first with provided image URLs
        let price = 26;
        if (data.targetOrders === 200) price = 22;
        if (data.targetOrders === 500) price = 20;
        
        // Set preview audio URL from the first track of side A
        const previewAudioUrl = data.sideATracks && data.sideATracks.length > 0 
          ? data.sideATracks[0].url 
          : null;
        
        // Create Brevo list for this presale
        console.log('Creating Brevo list for presale:', data.name);
        const brevoListResult = await createPresaleList(data.name, 'temp-id');
        
        let brevoListId = null;
        if (brevoListResult.success) {
          brevoListId = brevoListResult.listId;
          console.log(`✅ Created Brevo list with ID: ${brevoListId}`);
        } else {
          console.warn('Failed to create Brevo list:', brevoListResult.error);
          // Don't fail the entire presale creation if Brevo fails
        }
        
        const nft = await tx.nFT.create({
          data: {
            name: data.name,
            description: data.description,
            externalLink: data.externalLink,
            royalties: data.royalties,
            size: data.size,
            properties: data.properties,
            instantSalePrice: data.instantSalePrice,
            isUnlockable: data.isUnlockable,
            isInstantSale: data.isInstantSale,
            genre: data.genre,
            recordSize: data.recordSize,
            recordLabel: data.recordLabel || null,
            sideAImage: data.sideAImage,
            sideBImage: data.sideBImage,
            price: price,
            endDate: new Date(data.endDate),
            userId: user.id,
            currentOrders: 0, // Start with 0 orders
            targetOrders: data.targetOrders || 100,
            isVinylPresale: true,
            addressName: data.addressName,
            addressStreet: data.addressStreet,
            addressCity: data.addressCity,
            addressPostcode: data.addressPostcode,
            addressCountry: data.addressCountry,
            previewAudioUrl: previewAudioUrl, // Set preview audio for radio eligibility
            brevoListId: brevoListId, // Store the Brevo list ID
          }
        });

        console.log('Created NFT:', nft);

        // Create tracks for side A
        let sideATracks: any[] = [];
        if (data.sideATracks && data.sideATracks.length > 0) {
          for (const track of data.sideATracks) {
            const createdTrack = await tx.track.create({
              data: {
                name: track.name,
                url: track.url,
                duration: track.duration,
                isrc: track.isrc || null,
                side: 'A',
                nftAId: nft.id
              }
            });
            sideATracks.push(createdTrack);
          }
          console.log('Created side A tracks:', sideATracks.length);
        }

        // Create tracks for side B
        let sideBTracks: any[] = [];
        if (data.sideBTracks && data.sideBTracks.length > 0) {
          for (const track of data.sideBTracks) {
            const createdTrack = await tx.track.create({
              data: {
                name: track.name,
                url: track.url,
                duration: track.duration,
                isrc: track.isrc || null,
                side: 'B',
                nftBId: nft.id
              }
            });
            sideBTracks.push(createdTrack);
          }
          console.log('Created side B tracks:', sideBTracks.length);
        }

        // Consume pay-as-you-go credit for starter and basic tier users
        if (user.subscriptionTier === 'starter' || user.subscriptionTier === 'basic') {
          await tx.user.update({
            where: { id: user.id },
            data: {
              payAsYouGoCredits: {
                decrement: 1
              }
            }
          });
          console.log(`✅ Consumed pay-as-you-go credit for user ${user.id}. Remaining credits: ${user.payAsYouGoCredits - 1}`);
        }

        console.log('Transaction completed successfully');
        return {
          nft: {
            ...nft,
            sideATracks,
            sideBTracks,
            brevoListId // Include in response
          }
        };
      } catch (error) {
        console.error('Error in NFT creation transaction:', error);
        throw error;
      }
    });

    /*
     * ------------------------------------------------------
     * Move uploaded audio assets from the temporary draft
     * folder (tmp-<draftId>) into a final folder that uses
     * the real NFT id. Example:
     *   master/tmp-abc123/side-a/track1.mp3  ->
     *   master/<nftId>/side-a/track1.mp3
     * This keeps the Cloudinary library tree tidy and
     * prevents filename collisions for future drafts.
     * ------------------------------------------------------
     */

    try {
      const movePromises: Promise<void>[] = [];

      // Helper to extract S3/Wasabi object key from the public URL
      const extractKey = (urlStr: string): string | null => {
        try {
          const url = new URL(urlStr);
          return url.pathname.replace(/^\//, ''); // remove leading slash
        } catch (err) {
          console.error('Error extracting key:', err);
          return null;
        }
      };

      const processTrack = (track: any, side: 'A' | 'B') => {
        movePromises.push(
          (async () => {
            const publicId = extractKey(track.url);
            if (!publicId) return;

            const filename = publicId.split('/').pop();
            if (!filename) return;

            const newPublicId = `master/${result.nft.id}/side-${side.toLowerCase()}/${filename}`;

            try {
              await moveObject(publicId, newPublicId);

              const secureUrl = getPublicUrl(newPublicId);

              // Persist new URL in DB
              await prisma.track.update({
                where: { id: track.id },
                data: { url: secureUrl }
              });

              // Mutate local object so response contains correct URLs
              track.url = secureUrl;

              // Update preview audio if this is the first Side-A track
              if (side === 'A' && result.nft.sideATracks[0]?.id === track.id) {
                await prisma.nFT.update({
                  where: { id: result.nft.id },
                  data: { previewAudioUrl: secureUrl }
                });
                result.nft.previewAudioUrl = secureUrl as any;
              }
            } catch (err) {
              console.error('Error renaming Cloudinary asset:', err);
            }
          })()
        );
      };

      result.nft.sideATracks.forEach((t: any) => processTrack(t, 'A'));
      result.nft.sideBTracks.forEach((t: any) => processTrack(t, 'B'));

      await Promise.all(movePromises);
      console.log('✅ Moved Cloudinary assets to final NFT folder');

      /*
       * Move artwork images (sideAImage / sideBImage) from temp folder
       */
      const artworkMoves: Promise<void>[] = [];

      const processArtwork = async (currentUrl: string | null, side: 'a' | 'b') => {
        if (!currentUrl) return;
        const publicId = extractKey(currentUrl);
        if (!publicId) return;

        // Skip if already in final location
        if (publicId.startsWith(`artwork/${result.nft.id}`)) return;

        const filename = publicId.split('/').pop();
        if (!filename) return;

        const newPublicId = `artwork/${result.nft.id}/side-${side}/${filename}`;

        try {
          await moveObject(publicId, newPublicId);

          const secureUrl = getPublicUrl(newPublicId);

          await prisma.nFT.update({
            where: { id: result.nft.id },
            data: side === 'a' ? { sideAImage: secureUrl } : { sideBImage: secureUrl }
          });

          if (side === 'a') {
            // @ts-ignore mutate local
            result.nft.sideAImage = secureUrl;
          } else {
            // @ts-ignore mutate local
            result.nft.sideBImage = secureUrl;
          }
        } catch (err) {
          console.error('Error moving artwork asset:', err);
        }
      };

      artworkMoves.push(processArtwork(result.nft.sideAImage as any, 'a'));
      artworkMoves.push(processArtwork(result.nft.sideBImage as any, 'b'));

      await Promise.all(artworkMoves);
      console.log('✅ Moved artwork images to final NFT folder');
    } catch (err) {
      console.error('Failed to move Cloudinary assets:', err);
    }

    // Send vinyl creation email (template 12)
    try {
      console.log('🔥 Sending vinyl creation email for NFT:', result.nft.id);
      const emailResult = await sendVinylCreationEmail(
        session.user.email!,
        session.user.name || 'User',
        result.nft as any
      );
      if (emailResult) {
        console.log('✅ Vinyl creation email sent successfully');
      } else {
        console.log('⚠️ Vinyl creation email not sent (API key missing or other issue)');
      }
    } catch (emailError) {
      console.error('❌ Failed to send vinyl creation email:', emailError);
      // Don't fail the entire request if email fails
    }

    // Sync with Google Merchant Center
    try {
      console.log('🛍️ Syncing NFT with Google Merchant Center:', result.nft.id);
      
      // Make internal API call to sync the product
      const merchantResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-merchant/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftId: result.nft.id,
          action: 'sync'
        }),
      });

      if (merchantResponse.ok) {
        const merchantResult = await merchantResponse.json();
        if (merchantResult.success) {
          console.log('✅ NFT synced to Google Merchant Center successfully');
        } else {
          console.log('⚠️ Google Merchant Center sync failed:', merchantResult.error);
        }
      } else {
        console.log('⚠️ Google Merchant Center sync request failed:', merchantResponse.status);
      }
    } catch (merchantError) {
      console.error('❌ Failed to sync with Google Merchant Center:', merchantError);
      // Don't fail the entire request if Google Merchant sync fails
    }

    return NextResponse.json({
      success: true,
      nft: result.nft,
      brevoListId: result.nft.brevoListId,
    });
  } catch (error) {
    console.error('Error creating NFT:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create NFT' },
      { status: 500 }
    );
  }
} 
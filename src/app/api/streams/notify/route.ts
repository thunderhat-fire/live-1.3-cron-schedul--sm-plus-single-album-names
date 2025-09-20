import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as SibApiV3Sdk from '@sendinblue/client';

// Initialize Brevo API client
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
const contactsApi = new SibApiV3Sdk.ContactsApi();

brevoClient.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');
contactsApi.setApiKey(SibApiV3Sdk.ContactsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { streamId, emails, authorName, streamTitle } = await request.json();

    // Validate input
    if (!streamId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return new NextResponse('Invalid input', { status: 400 });
    }

    // Create email content
    const emailContent = {
      sender: {
        name: authorName,
        email: process.env.NEXT_PUBLIC_APP_EMAIL!,
      },
      to: emails.map(email => ({ email })),
      subject: `${authorName} is going live: ${streamTitle}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${authorName} is going live!</h2>
          <p>Join us for a live stream: ${streamTitle}</p>
          <p>Click the button below to watch:</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/stream/${streamId}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            Watch Live Stream
          </a>
          <p style="color: #666; font-size: 14px;">
            This email was sent because you were invited to watch this live stream.
          </p>
        </div>
      `,
    };

    // Send emails
    const result = await brevoClient.sendTransacEmail(emailContent);

    // Add contacts to Brevo list
    const createContactPromises = emails.map(email => 
      contactsApi.createContact({
        email,
        attributes: {
          STREAM_ID: streamId,
          AUTHOR_NAME: authorName,
          STREAM_TITLE: streamTitle,
        },
        listIds: [parseInt(process.env.BREVO_LIST_ID!)]
      }).catch(err => {
        console.error(`Failed to add contact ${email}:`, err);
        return null;
      })
    );

    await Promise.all(createContactPromises);

    return NextResponse.json({
      success: true,
      sentCount: emails.length,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
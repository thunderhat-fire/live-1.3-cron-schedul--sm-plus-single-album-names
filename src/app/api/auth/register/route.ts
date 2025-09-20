import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { addOrUpdateContact, sendTransactionalEmail, EMAIL_TEMPLATES } from '@/lib/brevo';
import { createOrGetConnectAccount } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
      console.log('Registration request body:', { ...body, password: '[REDACTED]' });
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      console.error('Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      console.error('Password too short');
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    try {
      const existingUser = await prisma.user.findUnique({
        where: { 
          email: email 
        },
        select: {
          id: true,
          email: true
        }
      });

      if (existingUser) {
        console.error('User already exists:', email);
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error checking existing user:', error);
      return NextResponse.json(
        { error: 'Database error while checking existing user' },
        { status: 500 }
      );
    }

    // Create user
    try {
      const hashedPassword = await hash(password, 12);
      console.log('Creating user with email:', email);
      
      // Assign a random avatar if none is provided
      const avatarNumber = Math.floor(Math.random() * 14) + 1;
      const randomAvatar = `/images/avatars/${avatarNumber}.png`;
      
      // Create user first
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          image: randomAvatar,
          isAdmin: false,
          aiMasteringCredits: 0,
          promotionalCredits: 0,
          subscriptionStatus: 'active', // Active but on basic tier
          subscriptionTier: 'basic', // Start with basic (free) tier
          // Connect fields - will be populated after account creation
          stripeOnboardingComplete: false,
          stripePayoutsEnabled: false,
          stripeChargesEnabled: false,
        }
      });

      console.log('User created successfully:', { id: user.id, email: user.email });

      // Create Stripe Connect account immediately
      console.log('Creating Stripe Connect account for user:', user.id);
      const connectResult = await createOrGetConnectAccount({
        userId: user.id,
        email: user.email,
        businessType: 'individual', // Default to individual, can be changed later
        country: 'GB', // Default to GB, can be changed later
      });

      if (!connectResult.success) {
        console.error('Failed to create Connect account:', connectResult.error);
        // Don't fail registration, but log the error
        // User can set up Connect account later through their profile
      } else {
        console.log('Connect account created successfully:', connectResult.account?.id);
      }

      // Add user to Brevo contact list as basic
      try {
        await addOrUpdateContact(email, {
          FIRSTNAME: name?.split(' ')[0] || '',
          LASTNAME: name?.split(' ').slice(1).join(' ') || '',
          SUBSCRIPTION_TIER: 'BASIC', // Start as basic (free)
          SUBSCRIPTION_STATUS: 'ACTIVE',
        });

        // Send welcome email with Connect onboarding info
        await sendTransactionalEmail(email, EMAIL_TEMPLATES.WELCOME, {
          USER_NAME: name || email,
          SUBSCRIPTION_TIER: 'BASIC'
        });
      } catch (error) {
        console.error('Failed to add contact to Brevo:', error);
        // Don't fail registration if Brevo integration fails
      }

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          subscriptionStatus: 'active',
          subscriptionTier: 'basic',
          stripeOnboardingComplete: false, // Will need to complete onboarding
        },
        message: 'Registration successful. Please log in to complete your payment setup.',
      });
    } catch (error) {
      console.error('Detailed error creating user:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        code: error instanceof Error ? (error as any).code : undefined
      });
      return NextResponse.json(
        { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
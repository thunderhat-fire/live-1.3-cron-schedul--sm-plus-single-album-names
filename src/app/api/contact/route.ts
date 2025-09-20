import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { contactLimiter, getRateLimitIdentifier } from '@/lib/rate-limit';

// Contact form schema validation
const contactSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
});

export async function POST(req: Request) {
  try {
    // Apply rate limiting
    const identifier = getRateLimitIdentifier(req);
    const { success, limit, reset, remaining } = await contactLimiter.limit(identifier);
    
    if (!success) {
      return NextResponse.json(
        { 
          message: 'Too many contact form submissions. Please try again later.',
          reset,
          limit,
          remaining
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }

    const body = await req.json();
    
    // Validate form data
    const validatedData = contactSchema.parse(body);

    // Prepare email content
    const emailContent = `
      New Contact Form Submission
      
      From: ${validatedData.fullName}
      Email: ${validatedData.email}
      
      Message:
      ${validatedData.message}
    `;

    const htmlContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${validatedData.fullName}</p>
      <p><strong>Email:</strong> ${validatedData.email}</p>
      <h3>Message:</h3>
      <p>${validatedData.message.replace(/\n/g, '<br>')}</p>
    `;

    // Send email
    await sendEmail({
      to: process.env.CONTACT_EMAIL || 'release@vinylfunders.com',
      subject: `New Contact Form Message from ${validatedData.fullName}`,
      text: emailContent,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors[0]?.message || 'Validation failed';
      return NextResponse.json({ message: errorMessage }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
} 
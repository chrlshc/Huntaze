import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    // In production, save to database
    // For now, just log it
    console.log('OnlyFans waitlist signup:', email);
    
    // Send notification email to admin
    if (process.env.WAITLIST_NOTIFY_EMAILS) {
      // TODO: Send email via SES or SMTP
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Added to waitlist' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}
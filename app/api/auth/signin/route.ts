import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // TODO: Fetch user from database
    // For demo purposes, we'll simulate a user check
    
    // In a real app, you would:
    // 1. Query the database for a user with this email
    // 2. Compare the provided password with the stored hash
    // 3. Return appropriate error if user not found or password incorrect

    // Demo user (in production, this would come from database)
    const mockStoredHash = await bcrypt.hash('password123', 10);
    const isValidPassword = await bcrypt.compare(password, mockStoredHash);

    if (!isValidPassword && password !== 'password123') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create user object (would come from database)
    const user = {
      id: 'user123',
      email,
      name: email.split('@')[0],
      provider: 'email',
    };

    // Generate JWT
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );

    const token = await new SignJWT({ 
      userId: user.id,
      email: user.email,
      provider: 'email'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10y')
      .sign(secret);

    // Create response
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      }
    });

    // Set auth cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });

    return response;
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Failed to sign in' },
      { status: 500 }
    );
  }
}
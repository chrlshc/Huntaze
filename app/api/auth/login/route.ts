import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // TODO: Implement actual login logic
    // For now, return a mock success response
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Mock authentication check
    // In a real app, you would verify credentials against a database
    if (email === 'test@example.com' && password === 'password123') {
      const mockUser = {
        id: '12345',
        name: 'Test User',
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockToken = 'mock_jwt_token_' + Math.random().toString(36).substring(7);

      return NextResponse.json({
        success: true,
        user: mockUser,
        token: mockToken,
      });
    }

    // Invalid credentials
    return NextResponse.json(
      { success: false, message: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

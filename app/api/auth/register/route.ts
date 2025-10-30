import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // TODO: Implement actual registration logic
    // For now, return a mock success response
    
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Mock user creation
    const mockUser = {
      id: Math.random().toString(36).substring(7),
      name,
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mock token
    const mockToken = 'mock_jwt_token_' + Math.random().toString(36).substring(7);

    return NextResponse.json({
      success: true,
      user: mockUser,
      token: mockToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

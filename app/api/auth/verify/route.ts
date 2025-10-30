import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // TODO: Implement actual token verification
    // For now, accept any token that starts with 'mock_jwt_token_'
    if (token.startsWith('mock_jwt_token_')) {
      const mockUser = {
        id: '12345',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        user: mockUser,
      });
    }

    // Invalid token
    return NextResponse.json(
      { success: false, message: 'Invalid token' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

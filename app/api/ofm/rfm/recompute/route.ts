import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Forward to backend API
    const response = await fetch(`${API_URL}/ofm/rfm/recompute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    // Backend will handle async computation
    return NextResponse.json({ 
      status: 'scheduled',
      message: 'RFM segmentation recomputation has been scheduled'
    }, { status: 202 });

  } catch (error: any) {
    console.error('RFM recompute error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to schedule RFM recomputation' 
    }, { status: 500 });
  }
}

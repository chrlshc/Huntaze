import { serialize } from 'cookie';
import { NextResponse } from 'next/server';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

export function createSecureCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
) {
  const defaultOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour for access token
  };
  
  return serialize(name, value, { ...defaultOptions, ...options });
}

export function clearCookie(name: string, path: string = '/') {
  return serialize(name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path,
    maxAge: 0,
  });
}

// Token-specific cookie configurations
export const COOKIE_CONFIGS = {
  accessToken: {
    name: 'accessToken',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60, // 1 hour
    }
  },
  refreshToken: {
    name: 'refreshToken',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    }
  },
  idToken: {
    name: 'idToken',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60, // 1 hour
    }
  }
};

// Helper to set multiple cookies in NextResponse
export function setAuthCookies(
  response: NextResponse,
  tokens: {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
  }
) {
  const cookies = [];

  if (tokens.accessToken) {
    cookies.push(createSecureCookie(
      COOKIE_CONFIGS.accessToken.name,
      tokens.accessToken,
      COOKIE_CONFIGS.accessToken.options
    ));
  }

  if (tokens.refreshToken) {
    cookies.push(createSecureCookie(
      COOKIE_CONFIGS.refreshToken.name,
      tokens.refreshToken,
      COOKIE_CONFIGS.refreshToken.options
    ));
  }

  if (tokens.idToken) {
    cookies.push(createSecureCookie(
      COOKIE_CONFIGS.idToken.name,
      tokens.idToken,
      COOKIE_CONFIGS.idToken.options
    ));
  }

  // Set all cookies in the response
  response.headers.set('Set-Cookie', cookies.join(', '));
  
  return response;
}

// Helper to clear all auth cookies
export function clearAuthCookies(response: NextResponse) {
  const cookies = [
    clearCookie('accessToken'),
    clearCookie('refreshToken'),
    clearCookie('idToken'),
  ];
  
  response.headers.set('Set-Cookie', cookies.join(', '));
  
  return response;
}

// Extract token from Authorization header or cookie
export function extractToken(request: Request): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies
  const cookies = request.headers.get('Cookie');
  if (cookies) {
    const accessToken = cookies
      .split(';')
      .find(c => c.trim().startsWith('accessToken='))
      ?.split('=')[1];
    
    return accessToken || null;
  }
  
  return null;
}
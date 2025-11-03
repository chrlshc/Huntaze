'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, AuthState } from '@/lib/auth/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/platforms',
  '/messages',
  '/campaigns',
  '/analytics',
  '/ai',
  '/settings'
];

// Auth routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password'
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Handle route protection
  useEffect(() => {
    if (authState.isLoading) return;

    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname?.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some(route => pathname?.startsWith(route));

    // Redirect unauthenticated users from protected routes to login
    if (isProtectedRoute && !authState.isAuthenticated) {
      router.push('/auth/login');
    }

    // Redirect authenticated users from auth routes to dashboard
    if (isAuthRoute && authState.isAuthenticated) {
      router.push('/dashboard');
    }
  }, [authState.isAuthenticated, authState.isLoading, pathname, router]);

  const checkAuth = async () => {
    try {
      // Check if token exists in localStorage
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        return;
      }

      // Verify token with API
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('auth_token');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  };

  const login = async (email: string, password: string, rememberMe?: boolean): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token
        localStorage.setItem('auth_token', data.token);
        
        // Update auth state
        setAuthState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token
        localStorage.setItem('auth_token', data.token);
        
        // Update auth state
        setAuthState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    // Clear token
    localStorage.removeItem('auth_token');
    
    // Update auth state
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });

    // Redirect to home
    router.push('/');
  };

  // Show loading screen while checking auth
  if (authState.isLoading) {
    return (
      <AuthContext.Provider value={{ ...authState, login, register, logout }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

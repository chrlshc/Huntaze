'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, fetchAuthSession, signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
  userId: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  checkAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const session = await fetchAuthSession();
      if (session.tokens) {
        const currentUser = await getCurrentUser();
        setUser({
          username: currentUser.username,
          userId: currentUser.userId,
          email: currentUser.signInDetails?.loginId,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      router.push('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut: handleSignOut,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
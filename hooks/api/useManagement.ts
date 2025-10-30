import { useState, useEffect, useCallback } from 'react';

// Types
interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    newSubscriber: boolean;
    newMessage: boolean;
    paymentReceived: boolean;
  };
  automation: {
    autoReply: boolean;
    welcomeMessage: boolean;
    thankYouMessage: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowScreenshots: boolean;
    watermarkContent: boolean;
  };
  billing: {
    currency: string;
    taxRate: number;
    payoutMethod: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  image?: string;
  bio?: string;
  website?: string;
  location?: string;
  onlyfansUsername?: string;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    subscribers: number;
    campaigns: number;
    media: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// Hook: useSettings
export function useSettings() {
  const [data, setData] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/management/settings');
      const result: ApiResponse<UserSettings> = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (settings: Partial<UserSettings>) => {
    try {
      setUpdating(true);
      setError(null);

      const response = await fetch('/api/management/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const result: ApiResponse<UserSettings> = await response.json();

      if (result.success) {
        setData(result.data);
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to update settings');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  return {
    settings: data,
    loading,
    error,
    updating,
    refetch: fetchSettings,
    updateSettings,
  };
}

// Hook: useProfile
export function useProfile() {
  const [data, setData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/management/profile');
      const result: ApiResponse<UserProfile> = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (profile: {
    name?: string;
    bio?: string;
    website?: string;
    location?: string;
    onlyfansUsername?: string;
    image?: string;
  }) => {
    try {
      setUpdating(true);
      setError(null);

      const response = await fetch('/api/management/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      const result: ApiResponse<UserProfile> = await response.json();

      if (result.success) {
        setData(result.data);
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to update profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  return {
    profile: data,
    loading,
    error,
    updating,
    refetch: fetchProfile,
    updateProfile,
  };
}

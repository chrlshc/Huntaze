// Authentication configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// OAuth URLs - Now handled by the backend
export const getOAuthUrl = (provider: 'google') => {
  switch (provider) {
    case 'google':
      return `${API_URL}/auth/google`;
    
    default:
      throw new Error('Invalid provider');
  }
};
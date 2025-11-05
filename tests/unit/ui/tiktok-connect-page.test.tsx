/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSearchParams, useRouter } from 'next/navigation';
import TikTokConnectPage from '@/app/platforms/connect/tiktok/page';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock window.location.href
delete (window as any).location;
window.location = { href: '' } as any;

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('TikTokConnectPage', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
    mockUseSearchParams.mockReturnValue({
      get: mockGet,
    } as any);
  });

  describe('Initial State', () => {
    it('should render the connect page with default state', () => {
      mockGet.mockReturnValue(null);

      render(<TikTokConnectPage />);

      expect(screen.getByText('Connect TikTok')).toBeInTheDocument();
      expect(screen.getByText('Link your TikTok account to publish content and track performance')).toBeInTheDocument();
      expect(screen.getByText('Connect with TikTok')).toBeInTheDocument();
    });

    it('should display feature list', () => {
      mockGet.mockReturnValue(null);

      render(<TikTokConnectPage />);

      expect(screen.getByText('Upload videos directly to TikTok')).toBeInTheDocument();
      expect(screen.getByText('Schedule content for optimal engagement')).toBeInTheDocument();
      expect(screen.getByText('Track video performance and analytics')).toBeInTheDocument();
      expect(screen.getByText('Manage your TikTok content library')).toBeInTheDocument();
      expect(screen.getByText('Access advanced publishing features')).toBeInTheDocument();
    });

    it('should display permissions information', () => {
      mockGet.mockReturnValue(null);

      render(<TikTokConnectPage />);

      expect(screen.getByText('Required Permissions')).toBeInTheDocument();
      expect(screen.getByText(/We'll request access to upload videos and view basic profile information/)).toBeInTheDocument();
    });
  });

  describe('OAuth Flow Integration', () => {
    it('should initiate OAuth flow when connect button is clicked', async () => {
      mockGet.mockReturnValue(null);

      render(<TikTokConnectPage />);

      const connectButton = screen.getByText('Connect with TikTok');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(window.location.href).toBe('/api/auth/tiktok');
      });
    });

    it('should show loading state during connection', async () => {
      mockGet.mockReturnValue(null);

      render(<TikTokConnectPage />);

      const connectButton = screen.getByText('Connect with TikTok');
      fireEvent.click(connectButton);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(connectButton).toBeDisabled();
    });
  });

  describe('Success State', () => {
    it('should display success state when OAuth succeeds', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'success') return 'true';
        if (param === 'username') return 'testuser';
        return null;
      });

      render(<TikTokConnectPage />);

      expect(screen.getByText('Successfully Connected!')).toBeInTheDocument();
      expect(screen.getByText('@testuser')).toBeInTheDocument();
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    it('should navigate to dashboard when dashboard button is clicked', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'success') return 'true';
        if (param === 'username') return 'testuser';
        return null;
      });

      render(<TikTokConnectPage />);

      const dashboardButton = screen.getByText('Go to Dashboard');
      fireEvent.click(dashboardButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle disconnect when disconnect button is clicked', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'success') return 'true';
        if (param === 'username') return 'testuser';
        return null;
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<TikTokConnectPage />);

      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.click(disconnectButton);

      expect(consoleSpy).toHaveBeenCalledWith('Disconnect TikTok account');
      consoleSpy.mockRestore();
    });
  });

  describe('Error State Management', () => {
    it('should display error message for access_denied', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'error') return 'access_denied';
        return null;
      });

      render(<TikTokConnectPage />);

      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.getByText(/You denied access to your TikTok account/)).toBeInTheDocument();
    });

    it('should display error message for invalid_state', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'error') return 'invalid_state';
        return null;
      });

      render(<TikTokConnectPage />);

      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.getByText(/Security validation failed/)).toBeInTheDocument();
    });

    it('should display error message for missing_code', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'error') return 'missing_code';
        return null;
      });

      render(<TikTokConnectPage />);

      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.getByText(/Authorization failed/)).toBeInTheDocument();
    });

    it('should display error message for callback_failed', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'error') return 'callback_failed';
        return null;
      });

      render(<TikTokConnectPage />);

      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.getByText(/Failed to complete TikTok connection/)).toBeInTheDocument();
    });

    it('should display custom error message when provided', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'error') return 'callback_failed';
        if (param === 'message') return 'Custom error message';
        return null;
      });

      render(<TikTokConnectPage />);

      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should display generic error message for unknown error codes', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'error') return 'unknown_error';
        return null;
      });

      render(<TikTokConnectPage />);

      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.getByText(/An unknown error occurred/)).toBeInTheDocument();
    });

    it('should still show connect button when there is an error', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'error') return 'access_denied';
        return null;
      });

      render(<TikTokConnectPage />);

      expect(screen.getByText('Connect with TikTok')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should display navigation links to other platforms', () => {
      mockGet.mockReturnValue(null);

      render(<TikTokConnectPage />);

      expect(screen.getByText('Connect Instagram')).toBeInTheDocument();
      expect(screen.getByText('Connect Reddit')).toBeInTheDocument();
    });

    it('should display security message', () => {
      mockGet.mockReturnValue(null);

      render(<TikTokConnectPage />);

      expect(screen.getByText(/Your credentials are encrypted and stored securely/)).toBeInTheDocument();
    });
  });

  describe('URL Parameter Parsing', () => {
    it('should handle multiple URL parameters correctly', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'success') return 'true';
        if (param === 'username') return 'testuser123';
        return null;
      });

      render(<TikTokConnectPage />);

      expect(screen.getByText('Successfully Connected!')).toBeInTheDocument();
      expect(screen.getByText('@testuser123')).toBeInTheDocument();
    });

    it('should prioritize error over success when both are present', () => {
      mockGet.mockImplementation((param) => {
        if (param === 'error') return 'access_denied';
        if (param === 'success') return 'true';
        return null;
      });

      render(<TikTokConnectPage />);

      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
      expect(screen.queryByText('Successfully Connected!')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and semantic HTML', () => {
      mockGet.mockReturnValue(null);

      render(<TikTokConnectPage />);

      const connectButton = screen.getByRole('button', { name: /Connect with TikTok/i });
      expect(connectButton).toBeInTheDocument();

      const heading = screen.getByRole('heading', { name: /Connect TikTok/i });
      expect(heading).toBeInTheDocument();
    });

    it('should handle keyboard navigation', () => {
      mockGet.mockReturnValue(null);

      render(<TikTokConnectPage />);

      const connectButton = screen.getByText('Connect with TikTok');
      connectButton.focus();
      expect(document.activeElement).toBe(connectButton);
    });
  });
});
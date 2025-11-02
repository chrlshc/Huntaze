/**
 * Unit Tests - AWS SES Email Service
 * 
 * Tests to validate email sending functionality via AWS SES
 * 
 * Coverage:
 * - sendEmail function with HTML and text bodies
 * - sendVerificationEmail with token generation
 * - sendWelcomeEmail after verification
 * - Error handling for failed sends
 * - Email content validation
 * - URL generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SendEmailCommand } from '@aws-sdk/client-ses';

// Mock AWS SES Client
vi.mock('@aws-sdk/client-ses', () => {
  const mockSend = vi.fn();
  return {
    SESClient: vi.fn(() => ({
      send: mockSend,
    })),
    SendEmailCommand: vi.fn((params) => params),
    __mockSend: mockSend,
  };
});

describe('AWS SES Email Service', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = { ...process.env };
    process.env.AWS_REGION = 'us-east-1';
    process.env.FROM_EMAIL = 'noreply@huntaze.com';
    process.env.NEXT_PUBLIC_APP_URL = 'https://huntaze.com';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendEmail', () => {
    it('should send email with HTML and text bodies', async () => {
      const { SESClient } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-message-id-123' });

      const { sendEmail } = await import('@/lib/email/ses');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlBody: '<p>Test HTML</p>',
        textBody: 'Test Text',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id-123');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should use FROM_EMAIL from environment with sender name', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendEmail } = await import('@/lib/email/ses');

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
      });

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Source: 'Huntaze <noreply@huntaze.com>',
        })
      );
    });

    it('should use default FROM_EMAIL if not set with sender name', async () => {
      delete process.env.FROM_EMAIL;

      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      // Re-import to get fresh module with new env
      vi.resetModules();
      const { sendEmail } = await import('@/lib/email/ses');

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
      });

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Source: 'Huntaze <noreply@huntaze.com>',
        })
      );
    });

    it('should set correct destination address', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendEmail } = await import('@/lib/email/ses');

      await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
      });

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Destination: {
            ToAddresses: ['recipient@example.com'],
          },
        })
      );
    });

    it('should set subject with UTF-8 charset', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendEmail } = await import('@/lib/email/ses');

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject with émojis 🎉',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
      });

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Subject: {
              Data: 'Test Subject with émojis 🎉',
              Charset: 'UTF-8',
            },
          }),
        })
      );
    });

    it('should set HTML body with UTF-8 charset', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendEmail } = await import('@/lib/email/ses');

      const htmlContent = '<p>Test HTML with special chars: é à ç</p>';

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        htmlBody: htmlContent,
        textBody: 'Test',
      });

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Html: {
                Data: htmlContent,
                Charset: 'UTF-8',
              },
            }),
          }),
        })
      );
    });

    it('should set text body with UTF-8 charset', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendEmail } = await import('@/lib/email/ses');

      const textContent = 'Test text with special chars: é à ç';

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: textContent,
      });

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Body: expect.objectContaining({
              Text: {
                Data: textContent,
                Charset: 'UTF-8',
              },
            }),
          }),
        })
      );
    });

    it('should throw error when SES send fails', async () => {
      const { SESClient } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockRejectedValueOnce(new Error('SES send failed'));

      const { sendEmail } = await import('@/lib/email/ses');

      await expect(
        sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          htmlBody: '<p>Test</p>',
          textBody: 'Test',
        })
      ).rejects.toThrow('SES send failed');
    });

    it('should log success message with recipient and messageId', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { SESClient } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'msg-123' });

      const { sendEmail } = await import('@/lib/email/ses');

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Email sent successfully:',
        { to: 'test@example.com', messageId: 'msg-123' }
      );

      consoleSpy.mockRestore();
    });

    it('should log error when send fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { SESClient } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      const error = new Error('Network error');
      mockSend.mockRejectedValueOnce(error);

      const { sendEmail } = await import('@/lib/email/ses');

      await expect(
        sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          htmlBody: '<p>Test</p>',
          textBody: 'Test',
        })
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to send email:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct subject', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John Doe', 'token123');

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Subject: {
              Data: 'Vérifiez votre email - Huntaze',
              Charset: 'UTF-8',
            },
          }),
        })
      );
    });

    it('should include verification URL with token', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'abc123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      expect(htmlBody).toContain('https://huntaze.com/auth/verify-email?token=abc123');
    });

    it('should use localhost URL when NEXT_PUBLIC_APP_URL not set', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      vi.resetModules();
      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      expect(htmlBody).toContain('http://localhost:3000/auth/verify-email?token=token123');
    });

    it('should personalize email with user name', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'Alice Smith', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      expect(htmlBody).toContain('Bienvenue Alice Smith !');
    });

    it('should include HTML email template', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      expect(htmlBody).toContain('<!DOCTYPE html>');
      expect(htmlBody).toContain('<html>');
      expect(htmlBody).toContain('Huntaze');
      expect(htmlBody).toContain('Vérifier mon email');
    });

    it('should use external logo image instead of inline SVG', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      // Should contain img tag with logo
      expect(htmlBody).toContain('<img');
      expect(htmlBody).toContain('huntaze-logo.png');
      expect(htmlBody).toContain('alt="Huntaze"');
      
      // Should NOT contain inline SVG
      expect(htmlBody).not.toContain('<svg');
      expect(htmlBody).not.toContain('huntaze-gradient-email');
      expect(htmlBody).not.toContain('linearGradient');
    });

    it('should use correct logo URL from environment variable', async () => {
      const originalUrl = process.env.NEXT_PUBLIC_APP_URL;
      process.env.NEXT_PUBLIC_APP_URL = 'https://test.huntaze.com';
      
      vi.resetModules();
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      expect(htmlBody).toContain('https://test.huntaze.com/huntaze-logo.png');
      
      // Restore original
      if (originalUrl) {
        process.env.NEXT_PUBLIC_APP_URL = originalUrl;
      } else {
        delete process.env.NEXT_PUBLIC_APP_URL;
      }
    });

    it('should fallback to default URL when NEXT_PUBLIC_APP_URL is not set', async () => {
      const originalUrl = process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;
      
      vi.resetModules();
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      expect(htmlBody).toContain('https://huntaze.com/huntaze-logo.png');
      
      // Restore original
      if (originalUrl) {
        process.env.NEXT_PUBLIC_APP_URL = originalUrl;
      }
    });

    it('should apply correct logo styling', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      // Check for logo image attributes
      expect(htmlBody).toContain('width="60"');
      expect(htmlBody).toContain('height="60"');
      expect(htmlBody).toContain('border-radius: 12px');
      expect(htmlBody).toContain('display: block');
      expect(htmlBody).toContain('margin: 0 auto');
    });

    it('should apply updated header styling', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      // Check for updated h1 styling
      expect(htmlBody).toContain('letter-spacing: -0.5px');
      expect(htmlBody).toContain('margin: 15px 0 0');
      
      // Check for updated beta badge styling
      expect(htmlBody).toContain('text-transform: uppercase');
      expect(htmlBody).toContain('letter-spacing: 1px');
      expect(htmlBody).toContain('font-size: 13px');
    });

    it('should include text fallback', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const textBody = callArgs.Message.Body.Text.Data;

      expect(textBody).toContain('Bienvenue John !');
      expect(textBody).toContain('https://huntaze.com/auth/verify-email?token=token123');
      expect(textBody).toContain('Ce lien expirera dans 24 heures');
    });

    it('should include expiration notice', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      expect(htmlBody).toContain('Ce lien expirera dans 24 heures');
    });

    it('should include current year in footer', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      const currentYear = new Date().getFullYear();
      expect(htmlBody).toContain(`© ${currentYear} Huntaze`);
    });

    it('should return success result', async () => {
      const { SESClient } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'verify-msg-123' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      const result = await sendVerificationEmail('user@example.com', 'John', 'token123');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('verify-msg-123');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct subject', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendWelcomeEmail } = await import('@/lib/email/ses');

      await sendWelcomeEmail('user@example.com', 'John Doe');

      expect(SendEmailCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Message: expect.objectContaining({
            Subject: {
              Data: 'Bienvenue sur Huntaze ! 🎉',
              Charset: 'UTF-8',
            },
          }),
        })
      );
    });

    it('should include dashboard URL', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendWelcomeEmail } = await import('@/lib/email/ses');

      await sendWelcomeEmail('user@example.com', 'John');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      expect(htmlBody).toContain('https://huntaze.com/dashboard');
    });

    it('should use localhost dashboard URL when NEXT_PUBLIC_APP_URL not set', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      vi.resetModules();
      const { sendWelcomeEmail } = await import('@/lib/email/ses');

      await sendWelcomeEmail('user@example.com', 'John');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      expect(htmlBody).toContain('http://localhost:3000/dashboard');
    });

    it('should personalize email with user name', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendWelcomeEmail } = await import('@/lib/email/ses');

      await sendWelcomeEmail('user@example.com', 'Alice Smith');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      expect(htmlBody).toContain('Bonjour Alice Smith,');
    });

    it('should include congratulations message', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendWelcomeEmail } = await import('@/lib/email/ses');

      await sendWelcomeEmail('user@example.com', 'John');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      expect(htmlBody).toContain('Votre email est vérifié ! 🎉');
      expect(htmlBody).toContain('Félicitations !');
    });

    it('should include HTML email template', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendWelcomeEmail } = await import('@/lib/email/ses');

      await sendWelcomeEmail('user@example.com', 'John');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      expect(htmlBody).toContain('<!DOCTYPE html>');
      expect(htmlBody).toContain('<html>');
      expect(htmlBody).toContain('Huntaze');
      expect(htmlBody).toContain('Accéder au tableau de bord');
    });

    it('should include text fallback', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendWelcomeEmail } = await import('@/lib/email/ses');

      await sendWelcomeEmail('user@example.com', 'John');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const textBody = callArgs.Message.Body.Text.Data;

      expect(textBody).toContain('Votre email est vérifié ! 🎉');
      expect(textBody).toContain('Bonjour John,');
      expect(textBody).toContain('https://huntaze.com/dashboard');
    });

    it('should include current year in footer', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendWelcomeEmail } = await import('@/lib/email/ses');

      await sendWelcomeEmail('user@example.com', 'John');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      const currentYear = new Date().getFullYear();
      expect(htmlBody).toContain(`© ${currentYear} Huntaze`);
    });

    it('should return success result', async () => {
      const { SESClient } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'welcome-msg-123' });

      const { sendWelcomeEmail } = await import('@/lib/email/ses');

      const result = await sendWelcomeEmail('user@example.com', 'John');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('welcome-msg-123');
    });
  });

  describe('Logo Consistency Across Email Types', () => {
    it('should use same logo in verification and welcome emails', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValue({ MessageId: 'test-id' });

      const { sendVerificationEmail, sendWelcomeEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');
      const verificationCall = (SendEmailCommand as any).mock.calls[0][0];
      const verificationHtml = verificationCall.Message.Body.Html.Data;

      await sendWelcomeEmail('user@example.com', 'John');
      const welcomeCall = (SendEmailCommand as any).mock.calls[1][0];
      const welcomeHtml = welcomeCall.Message.Body.Html.Data;

      // Both should use the same logo
      expect(verificationHtml).toContain('huntaze-logo.png');
      expect(welcomeHtml).toContain('huntaze-logo.png');
      
      // Both should NOT contain SVG
      expect(verificationHtml).not.toContain('<svg');
      expect(welcomeHtml).not.toContain('<svg');
    });

    it('should have consistent header styling across email types', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValue({ MessageId: 'test-id' });

      const { sendVerificationEmail, sendWelcomeEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');
      const verificationCall = (SendEmailCommand as any).mock.calls[0][0];
      const verificationHtml = verificationCall.Message.Body.Html.Data;

      await sendWelcomeEmail('user@example.com', 'John');
      const welcomeCall = (SendEmailCommand as any).mock.calls[1][0];
      const welcomeHtml = welcomeCall.Message.Body.Html.Data;

      // Both should have the same header structure
      expect(verificationHtml).toContain('letter-spacing: -0.5px');
      expect(welcomeHtml).toContain('letter-spacing: -0.5px');
      
      expect(verificationHtml).toContain('text-transform: uppercase');
      expect(welcomeHtml).toContain('text-transform: uppercase');
    });

    it('should use same logo URL in both email types', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://production.huntaze.com';
      
      vi.resetModules();
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValue({ MessageId: 'test-id' });

      const { sendVerificationEmail, sendWelcomeEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');
      const verificationCall = (SendEmailCommand as any).mock.calls[0][0];
      const verificationHtml = verificationCall.Message.Body.Html.Data;

      await sendWelcomeEmail('user@example.com', 'John');
      const welcomeCall = (SendEmailCommand as any).mock.calls[1][0];
      const welcomeHtml = welcomeCall.Message.Body.Html.Data;

      // Both should use the same production URL
      expect(verificationHtml).toContain('https://production.huntaze.com/huntaze-logo.png');
      expect(welcomeHtml).toContain('https://production.huntaze.com/huntaze-logo.png');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in email addresses', async () => {
      const { SESClient } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendEmail } = await import('@/lib/email/ses');

      await sendEmail({
        to: 'user+test@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
      });

      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle long subject lines', async () => {
      const { SESClient } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendEmail } = await import('@/lib/email/ses');

      const longSubject = 'A'.repeat(200);

      await sendEmail({
        to: 'test@example.com',
        subject: longSubject,
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
      });

      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle empty name in verification email', async () => {
      const { SESClient } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', '', 'token123');

      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle special characters in token', async () => {
      const { SESClient } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      const specialToken = 'token-with-special_chars.123';

      await sendVerificationEmail('user@example.com', 'John', specialToken);

      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle Unicode characters in name', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'José García 日本', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      expect(htmlBody).toContain('José García 日本');
    });

    it('should handle URL with trailing slash', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://huntaze.com/';
      
      vi.resetModules();
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      // Should handle trailing slash correctly
      expect(htmlBody).toMatch(/https:\/\/huntaze\.com\/?\/huntaze-logo\.png/);
    });

    it('should handle empty NEXT_PUBLIC_APP_URL', async () => {
      process.env.NEXT_PUBLIC_APP_URL = '';
      
      vi.resetModules();
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      // Should fallback to default URL
      expect(htmlBody).toContain('https://huntaze.com/huntaze-logo.png');
    });

    it('should render logo with proper accessibility attributes', async () => {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
      const mockSend = (SESClient as any).prototype.send;
      mockSend.mockResolvedValueOnce({ MessageId: 'test-id' });

      const { sendVerificationEmail } = await import('@/lib/email/ses');

      await sendVerificationEmail('user@example.com', 'John', 'token123');

      const callArgs = (SendEmailCommand as any).mock.calls[0][0];
      const htmlBody = callArgs.Message.Body.Html.Data;

      // Should have alt text for accessibility
      expect(htmlBody).toContain('alt="Huntaze"');
    });
  });

  describe('AWS SES Client Configuration', () => {
    it('should use AWS_REGION from environment', async () => {
      process.env.AWS_REGION = 'eu-west-1';

      vi.resetModules();
      const { SESClient } = await import('@aws-sdk/client-ses');

      // Import module to trigger SESClient instantiation
      await import('@/lib/email/ses');

      expect(SESClient).toHaveBeenCalledWith({
        region: 'eu-west-1',
      });
    });

    it('should use default region if AWS_REGION not set', async () => {
      delete process.env.AWS_REGION;

      vi.resetModules();
      const { SESClient } = await import('@aws-sdk/client-ses');

      // Import module to trigger SESClient instantiation
      await import('@/lib/email/ses');

      expect(SESClient).toHaveBeenCalledWith({
        region: 'us-east-1',
      });
    });
  });
});

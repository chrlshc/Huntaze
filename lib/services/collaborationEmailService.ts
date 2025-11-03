import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface CollaborationInviteData {
  to: string;
  contentTitle: string;
  inviterName: string;
  permission: string;
  message?: string;
  acceptUrl: string;
}

export class CollaborationEmailService {
  private static fromEmail = process.env.FROM_EMAIL || 'noreply@yourapp.com';
  private static appName = process.env.APP_NAME || 'Content Creator';

  static async sendCollaborationInvite(data: CollaborationInviteData): Promise<void> {
    const { to, contentTitle, inviterName, permission, message, acceptUrl } = data;

    const permissionDescription = this.getPermissionDescription(permission);
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Collaboration Invitation</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 30px 0;
              border-bottom: 2px solid #f0f0f0;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
            .content {
              padding: 30px 0;
            }
            .invitation-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 24px;
              margin: 20px 0;
            }
            .content-title {
              font-size: 18px;
              font-weight: 600;
              color: #1e293b;
              margin-bottom: 8px;
            }
            .permission-badge {
              display: inline-block;
              background: #dbeafe;
              color: #1e40af;
              padding: 4px 12px;
              border-radius: 16px;
              font-size: 12px;
              font-weight: 500;
              text-transform: uppercase;
            }
            .message-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 16px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .cta-button {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px 0;
              border-top: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 14px;
            }
            .secondary-link {
              color: #64748b;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">${this.appName}</div>
          </div>
          
          <div class="content">
            <h1>You've been invited to collaborate!</h1>
            
            <p>Hi there,</p>
            
            <p><strong>${inviterName}</strong> has invited you to collaborate on their content with <strong>${permission}</strong> access.</p>
            
            <div class="invitation-card">
              <div class="content-title">${contentTitle}</div>
              <div class="permission-badge">${permission} Access</div>
              <p style="margin-top: 12px; color: #64748b;">${permissionDescription}</p>
            </div>
            
            ${message ? `
              <div class="message-box">
                <strong>Personal message from ${inviterName}:</strong>
                <p style="margin: 8px 0 0 0;">"${message}"</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" class="cta-button">Accept Invitation</a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">
              If you can't click the button above, copy and paste this link into your browser:<br>
              <a href="${acceptUrl}" class="secondary-link">${acceptUrl}</a>
            </p>
            
            <p style="color: #64748b; font-size: 14px;">
              This invitation will expire in 7 days. If you don't want to collaborate on this content, you can safely ignore this email.
            </p>
          </div>
          
          <div class="footer">
            <p>This email was sent by ${this.appName}</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </body>
      </html>
    `;

    const textBody = `
You've been invited to collaborate!

${inviterName} has invited you to collaborate on their content "${contentTitle}" with ${permission} access.

${permissionDescription}

${message ? `Personal message from ${inviterName}: "${message}"` : ''}

To accept this invitation, visit: ${acceptUrl}

This invitation will expire in 7 days.

---
${this.appName}
    `;

    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: `Collaboration invitation from ${inviterName}`,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    try {
      await sesClient.send(command);
      console.log(`Collaboration invitation sent to ${to}`);
    } catch (error) {
      console.error('Error sending collaboration invitation:', error);
      throw new Error('Failed to send collaboration invitation');
    }
  }

  private static getPermissionDescription(permission: string): string {
    switch (permission.toLowerCase()) {
      case 'owner':
        return 'Full access to edit, share, and manage this content';
      case 'editor':
        return 'Can edit and modify this content';
      case 'viewer':
        return 'Can view this content but not make changes';
      default:
        return 'Collaborate on this content';
    }
  }

  static async sendCollaboratorRemoved(data: {
    to: string;
    contentTitle: string;
    removedBy: string;
  }): Promise<void> {
    const { to, contentTitle, removedBy } = data;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Collaboration Access Removed</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 30px 0;
              border-bottom: 2px solid #f0f0f0;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">${this.appName}</div>
          </div>
          
          <div style="padding: 30px 0;">
            <h1>Collaboration access removed</h1>
            
            <p>Hi there,</p>
            
            <p>Your collaboration access to "<strong>${contentTitle}</strong>" has been removed by ${removedBy}.</p>
            
            <p>You will no longer be able to access or edit this content.</p>
            
            <p>If you believe this was done in error, please contact ${removedBy} directly.</p>
            
            <p>Thank you for your collaboration!</p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p>This email was sent by ${this.appName}</p>
          </div>
        </body>
      </html>
    `;

    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: `Collaboration access removed - ${contentTitle}`,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    try {
      await sesClient.send(command);
      console.log(`Collaboration removal notification sent to ${to}`);
    } catch (error) {
      console.error('Error sending collaboration removal notification:', error);
      throw new Error('Failed to send collaboration removal notification');
    }
  }
}
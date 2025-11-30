import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SafeCurrentYear } from '@/components/hydration';


const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}

export async function sendEmail({ to, subject, htmlBody, textBody }: SendEmailParams) {
  const fromEmail = process.env.FROM_EMAIL || 'noreply@huntaze.com';
  const fromName = 'Huntaze';
  const source = `${fromName} <${fromEmail}>`;

  const command = new SendEmailCommand({
    Source: source,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
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
    const response = await sesClient.send(command);
    console.log('Email sent successfully:', { to, messageId: response.MessageId });
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
  const firstName = name.split(' ')[0];

  const subject = '✅ Confirm your email to activate Huntaze';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: var(--bg-glass);">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: var(--bg-glass); padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://huntaze.com'}/huntaze-logo.png" alt="Huntaze" width="60" height="60" style="display: block; margin: 0 auto; border-radius: 12px;" />
              <h1 style="margin: 15px 0 0; color: var(--text-primary); font-size: var(--text-3xl); font-weight: 700; letter-spacing: -0.5px;">Huntaze</h1>
              <p style="margin: 5px 0 0; color: var(--text-secondary); font-size: var(--text-sm); font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">beta</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="margin: 0 0 20px; color: var(--text-primary); font-size: var(--text-2xl); font-weight: 600;">
                Hi ${firstName},
              </h2>
              
              <p style="margin: 0 0 20px; color: var(--text-tertiary); font-size: var(--text-base); line-height: 1.6;">
                Welcome to Huntaze (beta) 🎉 Before you get started, please confirm your email to secure your account and access your dashboard.
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: var(--bg-glass); border-radius: 6px;">
                <p style="margin: 0 0 10px; color: var(--text-primary); font-size: var(--text-base); font-weight: 600;">Why verify?</p>
                <p style="margin: 5px 0; color: var(--text-tertiary); font-size: var(--text-sm);">🔐 Protect your account and data</p>
                <p style="margin: 5px 0; color: var(--text-tertiary); font-size: var(--text-sm);">🚀 Immediate access to beta features</p>
                <p style="margin: 5px 0; color: var(--text-tertiary); font-size: var(--text-sm);">🔗 Seamless integrations (OnlyFans and more)</p>
              </div>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background-color: var(--accent-info); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: var(--text-base); font-weight: 600;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: var(--text-tertiary); font-size: var(--text-sm); line-height: 1.6;">
                This verification link expires in 24 hours. If you didn't sign up, just ignore this email.
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid var(--border-subtle);">
              
              <p style="margin: 0; color: var(--text-tertiary); font-size: var(--text-sm); line-height: 1.6;">
                See you inside,<br>
                — The Huntaze Team
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: var(--bg-glass); border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: var(--text-tertiary); font-size: var(--text-xs);">
                Need help? Contact us at support@huntaze.com
              </p>
              <p style="margin: 0; color: var(--text-secondary); font-size: var(--text-xs);">
                © ${new Date().getFullYear()} Huntaze. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textBody = `
Hi ${firstName},

Welcome to Huntaze (beta) 🎉 Before you get started, please confirm your email to secure your account and access your dashboard.

Why verify?
🔐 Protect your account and data
🚀 Immediate access to beta features
🔗 Seamless integrations (OnlyFans and more)

Verify your email: ${verificationUrl}

This verification link expires in 24 hours. If you didn't sign up, just ignore this email.

See you inside,
— The Huntaze Team

Need help? Contact us at support@huntaze.com
© ${new Date().getFullYear()} Huntaze. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject,
    htmlBody,
    textBody,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`;
  const docsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/docs`;
  const firstName = name.split(' ')[0];

  const subject = '🎉 Welcome to Huntaze—your workspace is ready';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: var(--bg-glass);">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: var(--bg-glass); padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://huntaze.com'}/huntaze-logo.png" alt="Huntaze" width="60" height="60" style="display: block; margin: 0 auto; border-radius: 12px;" />
              <h1 style="margin: 15px 0 0; color: var(--text-primary); font-size: var(--text-3xl); font-weight: 700; letter-spacing: -0.5px;">Huntaze</h1>
              <p style="margin: 5px 0 0; color: var(--text-secondary); font-size: var(--text-sm); font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">beta</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="margin: 0 0 20px; color: var(--text-primary); font-size: var(--text-2xl); font-weight: 600;">
                Hi ${firstName},
              </h2>
              
              <p style="margin: 0 0 20px; color: var(--text-tertiary); font-size: var(--text-base); line-height: 1.6;">
                We're thrilled to have you in the Huntaze beta! Here's everything you need to get productive fast.
              </p>
              
              <!-- Feature Highlights -->
              <div style="margin: 30px 0; padding: 20px; background-color: var(--bg-glass); border-radius: 6px;">
                <p style="margin: 0 0 15px; color: var(--text-primary); font-size: var(--text-base); font-weight: 600;">6 feature highlights</p>
                <p style="margin: 8px 0; color: var(--text-tertiary); font-size: var(--text-sm);">⚡ Multi-channel campaigns out of the box</p>
                <p style="margin: 8px 0; color: var(--text-tertiary); font-size: var(--text-sm);">🤖 AI copy & prompt templates to move faster</p>
                <p style="margin: 8px 0; color: var(--text-tertiary); font-size: var(--text-sm);">📊 Real-time analytics (opens, clicks, conversions)</p>
                <p style="margin: 8px 0; color: var(--text-tertiary); font-size: var(--text-sm);">🧠 Segmentation & tags for smarter sends</p>
                <p style="margin: 8px 0; color: var(--text-tertiary); font-size: var(--text-sm);">🔗 OnlyFans connection (beta) to sync your data</p>
                <p style="margin: 8px 0; color: var(--text-tertiary); font-size: var(--text-sm);">🧩 API & webhooks (beta) to fit your stack</p>
              </div>
              
              <!-- Quick Start -->
              <div style="margin: 30px 0;">
                <p style="margin: 0 0 15px; color: var(--text-primary); font-size: var(--text-base); font-weight: 600;">Quick start (4 steps)</p>
                <ol style="margin: 0; padding-left: 20px; color: var(--text-tertiary); font-size: var(--text-sm); line-height: 1.8;">
                  <li>Set up your brand profile & preferences</li>
                  <li>Connect OnlyFans (if applicable)</li>
                  <li>Add or import your audience</li>
                  <li>Launch your first campaign in minutes</li>
                </ol>
              </div>
              
              <!-- Pro Tips -->
              <div style="margin: 30px 0; padding: 20px; background-color: rgba(245, 158, 11, 0.1); border-radius: 6px; border-left: 4px solid var(--accent-warning);">
                <p style="margin: 0 0 10px; color: var(--accent-warning); font-size: var(--text-base); font-weight: 600;">💡 Pro tips</p>
                <p style="margin: 5px 0; color: var(--accent-warning); font-size: var(--text-sm);">• A/B test your subject lines before sending</p>
                <p style="margin: 5px 0; color: var(--accent-warning); font-size: var(--text-sm);">• Schedule by your audience's time zone</p>
                <p style="margin: 5px 0; color: var(--accent-warning); font-size: var(--text-sm);">• Re-engage non-openers after 24–48 hours</p>
                <p style="margin: 5px 0; color: var(--accent-warning); font-size: var(--text-sm);">• Review reports to guide your next iteration</p>
              </div>
              
              <!-- Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 10px;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 40px; background-color: var(--accent-info); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: var(--text-base); font-weight: 600;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 10px;">
                    <a href="${docsUrl}" style="display: inline-block; padding: 16px 40px; background-color: #ffffff; color: var(--accent-info); text-decoration: none; border-radius: 6px; font-size: var(--text-base); font-weight: 600; border: 2px solid var(--accent-info);">
                      View Docs
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: var(--text-tertiary); font-size: var(--text-sm); line-height: 1.6;">
                Thanks for joining the beta 💙<br>
                — The Huntaze Team
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 20px 40px; background-color: var(--bg-glass); border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: var(--text-tertiary); font-size: var(--text-xs);">
                📚 Help Center • 🎥 Onboarding • 💬 Community • ✉️ support@huntaze.com
              </p>
              <p style="margin: 0; color: var(--text-secondary); font-size: var(--text-xs);">
                © ${new Date().getFullYear()} Huntaze. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textBody = `
Hi ${firstName},

We're thrilled to have you in the Huntaze beta! Here's everything you need to get productive fast.

6 feature highlights:
⚡ Multi-channel campaigns out of the box
🤖 AI copy & prompt templates to move faster
📊 Real-time analytics (opens, clicks, conversions)
🧠 Segmentation & tags for smarter sends
🔗 OnlyFans connection (beta) to sync your data
🧩 API & webhooks (beta) to fit your stack

Quick start (4 steps):
1. Set up your brand profile & preferences
2. Connect OnlyFans (if applicable)
3. Add or import your audience
4. Launch your first campaign in minutes

Pro tips 💡
• A/B test your subject lines before sending
• Schedule by your audience's time zone
• Re-engage non-openers after 24–48 hours
• Review reports to guide your next iteration

Go to Dashboard: ${dashboardUrl}
View Docs: ${docsUrl}

Thanks for joining the beta 💙
— The Huntaze Team

Help Center • Onboarding • Community • support@huntaze.com
© ${new Date().getFullYear()} Huntaze. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject,
    htmlBody,
    textBody,
  });
}

require('dotenv').config();
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

async function sendTestEmail(to, name, type) {
  const fromEmail = process.env.FROM_EMAIL || 'noreply@huntaze.com';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const firstName = name.split(' ')[0];
  
  let subject, htmlBody, textBody;
  
  if (type === 'verification') {
    const token = 'test-token-' + Date.now();
    const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`;
    
    subject = '✅ Confirm your email to activate Huntaze';
    
    htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #6366f1; font-size: 32px; font-weight: 700;">Huntaze</h1>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 14px;">beta</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Hi ${firstName},</h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Welcome to Huntaze (beta) 🎉 Before you get started, please confirm your email to secure your account and access your dashboard.
              </p>
              <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 6px;">
                <p style="margin: 0 0 10px; color: #1f2937; font-size: 16px; font-weight: 600;">Why verify?</p>
                <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">🔐 Protect your account and data</p>
                <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">🚀 Immediate access to beta features</p>
                <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">🔗 Seamless integrations (OnlyFans and more)</p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                This verification link expires in 24 hours. If you didn't sign up, just ignore this email.
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                See you inside,<br>— The Huntaze Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px;">Need help? Contact us at support@huntaze.com</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Huntaze. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    
    textBody = `Hi ${firstName},

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
© ${new Date().getFullYear()} Huntaze. All rights reserved.`;
    
  } else {
    // Welcome email
    const dashboardUrl = `${appUrl}/dashboard`;
    const docsUrl = `${appUrl}/docs`;
    
    subject = '🎉 Welcome to Huntaze—your workspace is ready';
    
    htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #6366f1; font-size: 32px; font-weight: 700;">Huntaze</h1>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 14px;">beta</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Hi ${firstName},</h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We're thrilled to have you in the Huntaze beta! Here's everything you need to get productive fast.
              </p>
              <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 6px;">
                <p style="margin: 0 0 15px; color: #1f2937; font-size: 16px; font-weight: 600;">6 feature highlights</p>
                <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">⚡ Multi-channel campaigns out of the box</p>
                <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">🤖 AI copy & prompt templates to move faster</p>
                <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">📊 Real-time analytics (opens, clicks, conversions)</p>
                <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">🧠 Segmentation & tags for smarter sends</p>
                <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">🔗 OnlyFans connection (beta) to sync your data</p>
                <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">🧩 API & webhooks (beta) to fit your stack</p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 10px;">
                    <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 40px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 10px;">
                    <a href="${docsUrl}" style="display: inline-block; padding: 16px 40px; background-color: #ffffff; color: #6366f1; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; border: 2px solid #6366f1;">
                      View Docs
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                Thanks for joining the beta 💙<br>— The Huntaze Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px;">📚 Help Center • 🎥 Onboarding • 💬 Community • ✉️ support@huntaze.com</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Huntaze. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    
    textBody = `Hi ${firstName},

We're thrilled to have you in the Huntaze beta! Here's everything you need to get productive fast.

6 feature highlights:
⚡ Multi-channel campaigns out of the box
🤖 AI copy & prompt templates to move faster
📊 Real-time analytics (opens, clicks, conversions)
🧠 Segmentation & tags for smarter sends
🔗 OnlyFans connection (beta) to sync your data
🧩 API & webhooks (beta) to fit your stack

Go to Dashboard: ${dashboardUrl}
View Docs: ${docsUrl}

Thanks for joining the beta 💙
— The Huntaze Team

© ${new Date().getFullYear()} Huntaze. All rights reserved.`;
  }
  
  const command = new SendEmailCommand({
    Source: fromEmail,
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
  
  const response = await sesClient.send(command);
  return { success: true, messageId: response.MessageId };
}

async function testEmails() {
  const testEmail = process.argv[2] || 'test@example.com';
  const testName = process.argv[3] || 'Test User';

  console.log('🧪 Testing email sending...\n');
  console.log('Configuration:');
  console.log('  FROM_EMAIL:', process.env.FROM_EMAIL || 'noreply@huntaze.com');
  console.log('  AWS_REGION:', process.env.AWS_REGION || 'us-east-1');
  console.log('  TO_EMAIL:', testEmail);
  console.log('  NAME:', testName);
  console.log('');

  try {
    // Test verification email
    console.log('📧 Sending verification email...');
    const verificationResult = await sendTestEmail(testEmail, testName, 'verification');
    console.log('✅ Verification email sent!');
    console.log('   Message ID:', verificationResult.messageId);
    console.log('');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test welcome email
    console.log('📧 Sending welcome email...');
    const welcomeResult = await sendTestEmail(testEmail, testName, 'welcome');
    console.log('✅ Welcome email sent!');
    console.log('   Message ID:', welcomeResult.messageId);
    console.log('');

    console.log('🎉 All emails sent successfully!');
    console.log('');
    console.log('📬 Check your inbox at:', testEmail);
    console.log('');
    console.log('Note: If you don\'t receive emails:');
    console.log('  1. Check your spam folder');
    console.log('  2. Verify FROM_EMAIL is verified in AWS SES');
    console.log('  3. If in SES sandbox, verify TO_EMAIL in SES');
    console.log('  4. Check AWS credentials are configured');

  } catch (error) {
    console.error('❌ Error sending emails:');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.code === 'MessageRejected') {
      console.error('💡 Tips:');
      console.error('  - Verify FROM_EMAIL in AWS SES Console');
      console.error('  - If in sandbox mode, verify TO_EMAIL too');
      console.error('  - Request production access to send to any email');
    } else if (error.code === 'InvalidParameterValue') {
      console.error('💡 Tips:');
      console.error('  - Check FROM_EMAIL format');
      console.error('  - Check TO_EMAIL format');
    } else if (error.name === 'CredentialsError') {
      console.error('💡 Tips:');
      console.error('  - Configure AWS credentials');
      console.error('  - Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
      console.error('  - Or use AWS CLI: aws configure');
    }
    
    process.exit(1);
  }
}

// Usage
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Usage: node scripts/test-email.js [email] [name]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/test-email.js');
    console.log('  node scripts/test-email.js user@example.com');
    console.log('  node scripts/test-email.js user@example.com "John Doe"');
    console.log('');
    console.log('Environment variables required:');
    console.log('  FROM_EMAIL - Verified sender email in AWS SES');
    console.log('  AWS_REGION - AWS region (default: us-east-1)');
    console.log('  AWS_ACCESS_KEY_ID - AWS credentials');
    console.log('  AWS_SECRET_ACCESS_KEY - AWS credentials');
    process.exit(0);
  }

  testEmails().catch(console.error);
}

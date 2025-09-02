"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dunningSmsTemplates = exports.dunningEmailTemplates = void 0;
exports.dunningEmailTemplates = {
    payment_failed_immediate: {
        subject: 'Payment Failed - Action Required',
        html: `
      <h2>Hi {{firstName}},</h2>
      <p>We were unable to process your payment of <strong>{{amount}} {{currency}}</strong>.</p>
      <p>This can happen for various reasons:</p>
      <ul>
        <li>Insufficient funds</li>
        <li>Card expired</li>
        <li>Bank declined the transaction</li>
      </ul>
      <p><strong>Please update your payment method to avoid service interruption.</strong></p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{updatePaymentUrl}}" style="background: #5c67f2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Update Payment Method</a>
      </div>
      <p>If you need help, reply to this email and we'll assist you.</p>
    `,
        text: `
Hi {{firstName}},

We were unable to process your payment of {{amount}} {{currency}}.

Please update your payment method to avoid service interruption:
{{updatePaymentUrl}}

If you need help, reply to this email.
    `
    },
    payment_failed_reminder: {
        subject: 'Reminder: Update Your Payment Method',
        html: `
      <h2>Hi {{firstName}},</h2>
      <p>This is a friendly reminder that your payment of <strong>{{amount}} {{currency}}</strong> is still pending.</p>
      <p>We'll try again soon, but updating your payment method now ensures uninterrupted service.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{updatePaymentUrl}}" style="background: #5c67f2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Update Payment Method</a>
      </div>
      <p>Your Huntaze features remain active for now.</p>
    `,
        text: `
Hi {{firstName}},

Reminder: Your payment of {{amount}} {{currency}} is still pending.

Update your payment method here: {{updatePaymentUrl}}

Your Huntaze features remain active for now.
    `
    },
    payment_failed_urgent: {
        subject: 'Urgent: Payment Required to Keep Your Account Active',
        html: `
      <h2>Hi {{firstName}},</h2>
      <p style="color: #e74c3c;">Your payment of <strong>{{amount}} {{currency}}</strong> has failed multiple times.</p>
      <p><strong>Action required within {{daysUntilSuspension}} days to avoid account limitations.</strong></p>
      <div style="background: #fff3cd; border: 1px solid #ffeeba; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <p style="margin: 0;"><strong>What happens next:</strong></p>
        <ul style="margin: 10px 0 0 0;">
          <li>In {{daysUntilSuspension}} days: Premium features will be limited</li>
          <li>In 14 days: Account will be suspended</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{updatePaymentUrl}}" style="background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Update Payment Now</a>
      </div>
    `,
        text: `
Hi {{firstName}},

URGENT: Your payment of {{amount}} {{currency}} has failed multiple times.

Action required within {{daysUntilSuspension}} days to avoid account limitations.

Update your payment method now: {{updatePaymentUrl}}
    `
    },
    payment_failed_final: {
        subject: 'Final Notice: Account Limitations Starting Soon',
        html: `
      <h2>Hi {{firstName}},</h2>
      <p style="color: #e74c3c;"><strong>This is your final notice.</strong></p>
      <p>Your payment of <strong>{{amount}} {{currency}}</strong> remains unpaid.</p>
      <p><strong>In {{daysUntilSuspension}} days, your account will be downgraded to the free plan.</strong></p>
      <p>You'll lose access to:</p>
      <ul>
        <li>Commission caps (you'll pay full commission rates)</li>
        <li>Advanced analytics and insights</li>
        <li>Automation features</li>
        <li>Priority support</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{updatePaymentUrl}}" style="background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Keep My Premium Features</a>
      </div>
    `,
        text: `
Hi {{firstName}},

FINAL NOTICE: Your payment of {{amount}} {{currency}} remains unpaid.

In {{daysUntilSuspension}} days, your account will be downgraded to the free plan.

Keep your premium features: {{updatePaymentUrl}}
    `
    },
    payment_failed_downgrade: {
        subject: 'Account Downgraded - Payment Required',
        html: `
      <h2>Hi {{firstName}},</h2>
      <p>Due to payment failure, your account has been downgraded to the Starter plan.</p>
      <p><strong>What this means:</strong></p>
      <ul>
        <li>❌ No commission caps - you'll pay full rates</li>
        <li>❌ Limited analytics</li>
        <li>❌ No automation features</li>
        <li>✅ Basic CRM features remain available</li>
      </ul>
      <p>Your unpaid balance: <strong>{{amount}} {{currency}}</strong></p>
      <p>Update your payment method to restore premium features:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{updatePaymentUrl}}" style="background: #5c67f2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Restore Premium Features</a>
      </div>
    `,
        text: `
Hi {{firstName}},

Your account has been downgraded to Starter due to payment failure.

Unpaid balance: {{amount}} {{currency}}

Restore premium features: {{updatePaymentUrl}}
    `
    },
    payment_failed_collection: {
        subject: 'Account Suspended - Immediate Action Required',
        html: `
      <h2>Hi {{firstName}},</h2>
      <p style="color: #e74c3c;"><strong>Your Huntaze account has been suspended.</strong></p>
      <p>Due to unpaid balance of <strong>{{amount}} {{currency}}</strong>, we've had to suspend your account.</p>
      <p><strong>What's suspended:</strong></p>
      <ul>
        <li>All automations are paused</li>
        <li>API access is disabled</li>
        <li>Exports are unavailable</li>
      </ul>
      <p><strong>What still works:</strong></p>
      <ul>
        <li>View-only access to your data</li>
        <li>Basic CRM features</li>
      </ul>
      <p>To reactivate your account, please settle your outstanding balance:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{updatePaymentUrl}}" style="background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Reactivate Account</a>
      </div>
    `,
        text: `
Hi {{firstName}},

Your Huntaze account has been SUSPENDED due to unpaid balance of {{amount}} {{currency}}.

All automations are paused. API access is disabled.

Reactivate your account: {{updatePaymentUrl}}
    `
    },
    payment_failed_write_off: {
        subject: 'Account Closure Notice',
        html: `
      <h2>Hi {{firstName}},</h2>
      <p>Despite multiple attempts, we were unable to collect payment for your account.</p>
      <p>Outstanding balance: <strong>{{amount}} {{currency}}</strong></p>
      <p>Your account has been marked for closure. You have 30 days to export your data.</p>
      <p>If you wish to continue using Huntaze, you'll need to:</p>
      <ol>
        <li>Create a new account</li>
        <li>Use a valid payment method</li>
      </ol>
      <p>We're sorry to see you go. If there's anything we could have done better, please let us know.</p>
    `,
        text: `
Hi {{firstName}},

Your account has been marked for closure due to unpaid balance of {{amount}} {{currency}}.

You have 30 days to export your data.

We're sorry to see you go.
    `
    },
    payment_recovered: {
        subject: '✅ Payment Successful - Account Restored',
        html: `
      <h2>Great news, {{firstName}}!</h2>
      <p>Your payment of <strong>{{amount}} {{currency}}</strong> has been successfully processed.</p>
      <p>✅ Your account is now fully active</p>
      <p>✅ All premium features have been restored</p>
      <p>✅ Any paused automations are reactivated</p>
      <p>Thank you for your continued support. If you have any questions, we're here to help!</p>
    `,
        text: `
Great news, {{firstName}}!

Your payment of {{amount}} {{currency}} has been successfully processed.

✅ Account fully active
✅ Premium features restored
✅ Automations reactivated

Thank you!
    `
    },
    payment_3ds_required: {
        subject: 'Action Required: Confirm Your Payment',
        html: `
      <h2>Hi {{firstName}},</h2>
      <p>Your bank requires additional verification for your payment of <strong>{{amount}} {{currency}}</strong>.</p>
      <p>This is a security measure to protect your account.</p>
      <p><strong>Please complete verification within 24 hours:</strong></p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{hostedInvoiceUrl}}" style="background: #5c67f2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Complete Payment Verification</a>
      </div>
      <p>This link will take you to a secure page to confirm your payment.</p>
    `,
        text: `
Hi {{firstName}},

Your bank requires verification for your payment of {{amount}} {{currency}}.

Complete verification here: {{hostedInvoiceUrl}}

Please complete within 24 hours.
    `
    }
};
// SMS Templates (short)
exports.dunningSmsTemplates = {
    payment_failed_sms: {
        text: `Huntaze: Payment of {{amount}} {{currency}} failed. Update payment method: {{updateUrl}}`
    }
};
//# sourceMappingURL=dunning-emails.js.map
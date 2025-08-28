type MailOptions = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  from?: string;
};

export async function sendMail(opts: MailOptions): Promise<{ ok: true } | { ok: false; error: string }> {
  const from = opts.from || process.env.SES_FROM_EMAIL || process.env.SMTP_FROM || process.env.FROM_EMAIL;
  if (!from) return { ok: false, error: 'No FROM email configured' };

  const hasSmtp = !!process.env.SMTP_HOST;
  const hasSes = !!process.env.SES_FROM_EMAIL;

  try {
    if (hasSmtp) {
      // Lazy-load nodemailer to avoid hard dependency if not used
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });

      await transporter.sendMail({
        from,
        to: Array.isArray(opts.to) ? opts.to.join(',') : opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
        replyTo: opts.replyTo,
      });
      return { ok: true };
    }

    if (hasSes) {
      const region = process.env.AWS_REGION || 'us-east-1';
      // Lazy-load AWS SES client
      const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
      const client = new SESClient({ region });
      const toAddresses = Array.isArray(opts.to) ? opts.to : [opts.to];
      const configSet = process.env.SES_CONFIG_SET;
      const params = new SendEmailCommand({
        Destination: { ToAddresses: toAddresses },
        Message: {
          Subject: { Data: opts.subject },
          Body: opts.html ? { Html: { Data: opts.html } } : { Text: { Data: opts.text || '' } },
        },
        Source: from,
        ReplyToAddresses: opts.replyTo ? [opts.replyTo] : undefined,
        ConfigurationSetName: configSet || undefined,
      });
      await client.send(params);
      return { ok: true };
    }

    return { ok: false, error: 'No email provider configured (set SMTP_* or SES_* env)' };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Unknown email error' };
  }
}

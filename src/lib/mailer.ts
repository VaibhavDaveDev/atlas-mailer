import { WorkerMailer } from 'worker-mailer';

export interface MailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface MailCredentials {
  gmailUser: string;
  gmailAppPassword: string;
}

export async function sendEmail(
  creds: MailCredentials,
  payload: MailPayload
): Promise<{ messageId: string }> {
  await WorkerMailer.send(
    {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,   // false = plain TCP first, then STARTTLS upgrade
      startTls: true,  // required: Gmail mandates STARTTLS on port 587
      credentials: {
        username: creds.gmailUser,
        password: creds.gmailAppPassword,
      },
      authType: 'plain',
    },
    {
      from: { email: creds.gmailUser },
      to: { email: payload.to },
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    }
  );

  // worker-mailer does not return the SMTP message-id.
  // Generate a synthetic tracking ID for KV status records.
  const messageId = crypto.randomUUID();
  return { messageId };
}

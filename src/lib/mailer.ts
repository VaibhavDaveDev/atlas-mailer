import nodemailer from 'nodemailer';

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
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: creds.gmailUser,
      pass: creds.gmailAppPassword,
    },
  });

  const info = await transporter.sendMail({
    from: creds.gmailUser,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });

  return { messageId: info.messageId };
}

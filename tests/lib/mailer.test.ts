import { describe, it, expect, vi } from 'vitest';
import { sendEmail } from '../../src/lib/mailer';

// We mock nodemailer in this test
vi.mock('nodemailer', () => {
  return {
    default: {
      createTransport: () => ({
        sendMail: async () => ({ messageId: 'mock-id' })
      })
    }
  };
});

describe('mailer', () => {
  it('sends email and returns messageId', async () => {
    const res = await sendEmail(
      { gmailUser: 'u', gmailAppPassword: 'p' },
      { to: 'a@b.com', subject: 'sub', text: 'txt' }
    );
    expect(res.messageId).toBe('mock-id');
  });
});

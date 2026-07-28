import { describe, it, expect, vi } from 'vitest';
import { sendEmail } from '../../src/lib/mailer';
import { WorkerMailer } from 'worker-mailer';

// We mock worker-mailer in this test
vi.mock('worker-mailer', () => {
  return {
    WorkerMailer: {
      send: vi.fn().mockResolvedValue(undefined)
    }
  };
});

describe('mailer', () => {
  it('sends email and returns a generated messageId', async () => {
    const res = await sendEmail(
      { gmailUser: 'u', gmailAppPassword: 'p' },
      { to: 'a@b.com', subject: 'sub', text: 'txt' }
    );
    expect(res.messageId).toBeDefined();
    expect(typeof res.messageId).toBe('string');
    expect(WorkerMailer.send).toHaveBeenCalled();
  });
});

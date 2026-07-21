import { describe, it, expect, vi } from 'vitest';
import { queueHandler } from '../../src/lib/consumer';
import { env } from 'cloudflare:test';
import { readStatus } from '../../src/lib/status-store';

vi.mock('../../src/lib/mailer', () => ({
  sendEmail: async () => ({ messageId: 'mock-msg' })
}));

describe('consumer', () => {
  it('sends email on success and acks', async () => {
    const ackMock = vi.fn();
    const batch = {
      messages: [{
        body: { id: 'test-msg', to: 'a@b.com', subject: 'test', text: 'txt' },
        attempts: 1,
        ack: ackMock
      }]
    };
    
    await queueHandler(batch as any, env as any);
    
    const status = await readStatus(env.MAILER_KV as KVNamespace, 'test-msg');
    expect(status?.status).toBe('sent');
    expect(ackMock).toHaveBeenCalled();
  });
});

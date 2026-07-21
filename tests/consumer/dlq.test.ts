import { describe, it, expect, vi } from 'vitest';
import { dlqHandler } from '../../src/lib/dlq';
import { env } from 'cloudflare:test';
import { readStatus } from '../../src/lib/status-store';

describe('dlq', () => {
  it('writes failed status and acks message', async () => {
    const ackMock = vi.fn();
    const batch = {
      queue: 'mailer-dlq',
      messages: [{
        body: { id: 'test-id', to: 'a@b.com' },
        ack: ackMock
      }]
    };
    
    await dlqHandler(batch as any, env as any);
    
    const kv = env.MAILER_KV as KVNamespace;
    const status = await readStatus(kv, 'test-id');
    expect(status?.status).toBe('failed');
    expect(ackMock).toHaveBeenCalled();
  });
});

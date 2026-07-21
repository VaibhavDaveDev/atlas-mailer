import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { writeStatus, readStatus } from '../../src/lib/status-store';
import type { StatusRecord } from '../../src/types';

describe('status-store', () => {
  it('writes and reads status', async () => {
    const kv = env.MAILER_KV as KVNamespace;
    const record: StatusRecord = {
      status: 'queued',
      to: 'test@example.com',
      subject: 'Test',
      enqueuedAt: new Date().toISOString()
    };
    
    await writeStatus(kv, 'test-id', record);
    const read = await readStatus(kv, 'test-id');
    expect(read).toEqual(record);
  });

  it('returns null for unknown id', async () => {
    const kv = env.MAILER_KV as KVNamespace;
    const read = await readStatus(kv, 'unknown');
    expect(read).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { checkRateLimit, incrementRateLimit } from '../../src/lib/ratelimit';

describe('ratelimit', () => {
  it('allows request when under limit', async () => {
    const kv = env.MAILER_KV as KVNamespace;
    const res = await checkRateLimit(kv);
    expect(res.allowed).toBe(true);
  });
  
  it('increments counter', async () => {
    const kv = env.MAILER_KV as KVNamespace;
    await incrementRateLimit(kv);
    const res = await checkRateLimit(kv);
    expect(res.current).toBe(1);
  });
});

import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../../src/index';

describe('send routes', () => {
  it('returns 401 without auth', async () => {
    const req = new Request('http://localhost/send', { method: 'POST' });
    const res = await app.fetch(req, env as any, { waitUntil: () => {} } as any);
    expect(res.status).toBe(401);
  });
});

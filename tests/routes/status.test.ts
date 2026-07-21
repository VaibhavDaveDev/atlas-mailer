import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../../src/index';

describe('status routes', () => {
  it('returns 401 without auth', async () => {
    const req = new Request('http://localhost/status/123e4567-e89b-12d3-a456-426614174000');
    const res = await app.fetch(req, env as any, {} as any);
    expect(res.status).toBe(401);
  });
});

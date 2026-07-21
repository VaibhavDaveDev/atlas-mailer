import { describe, it, expect } from 'vitest';
import app from '../../src/index';

describe('health routes', () => {
  it('GET /health returns 200 ok', async () => {
    const req = new Request('http://localhost/health');
    const res = await app.fetch(req, {} as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.status).toBe('ok');
  });

  it('GET / returns 200 text', async () => {
    const req = new Request('http://localhost/');
    const res = await app.fetch(req, {} as any);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Atlas Mailer Microservice');
  });
});

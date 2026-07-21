import { describe, it, expect, vi } from 'vitest';
import { fireWebhook } from '../../src/lib/webhook';

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('webhook', () => {
  it('posts payload to callbackUrl', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });
    await fireWebhook('https://example.com/hook', { id: '123' });
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/hook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: '123' })
    });
  });

  it('swallows errors and does not throw', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await fireWebhook('https://example.com/hook', { id: '123' });
    
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

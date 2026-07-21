import type { Bindings } from '../types';

const DAILY_LIMIT = 500;

function getRateLimitKey(): string {
  const today = new Date().toISOString().split('T')[0];
  return `usage:${today}`;
}

export async function checkRateLimit(kv: KVNamespace): Promise<{ allowed: boolean; current: number }> {
  const key = getRateLimitKey();
  const val = await kv.get(key);
  const current = val ? parseInt(val, 10) : 0;
  return { allowed: current < DAILY_LIMIT, current };
}

export async function incrementRateLimit(kv: KVNamespace): Promise<void> {
  const key = getRateLimitKey();
  const val = await kv.get(key);
  const current = val ? parseInt(val, 10) : 0;
  await kv.put(key, (current + 1).toString(), {
    expirationTtl: 86400, // 24 hours
  });
}

import type { StatusRecord } from '../types';

const TTL_SECONDS = 604800; // 7 days

function statusKey(id: string): string {
  return `status:${id}`;
}

export async function writeStatus(kv: KVNamespace, id: string, record: StatusRecord): Promise<void> {
  await kv.put(statusKey(id), JSON.stringify(record), {
    expirationTtl: TTL_SECONDS,
  });
}

export async function readStatus(kv: KVNamespace, id: string): Promise<StatusRecord | null> {
  const raw = await kv.get(statusKey(id));
  if (!raw) return null;
  return JSON.parse(raw) as StatusRecord;
}

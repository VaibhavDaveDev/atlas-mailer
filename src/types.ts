import type { Queue, MessageBatch } from '@cloudflare/workers-types';

export type Bindings = {
  GMAIL_USER: string;
  GMAIL_APP_PASSWORD: string;
  API_KEY_SECRET: string;
  MAILER_KV: KVNamespace;
  MAILER_QUEUE: Queue<QueuedEmail>;
};

// The payload stored in the Cloudflare Queue message
export interface QueuedEmail {
  id: string;             // tracking id, generated at enqueue time (crypto.randomUUID())
  to: string;
  subject: string;
  text?: string;
  html?: string;
  callbackUrl?: string;   // optional webhook URL for terminal state notification
  enqueuedAt: string;     // ISO 8601 timestamp
}

// The shape of each KV status record, stored under key `status:<id>`
export type StatusRecord =
  | { status: 'queued';   to: string; subject: string; enqueuedAt: string }
  | { status: 'retrying'; attempt: number; lastAttemptAt: string }
  | { status: 'sent';     messageId: string; sentAt: string }
  | { status: 'failed';   error: string; failedAt: string };

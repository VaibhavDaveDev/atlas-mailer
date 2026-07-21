import type { MessageBatch } from '@cloudflare/workers-types';
import type { Bindings, QueuedEmail } from '../types';
import { writeStatus } from './status-store';
import { fireWebhook } from './webhook';

export async function dlqHandler(
  batch: MessageBatch<QueuedEmail>,
  env: Bindings
): Promise<void> {
  for (const message of batch.messages) {
    const { id, to, callbackUrl } = message.body;

    const failedAt = new Date().toISOString();
    const error = 'Email delivery failed after 5 attempts. Moved to dead-letter queue.';

    // Mark as permanently failed
    await writeStatus(env.MAILER_KV, id, {
      status: 'failed',
      error,
      failedAt,
    });

    // Notify via webhook if provided
    if (callbackUrl) {
      await fireWebhook(callbackUrl, { id, status: 'failed', error, to, failedAt });
    }

    console.error(JSON.stringify({
      event: 'dlq_message',
      id,
      to,
      error,
      failedAt,
    }));

    message.ack();
  }
}

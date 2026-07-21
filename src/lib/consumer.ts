import type { MessageBatch } from '@cloudflare/workers-types';
import type { Bindings, QueuedEmail } from '../types';
import { sendEmail } from './mailer';
import { writeStatus } from './status-store';
import { fireWebhook } from './webhook';

export async function queueHandler(
  batch: MessageBatch<QueuedEmail>,
  env: Bindings
): Promise<void> {
  for (const message of batch.messages) {
    const { id, to, subject, text, html, callbackUrl } = message.body;
    const attempt = message.attempts; // 1-indexed: 1 on first attempt

    try {
      const { messageId } = await sendEmail(
        { gmailUser: env.GMAIL_USER, gmailAppPassword: env.GMAIL_APP_PASSWORD },
        { to, subject, text, html }
      );

      // Terminal success
      await writeStatus(env.MAILER_KV, id, {
        status: 'sent',
        messageId,
        sentAt: new Date().toISOString(),
      });

      if (callbackUrl) {
        await fireWebhook(callbackUrl, { id, status: 'sent', messageId, to });
      }

      console.log(JSON.stringify({ event: 'send_success', id, messageId, to }));
      message.ack();

    } catch (error) {
      console.error(JSON.stringify({
        event: 'send_failure',
        id,
        to,
        attempt,
        error: String(error),
      }));

      // Update KV with retry state (for polling clients)
      await writeStatus(env.MAILER_KV, id, {
        status: 'retrying',
        attempt,
        lastAttemptAt: new Date().toISOString(),
      });

      // Exponential backoff: 15s, 30s, 60s, 120s, 240s
      // This delay only affects when the next retry fires, not the client
      // (the client already received 202 and is polling /status/:id)
      const delaySeconds = 15 * Math.pow(2, attempt - 1);
      message.retry({ delaySeconds });
      // After 5 failures (max_retries: 5), the platform routes to mailer-dlq automatically.
    }
  }
}

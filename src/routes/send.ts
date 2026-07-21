import { createRoute, z } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { Bindings } from '../types';
import { authMiddleware } from '../lib/middleware/auth';
import { checkRateLimit, incrementRateLimit } from '../lib/ratelimit';
import { writeStatus } from '../lib/status-store';

export const sendEmailSchema = z.object({
  to: z.string().email().openapi({ example: 'recipient@example.com' }),
  subject: z.string().min(1).openapi({ example: 'Hello from Atlas Mailer' }),
  text: z.string().optional().openapi({ example: 'Plain text body' }),
  html: z.string().optional().openapi({ example: '<p>HTML body</p>' }),
  callbackUrl: z.string().url().optional().openapi({
    example: 'https://yourapp.com/webhooks/email-status',
    description: 'Optional URL to POST the final delivery status to (sent or failed).',
  }),
}).refine(data => data.text || data.html, {
  message: "At least one of 'text' or 'html' must be provided",
  path: ['text'],
});

const sendRoute = createRoute({
  method: 'post',
  path: '/send',
  request: {
    body: {
      content: { 'application/json': { schema: sendEmailSchema } },
      required: true,
    },
    headers: z.object({
      authorization: z.string().openapi({ example: 'Bearer <API_KEY_SECRET>' }),
    }),
  },
  responses: {
    202: {
      description: 'Email accepted and queued for delivery',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            id: z.string().uuid(),
            status: z.literal('queued'),
          }),
        },
      },
    },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    429: { description: 'Daily rate limit exceeded' },
  },
});

export function registerSendRoute(app: OpenAPIHono<{ Bindings: Bindings }>) {
  app.use('/send', authMiddleware);

  app.openapi(sendRoute, async (c) => {
    const payload = c.req.valid('json');

    const { allowed } = await checkRateLimit(c.env.MAILER_KV);
    if (!allowed) {
      return c.json({ success: false, error: 'Daily email limit exceeded' }, 429);
    }

    const id = crypto.randomUUID();
    const enqueuedAt = new Date().toISOString();

    // Write initial status record to KV before enqueueing
    await writeStatus(c.env.MAILER_KV, id, {
      status: 'queued',
      to: payload.to,
      subject: payload.subject,
      enqueuedAt,
    });

    // Enqueue the message — includes the tracking id
    await c.env.MAILER_QUEUE.send({
      id,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      callbackUrl: payload.callbackUrl,
      enqueuedAt,
    });

    // Increment rate-limit counter in background (non-blocking)
    c.executionCtx.waitUntil(incrementRateLimit(c.env.MAILER_KV));

    return c.json({ success: true, id, status: 'queued' as const }, 202);
  });
}

import { createRoute, z } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { Bindings } from '../types';
import { authMiddleware } from '../lib/middleware/auth';
import { readStatus } from '../lib/status-store';

const statusRoute = createRoute({
  method: 'get',
  path: '/status/{id}',
  request: {
    params: z.object({ id: z.string().uuid() }),
    headers: z.object({
      authorization: z.string().openapi({ example: 'Bearer <API_KEY_SECRET>' }),
    }),
  },
  responses: {
    200: {
      description: 'Status record found',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            status: z.enum(['queued', 'retrying', 'sent', 'failed']),
          }).passthrough(),
        },
      },
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Tracking ID not found' },
  },
});

export function registerStatusRoute(app: OpenAPIHono<{ Bindings: Bindings }>) {
  app.use('/status/*', authMiddleware); // Must be applied explicitly — does not inherit from /send

  app.openapi(statusRoute, async (c) => {
    const { id } = c.req.valid('param');
    const record = await readStatus(c.env.MAILER_KV, id);
    if (!record) {
      return c.json({ success: false, error: 'Not found' }, 404);
    }
    return c.json({ success: true, ...record });
  });
}

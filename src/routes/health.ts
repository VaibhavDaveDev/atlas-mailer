import { createRoute, z } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { Bindings } from '../types';

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  responses: {
    200: {
      description: 'Service is healthy',
      content: {
        'application/json': {
          schema: z.object({ status: z.literal('ok'), timestamp: z.string() }),
        },
      },
    },
  },
});

const rootRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: { description: 'Service info', content: { 'text/plain': { schema: z.string() } } },
  },
});

export function registerHealthRoutes(app: OpenAPIHono<{ Bindings: Bindings }>) {
  app.openapi(healthRoute, (c) => {
    return c.json({ status: 'ok' as const, timestamp: new Date().toISOString() });
  });

  app.openapi(rootRoute, (c) => {
    return c.text('Atlas Mailer Microservice is running');
  });
}

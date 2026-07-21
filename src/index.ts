import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import type { Bindings } from './types';
import { registerSendRoute } from './routes/send';
import { registerStatusRoute } from './routes/status';
import { registerHealthRoutes } from './routes/health';
import { queueHandler } from './lib/consumer';
import { dlqHandler } from './lib/dlq';
import type { MessageBatch } from '@cloudflare/workers-types';
import type { QueuedEmail } from './types';

const app = new OpenAPIHono<{ Bindings: Bindings }>();

// Register all routes
registerSendRoute(app);
registerStatusRoute(app);
registerHealthRoutes(app);

// Serve the OpenAPI JSON spec
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'Atlas Mailer',
    version: '1.0.0',
    description: 'A free transactional email microservice powered by Gmail SMTP and Cloudflare Workers.',
  },
});

// Serve the Swagger UI at /docs
app.get('/docs', swaggerUI({ url: '/openapi.json' }));

// Cloudflare Workers module export
// fetch handles HTTP requests; queue handles async queue messages
export default {
  fetch: app.fetch,

  async queue(batch: MessageBatch<QueuedEmail>, env: Bindings): Promise<void> {
    if (batch.queue === 'mailer-dlq') {
      await dlqHandler(batch, env);
    } else {
      await queueHandler(batch, env);
    }
  },
};

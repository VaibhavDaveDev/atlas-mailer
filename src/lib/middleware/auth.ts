import { createMiddleware } from 'hono/factory';
import type { Bindings } from '../../types';

export const authMiddleware = createMiddleware<{ Bindings: Bindings }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (authHeader !== `Bearer ${c.env.API_KEY_SECRET}`) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    await next();
  }
);

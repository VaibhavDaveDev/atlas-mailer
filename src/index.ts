import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import type { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

// Zod Schema for Request Body
const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().optional(),
  html: z.string().optional(),
}).refine(data => data.text || data.html, {
  message: "At least one of 'text' or 'html' must be provided",
  path: ["text"],
});

// Middleware: Authentication
app.use('/send', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader !== `Bearer ${c.env.API_KEY_SECRET}`) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  await next();
});

// Route: POST /send
app.post(
  '/send',
  zValidator('json', sendEmailSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: 'Validation Error',
          details: result.error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        },
        400
      );
    }
  }),
  async (c) => {
  const payload = c.req.valid('json');
  
  // Rate Limiting
  const today = new Date().toISOString().split('T')[0];
  const rateLimitKey = `usage:${today}`;
  
  const currentCountStr = await c.env.MAILER_KV.get(rateLimitKey);
  const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
  
  if (currentCount >= 500) {
    return c.json({ success: false, error: 'Daily email limit exceeded' }, 429);
  }

  // SMTP Configuration
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: c.env.GMAIL_USER,
      pass: c.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: c.env.GMAIL_USER,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    // Increment KV count in the background with 24h expiration
    c.executionCtx.waitUntil(
      c.env.MAILER_KV.put(rateLimitKey, (currentCount + 1).toString(), {
        expirationTtl: 86400, // 24 hours in seconds
      })
    );

    return c.json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('SMTP Error:', error);
    return c.json({ success: false, error: 'Failed to send email' }, 500);
  }
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (c) => {
  return c.text('Atlas Mailer Microservice is running');
});

export default app;

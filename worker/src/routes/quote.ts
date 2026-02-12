import { Hono } from 'hono';
import type { Env } from '../index';
import { sendQuoteConfirmation, forwardToStella } from '../services/email';
import type { QuoteEmailData } from '../services/email';

export const quoteRoutes = new Hono<{ Bindings: Env }>();

quoteRoutes.post('/', async (c) => {
  const body = await c.req.json<QuoteEmailData>();

  if (!body.email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return c.json({ error: 'Invalid email address' }, 400);
  }

  // Forward to Stella CRM (non-blocking)
  const stellaPayload = { ...body, formType: 'quote' };
  c.executionCtx.waitUntil(forwardToStella(stellaPayload));

  // Send quote confirmation email via Resend
  const emailResult = await sendQuoteConfirmation(body, c.env.RESEND_API_KEY);

  if (!emailResult.success) {
    // Email failed but Stella was forwarded — partial success
    return c.json({
      status: 'partial',
      email: { success: false, error: emailResult.error },
      stella: { forwarded: true },
    }, 207);
  }

  return c.json({
    status: 'ok',
    email: { success: true, id: emailResult.id },
    stella: { forwarded: true },
  });
});

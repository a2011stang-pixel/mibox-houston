import { Hono } from 'hono';
import type { Env } from '../index';
import { sendQuoteConfirmation, forwardToStella } from '../services/email';
import type { QuoteEmailData } from '../services/email';
import { generateQuoteId, insertQuote, updateQuoteFlags } from '../services/database';

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

  // Generate quote ID and insert into D1
  const quoteId = await generateQuoteId(c.env.DB);
  await insertQuote(c.env.DB, quoteId, body);

  // Forward to Stella CRM (non-blocking)
  const stellaPayload = { ...body, quoteId, formType: 'quote' };
  c.executionCtx.waitUntil(
    forwardToStella(stellaPayload).then((ok) =>
      updateQuoteFlags(c.env.DB, quoteId, { stella_forwarded: ok ? 1 : 0 })
    )
  );

  // Send quote confirmation email via Resend (with quoteId)
  const emailResult = await sendQuoteConfirmation(body, c.env.RESEND_API_KEY, quoteId);

  // Update email_sent flag
  await updateQuoteFlags(c.env.DB, quoteId, {
    email_sent: emailResult.success ? 1 : 0,
  });

  if (!emailResult.success) {
    return c.json({
      status: 'partial',
      quoteId,
      email: { success: false, error: emailResult.error },
      stella: { forwarded: true },
    }, 207);
  }

  return c.json({
    status: 'ok',
    quoteId,
    email: { success: true, id: emailResult.id },
    stella: { forwarded: true },
  });
});

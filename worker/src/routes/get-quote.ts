import { Hono } from 'hono';
import type { Env } from '../index';
import { getQuoteByQuoteId } from '../services/database';

export const getQuoteRoutes = new Hono<{ Bindings: Env }>();

const QUOTE_ID_PATTERN = /^Q-[2346789ABCDEFGHJKMNPQRTUVWXYZ]{5}$/;
const QUOTE_EXPIRY_DAYS = 10;

getQuoteRoutes.get('/:quoteId', async (c) => {
  const quoteId = c.req.param('quoteId');

  if (!QUOTE_ID_PATTERN.test(quoteId)) {
    return c.json({ error: 'Invalid quote ID format' }, 400);
  }

  const quote = await getQuoteByQuoteId(c.env.DB, quoteId);

  if (!quote) {
    return c.json({ error: 'Quote not found or no longer available' }, 404);
  }

  // Check if quote has expired (older than 10 days)
  const createdAt = new Date(quote.createdAt).getTime();
  const now = Date.now();
  const expiryMs = QUOTE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  if (now - createdAt > expiryMs) {
    return c.json({
      expired: true,
      message: 'This quote has expired. Please request a new quote.',
    }, 410);
  }

  return c.json(quote);
});

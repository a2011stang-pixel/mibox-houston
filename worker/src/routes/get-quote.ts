import { Hono } from 'hono';
import type { Env } from '../index';
import { getQuoteByQuoteId } from '../services/database';

export const getQuoteRoutes = new Hono<{ Bindings: Env }>();

const QUOTE_ID_PATTERN = /^Q-[2346789ABCDEFGHJKMNPQRTUVWXYZ]{5}$/;

getQuoteRoutes.get('/:quoteId', async (c) => {
  const quoteId = c.req.param('quoteId');

  if (!QUOTE_ID_PATTERN.test(quoteId)) {
    return c.json({ error: 'Invalid quote ID format' }, 400);
  }

  const quote = await getQuoteByQuoteId(c.env.DB, quoteId);

  if (!quote) {
    return c.json({ error: 'Quote not found or no longer available' }, 404);
  }

  return c.json(quote);
});

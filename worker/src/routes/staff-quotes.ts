import { Hono } from 'hono';
import { AuditService } from '../services/audit';
import {
  previewNextQuoteNumber,
  calculatePricing,
  insertQuote,
  getQuote,
  listQuotes,
  updateQuoteStatus,
} from '../services/staff-quotes';
import type { CreateQuoteInput } from '../services/staff-quotes';
import { sendStaffQuoteEmail, mapStaffQuoteToStella, forwardToStella } from '../services/email';
import type { Env } from '../index';

export const staffQuotesRoutes = new Hono<{ Bindings: Env }>();

// Preview next quote number (no increment)
staffQuotesRoutes.get('/next-number', async (c) => {
  try {
    const nextNumber = await previewNextQuoteNumber(c.env.DB);
    return c.json({ next_number: nextNumber });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get quote stats for dashboard (must be before /:id)
staffQuotesRoutes.get('/stats/summary', async (c) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString();

    const stats = await c.env.DB.batch([
      c.env.DB.prepare("SELECT COUNT(*) as count FROM staff_quotes WHERE created_at >= ?").bind(weekAgoStr),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM staff_quotes WHERE status = 'converted' AND created_at >= ?").bind(weekAgoStr),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM staff_quotes WHERE status = 'draft'"),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM staff_quotes WHERE status = 'sent'"),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM staff_quotes WHERE status = 'converted'"),
    ]);

    const get = (idx: number) => {
      const results = stats[idx].results as { count: number }[];
      return results?.[0]?.count ?? 0;
    };

    return c.json({
      this_week: get(0),
      converted_this_week: get(1),
      draft_count: get(2),
      sent_count: get(3),
      converted_count: get(4),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// List quotes with filters
staffQuotesRoutes.get('/', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '25');
    const offset = parseInt(c.req.query('offset') || '0');
    const status = c.req.query('status') || undefined;
    const search = c.req.query('search') || undefined;

    const result = await listQuotes(c.env.DB, { limit, offset, status, search });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Get single quote with items
staffQuotesRoutes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) return c.json({ error: 'Invalid quote ID' }, 400);

    const quote = await getQuote(c.env.DB, id);
    if (!quote) return c.json({ error: 'Quote not found' }, 404);

    return c.json({ quote });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Create a new staff quote
staffQuotesRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<CreateQuoteInput>();

    // Validate required fields
    if (!body.customer_name?.trim()) {
      return c.json({ error: 'Customer name is required' }, 400);
    }
    if (!body.items || body.items.length === 0) {
      return c.json({ error: 'At least one container is required' }, 400);
    }
    if (body.items.length > 10) {
      return c.json({ error: 'Maximum 10 containers per quote' }, 400);
    }

    const isAdvanced = body.quote_type === 'advanced';

    if (isAdvanced) {
      // Advanced mode: per-item service_type required, non-facility items need zip_1
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        if (!item.service_type) {
          return c.json({ error: `Container ${i + 1}: service type is required` }, 400);
        }
        const isFacility = item.service_type.startsWith('Facility Storage');
        if (!isFacility && (!item.zip_1 || !/^\d{5}$/.test(item.zip_1))) {
          return c.json({ error: `Container ${i + 1}: valid 5-digit ZIP is required` }, 400);
        }
      }
      // Global zip/service_type fall back to first item
      if (!body.zip) body.zip = body.items[0].zip_1 || '00000';
      if (!body.service_type) body.service_type = body.items[0].service_type || '';
    } else {
      // Quick Quote mode: global zip + service_type required
      if (!body.zip || !/^\d{5}$/.test(body.zip)) {
        return c.json({ error: 'Valid 5-digit ZIP code is required' }, 400);
      }
      if (!body.service_type) {
        return c.json({ error: 'Service type is required' }, 400);
      }
    }

    // Validate override reason if override set
    if (body.override_monthly_cents !== undefined && body.override_monthly_cents !== null) {
      if (!body.override_reason?.trim()) {
        return c.json({ error: 'Override reason is required when setting a price override' }, 400);
      }
    }

    // Validate email if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return c.json({ error: 'Invalid email address' }, 400);
      }
    }

    // Calculate pricing from DB
    const pricing = await calculatePricing(
      c.env.DB,
      body.zip,
      body.items,
      body.promo_id,
      body.override_monthly_cents
    );

    // Insert quote
    const { id, quote_number } = await insertQuote(c.env.DB, body, pricing, user.email);

    // Fetch the saved quote for audit
    const savedQuote = await getQuote(c.env.DB, id);

    // Audit log
    const audit = new AuditService(c.env.DB);
    await audit.log(
      parseInt(user.id),
      user.email,
      'staff_quote.create',
      'staff_quote',
      quote_number,
      null,
      savedQuote,
      c.req.header('CF-Connecting-IP') || null,
      c.req.header('User-Agent') || null
    );

    return c.json({ quote: savedQuote }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Send quote email
staffQuotesRoutes.post('/:id/email', async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) return c.json({ error: 'Invalid quote ID' }, 400);

    const quote = await getQuote(c.env.DB, id);
    if (!quote) return c.json({ error: 'Quote not found' }, 404);

    if (!quote.email) {
      return c.json({ error: 'Quote has no email address' }, 400);
    }

    const emailResult = await sendStaffQuoteEmail(quote, quote.items, c.env.RESEND_API_KEY);

    const now = new Date().toISOString();
    await updateQuoteStatus(c.env.DB, id, {
      status: quote.status === 'draft' ? 'sent' : quote.status,
      email_sent: emailResult.success ? 1 : 0,
      email_sent_at: emailResult.success ? now : undefined,
    });

    const audit = new AuditService(c.env.DB);
    await audit.log(
      parseInt(user.id),
      user.email,
      'staff_quote.email',
      'staff_quote',
      quote.quote_number,
      { email_sent: quote.email_sent },
      { email_sent: emailResult.success ? 1 : 0, email_sent_at: now },
      c.req.header('CF-Connecting-IP') || null,
      c.req.header('User-Agent') || null
    );

    if (!emailResult.success) {
      return c.json({ error: emailResult.error || 'Failed to send email' }, 500);
    }

    return c.json({ success: true, email_id: emailResult.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Convert to Stella CRM
staffQuotesRoutes.post('/:id/convert', async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) return c.json({ error: 'Invalid quote ID' }, 400);

    const quote = await getQuote(c.env.DB, id);
    if (!quote) return c.json({ error: 'Quote not found' }, 404);

    const stellaPayload = mapStaffQuoteToStella(quote, quote.items);
    const ok = await forwardToStella(stellaPayload);

    const now = new Date().toISOString();
    await updateQuoteStatus(c.env.DB, id, {
      status: 'converted',
      stella_forwarded: ok ? 1 : 0,
      converted_at: now,
    });

    const audit = new AuditService(c.env.DB);
    await audit.log(
      parseInt(user.id),
      user.email,
      'staff_quote.convert',
      'staff_quote',
      quote.quote_number,
      { status: quote.status },
      { status: 'converted', stella_forwarded: ok ? 1 : 0 },
      c.req.header('CF-Connecting-IP') || null,
      c.req.header('User-Agent') || null
    );

    if (!ok) {
      return c.json({ error: 'Stella forwarding failed' }, 500);
    }

    return c.json({ success: true, converted_at: now });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

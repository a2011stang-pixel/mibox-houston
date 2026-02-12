import { Hono } from 'hono';
import type { Env } from '../index';
import { sendBookingConfirmation, forwardToStella } from '../services/email';
import type { BookingEmailData } from '../services/email';
import {
  generateQuoteId,
  insertBookingQuote,
  updateQuoteToBooked,
  updateQuoteFlags,
} from '../services/database';

export const bookingRoutes = new Hono<{ Bindings: Env }>();

bookingRoutes.post('/', async (c) => {
  const body = await c.req.json<BookingEmailData & { quoteId?: string }>();

  if (!body.email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return c.json({ error: 'Invalid email address' }, 400);
  }

  let quoteId: string;

  if (body.quoteId) {
    // Update existing quote to booked
    const updated = await updateQuoteToBooked(c.env.DB, body.quoteId, {
      deliveryAddress: body.deliveryAddress,
      city: body.city,
      state: body.state,
      placement: body.placement,
      surfaceType: body.surfaceType,
      doorFacing: body.doorFacing,
      gateCode: body.gateCode,
      notes: body.notes,
    });

    if (updated) {
      quoteId = body.quoteId;
    } else {
      // Quote not found or already booked — create a new one
      quoteId = await generateQuoteId(c.env.DB);
      await insertBookingQuote(c.env.DB, quoteId, body);
    }
  } else {
    // No quoteId provided — create new record as booked
    quoteId = await generateQuoteId(c.env.DB);
    await insertBookingQuote(c.env.DB, quoteId, body);
  }

  // Forward to Stella CRM (non-blocking)
  const stellaPayload = { ...body, quoteId, formType: 'booking' };
  c.executionCtx.waitUntil(
    forwardToStella(stellaPayload).then((ok) =>
      updateQuoteFlags(c.env.DB, quoteId, { stella_forwarded: ok ? 1 : 0 })
    )
  );

  // Send booking confirmation email via Resend (with quoteId)
  const emailResult = await sendBookingConfirmation(body, c.env.RESEND_API_KEY, quoteId);

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

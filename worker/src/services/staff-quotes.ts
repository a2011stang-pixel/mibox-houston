/**
 * Staff Quotes service — quote number generation, pricing calculation, CRUD.
 * Prices stored as INTEGER cents, consistent with zones/pricing tables.
 */

import type { StaffQuote, StaffQuoteItem } from '../types';

export interface StaffQuoteItemInput {
  container_size: string;
  storage_location: string;
}

export interface PricingResult {
  items: {
    container_size: string;
    storage_location: string;
    monthly_rate_cents: number;
    first_month_rate_cents: number;
  }[];
  zone_id: number;
  zone_name: string;
  delivery_fee_cents: number;
  pickup_fee_cents: number;
  relocation_fee_cents: number;
  container_count: number;
  multi_discount_percent: number;
  promo_discount_cents: number;
  subtotal_monthly_cents: number;
  discount_monthly_cents: number;
  total_monthly_cents: number;
  first_month_total_cents: number;
  due_today_cents: number;
}

export interface CreateQuoteInput {
  customer_name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip: string;
  service_type: string;
  delivery_date?: string;
  months_needed?: number;
  items: StaffQuoteItemInput[];
  promo_id?: number;
  promo_code?: string;
  override_monthly_cents?: number;
  override_reason?: string;
  notes?: string;
}

/**
 * Generate sequential quote number: QT-YYYY-NNNN
 * Uses atomic UPDATE + SELECT on staff_quote_counter table.
 */
export async function generateQuoteNumber(db: D1Database): Promise<string> {
  const year = new Date().getFullYear();

  // Upsert the counter row for this year
  await db
    .prepare(
      `INSERT INTO staff_quote_counter (year, last_number)
       VALUES (?, 0)
       ON CONFLICT(year) DO NOTHING`
    )
    .bind(year)
    .run();

  // Atomic increment
  await db
    .prepare('UPDATE staff_quote_counter SET last_number = last_number + 1 WHERE year = ?')
    .bind(year)
    .run();

  const row = await db
    .prepare('SELECT last_number FROM staff_quote_counter WHERE year = ?')
    .bind(year)
    .first<{ last_number: number }>();

  const num = row?.last_number ?? 1;
  return `QT-${year}-${String(num).padStart(4, '0')}`;
}

/**
 * Preview next quote number without incrementing.
 */
export async function previewNextQuoteNumber(db: D1Database): Promise<string> {
  const year = new Date().getFullYear();
  const row = await db
    .prepare('SELECT last_number FROM staff_quote_counter WHERE year = ?')
    .bind(year)
    .first<{ last_number: number }>();

  const next = (row?.last_number ?? 0) + 1;
  return `QT-${year}-${String(next).padStart(4, '0')}`;
}

/**
 * Calculate full pricing breakdown from DB data.
 * Multi-container discount: 2 = 5%, 3+ = 10% (monthly only).
 */
export async function calculatePricing(
  db: D1Database,
  zip: string,
  items: StaffQuoteItemInput[],
  promoId?: number,
  overrideMonthlyCents?: number
): Promise<PricingResult> {
  // Fetch zone by ZIP
  const zoneRow = await db
    .prepare(`
      SELECT z.id as zone_id, z.name as zone_name, z.delivery_fee, z.pickup_fee, z.relocation_fee
      FROM zip_codes zc
      JOIN zones z ON zc.zone_id = z.id
      WHERE zc.zip = ? AND z.is_active = 1
    `)
    .bind(zip)
    .first<{
      zone_id: number;
      zone_name: string;
      delivery_fee: number;
      pickup_fee: number;
      relocation_fee: number;
    }>();

  if (!zoneRow) {
    throw new Error('ZIP code not in service area');
  }

  // Fetch all pricing
  const pricingRows = await db
    .prepare('SELECT container_size, rate_type, amount FROM pricing')
    .all<{ container_size: string; rate_type: string; amount: number }>();

  const pricingMap: Record<string, Record<string, number>> = {};
  for (const p of pricingRows.results || []) {
    if (!pricingMap[p.container_size]) pricingMap[p.container_size] = {};
    pricingMap[p.container_size][p.rate_type] = p.amount; // already in cents
  }

  // Build line items
  const pricedItems = items.map((item) => {
    const sizeRates = pricingMap[item.container_size];
    if (!sizeRates) throw new Error(`No pricing for container size ${item.container_size}`);

    const monthlyRate = sizeRates[item.storage_location];
    if (monthlyRate === undefined) {
      throw new Error(`No pricing for ${item.container_size}/${item.storage_location}`);
    }

    const firstMonthRate = sizeRates['first_month'] ?? monthlyRate;

    return {
      container_size: item.container_size,
      storage_location: item.storage_location,
      monthly_rate_cents: monthlyRate,
      first_month_rate_cents: firstMonthRate,
    };
  });

  const containerCount = items.length;

  // Multi-container discount on monthly only
  let multiDiscountPercent = 0;
  if (containerCount === 2) multiDiscountPercent = 5;
  else if (containerCount >= 3) multiDiscountPercent = 10;

  // Sum monthly rates
  let subtotalMonthlyCents = pricedItems.reduce((sum, i) => sum + i.monthly_rate_cents, 0);

  // Apply override if set
  if (overrideMonthlyCents !== undefined && overrideMonthlyCents !== null) {
    subtotalMonthlyCents = overrideMonthlyCents * containerCount;
  }

  const multiDiscountCents = Math.round(subtotalMonthlyCents * multiDiscountPercent / 100);

  // Promo discount
  let promoDiscountCents = 0;
  if (promoId) {
    const promo = await db
      .prepare('SELECT * FROM promotions WHERE id = ? AND is_active = 1')
      .bind(promoId)
      .first<{
        discount_type: string;
        discount_value: number;
        applies_to: string;
        container_sizes: string;
      }>();

    if (promo) {
      const appliesTo: string[] = JSON.parse(promo.applies_to || '[]');

      // Apply to monthly rent
      if (appliesTo.includes('rent')) {
        const applicableMonthly = subtotalMonthlyCents - multiDiscountCents;
        if (promo.discount_type === 'percent') {
          promoDiscountCents += Math.round(applicableMonthly * promo.discount_value / 100);
        } else {
          promoDiscountCents += Math.round(promo.discount_value * 100); // flat value is in dollars
        }
      }

      // Apply to delivery
      if (appliesTo.includes('delivery')) {
        const deliveryTotal = zoneRow.delivery_fee * containerCount;
        if (promo.discount_type === 'percent') {
          promoDiscountCents += Math.round(deliveryTotal * promo.discount_value / 100);
        } else {
          promoDiscountCents += Math.round(promo.discount_value * 100);
        }
      }
    }
  }

  const discountMonthlyCents = multiDiscountCents + promoDiscountCents;
  const totalMonthlyCents = subtotalMonthlyCents - multiDiscountCents;

  // First month total = first month rates + delivery fees - promo
  const firstMonthRentCents = pricedItems.reduce((sum, i) => sum + i.first_month_rate_cents, 0);
  const deliveryTotalCents = zoneRow.delivery_fee * containerCount;
  const firstMonthTotalCents = firstMonthRentCents + deliveryTotalCents - promoDiscountCents;

  // Due today = first month total
  const dueTodayCents = firstMonthTotalCents;

  return {
    items: pricedItems,
    zone_id: zoneRow.zone_id,
    zone_name: zoneRow.zone_name,
    delivery_fee_cents: zoneRow.delivery_fee,
    pickup_fee_cents: zoneRow.pickup_fee,
    relocation_fee_cents: zoneRow.relocation_fee,
    container_count: containerCount,
    multi_discount_percent: multiDiscountPercent,
    promo_discount_cents: promoDiscountCents,
    subtotal_monthly_cents: subtotalMonthlyCents,
    discount_monthly_cents: discountMonthlyCents,
    total_monthly_cents: totalMonthlyCents,
    first_month_total_cents: firstMonthTotalCents,
    due_today_cents: dueTodayCents,
  };
}

/**
 * Insert a new staff quote + line items in a batch.
 */
export async function insertQuote(
  db: D1Database,
  input: CreateQuoteInput,
  pricing: PricingResult,
  userEmail: string
): Promise<{ id: number; quote_number: string }> {
  const quoteNumber = await generateQuoteNumber(db);
  const now = new Date().toISOString();

  // Insert quote
  const result = await db
    .prepare(`
      INSERT INTO staff_quotes (
        quote_number, status, created_at, updated_at,
        customer_name, phone, email, address, city, state, zip,
        service_type, delivery_date, months_needed,
        zone_id, zone_name, delivery_fee_cents, pickup_fee_cents, relocation_fee_cents,
        container_count, multi_discount_percent,
        promo_id, promo_code, promo_discount_cents,
        override_monthly_cents, override_reason,
        subtotal_monthly_cents, discount_monthly_cents, total_monthly_cents,
        first_month_total_cents, due_today_cents,
        created_by, notes
      ) VALUES (?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      quoteNumber, now, now,
      input.customer_name,
      input.phone || null,
      input.email || null,
      input.address || null,
      input.city || null,
      input.state || 'TX',
      input.zip,
      input.service_type,
      input.delivery_date || null,
      input.months_needed || 1,
      pricing.zone_id,
      pricing.zone_name,
      pricing.delivery_fee_cents,
      pricing.pickup_fee_cents,
      pricing.relocation_fee_cents,
      pricing.container_count,
      pricing.multi_discount_percent,
      input.promo_id || null,
      input.promo_code || null,
      pricing.promo_discount_cents,
      input.override_monthly_cents ?? null,
      input.override_reason || null,
      pricing.subtotal_monthly_cents,
      pricing.discount_monthly_cents,
      pricing.total_monthly_cents,
      pricing.first_month_total_cents,
      pricing.due_today_cents,
      userEmail,
      input.notes || null
    )
    .run();

  // Get the inserted ID
  const inserted = await db
    .prepare('SELECT id FROM staff_quotes WHERE quote_number = ?')
    .bind(quoteNumber)
    .first<{ id: number }>();

  const quoteId = inserted!.id;

  // Insert line items
  for (const item of pricing.items) {
    await db
      .prepare(`
        INSERT INTO staff_quote_items (quote_id, container_size, storage_location, monthly_rate_cents, first_month_rate_cents)
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(quoteId, item.container_size, item.storage_location, item.monthly_rate_cents, item.first_month_rate_cents)
      .run();
  }

  return { id: quoteId, quote_number: quoteNumber };
}

/**
 * Get a single quote with its line items.
 */
export async function getQuote(
  db: D1Database,
  id: number
): Promise<(StaffQuote & { items: StaffQuoteItem[] }) | null> {
  const quote = await db
    .prepare('SELECT * FROM staff_quotes WHERE id = ?')
    .bind(id)
    .first<StaffQuote>();

  if (!quote) return null;

  const items = await db
    .prepare('SELECT * FROM staff_quote_items WHERE quote_id = ? ORDER BY id')
    .bind(id)
    .all<StaffQuoteItem>();

  return { ...quote, items: items.results || [] };
}

/**
 * List quotes with pagination, filtering, and search.
 */
export async function listQuotes(
  db: D1Database,
  options: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
  } = {}
): Promise<{ quotes: StaffQuote[]; total: number }> {
  const { limit = 25, offset = 0, status, search } = options;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (search) {
    conditions.push(
      '(customer_name LIKE ? OR email LIKE ? OR quote_number LIKE ? OR zip LIKE ?)'
    );
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countRow = await db
    .prepare(`SELECT COUNT(*) as count FROM staff_quotes ${where}`)
    .bind(...params)
    .first<{ count: number }>();

  const rows = await db
    .prepare(`SELECT * FROM staff_quotes ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(...params, limit, offset)
    .all<StaffQuote>();

  return {
    quotes: rows.results || [],
    total: countRow?.count ?? 0,
  };
}

/**
 * Update quote status and tracking fields.
 */
export async function updateQuoteStatus(
  db: D1Database,
  id: number,
  updates: {
    status?: string;
    email_sent?: number;
    email_sent_at?: string;
    stella_forwarded?: number;
    stella_order_id?: string;
    converted_at?: string;
  }
): Promise<boolean> {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.status !== undefined) {
    sets.push('status = ?');
    values.push(updates.status);
  }
  if (updates.email_sent !== undefined) {
    sets.push('email_sent = ?');
    values.push(updates.email_sent);
  }
  if (updates.email_sent_at !== undefined) {
    sets.push('email_sent_at = ?');
    values.push(updates.email_sent_at);
  }
  if (updates.stella_forwarded !== undefined) {
    sets.push('stella_forwarded = ?');
    values.push(updates.stella_forwarded);
  }
  if (updates.stella_order_id !== undefined) {
    sets.push('stella_order_id = ?');
    values.push(updates.stella_order_id);
  }
  if (updates.converted_at !== undefined) {
    sets.push('converted_at = ?');
    values.push(updates.converted_at);
  }

  if (sets.length === 0) return false;

  sets.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const result = await db
    .prepare(`UPDATE staff_quotes SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

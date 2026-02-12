/**
 * Database service for D1 quotes table.
 * Handles quote ID generation, CRUD operations for quotes/bookings.
 */

const QUOTE_ID_CHARSET = '2346789ABCDEFGHJKMNPQRTUVWXYZ';
const QUOTE_ID_LENGTH = 5;
const MAX_RETRIES = 3;

export interface QuoteRecord {
  id?: number;
  quote_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  service_type?: string;
  service_display?: string;
  box_size?: string;
  delivery_zip?: string;
  destination_zip?: string;
  storage_duration?: string;
  delivery_date?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  how_heard?: string;
  delivery_fee?: string;
  first_month_rent?: string;
  monthly_rent?: string;
  due_today?: string;
  ongoing_monthly?: string;
  delivery_address?: string;
  city?: string;
  state?: string;
  placement?: string;
  surface_type?: string;
  door_facing?: string;
  gate_code?: string;
  notes?: string;
  booked_at?: string;
  lead_source?: string;
  stella_forwarded?: number;
  email_sent?: number;
  sms_sent?: number;
}

export interface QuoteInsertData {
  serviceDisplay?: string;
  boxSize?: string;
  deliveryZip?: string;
  destinationZip?: string;
  storageDuration?: string;
  deliveryDate?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  howHeard?: string;
  deliveryFee?: string;
  firstMonthRent?: string;
  monthlyRent?: string;
  dueToday?: string;
  ongoingMonthly?: string;
  leadSource?: string;
  formType?: string;
}

export interface BookingUpdateData {
  deliveryAddress?: string;
  city?: string;
  state?: string;
  placement?: string;
  surfaceType?: string;
  doorFacing?: string;
  gateCode?: string;
  notes?: string;
}

export interface QuotePublicData {
  quoteId: string;
  status: string;
  createdAt: string;
  serviceDisplay?: string;
  boxSize?: string;
  deliveryZip?: string;
  destinationZip?: string;
  storageDuration?: string;
  deliveryDate?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  howHeard?: string;
  deliveryFee?: string;
  firstMonthRent?: string;
  monthlyRent?: string;
  dueToday?: string;
  ongoingMonthly?: string;
}

function generateRandomId(): string {
  let id = '';
  const array = new Uint8Array(QUOTE_ID_LENGTH);
  crypto.getRandomValues(array);
  for (let i = 0; i < QUOTE_ID_LENGTH; i++) {
    id += QUOTE_ID_CHARSET[array[i] % QUOTE_ID_CHARSET.length];
  }
  return `Q-${id}`;
}

export async function generateQuoteId(db: D1Database): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const quoteId = generateRandomId();
    const existing = await db
      .prepare('SELECT quote_id FROM quotes WHERE quote_id = ?')
      .bind(quoteId)
      .first();
    if (!existing) {
      return quoteId;
    }
  }
  throw new Error('Failed to generate unique quote ID after max retries');
}

export async function insertQuote(
  db: D1Database,
  quoteId: string,
  data: QuoteInsertData
): Promise<string> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO quotes (
        quote_id, status, created_at, updated_at,
        service_type, service_display, box_size, delivery_zip, destination_zip,
        storage_duration, delivery_date,
        first_name, last_name, email, phone, company, how_heard,
        delivery_fee, first_month_rent, monthly_rent, due_today, ongoing_monthly,
        lead_source
      ) VALUES (?, 'quoted', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      quoteId, now, now,
      data.formType || null,
      data.serviceDisplay || null,
      data.boxSize || null,
      data.deliveryZip || null,
      data.destinationZip || null,
      data.storageDuration || null,
      data.deliveryDate || null,
      data.firstName || null,
      data.lastName || null,
      data.email || null,
      data.phone || null,
      data.company || null,
      data.howHeard || null,
      data.deliveryFee || null,
      data.firstMonthRent || null,
      data.monthlyRent || null,
      data.dueToday || null,
      data.ongoingMonthly || null,
      data.leadSource || 'Website'
    )
    .run();

  return quoteId;
}

export async function getQuoteByQuoteId(
  db: D1Database,
  quoteId: string
): Promise<QuotePublicData | null> {
  const row = await db
    .prepare('SELECT * FROM quotes WHERE quote_id = ? AND status = ?')
    .bind(quoteId, 'quoted')
    .first<QuoteRecord>();

  if (!row) return null;

  return {
    quoteId: row.quote_id,
    status: row.status,
    createdAt: row.created_at,
    serviceDisplay: row.service_display || undefined,
    boxSize: row.box_size || undefined,
    deliveryZip: row.delivery_zip || undefined,
    destinationZip: row.destination_zip || undefined,
    storageDuration: row.storage_duration || undefined,
    deliveryDate: row.delivery_date || undefined,
    firstName: row.first_name || undefined,
    lastName: row.last_name || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    company: row.company || undefined,
    howHeard: row.how_heard || undefined,
    deliveryFee: row.delivery_fee || undefined,
    firstMonthRent: row.first_month_rent || undefined,
    monthlyRent: row.monthly_rent || undefined,
    dueToday: row.due_today || undefined,
    ongoingMonthly: row.ongoing_monthly || undefined,
  };
}

export async function updateQuoteToBooked(
  db: D1Database,
  quoteId: string,
  data: BookingUpdateData
): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE quotes SET
        status = 'booked',
        booked_at = ?,
        updated_at = ?,
        delivery_address = ?,
        city = ?,
        state = ?,
        placement = ?,
        surface_type = ?,
        door_facing = ?,
        gate_code = ?,
        notes = ?
      WHERE quote_id = ? AND status = 'quoted'`
    )
    .bind(
      now, now,
      data.deliveryAddress || null,
      data.city || null,
      data.state || null,
      data.placement || null,
      data.surfaceType || null,
      data.doorFacing || null,
      data.gateCode || null,
      data.notes || null,
      quoteId
    )
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

export async function updateQuoteFlags(
  db: D1Database,
  quoteId: string,
  flags: { email_sent?: number; stella_forwarded?: number; sms_sent?: number }
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number)[] = [];

  if (flags.email_sent !== undefined) {
    sets.push('email_sent = ?');
    values.push(flags.email_sent);
  }
  if (flags.stella_forwarded !== undefined) {
    sets.push('stella_forwarded = ?');
    values.push(flags.stella_forwarded);
  }
  if (flags.sms_sent !== undefined) {
    sets.push('sms_sent = ?');
    values.push(flags.sms_sent);
  }

  if (sets.length === 0) return;

  sets.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(quoteId);

  await db
    .prepare(`UPDATE quotes SET ${sets.join(', ')} WHERE quote_id = ?`)
    .bind(...values)
    .run();
}

export async function insertBookingQuote(
  db: D1Database,
  quoteId: string,
  data: QuoteInsertData & BookingUpdateData
): Promise<string> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO quotes (
        quote_id, status, created_at, updated_at, booked_at,
        service_type, service_display, box_size, delivery_zip, destination_zip,
        storage_duration, delivery_date,
        first_name, last_name, email, phone, company, how_heard,
        delivery_fee, first_month_rent, monthly_rent, due_today, ongoing_monthly,
        delivery_address, city, state, placement, surface_type,
        door_facing, gate_code, notes,
        lead_source
      ) VALUES (?, 'booked', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      quoteId, now, now, now,
      data.formType || null,
      data.serviceDisplay || null,
      data.boxSize || null,
      data.deliveryZip || null,
      data.destinationZip || null,
      data.storageDuration || null,
      data.deliveryDate || null,
      data.firstName || null,
      data.lastName || null,
      data.email || null,
      data.phone || null,
      data.company || null,
      data.howHeard || null,
      data.deliveryFee || null,
      data.firstMonthRent || null,
      data.monthlyRent || null,
      data.dueToday || null,
      data.ongoingMonthly || null,
      data.deliveryAddress || null,
      data.city || null,
      data.state || null,
      data.placement || null,
      data.surfaceType || null,
      data.doorFacing || null,
      data.gateCode || null,
      data.notes || null,
      data.leadSource || 'Website'
    )
    .run();

  return quoteId;
}

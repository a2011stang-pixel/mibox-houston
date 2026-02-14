/**
 * Email service using Resend API.
 * Builds branded HTML email templates and sends via Resend.
 *
 * Brand colors: yellow #FFDD00, dark #333333, gray #f8f9fa
 * Phone: (713) 929-6051
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'MI-BOX Houston <sales@miboxhouston.com>';
const STELLA_WEBHOOK_URL = 'https://api.runstella.com/webhook/16216eb0';
const BRAND_YELLOW = '#FFDD00';
const BRAND_DARK = '#333333';

export interface QuoteEmailData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  howHeard?: string;
  serviceDisplay: string;
  boxSize: string;
  deliveryZip: string;
  destinationZip?: string;
  storageDuration?: string;
  deliveryDate?: string;
  deliveryFee: string;
  firstMonthRent: string;
  monthlyRent: string;
  dueToday: string;
  ongoingMonthly: string;
  whenDoneTotal?: string;
  leadSource: string;
  formType: string;
  timestamp: string;
}

export interface BookingEmailData extends QuoteEmailData {
  deliveryAddress: string;
  city: string;
  state: string;
  placement: string;
  surfaceType: string;
  doorFacing?: string;
  gateCode?: string;
  notes?: string;
}

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export function escapeHtml(str: string | null | undefined): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function emailRow(label: string, value: string): string {
  return `<tr>
<td style="padding:6px 0;color:#666666;font-size:14px;">${label}</td>
<td style="padding:6px 0;color:${BRAND_DARK};font-size:14px;text-align:right;font-weight:bold;">${value}</td>
</tr>`;
}

function sectionHeader(title: string): string {
  return `<h3 style="margin:0 0 16px;color:${BRAND_DARK};font-size:16px;border-bottom:2px solid ${BRAND_YELLOW};padding-bottom:8px;">${title}</h3>`;
}

function sectionWrapper(content: string): string {
  return `<tr>
<td style="padding:16px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:6px;border:1px solid #e9ecef;">
<tr><td style="padding:20px;">
${content}
</td></tr>
</table>
</td>
</tr>`;
}

function trustBar(): string {
  return `<!-- Trust Bar -->
<tr>
<td style="padding:0 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e9ecef;border-bottom:1px solid #e9ecef;">
<tr>
<td width="49%" style="padding:16px 0;text-align:center;vertical-align:top;">
<p style="margin:0;color:${BRAND_DARK};font-size:13px;font-weight:bold;">Google Reviews</p>
<p style="margin:4px 0 0;font-size:14px;"><span style="color:${BRAND_YELLOW};">&#9733;&#9733;&#9733;&#9733;&#9733;</span> <span style="color:${BRAND_DARK};font-weight:bold;">5.0</span></p>
</td>
<td width="2%" style="padding:16px 0;vertical-align:top;">
<table role="presentation" width="1" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="background-color:#e9ecef;width:1px;height:40px;font-size:0;line-height:0;">&nbsp;</td></tr></table>
</td>
<td width="49%" style="padding:16px 0;text-align:center;vertical-align:top;">
<p style="margin:0;color:${BRAND_DARK};font-size:13px;font-weight:bold;">Locally Owned</p>
<p style="margin:4px 0 0;color:#666666;font-size:13px;">Operated in Houston, TX</p>
</td>
</tr>
</table>
</td>
</tr>`;
}

function legalDisclaimer(): string {
  return `<!-- Legal Disclaimer -->
<tr>
<td style="padding:16px 32px 8px;">
<p style="margin:0;color:#888888;font-size:11px;line-height:1.5;">Pricing is based on the information provided at the time of this quote and is subject to change without notice. Sales tax is not included and will be applied at the time of booking. Final pricing may vary based on actual delivery location, container availability, and service requirements. This quote does not constitute a binding agreement or guarantee of service. MI-BOX Moving &amp; Mobile Storage of Houston reserves the right to adjust pricing based on updated information or market conditions.</p>
</td>
</tr>`;
}

function emailShell(subject: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
<tr><td align="center" style="padding:20px 0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">

<!-- Header -->
<tr>
<td style="background-color:${BRAND_DARK};padding:24px;text-align:center;">
<h1 style="margin:0;color:${BRAND_YELLOW};font-size:24px;font-weight:bold;">MI-BOX Moving &amp; Mobile Storage</h1>
<p style="margin:4px 0 0;color:#cccccc;font-size:14px;">of Houston</p>
</td>
</tr>

${bodyContent}

${trustBar()}

${legalDisclaimer()}

<!-- Footer -->
<tr>
<td style="background-color:${BRAND_DARK};padding:20px 32px;text-align:center;">
<p style="margin:0;color:#cccccc;font-size:12px;">MI-BOX Moving &amp; Mobile Storage of Houston</p>
<p style="margin:4px 0 0;color:#cccccc;font-size:12px;">This quote is valid for 10 days from the date of this email.</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildQuoteConfirmationHtml(data: QuoteEmailData, quoteId?: string): string {
  const firstName = escapeHtml(data.firstName);
  const serviceDisplay = escapeHtml(data.serviceDisplay);
  const boxSize = escapeHtml(data.boxSize);
  const deliveryZip = escapeHtml(data.deliveryZip);
  const deliveryDate = data.deliveryDate
    ? escapeHtml(new Date(data.deliveryDate + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }))
    : '';
  const deliveryFee = escapeHtml(data.deliveryFee);
  const firstMonthRent = escapeHtml(data.firstMonthRent);
  const monthlyRent = escapeHtml(data.monthlyRent);
  const dueToday = escapeHtml(data.dueToday);
  const ongoingMonthly = escapeHtml(data.ongoingMonthly);
  const safeQuoteId = escapeHtml(quoteId);

  const quoteIdBanner = quoteId ? `<tr>
<td style="padding:16px 32px 0;text-align:center;">
<span style="display:inline-block;background-color:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;padding:8px 16px;font-size:14px;color:${BRAND_DARK};font-weight:bold;">Quote #${safeQuoteId}</span>
</td>
</tr>` : '';

  const greeting = `<tr>
<td style="padding:32px 32px 16px;">
<h2 style="margin:0 0 8px;color:${BRAND_DARK};font-size:20px;">Hi ${firstName},</h2>
<p style="margin:0;color:#666666;font-size:15px;line-height:1.5;">
Thank you for requesting a quote! Here&#39;s a summary of your MI-BOX portable storage quote.
</p>
</td>
</tr>`;

  let detailsRows = emailRow('Service Type', serviceDisplay)
    + emailRow('Container Size', boxSize)
    + emailRow('Delivery ZIP', deliveryZip);
  if (deliveryDate) {
    detailsRows += emailRow('Delivery Date', deliveryDate);
  }

  const detailsSection = sectionWrapper(
    sectionHeader('Quote Details')
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailsRows}</table>`
  );

  const pricingRows = emailRow('Delivery Fee', deliveryFee)
    + emailRow('First Month Rent', firstMonthRent)
    + emailRow('Monthly Rent (ongoing)', ongoingMonthly)
    + `<tr><td colspan="2" style="padding:12px 0 0;border-top:2px solid ${BRAND_YELLOW};"></td></tr>`
    + `<tr>
<td style="padding:6px 0;color:${BRAND_DARK};font-size:16px;font-weight:bold;">Due Today</td>
<td style="padding:6px 0;color:${BRAND_DARK};font-size:16px;text-align:right;font-weight:bold;">${dueToday}</td>
</tr>`;

  const pricingSection = sectionWrapper(
    sectionHeader('Pricing Breakdown')
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${pricingRows}</table>`
  );

  const ctaSection = quoteId ? `<!-- CTA -->
<tr>
<td style="padding:24px 32px;text-align:center;">
<p style="margin:0 0 16px;color:${BRAND_DARK};font-size:15px;font-weight:bold;">Ready to book? Complete your delivery details:</p>
<a href="https://miboxhouston.com/?quoteId=${encodeURIComponent(quoteId)}" style="display:inline-block;background-color:${BRAND_YELLOW};color:${BRAND_DARK};text-decoration:none;padding:14px 36px;border-radius:6px;font-size:16px;font-weight:bold;">Book Now</a>
<p style="margin:12px 0 0;color:#666666;font-size:14px;">Or call <a href="tel:7139296051" style="color:${BRAND_DARK};font-weight:bold;text-decoration:none;">(713) 929-6051</a></p>
</td>
</tr>` : `<!-- CTA -->
<tr>
<td style="padding:24px 32px;text-align:center;">
<p style="margin:0;color:#666666;font-size:14px;">
Questions? Call us or reply to this email.
</p>
<p style="margin:8px 0 0;"><a href="tel:7139296051" style="color:${BRAND_DARK};font-weight:bold;text-decoration:none;font-size:16px;">(713) 929-6051</a></p>
</td>
</tr>`;

  return emailShell('Your MI-BOX Houston Quote', quoteIdBanner + greeting + detailsSection + pricingSection + ctaSection);
}

export function buildBookingConfirmationHtml(data: BookingEmailData, quoteId?: string): string {
  const firstName = escapeHtml(data.firstName);
  const serviceDisplay = escapeHtml(data.serviceDisplay);
  const boxSize = escapeHtml(data.boxSize);
  const deliveryZip = escapeHtml(data.deliveryZip);
  const deliveryDate = data.deliveryDate
    ? escapeHtml(new Date(data.deliveryDate + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }))
    : '';
  const deliveryFee = escapeHtml(data.deliveryFee);
  const firstMonthRent = escapeHtml(data.firstMonthRent);
  const ongoingMonthly = escapeHtml(data.ongoingMonthly);
  const dueToday = escapeHtml(data.dueToday);
  const deliveryAddress = escapeHtml(data.deliveryAddress);
  const city = escapeHtml(data.city);
  const state = escapeHtml(data.state);
  const placement = escapeHtml(data.placement);
  const surfaceType = escapeHtml(data.surfaceType);
  const doorFacing = escapeHtml(data.doorFacing);
  const gateCode = escapeHtml(data.gateCode);
  const notes = escapeHtml(data.notes);
  const safeQuoteId = escapeHtml(quoteId);

  const quoteIdBanner = quoteId ? `<tr>
<td style="padding:16px 32px 0;text-align:center;">
<span style="display:inline-block;background-color:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;padding:8px 16px;font-size:14px;color:${BRAND_DARK};font-weight:bold;">Booking Confirmed - Quote #${safeQuoteId}</span>
</td>
</tr>` : '';

  const greeting = `<tr>
<td style="padding:32px 32px 16px;">
<h2 style="margin:0 0 8px;color:${BRAND_DARK};font-size:20px;">Hi ${firstName},</h2>
<p style="margin:0;color:#666666;font-size:15px;line-height:1.5;">
Thank you for booking with MI-BOX Houston! Here are your booking details.
</p>
</td>
</tr>`;

  // Service details
  let detailsRows = emailRow('Service Type', serviceDisplay)
    + emailRow('Container Size', boxSize)
    + emailRow('Delivery ZIP', deliveryZip);
  if (deliveryDate) {
    detailsRows += emailRow('Delivery Date', deliveryDate);
  }

  const detailsSection = sectionWrapper(
    sectionHeader('Service Details')
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailsRows}</table>`
  );

  // Delivery details
  let deliveryRows = '';
  if (deliveryAddress) deliveryRows += emailRow('Address', deliveryAddress);
  if (city) deliveryRows += emailRow('City', city);
  if (state) deliveryRows += emailRow('State', state);
  if (placement) deliveryRows += emailRow('Placement', placement);
  if (surfaceType) deliveryRows += emailRow('Surface Type', surfaceType);
  if (doorFacing) deliveryRows += emailRow('Door Facing', doorFacing);
  if (gateCode) deliveryRows += emailRow('Gate Code', gateCode);
  if (notes) deliveryRows += emailRow('Special Notes', notes);

  const deliverySection = deliveryRows
    ? sectionWrapper(
        sectionHeader('Delivery Details')
        + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${deliveryRows}</table>`
      )
    : '';

  // Pricing
  const pricingRows = emailRow('Delivery Fee', deliveryFee)
    + emailRow('First Month Rent', firstMonthRent)
    + emailRow('Monthly Rent (ongoing)', ongoingMonthly)
    + `<tr><td colspan="2" style="padding:12px 0 0;border-top:2px solid ${BRAND_YELLOW};"></td></tr>`
    + `<tr>
<td style="padding:6px 0;color:${BRAND_DARK};font-size:16px;font-weight:bold;">Due Today</td>
<td style="padding:6px 0;color:${BRAND_DARK};font-size:16px;text-align:right;font-weight:bold;">${dueToday}</td>
</tr>`;

  const pricingSection = sectionWrapper(
    sectionHeader('Pricing Breakdown')
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${pricingRows}</table>`
  );

  // Booking CTA - no Book Now button, just reference info
  const ctaSection = quoteId ? `<!-- CTA -->
<tr>
<td style="padding:24px 32px;text-align:center;">
<p style="margin:0;color:#666666;font-size:14px;">Questions? Call <a href="tel:7139296051" style="color:${BRAND_DARK};font-weight:bold;text-decoration:none;">(713) 929-6051</a> and reference Quote #${safeQuoteId}</p>
</td>
</tr>` : `<!-- CTA -->
<tr>
<td style="padding:24px 32px;text-align:center;">
<p style="margin:0;color:#666666;font-size:14px;">
Questions? Call us or reply to this email.
</p>
<p style="margin:8px 0 0;"><a href="tel:7139296051" style="color:${BRAND_DARK};font-weight:bold;text-decoration:none;font-size:16px;">(713) 929-6051</a></p>
</td>
</tr>`;

  return emailShell('Your MI-BOX Houston Booking Confirmation', quoteIdBanner + greeting + detailsSection + deliverySection + pricingSection + ctaSection);
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  apiKey: string
): Promise<EmailResult> {
  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        bcc: ['mike@miboxhouston.com', 'dmorgan@miboxhouston.com', 'sales@miboxhouston.com'],
        reply_to: 'sales@miboxhouston.com',
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as { message?: string };
      return { success: false, error: errorData.message || `Resend API error (${response.status})` };
    }

    const result = await response.json() as { id: string };
    return { success: true, id: result.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    return { success: false, error: message };
  }
}

export async function sendQuoteConfirmation(data: QuoteEmailData, apiKey: string, quoteId?: string): Promise<EmailResult> {
  if (!apiKey) {
    return { success: false, error: 'API key is required' };
  }
  if (!data.email) {
    return { success: false, error: 'Customer email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { success: false, error: 'Invalid email address' };
  }

  const html = buildQuoteConfirmationHtml(data, quoteId);
  const subject = quoteId ? `Your MI-BOX Houston Quote #${quoteId}` : 'Your MI-BOX Houston Quote';
  return sendEmail(data.email, subject, html, apiKey);
}

export async function sendBookingConfirmation(data: BookingEmailData, apiKey: string, quoteId?: string): Promise<EmailResult> {
  if (!apiKey) {
    return { success: false, error: 'API key is required' };
  }
  if (!data.email) {
    return { success: false, error: 'Customer email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { success: false, error: 'Invalid email address' };
  }

  const html = buildBookingConfirmationHtml(data, quoteId);
  const subject = quoteId ? `Your MI-BOX Houston Booking Confirmation #${quoteId}` : 'Your MI-BOX Houston Booking Confirmation';
  return sendEmail(data.email, subject, html, apiKey);
}

function mapToStellaFields(payload: Record<string, unknown>): Record<string, unknown> {
  const serviceMap: Record<string, string> = {
    'Storage at Your Location': 'store_onsite',
    'Storage at Our Facility': 'store_facility',
    'Moving - To New Location': 'moving_onsite',
  };

  const boxSizeMap: Record<string, string> = {
    '8-foot': '8x16',
    '16-foot': '8x16',
    '20-foot': '8x20',
    '8x16': '8x16',
    '8x20': '8x20',
  };

  const sourceMap: Record<string, string> = {
    'website': 'Website',
    'google': 'Google Ads',
    'facebook': 'Facebook AD',
    'referral': 'Friend Referral',
  };

  const mapDuration = (val: unknown): string => {
    const s = typeof val === 'string' ? val : '';
    if (s === '12+' || s === '1 year or longer') return '9-12 months';
    const n = parseInt(s, 10);
    if (isNaN(n)) return '';
    if (n <= 1) return 'Less than 1 month';
    if (n <= 3) return '1-3 months';
    if (n <= 6) return '3-6 months';
    if (n <= 9) return '6-9 months';
    return '9-12 months';
  };

  const cleanPrice = (val: unknown) =>
    typeof val === 'string' ? val.replace(/[$,]/g, '') : '';

  const str = (val: unknown) => (typeof val === 'string' ? val : '');

  return {
    first_name: str(payload.firstName),
    last_name: str(payload.lastName),
    email: str(payload.email),
    phone: str(payload.phone),
    company: str(payload.company),
    service_needed: serviceMap[str(payload.serviceDisplay)] || str(payload.serviceDisplay),
    box_size: boxSizeMap[str(payload.boxSize)] || str(payload.boxSize),
    delivery_zip: str(payload.deliveryZip),
    delivery_date: str(payload.deliveryDate),
    delivery_address: str(payload.deliveryAddress),
    delivery_price: cleanPrice(payload.deliveryFee),
    monthly_rent: cleanPrice(payload.monthlyRent),
    months_needed: mapDuration(payload.storageDuration),
    notes: str(payload.notes),
    source: sourceMap[str(payload.leadSource)] || str(payload.leadSource) || 'Website',
    formType: payload.formType,
    quoteId: payload.quoteId,
  };
}

// ============================================================
// Staff Quote Email
// ============================================================

import type { StaffQuote, StaffQuoteItem } from '../types';

interface StaffQuoteEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2);
}

export function buildStaffQuoteEmailHtml(
  quote: StaffQuote,
  items: StaffQuoteItem[]
): string {
  const customerName = escapeHtml(quote.customer_name.split(' ')[0]);
  const quoteNumber = escapeHtml(quote.quote_number);

  const quoteIdBanner = `<tr>
<td style="padding:16px 32px 0;text-align:center;">
<span style="display:inline-block;background-color:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;padding:8px 16px;font-size:14px;color:${BRAND_DARK};font-weight:bold;">Quote #${quoteNumber}</span>
</td>
</tr>`;

  const greeting = `<tr>
<td style="padding:32px 32px 16px;">
<h2 style="margin:0 0 8px;color:${BRAND_DARK};font-size:20px;">Hi ${customerName},</h2>
<p style="margin:0;color:#666666;font-size:15px;line-height:1.5;">
Thank you for your interest in MI-BOX Houston! Here is your portable storage quote.
</p>
</td>
</tr>`;

  // Detect advanced mode: items have service_type set
  const isAdvanced = items.some(i => !!i.service_type);

  // Service details
  const deliveryDate = quote.delivery_date
    ? escapeHtml(new Date(quote.delivery_date + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }))
    : '';

  let detailsRows = '';
  if (!isAdvanced) {
    detailsRows += emailRow('Service Type', escapeHtml(quote.service_type))
      + emailRow('Delivery ZIP', escapeHtml(quote.zip));
  }
  if (deliveryDate) {
    detailsRows += emailRow('Delivery Date', deliveryDate);
  }

  if (isAdvanced) {
    // Per-container details for advanced quotes
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const num = idx + 1;
      const svcType = escapeHtml(item.service_type || '');
      const sizeLabel = item.container_size + "' Container";
      detailsRows += emailRow(`Container #${num}`, `${sizeLabel} - ${svcType}`);
      if (item.zip_1) {
        detailsRows += emailRow(`  Delivery ZIP`, escapeHtml(item.zip_1));
      }
      if (item.zone_name) {
        detailsRows += emailRow(`  Zone`, escapeHtml(item.zone_name));
      }
      detailsRows += emailRow(`  Monthly Rate`, formatCents(item.monthly_rate_cents));
      if (item.delivery_fee_cents > 0) {
        detailsRows += emailRow(`  Delivery Fee`, formatCents(item.delivery_fee_cents));
      }
    }
  } else {
    // Simple mode: grouped container summary
    const containerSummary: Record<string, number> = {};
    for (const item of items) {
      const key = item.container_size + "' " + escapeHtml(item.storage_location);
      containerSummary[key] = (containerSummary[key] || 0) + 1;
    }
    for (const [desc, count] of Object.entries(containerSummary)) {
      detailsRows += emailRow('Container', count > 1 ? `${count}x ${desc}` : desc);
    }
  }

  const detailsSection = sectionWrapper(
    sectionHeader('Quote Details')
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailsRows}</table>`
  );

  // Pricing breakdown
  const firstMonthRent = items.reduce((sum, i) => sum + i.first_month_rate_cents, 0);
  const deliveryTotal = isAdvanced
    ? items.reduce((sum, i) => sum + (i.delivery_fee_cents || 0), 0)
    : quote.delivery_fee_cents * quote.container_count;
  let pricingRows = emailRow('First Month Rent', formatCents(firstMonthRent))
    + emailRow('Delivery Fee' + (quote.container_count > 1 ? ` (x${quote.container_count})` : ''), formatCents(deliveryTotal));

  if (quote.multi_discount_percent > 0) {
    const monthlySubtotal = items.reduce((sum, i) => sum + i.monthly_rate_cents, 0);
    const discountAmt = Math.round(monthlySubtotal * quote.multi_discount_percent / 100);
    pricingRows += emailRow(
      `Multi-Container Discount (${quote.multi_discount_percent}%)`,
      `<span style="color:#22C55E;">-${formatCents(discountAmt)}</span>`
    );
  }

  if (quote.promo_discount_cents > 0) {
    pricingRows += emailRow(
      'Promo Discount' + (quote.promo_code ? ` (${escapeHtml(quote.promo_code)})` : ''),
      `<span style="color:#22C55E;">-${formatCents(quote.promo_discount_cents)}</span>`
    );
  }

  pricingRows += `<tr><td colspan="2" style="padding:12px 0 0;border-top:2px solid ${BRAND_YELLOW};"></td></tr>`
    + `<tr>
<td style="padding:6px 0;color:${BRAND_DARK};font-size:16px;font-weight:bold;">Due at Delivery</td>
<td style="padding:6px 0;color:${BRAND_DARK};font-size:16px;text-align:right;font-weight:bold;">${formatCents(quote.due_today_cents)}</td>
</tr>`
    + emailRow('Monthly After First', formatCents(quote.total_monthly_cents));

  const pricingSection = sectionWrapper(
    sectionHeader('Pricing Breakdown')
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${pricingRows}</table>`
  );

  // CTA
  const ctaSection = `<!-- CTA -->
<tr>
<td style="padding:24px 32px;text-align:center;">
<p style="margin:0 0 16px;color:${BRAND_DARK};font-size:15px;font-weight:bold;">Ready to book? Let us know:</p>
<a href="tel:7139296051" style="display:inline-block;background-color:${BRAND_YELLOW};color:${BRAND_DARK};text-decoration:none;padding:14px 36px;border-radius:6px;font-size:16px;font-weight:bold;">Call (713) 929-6051</a>
<p style="margin:12px 0 0;color:#666666;font-size:14px;">Reference Quote #${quoteNumber}</p>
</td>
</tr>`;

  return emailShell(
    `Your MI-BOX Houston Quote #${quote.quote_number}`,
    quoteIdBanner + greeting + detailsSection + pricingSection + ctaSection
  );
}

export async function sendStaffQuoteEmail(
  quote: StaffQuote,
  items: StaffQuoteItem[],
  apiKey: string
): Promise<StaffQuoteEmailResult> {
  if (!apiKey) return { success: false, error: 'API key is required' };
  if (!quote.email) return { success: false, error: 'Customer email is required' };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(quote.email)) {
    return { success: false, error: 'Invalid email address' };
  }

  const html = buildStaffQuoteEmailHtml(quote, items);
  const subject = `Your MI-BOX Houston Quote #${quote.quote_number}`;
  return sendEmail(quote.email, subject, html, apiKey);
}

export function mapStaffQuoteToStella(
  quote: StaffQuote,
  items: StaffQuoteItem[]
): Record<string, unknown> {
  const boxSizeMap: Record<string, string> = {
    '16': '8x16',
    '20': '8x20',
  };

  const serviceMap: Record<string, string> = {
    'Storage at Your Location': 'store_onsite',
    'Storage at Our Facility': 'store_facility',
    'Moving - To New Location': 'moving_onsite',
  };

  const mapDuration = (months: number): string => {
    if (months <= 1) return 'Less than 1 month';
    if (months <= 3) return '1-3 months';
    if (months <= 6) return '3-6 months';
    if (months <= 9) return '6-9 months';
    return '9-12 months';
  };

  const nameParts = (quote.customer_name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Use the first item's container size for Stella
  const primarySize = items.length > 0 ? items[0].container_size : '16';

  return {
    first_name: firstName,
    last_name: lastName,
    email: quote.email || '',
    phone: quote.phone || '',
    service_needed: serviceMap[quote.service_type] || quote.service_type,
    box_size: boxSizeMap[primarySize] || primarySize,
    delivery_zip: quote.zip,
    delivery_date: quote.delivery_date || '',
    delivery_address: quote.address || '',
    delivery_price: (quote.delivery_fee_cents / 100).toFixed(2),
    monthly_rent: (quote.total_monthly_cents / 100).toFixed(2),
    months_needed: mapDuration(quote.months_needed),
    notes: quote.notes || '',
    source: 'Ops Hub',
    formType: 'staff_quote',
    quoteId: quote.quote_number,
  };
}

export async function forwardToStella(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const stellaBody = mapToStellaFields(payload);
    const response = await fetch(STELLA_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stellaBody),
    });
    return response.ok;
  } catch {
    return false;
  }
}

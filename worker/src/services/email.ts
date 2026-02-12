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
<h1 style="margin:0;color:${BRAND_YELLOW};font-size:24px;font-weight:bold;">MI-BOX Houston</h1>
<p style="margin:4px 0 0;color:#cccccc;font-size:14px;">Portable Storage &amp; Moving</p>
</td>
</tr>

${bodyContent}

<!-- CTA -->
<tr>
<td style="padding:24px 32px;text-align:center;">
<p style="margin:0 0 16px;color:#666666;font-size:14px;">
Questions? Call us or reply to this email.
</p>
<a href="tel:7139296051" style="display:inline-block;background-color:${BRAND_YELLOW};color:${BRAND_DARK};text-decoration:none;padding:12px 32px;border-radius:6px;font-size:16px;font-weight:bold;">(713) 929-6051</a>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:${BRAND_DARK};padding:20px 32px;text-align:center;">
<p style="margin:0;color:#cccccc;font-size:12px;">MI-BOX Houston | Portable Storage &amp; Moving</p>
<p style="margin:4px 0 0;color:#cccccc;font-size:12px;">This quote is valid for 30 days from the date of this email.</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildQuoteConfirmationHtml(data: QuoteEmailData): string {
  const firstName = escapeHtml(data.firstName);
  const serviceDisplay = escapeHtml(data.serviceDisplay);
  const boxSize = escapeHtml(data.boxSize);
  const deliveryZip = escapeHtml(data.deliveryZip);
  const deliveryDate = escapeHtml(data.deliveryDate);
  const deliveryFee = escapeHtml(data.deliveryFee);
  const firstMonthRent = escapeHtml(data.firstMonthRent);
  const monthlyRent = escapeHtml(data.monthlyRent);
  const dueToday = escapeHtml(data.dueToday);
  const ongoingMonthly = escapeHtml(data.ongoingMonthly);

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

  return emailShell('Your MI-BOX Houston Quote', greeting + detailsSection + pricingSection);
}

export function buildBookingConfirmationHtml(data: BookingEmailData): string {
  const firstName = escapeHtml(data.firstName);
  const serviceDisplay = escapeHtml(data.serviceDisplay);
  const boxSize = escapeHtml(data.boxSize);
  const deliveryZip = escapeHtml(data.deliveryZip);
  const deliveryDate = escapeHtml(data.deliveryDate);
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

  return emailShell('Your MI-BOX Houston Booking Confirmation', greeting + detailsSection + deliverySection + pricingSection);
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

export async function sendQuoteConfirmation(data: QuoteEmailData, apiKey: string): Promise<EmailResult> {
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

  const html = buildQuoteConfirmationHtml(data);
  return sendEmail(data.email, 'Your MI-BOX Houston Quote', html, apiKey);
}

export async function sendBookingConfirmation(data: BookingEmailData, apiKey: string): Promise<EmailResult> {
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

  const html = buildBookingConfirmationHtml(data);
  return sendEmail(data.email, 'Your MI-BOX Houston Booking Confirmation', html, apiKey);
}

export async function forwardToStella(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch(STELLA_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

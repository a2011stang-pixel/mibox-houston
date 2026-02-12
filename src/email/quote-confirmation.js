/**
 * Quote confirmation email module using Resend API.
 * Phase 1a: Builds and sends branded HTML quote confirmation emails.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'MI-BOX Houston <sales@miboxhouston.com>';
const SUBJECT = 'Your MI-BOX Houston Quote';

/**
 * Escapes HTML special characters to prevent XSS in email templates.
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Builds an HTML email template for quote confirmations.
 * @param {Object} quoteData - The quote data from buildQuotePayload()
 * @returns {string} HTML email string
 */
export function buildQuoteConfirmationEmail(quoteData) {
  const firstName = escapeHtml(quoteData.first_name || '');
  const boxSize = escapeHtml(quoteData.box_size || '');
  const deliveryZip = escapeHtml(quoteData.delivery_zip || '');
  const deliveryDate = escapeHtml(quoteData.delivery_date || '');
  const deliveryPrice = escapeHtml(quoteData.delivery_price || '');
  const firstMonthRent = escapeHtml(quoteData.first_month_rent || '');
  const monthlyRent = escapeHtml(quoteData.monthly_rent || '');
  const dueToday = escapeHtml(quoteData.due_today || '');
  const ongoingMonthly = escapeHtml(quoteData.ongoing_monthly || '');
  const serviceDisplay = escapeHtml(quoteData.service_display || '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
<tr><td align="center" style="padding:20px 0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">

<!-- Header -->
<tr>
<td style="background-color:#333333;padding:24px;text-align:center;">
<h1 style="margin:0;color:#FFDD00;font-size:24px;font-weight:bold;">MI-BOX Houston</h1>
<p style="margin:4px 0 0;color:#cccccc;font-size:14px;">Portable Storage &amp; Moving</p>
</td>
</tr>

<!-- Greeting -->
<tr>
<td style="padding:32px 32px 16px;">
<h2 style="margin:0 0 8px;color:#333333;font-size:20px;">Hi ${firstName},</h2>
<p style="margin:0;color:#555555;font-size:15px;line-height:1.5;">
Thank you for requesting a quote! Here's a summary of your MI-BOX portable storage quote.
</p>
</td>
</tr>

<!-- Quote Details -->
<tr>
<td style="padding:16px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:6px;border:1px solid #e9ecef;">
<tr>
<td style="padding:20px;">
<h3 style="margin:0 0 16px;color:#333333;font-size:16px;border-bottom:2px solid #FFDD00;padding-bottom:8px;">Quote Details</h3>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:6px 0;color:#555555;font-size:14px;">Service Type</td>
<td style="padding:6px 0;color:#333333;font-size:14px;text-align:right;font-weight:bold;">${serviceDisplay}</td>
</tr>
<tr>
<td style="padding:6px 0;color:#555555;font-size:14px;">Container Size</td>
<td style="padding:6px 0;color:#333333;font-size:14px;text-align:right;font-weight:bold;">${boxSize}</td>
</tr>
<tr>
<td style="padding:6px 0;color:#555555;font-size:14px;">Delivery ZIP</td>
<td style="padding:6px 0;color:#333333;font-size:14px;text-align:right;font-weight:bold;">${deliveryZip}</td>
</tr>
${deliveryDate ? `<tr>
<td style="padding:6px 0;color:#555555;font-size:14px;">Delivery Date</td>
<td style="padding:6px 0;color:#333333;font-size:14px;text-align:right;font-weight:bold;">${deliveryDate}</td>
</tr>` : ''}
</table>
</td>
</tr>
</table>
</td>
</tr>

<!-- Pricing -->
<tr>
<td style="padding:16px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:6px;border:1px solid #e9ecef;">
<tr>
<td style="padding:20px;">
<h3 style="margin:0 0 16px;color:#333333;font-size:16px;border-bottom:2px solid #FFDD00;padding-bottom:8px;">Pricing Breakdown</h3>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:6px 0;color:#555555;font-size:14px;">Delivery Fee</td>
<td style="padding:6px 0;color:#333333;font-size:14px;text-align:right;font-weight:bold;">${deliveryPrice}</td>
</tr>
<tr>
<td style="padding:6px 0;color:#555555;font-size:14px;">First Month Rent</td>
<td style="padding:6px 0;color:#333333;font-size:14px;text-align:right;font-weight:bold;">${firstMonthRent}</td>
</tr>
<tr>
<td style="padding:6px 0;color:#555555;font-size:14px;">Monthly Rent (ongoing)</td>
<td style="padding:6px 0;color:#333333;font-size:14px;text-align:right;font-weight:bold;">${ongoingMonthly}</td>
</tr>
<tr>
<td colspan="2" style="padding:12px 0 0;border-top:2px solid #FFDD00;"></td>
</tr>
<tr>
<td style="padding:6px 0;color:#333333;font-size:16px;font-weight:bold;">Due Today</td>
<td style="padding:6px 0;color:#333333;font-size:16px;text-align:right;font-weight:bold;">${dueToday}</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>

<!-- CTA -->
<tr>
<td style="padding:24px 32px;text-align:center;">
<p style="margin:0 0 16px;color:#555555;font-size:14px;">
Ready to book? Call us or reply to this email to schedule your delivery.
</p>
<a href="tel:7139296051" style="display:inline-block;background-color:#FFDD00;color:#333333;text-decoration:none;padding:12px 32px;border-radius:4px;font-size:16px;font-weight:bold;">(713) 929-6051</a>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:#f0f0f0;padding:20px 32px;text-align:center;">
<p style="margin:0;color:#888888;font-size:12px;">MI-BOX Houston | Portable Storage &amp; Moving</p>
<p style="margin:4px 0 0;color:#888888;font-size:12px;">This quote is valid for 30 days from the date of this email.</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Sends a quote confirmation email via the Resend API.
 * @param {Object} quoteData - The quote data (must include email)
 * @param {string} apiKey - Resend API key
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function sendQuoteConfirmation(quoteData, apiKey) {
  if (!apiKey) {
    return { success: false, error: 'API key is required' };
  }

  if (!quoteData.email) {
    return { success: false, error: 'Customer email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(quoteData.email)) {
    return { success: false, error: 'Invalid email address' };
  }

  const html = buildQuoteConfirmationEmail(quoteData);

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [quoteData.email],
        subject: SUBJECT,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || `Resend API error (${response.status})` };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to send email' };
  }
}

/**
 * SMS service using Twilio REST API.
 * Sends customer quote SMS and team notification SMS.
 */

const TEAM_NUMBERS = ['+13618154452', '+13618160461', '+13619066880'];

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

interface SmsResult {
  success: boolean;
  sid?: string;
  error?: string;
}

export interface QuoteSmsData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  serviceDisplay: string;
  boxSize: string;
  deliveryZip: string;
  storageDuration?: string;
  deliveryFee: string;
  firstMonthRent: string;
  dueToday: string;
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

async function sendSms(
  to: string,
  body: string,
  config: TwilioConfig
): Promise<SmsResult> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const auth = btoa(`${config.accountSid}:${config.authToken}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: config.fromNumber,
        Body: body,
      }).toString(),
    });

    if (!response.ok) {
      const err = await response.json() as { message?: string };
      return { success: false, error: err.message || `Twilio error (${response.status})` };
    }

    const result = await response.json() as { sid: string };
    return { success: true, sid: result.sid };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send SMS';
    return { success: false, error: message };
  }
}

export function buildCustomerSms(data: QuoteSmsData, quoteId: string): string {
  return `Hi ${data.firstName}, thanks for your MI-BOX Houston quote. Due today: ${data.dueToday}. Book now: https://miboxhouston.com/?quoteId=${quoteId} or call (713) 929-6051`;
}

export function buildTeamSms(data: QuoteSmsData, quoteId: string): string {
  return [
    `New Quote ${quoteId}`,
    `${data.firstName} ${data.lastName}`,
    `${data.serviceDisplay}, ${data.boxSize}`,
    `ZIP: ${data.deliveryZip}`,
    `Duration: ${data.storageDuration || 'N/A'}`,
    `Delivery Fee: ${data.deliveryFee}`,
    `1st Month Rent: ${data.firstMonthRent}`,
    `Due Today: ${data.dueToday}`,
    `Ph: ${data.phone}`,
    `Email: ${data.email}`,
  ].join('\n');
}

export async function sendCustomerSms(
  data: QuoteSmsData,
  quoteId: string,
  config: TwilioConfig
): Promise<SmsResult> {
  if (!config.accountSid || !config.authToken || !config.fromNumber) {
    return { success: false, error: 'Twilio credentials not configured' };
  }

  const to = normalizePhone(data.phone);
  if (!to) {
    return { success: false, error: 'Invalid customer phone number' };
  }

  const body = buildCustomerSms(data, quoteId);
  return sendSms(to, body, config);
}

export async function sendTeamNotificationSms(
  data: QuoteSmsData,
  quoteId: string,
  config: TwilioConfig
): Promise<{ sent: number; failed: number }> {
  if (!config.accountSid || !config.authToken || !config.fromNumber) {
    return { sent: 0, failed: TEAM_NUMBERS.length };
  }

  const body = buildTeamSms(data, quoteId);
  let sent = 0;
  let failed = 0;

  await Promise.all(
    TEAM_NUMBERS.map(async (number) => {
      const result = await sendSms(number, body, config);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    })
  );

  return { sent, failed };
}

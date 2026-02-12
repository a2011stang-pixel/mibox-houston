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
    console.log(`[SMS] Sending to=${to} from=${config.fromNumber} accountSid=${config.accountSid?.slice(0, 6)}...`);

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

    const result = await response.json() as Record<string, unknown>;
    console.log(`[SMS] Twilio response status=${response.status}`, JSON.stringify(result));

    if (!response.ok) {
      const errorMsg = (result.message as string) || `Twilio error (${response.status})`;
      const errorCode = result.code as number | undefined;
      console.error(`[SMS] FAILED to=${to} code=${errorCode} status=${result.status} error=${errorMsg}`);
      return { success: false, error: `${errorMsg} (code: ${errorCode})` };
    }

    console.log(`[SMS] SUCCESS to=${to} sid=${result.sid} status=${result.status}`);
    return { success: true, sid: result.sid as string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send SMS';
    console.error(`[SMS] EXCEPTION to=${to} error=${message}`);
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
    console.error(`[SMS] Missing Twilio credentials: sid=${!!config.accountSid} token=${!!config.authToken} from=${!!config.fromNumber}`);
    return { success: false, error: 'Twilio credentials not configured' };
  }

  const to = normalizePhone(data.phone);
  if (!to) {
    console.error(`[SMS] Invalid customer phone: "${data.phone}"`);
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
    console.error(`[SMS] Team SMS skipped — missing Twilio credentials`);
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

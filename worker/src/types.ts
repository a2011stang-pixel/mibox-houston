export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  BACKUPS: R2Bucket;
  RESEND_API_KEY: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  totp_secret: string | null;
  totp_enabled: number;
  failed_attempts: number;
  locked_until: number | null;
  created_at: number;
  updated_at: number;
}

export interface Session {
  id: string;
  user_id: number;
  token_hash: string;
  expires_at: number;
  created_at: number;
}

export interface Zone {
  id: number;
  name: string;
  display_name: string;
  delivery_fee: number;
  pickup_fee: number;
  relocation_fee: number;
  is_active: number;
  created_at: number;
  updated_at: number;
}

export interface ZipCode {
  zip: string;
  zone_id: number | null;
  created_at: number;
  updated_at: number;
}

export interface Pricing {
  id: number;
  container_size: string;
  rate_type: string;
  amount: number;
  created_at: number;
  updated_at: number;
}

export interface Promotion {
  id: number;
  name: string;
  discount_type: 'percent' | 'flat';
  discount_value: number;
  applies_to: string;
  container_sizes: string;
  promo_code: string | null;
  start_date: string;
  end_date: string;
  is_active: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  id: number;
  user_id: number;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  created_at: number;
}

export interface JWTPayload {
  sub: number;
  email: string;
  sid: string;
  exp: number;
  iat: number;
}

export interface AuthContext {
  user: {
    id: number;
    email: string;
  };
  sessionId: string;
}

export interface StaffQuote {
  id: number;
  quote_number: string;
  quote_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string;
  service_type: string;
  delivery_date: string | null;
  months_needed: number;
  zone_id: number | null;
  zone_name: string | null;
  delivery_fee_cents: number;
  pickup_fee_cents: number;
  relocation_fee_cents: number;
  container_count: number;
  multi_discount_percent: number;
  promo_id: number | null;
  promo_code: string | null;
  promo_discount_cents: number;
  override_monthly_cents: number | null;
  override_reason: string | null;
  subtotal_monthly_cents: number;
  discount_monthly_cents: number;
  total_monthly_cents: number;
  first_month_total_cents: number;
  due_today_cents: number;
  created_by: string;
  email_sent: number;
  email_sent_at: string | null;
  stella_forwarded: number;
  stella_order_id: string | null;
  converted_at: string | null;
  notes: string | null;
}

export interface StaffQuoteItem {
  id: number;
  quote_id: number;
  container_size: string;
  storage_location: string;
  monthly_rate_cents: number;
  first_month_rate_cents: number;
  service_type: string | null;
  address_1: string | null;
  apt_1: string | null;
  city_1: string | null;
  state_1: string | null;
  zip_1: string | null;
  address_2: string | null;
  apt_2: string | null;
  city_2: string | null;
  state_2: string | null;
  zip_2: string | null;
  zone_id: number | null;
  zone_name: string | null;
  delivery_fee_cents: number;
}

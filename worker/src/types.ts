export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  BACKUPS: R2Bucket;
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

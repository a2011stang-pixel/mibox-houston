import { hashPassword, verifyPassword, signJWT, generateId } from '../utils/crypto';
import { generateTOTPSecret, verifyTOTP, generateOTPAuthURI } from './totp';

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

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  requires_totp?: boolean;
  requires_mfa_setup?: boolean;
  temp_token?: string;
  access_token?: string;
  expires_in?: number;
}

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60;

export class AuthService {
  constructor(
    private db: D1Database,
    private jwtSecret: string,
    private jwtExpiresIn: string
  ) {}

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<User>();

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    if (user.locked_until && user.locked_until > Math.floor(Date.now() / 1000)) {
      const remainingTime = user.locked_until - Math.floor(Date.now() / 1000);
      const minutes = Math.ceil(remainingTime / 60);
      return { success: false, error: 'Account locked. Try again in ' + minutes + ' minutes.' };
    }

    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      await this.incrementFailedAttempts(user.id, user.failed_attempts);
      return { success: false, error: 'Invalid credentials' };
    }

    await this.resetFailedAttempts(user.id);

    if (!user.totp_enabled) {
      const tempToken = await this.createTempToken(user, 'mfa_setup');
      return { success: true, user, requires_mfa_setup: true, temp_token: tempToken };
    }

    const tempToken = await this.createTempToken(user, 'totp_verify');
    return { success: true, user, requires_totp: true, temp_token: tempToken };
  }

  async verifyTOTPCode(tempToken: string, code: string): Promise<AuthResult> {
    const tokenData = await this.verifyTempToken(tempToken, 'totp_verify');
    if (!tokenData) {
      return { success: false, error: 'Invalid or expired token' };
    }

    const user = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(tokenData.userId)
      .first<User>();

    if (!user || !user.totp_secret) {
      return { success: false, error: 'User not found' };
    }

    const validCode = await verifyTOTP(user.totp_secret, code);
    if (!validCode) {
      await this.incrementFailedAttempts(user.id, user.failed_attempts);
      return { success: false, error: 'Invalid TOTP code' };
    }

    const { token, expiresIn } = await this.createAccessToken(user);
    await this.deleteTempToken(tempToken);

    return { success: true, access_token: token, expires_in: expiresIn };
  }

  async setupTOTP(tempToken: string): Promise<{ secret: string; uri: string } | null> {
    const tokenData = await this.verifyTempToken(tempToken, 'mfa_setup');
    if (!tokenData) return null;

    const user = await this.db
      .prepare('SELECT email FROM users WHERE id = ?')
      .bind(tokenData.userId)
      .first<{ email: string }>();

    if (!user) return null;

    const secret = generateTOTPSecret();
    const uri = generateOTPAuthURI(secret, user.email);

    await this.db
      .prepare('UPDATE sessions SET token_hash = ? WHERE id = ?')
      .bind('pending:' + secret, tempToken)
      .run();

    return { secret, uri };
  }

  async enableTOTP(tempToken: string, code: string): Promise<AuthResult> {
    const session = await this.db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .bind(tempToken)
      .first<{ user_id: number; token_hash: string; expires_at: number }>();

    if (!session || session.expires_at < Math.floor(Date.now() / 1000)) {
      return { success: false, error: 'Invalid or expired token' };
    }

    const secret = session.token_hash.replace('pending:', '');
    const validCode = await verifyTOTP(secret, code);
    if (!validCode) {
      return { success: false, error: 'Invalid TOTP code' };
    }

    const now = Math.floor(Date.now() / 1000);
    await this.db
      .prepare('UPDATE users SET totp_secret = ?, totp_enabled = 1, updated_at = ? WHERE id = ?')
      .bind(secret, now, session.user_id)
      .run();

    const user = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(session.user_id)
      .first<User>();

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const { token, expiresIn } = await this.createAccessToken(user);
    await this.deleteTempToken(tempToken);

    return { success: true, access_token: token, expires_in: expiresIn };
  }

  async logout(sessionId: string): Promise<void> {
    await this.db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }

  async createUser(email: string, password: string): Promise<User | null> {
    const hash = await hashPassword(password);
    const now = Math.floor(Date.now() / 1000);

    try {
      await this.db
        .prepare('INSERT INTO users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)')
        .bind(email, hash, now, now)
        .run();

      return await this.db
        .prepare('SELECT * FROM users WHERE email = ?')
        .bind(email)
        .first<User>();
    } catch {
      return null;
    }
  }

  private async incrementFailedAttempts(userId: number, currentAttempts: number): Promise<void> {
    const newAttempts = currentAttempts + 1;
    const now = Math.floor(Date.now() / 1000);
    const lockedUntil = newAttempts >= LOCKOUT_THRESHOLD ? now + LOCKOUT_DURATION : null;

    await this.db
      .prepare('UPDATE users SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?')
      .bind(newAttempts, lockedUntil, now, userId)
      .run();
  }

  private async resetFailedAttempts(userId: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    await this.db
      .prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?')
      .bind(now, userId)
      .run();
  }

  private async createTempToken(user: User, purpose: string): Promise<string> {
    const id = generateId();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 300;

    await this.db
      .prepare('INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(id, user.id, purpose, expiresAt, now)
      .run();

    return id;
  }

  private async verifyTempToken(token: string, purpose: string): Promise<{ userId: number } | null> {
    const session = await this.db
      .prepare('SELECT user_id, token_hash, expires_at FROM sessions WHERE id = ?')
      .bind(token)
      .first<{ user_id: number; token_hash: string; expires_at: number }>();

    if (!session) return null;
    if (session.expires_at < Math.floor(Date.now() / 1000)) return null;
    if (session.token_hash !== purpose && !session.token_hash.startsWith('pending:')) return null;

    return { userId: session.user_id };
  }

  private async deleteTempToken(token: string): Promise<void> {
    await this.db.prepare('DELETE FROM sessions WHERE id = ?').bind(token).run();
  }

  private async createAccessToken(user: User): Promise<{ token: string; expiresIn: number }> {
    const jti = generateId();
    const token = await signJWT(
      { sub: user.id.toString(), email: user.email, jti },
      this.jwtSecret,
      this.jwtExpiresIn
    );

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.parseExpiry(this.jwtExpiresIn);
    
    await this.db
      .prepare('INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(jti, user.id, 'access', now + expiresIn, now)
      .run();

    return { token, expiresIn };
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)(h|m|d)$/);
    if (!match) return 3600;
    const value = parseInt(match[1]);
    switch (match[2]) {
      case 'h': return value * 3600;
      case 'm': return value * 60;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }
}

import { Hono } from 'hono';
import { AuthService } from '../services/auth';
import type { Env } from '../index';

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();
  
  if (!body.email || !body.password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  const authService = new AuthService(c.env.DB, c.env.JWT_SECRET, c.env.JWT_EXPIRES_IN);
  const result = await authService.login(body.email, body.password);

  if (!result.success) {
    return c.json({ error: result.error }, 401);
  }

  return c.json({
    requires_totp: result.requires_totp,
    requires_mfa_setup: result.requires_mfa_setup,
    temp_token: result.temp_token,
  });
});

authRoutes.post('/verify-totp', async (c) => {
  const body = await c.req.json<{ temp_token: string; code: string }>();
  
  if (!body.temp_token || !body.code) {
    return c.json({ error: 'Token and code required' }, 400);
  }

  const authService = new AuthService(c.env.DB, c.env.JWT_SECRET, c.env.JWT_EXPIRES_IN);
  const result = await authService.verifyTOTPCode(body.temp_token, body.code);

  if (!result.success) {
    return c.json({ error: result.error }, 401);
  }

  return c.json({
    access_token: result.access_token,
    expires_in: result.expires_in,
  });
});

authRoutes.post('/setup-totp', async (c) => {
  const body = await c.req.json<{ temp_token: string }>();
  
  if (!body.temp_token) {
    return c.json({ error: 'Token required' }, 400);
  }

  const authService = new AuthService(c.env.DB, c.env.JWT_SECRET, c.env.JWT_EXPIRES_IN);
  const result = await authService.setupTOTP(body.temp_token);

  if (!result) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  return c.json({
    secret: result.secret,
    otpauth_uri: result.uri,
  });
});

authRoutes.post('/enable-totp', async (c) => {
  const body = await c.req.json<{ temp_token: string; code: string }>();
  
  if (!body.temp_token || !body.code) {
    return c.json({ error: 'Token and code required' }, 400);
  }

  const authService = new AuthService(c.env.DB, c.env.JWT_SECRET, c.env.JWT_EXPIRES_IN);
  const result = await authService.enableTOTP(body.temp_token, body.code);

  if (!result.success) {
    return c.json({ error: result.error }, 401);
  }

  return c.json({
    access_token: result.access_token,
    expires_in: result.expires_in,
  });
});

authRoutes.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const authService = new AuthService(c.env.DB, c.env.JWT_SECRET, c.env.JWT_EXPIRES_IN);
      await authService.logout(payload.jti);
    } catch {
      // Ignore errors during logout
    }
  }
  return c.json({ success: true });
});

authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return c.json({ id: payload.sub, email: payload.email });
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

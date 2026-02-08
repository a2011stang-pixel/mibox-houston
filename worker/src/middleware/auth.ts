import { Context, Next } from 'hono';
import { verifyJWT } from '../utils/crypto';

export interface AuthUser {
  id: string;
  email: string;
  jti: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  // Verify session is still valid
  const session = await c.env.DB
    .prepare('SELECT id FROM sessions WHERE id = ? AND expires_at > ?')
    .bind(payload.jti, Math.floor(Date.now() / 1000))
    .first();

  if (!session) {
    return c.json({ error: 'Session expired' }, 401);
  }

  c.set('user', {
    id: payload.sub,
    email: payload.email,
    jti: payload.jti,
  });

  await next();
}

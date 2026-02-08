import { Hono } from 'hono';
import { AuditService } from '../services/audit';
import type { Env } from '../index';

export const auditRoutes = new Hono<{ Bindings: Env }>();

auditRoutes.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const userId = c.req.query('user') ? parseInt(c.req.query('user')!) : undefined;
  const entityType = c.req.query('type');
  const fromDate = c.req.query('from') ? Math.floor(new Date(c.req.query('from')!).getTime() / 1000) : undefined;
  const toDate = c.req.query('to') ? Math.floor(new Date(c.req.query('to')!).getTime() / 1000) : undefined;

  const audit = new AuditService(c.env.DB);
  const result = await audit.query({ limit, offset, userId, entityType, fromDate, toDate });

  return c.json({
    entries: result.entries,
    total: result.total,
    limit,
    offset,
  });
});

auditRoutes.get('/export', async (c) => {
  const fromDate = c.req.query('from') ? Math.floor(new Date(c.req.query('from')!).getTime() / 1000) : undefined;
  const toDate = c.req.query('to') ? Math.floor(new Date(c.req.query('to')!).getTime() / 1000) : undefined;

  const audit = new AuditService(c.env.DB);
  const csv = await audit.exportCSV({ fromDate, toDate });

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="audit_log.csv"',
    },
  });
});

import { Hono } from 'hono';
import { AuditService } from '../services/audit';
import { listBackups, restoreTable, runBackup } from '../services/backup';
import type { Env } from '../index';

export const adminRoutes = new Hono<{ Bindings: Env }>();

// GET /api/admin/backups - List all available backups
adminRoutes.get('/backups', async (c) => {
  try {
    const backups = await listBackups(c.env);
    return c.json({ backups });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// GET /api/admin/backups/:date - Get manifest for a specific date
adminRoutes.get('/backups/:date', async (c) => {
  const date = c.req.param('date');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400);
  }

  try {
    const manifestObj = await c.env.BACKUPS.get(`backups/${date}/manifest.json`);
    if (!manifestObj) {
      return c.json({ error: 'No backup found for this date' }, 404);
    }
    const manifest = await manifestObj.json();
    return c.json({ manifest });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// POST /api/admin/backups/trigger - Manually trigger a backup
adminRoutes.post('/backups/trigger', async (c) => {
  const user = c.get('user');

  try {
    const manifest = await runBackup(c.env);

    const audit = new AuditService(c.env.DB);
    await audit.log(
      parseInt(user.id),
      user.email,
      'backup.manual_trigger',
      'backup',
      manifest.date,
      null,
      { tables: manifest.tables.length, status: manifest.status },
      c.req.header('CF-Connecting-IP') || null,
      c.req.header('User-Agent') || null
    );

    return c.json({ manifest }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// POST /api/admin/restore - Restore a specific table from a backup
adminRoutes.post('/restore', async (c) => {
  const user = c.get('user');

  let body: { date?: string; table?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.date || !body.table) {
    return c.json({ error: 'date and table are required' }, 400);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return c.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400);
  }

  try {
    const result = await restoreTable(c.env, body.date, body.table);

    const audit = new AuditService(c.env.DB);
    await audit.log(
      parseInt(user.id),
      user.email,
      'backup.restore',
      body.table,
      body.date,
      null,
      { rowsRestored: result.rowsRestored },
      c.req.header('CF-Connecting-IP') || null,
      c.req.header('User-Agent') || null
    );

    return c.json({
      success: true,
      table: body.table,
      date: body.date,
      rowsRestored: result.rowsRestored,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});

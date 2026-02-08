import { Hono } from 'hono';
import { AuditService } from '../services/audit';
import type { Env } from '../index';

interface ZipCode {
  zip: string;
  zone_id: number | null;
  created_at: number;
  updated_at: number;
}

export const zipsRoutes = new Hono<{ Bindings: Env }>();

zipsRoutes.get('/', async (c) => {
  const zone = c.req.query('zone');
  const search = c.req.query('search');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');

  let query = `
    SELECT zc.*, z.name as zone_name, z.display_name as zone_display_name
    FROM zip_codes zc
    LEFT JOIN zones z ON zc.zone_id = z.id
  `;
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (zone) {
    conditions.push('zc.zone_id = ?');
    params.push(parseInt(zone));
  }

  if (search) {
    conditions.push('zc.zip LIKE ?');
    params.push(search + '%');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY zc.zip LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const zips = await c.env.DB.prepare(query).bind(...params).all();

  const countQuery = conditions.length > 0
    ? 'SELECT COUNT(*) as count FROM zip_codes zc WHERE ' + conditions.slice(0, -2).join(' AND ')
    : 'SELECT COUNT(*) as count FROM zip_codes';
  
  const countParams = conditions.length > 0 ? params.slice(0, -2) : [];
  const total = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ count: number }>();

  return c.json({ zips: zips.results || [], total: total?.count || 0 });
});

zipsRoutes.put('/:zip', async (c) => {
  const user = c.get('user');
  const zip = c.req.param('zip');
  const body = await c.req.json<{ zone_id: number }>();

  if (!/^\d{5}$/.test(zip)) {
    return c.json({ error: 'Invalid ZIP code format' }, 400);
  }

  const oldZip = await c.env.DB
    .prepare('SELECT * FROM zip_codes WHERE zip = ?')
    .bind(zip)
    .first<ZipCode>();

  const now = Math.floor(Date.now() / 1000);

  if (oldZip) {
    await c.env.DB
      .prepare('UPDATE zip_codes SET zone_id = ?, updated_at = ? WHERE zip = ?')
      .bind(body.zone_id, now, zip)
      .run();
  } else {
    await c.env.DB
      .prepare('INSERT INTO zip_codes (zip, zone_id, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .bind(zip, body.zone_id, now, now)
      .run();
  }

  const newZip = await c.env.DB
    .prepare('SELECT * FROM zip_codes WHERE zip = ?')
    .bind(zip)
    .first<ZipCode>();

  const audit = new AuditService(c.env.DB);
  await audit.log(
    parseInt(user.id),
    user.email,
    oldZip ? 'zip.update' : 'zip.create',
    'zip_code',
    zip,
    oldZip,
    newZip,
    c.req.header('CF-Connecting-IP') || null,
    c.req.header('User-Agent') || null
  );

  return c.json({ zip: newZip });
});

zipsRoutes.delete('/:zip', async (c) => {
  const user = c.get('user');
  const zip = c.req.param('zip');

  const oldZip = await c.env.DB
    .prepare('SELECT * FROM zip_codes WHERE zip = ?')
    .bind(zip)
    .first<ZipCode>();

  if (!oldZip) {
    return c.json({ error: 'ZIP code not found' }, 404);
  }

  await c.env.DB.prepare('DELETE FROM zip_codes WHERE zip = ?').bind(zip).run();

  const audit = new AuditService(c.env.DB);
  await audit.log(
    parseInt(user.id),
    user.email,
    'zip.delete',
    'zip_code',
    zip,
    oldZip,
    null,
    c.req.header('CF-Connecting-IP') || null,
    c.req.header('User-Agent') || null
  );

  return c.json({ success: true });
});

zipsRoutes.post('/import', async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ csv: string }>();

  if (!body.csv) {
    return c.json({ error: 'CSV data required' }, 400);
  }

  const lines = body.csv.trim().split('\n');
  const results = { imported: 0, errors: [] as string[] };
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (i === 0 && line.toLowerCase().includes('zip'))) continue;

    const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
    if (parts.length < 2) {
      results.errors.push('Line ' + (i + 1) + ': Invalid format');
      continue;
    }

    const [zip, zoneName] = parts;

    if (!/^\d{5}$/.test(zip)) {
      results.errors.push('Line ' + (i + 1) + ': Invalid ZIP code: ' + zip);
      continue;
    }

    const zone = await c.env.DB
      .prepare('SELECT id FROM zones WHERE name = ?')
      .bind(zoneName)
      .first<{ id: number }>();

    if (!zone) {
      results.errors.push('Line ' + (i + 1) + ': Unknown zone: ' + zoneName);
      continue;
    }

    try {
      await c.env.DB
        .prepare('INSERT OR REPLACE INTO zip_codes (zip, zone_id, created_at, updated_at) VALUES (?, ?, ?, ?)')
        .bind(zip, zone.id, now, now)
        .run();
      results.imported++;
    } catch (e) {
      results.errors.push('Line ' + (i + 1) + ': Database error');
    }
  }

  const audit = new AuditService(c.env.DB);
  await audit.log(
    parseInt(user.id),
    user.email,
    'zip.bulk_import',
    'zip_code',
    null,
    null,
    { imported: results.imported, errors: results.errors.length },
    c.req.header('CF-Connecting-IP') || null,
    c.req.header('User-Agent') || null
  );

  return c.json(results);
});

zipsRoutes.get('/export', async (c) => {
  const zips = await c.env.DB
    .prepare(`
      SELECT zc.zip, z.name as zone_name
      FROM zip_codes zc
      LEFT JOIN zones z ON zc.zone_id = z.id
      ORDER BY zc.zip
    `)
    .all<{ zip: string; zone_name: string }>();

  const csv = 'zip,zone\n' + (zips.results || [])
    .map(z => z.zip + ',' + (z.zone_name || ''))
    .join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="zip_codes.csv"',
    },
  });
});

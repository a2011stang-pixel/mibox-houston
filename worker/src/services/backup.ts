import type { Env } from '../index';

const BACKUP_TABLES: Record<string, string> = {
  zones: 'SELECT * FROM zones',
  zip_codes: 'SELECT * FROM zip_codes',
  pricing: 'SELECT * FROM pricing',
  users: 'SELECT id, email, totp_enabled, failed_attempts, locked_until, created_at, updated_at FROM users',
  audit_log: 'SELECT * FROM audit_log',
  promotions: 'SELECT * FROM promotions',
};

const RESTORABLE_TABLES = ['zones', 'zip_codes', 'pricing', 'promotions'] as const;
type RestorableTable = (typeof RESTORABLE_TABLES)[number];

export interface BackupManifest {
  version: 1;
  timestamp: string;
  date: string;
  tables: {
    name: string;
    rowCount: number;
    key: string;
    sizeBytes: number;
  }[];
  durationMs: number;
  status: 'complete' | 'partial';
  errors: string[];
}

export async function runBackup(env: Env): Promise<BackupManifest> {
  const startTime = Date.now();
  const date = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();
  const prefix = `backups/${date}`;
  const errors: string[] = [];
  const tables: BackupManifest['tables'] = [];

  for (const [tableName, query] of Object.entries(BACKUP_TABLES)) {
    try {
      const result = await env.DB.prepare(query).all();
      const rows = result.results || [];
      const json = JSON.stringify(rows, null, 2);
      const key = `${prefix}/${tableName}.json`;

      await env.BACKUPS.put(key, json, {
        httpMetadata: { contentType: 'application/json' },
        customMetadata: {
          table: tableName,
          rowCount: rows.length.toString(),
          date,
        },
      });

      tables.push({
        name: tableName,
        rowCount: rows.length,
        key,
        sizeBytes: new TextEncoder().encode(json).byteLength,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${tableName}: ${message}`);
      console.error(`Backup failed for ${tableName}:`, message);
    }
  }

  const manifest: BackupManifest = {
    version: 1,
    timestamp,
    date,
    tables,
    durationMs: Date.now() - startTime,
    status: errors.length > 0 ? 'partial' : 'complete',
    errors,
  };

  await env.BACKUPS.put(
    `${prefix}/manifest.json`,
    JSON.stringify(manifest, null, 2),
    {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: { date },
    }
  );

  await cleanupOldBackups(env, 14);

  return manifest;
}

export async function cleanupOldBackups(
  env: Env,
  retentionDays: number
): Promise<{ deleted: string[]; errors: string[] }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const deleted: string[] = [];
  const errors: string[] = [];

  let cursor: string | undefined;
  let truncated = true;

  while (truncated) {
    const listed = await env.BACKUPS.list({
      prefix: 'backups/',
      cursor,
    });

    for (const object of listed.objects) {
      const parts = object.key.split('/');
      if (parts.length < 2) continue;
      const dateStr = parts[1];

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

      if (dateStr < cutoffStr) {
        try {
          await env.BACKUPS.delete(object.key);
          deleted.push(object.key);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Failed to delete ${object.key}: ${msg}`);
        }
      }
    }

    truncated = listed.truncated;
    cursor = listed.truncated ? listed.cursor : undefined;
  }

  if (deleted.length > 0) {
    console.log(`Cleanup: deleted ${deleted.length} objects older than ${cutoffStr}`);
  }

  return { deleted, errors };
}

export async function restoreTable(
  env: Env,
  date: string,
  tableName: string
): Promise<{ rowsRestored: number }> {
  if (!RESTORABLE_TABLES.includes(tableName as RestorableTable)) {
    throw new Error(
      `Table '${tableName}' cannot be restored. Allowed: ${RESTORABLE_TABLES.join(', ')}`
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }

  const manifestObj = await env.BACKUPS.get(`backups/${date}/manifest.json`);
  if (!manifestObj) {
    throw new Error(`No backup found for date ${date}`);
  }

  const manifest: BackupManifest = await manifestObj.json();
  const tableEntry = manifest.tables.find((t) => t.name === tableName);
  if (!tableEntry) {
    throw new Error(`Table '${tableName}' not found in backup for ${date}`);
  }

  const dataObj = await env.BACKUPS.get(`backups/${date}/${tableName}.json`);
  if (!dataObj) {
    throw new Error(`Backup data file missing for ${tableName} on ${date}`);
  }

  const rows: Record<string, unknown>[] = await dataObj.json();
  if (!Array.isArray(rows)) {
    throw new Error(`Invalid backup data for ${tableName}`);
  }

  if (rows.length === 0) {
    throw new Error(`Backup for ${tableName} on ${date} contains zero rows`);
  }

  const statements: D1PreparedStatement[] = [];

  statements.push(env.DB.prepare(`DELETE FROM ${tableName}`));

  for (const row of rows) {
    const columns = Object.keys(row);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map((col) => row[col] as null | number | string);
    statements.push(
      env.DB
        .prepare(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`)
        .bind(...values)
    );
  }

  await env.DB.batch(statements);

  return { rowsRestored: rows.length };
}

export async function listBackups(
  env: Env
): Promise<{ date: string; manifest: BackupManifest }[]> {
  const backups: { date: string; manifest: BackupManifest }[] = [];
  let cursor: string | undefined;
  let truncated = true;

  while (truncated) {
    const listed = await env.BACKUPS.list({
      prefix: 'backups/',
      delimiter: '/',
      cursor,
    });

    for (const prefix of listed.delimitedPrefixes) {
      const date = prefix.replace('backups/', '').replace('/', '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

      const manifestObj = await env.BACKUPS.get(`backups/${date}/manifest.json`);
      if (manifestObj) {
        const manifest: BackupManifest = await manifestObj.json();
        backups.push({ date, manifest });
      }
    }

    truncated = listed.truncated;
    cursor = listed.truncated ? listed.cursor : undefined;
  }

  backups.sort((a, b) => b.date.localeCompare(a.date));
  return backups;
}

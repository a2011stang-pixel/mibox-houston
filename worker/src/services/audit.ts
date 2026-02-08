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
  user_agent: string | null;
  created_at: number;
}

export class AuditService {
  constructor(private db: D1Database) {}

  async log(
    userId: number,
    userEmail: string,
    action: string,
    entityType: string,
    entityId: string | null,
    oldValue: unknown,
    newValue: unknown,
    ipAddress: string | null,
    userAgent: string | null
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    await this.db
      .prepare(`
        INSERT INTO audit_log 
        (user_id, user_email, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        userId,
        userEmail,
        action,
        entityType,
        entityId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ipAddress,
        userAgent,
        now
      )
      .run();
  }

  async query(
    options: {
      limit?: number;
      offset?: number;
      userId?: number;
      entityType?: string;
      fromDate?: number;
      toDate?: number;
    } = {}
  ): Promise<{ entries: AuditEntry[]; total: number }> {
    const { limit = 50, offset = 0, userId, entityType, fromDate, toDate } = options;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }
    if (entityType) {
      conditions.push('entity_type = ?');
      params.push(entityType);
    }
    if (fromDate) {
      conditions.push('created_at >= ?');
      params.push(fromDate);
    }
    if (toDate) {
      conditions.push('created_at <= ?');
      params.push(toDate);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await this.db
      .prepare('SELECT COUNT(*) as count FROM audit_log ' + whereClause)
      .bind(...params)
      .first<{ count: number }>();

    const entries = await this.db
      .prepare(
        'SELECT * FROM audit_log ' + whereClause + ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .bind(...params, limit, offset)
      .all<AuditEntry>();

    return {
      entries: entries.results || [],
      total: countResult?.count || 0,
    };
  }

  async exportCSV(options: { fromDate?: number; toDate?: number } = {}): Promise<string> {
    const { fromDate, toDate } = options;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (fromDate) {
      conditions.push('created_at >= ?');
      params.push(fromDate);
    }
    if (toDate) {
      conditions.push('created_at <= ?');
      params.push(toDate);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const entries = await this.db
      .prepare('SELECT * FROM audit_log ' + whereClause + ' ORDER BY created_at DESC')
      .bind(...params)
      .all<AuditEntry>();

    const headers = ['ID', 'User', 'Action', 'Entity Type', 'Entity ID', 'Old Value', 'New Value', 'IP', 'Timestamp'];
    const rows = (entries.results || []).map(e => [
      e.id,
      e.user_email,
      e.action,
      e.entity_type,
      e.entity_id || '',
      e.old_value || '',
      e.new_value || '',
      e.ip_address || '',
      new Date(e.created_at * 1000).toISOString(),
    ]);

    return [headers, ...rows].map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n');
  }
}

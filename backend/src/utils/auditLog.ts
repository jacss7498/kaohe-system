import { db } from '../db';

export interface AuditLogEntry {
  userId?: number;
  username: string;
  action: string;
  resource: string;
  resourceId?: number;
  details?: string;
  ipAddress?: string;
}

export function logAudit(entry: AuditLogEntry): void {
  const { userId, username, action, resource, resourceId, details, ipAddress } = entry;

  db.run(
    `INSERT INTO audit_logs (user_id, username, action, resource, resource_id, details, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId || null, username, action, resource, resourceId || null, details || null, ipAddress || null],
    (err) => {
      if (err) {
        console.error('审计日志记录失败:', err);
      }
    }
  );
}

export function getAuditLogs(filters?: {
  userId?: number;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (filters?.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }
    if (filters?.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }
    if (filters?.resource) {
      query += ' AND resource = ?';
      params.push(filters.resource);
    }
    if (filters?.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.CALLBACKS_DB_PATH || path.join(__dirname, '..', 'data', 'callbacks.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS callbacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trace_id TEXT,
        agent_id TEXT,
        bundle_id TEXT,
        mediator_id TEXT,
        resource_type TEXT,
        status TEXT DEFAULT 'valid',
        envelope_type TEXT,
        ingestion_latency_ms REAL,
        payload TEXT,
        received_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    const columns = db.prepare('PRAGMA table_info(callbacks)').all();
    const hasMediatorIdColumn = columns.some((column) => column.name === 'mediator_id');
    if (!hasMediatorIdColumn) {
      db.exec('ALTER TABLE callbacks ADD COLUMN mediator_id TEXT');
    }

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_trace_id ON callbacks(trace_id);
      CREATE INDEX IF NOT EXISTS idx_resource_type ON callbacks(resource_type);
      CREATE INDEX IF NOT EXISTS idx_received_at ON callbacks(received_at);
    `);
  }
  return db;
}

function insertCallback(record) {
  const stmt = getDb().prepare(`
    INSERT INTO callbacks (trace_id, agent_id, bundle_id, mediator_id, resource_type, status, envelope_type, ingestion_latency_ms, payload, received_at)
    VALUES (@trace_id, @agent_id, @bundle_id, @mediator_id, @resource_type, @status, @envelope_type, @ingestion_latency_ms, @payload, @received_at)
  `);
  const result = stmt.run(record);
  return result.lastInsertRowid;
}

function getCallbacks({ limit = 100, offset = 0, traceId, resourceType, mediatorId } = {}) {
  let query = 'SELECT * FROM callbacks WHERE 1=1';
  const params = {};

  if (traceId) {
    query += ' AND trace_id LIKE @traceId';
    params.traceId = `%${traceId}%`;
  }
  if (resourceType) {
    query += ' AND resource_type = @resourceType';
    params.resourceType = resourceType;
  }
  if (mediatorId) {
    query += ' AND mediator_id LIKE @mediatorId';
    params.mediatorId = `%${mediatorId}%`;
  }

  query += ' ORDER BY id DESC LIMIT @limit OFFSET @offset';
  params.limit = limit;
  params.offset = offset;

  return getDb().prepare(query).all(params);
}

function getStats() {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM callbacks').get();
  const byType = db.prepare('SELECT resource_type, COUNT(*) as count FROM callbacks GROUP BY resource_type').all();
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM callbacks GROUP BY status').all();
  const avgLatency = db.prepare('SELECT AVG(ingestion_latency_ms) as avg_ms FROM callbacks WHERE ingestion_latency_ms IS NOT NULL').get();
  return { total: total.count, byType, byStatus, avgLatency: avgLatency.avg_ms };
}

function clearAll() {
  getDb().exec('DELETE FROM callbacks');
}

module.exports = { getDb, insertCallback, getCallbacks, getStats, clearAll };

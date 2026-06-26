const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { insertCallback, getCallbacks, getStats, clearAll } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

function detectEnvelopeType(payload) {
  if (payload.topic || payload.partition !== undefined || payload.offset !== undefined || payload.key) {
    return 'Wrapped';
  }
  return 'Unwrapped';
}

function extractFhirData(payload) {
  const envelopeType = detectEnvelopeType(payload);
  let fhirPayload = payload;

  if (envelopeType === 'Wrapped') {
    fhirPayload = payload.value || payload.message || payload.data || payload;
    if (typeof fhirPayload === 'string') {
      try { fhirPayload = JSON.parse(fhirPayload); } catch { /* keep as-is */ }
    }
  }

  const traceId = fhirPayload.traceId
    || fhirPayload.meta?.traceId
    || payload.headers?.traceId
    || payload.traceId
    || null;

  const agentId = fhirPayload.agentId
    || fhirPayload.meta?.agentId
    || payload.agentId
    || null;

  const bundleId = fhirPayload.id
    || fhirPayload.bundleId
    || payload.bundleId
    || null;

  const resourceType = fhirPayload.resourceType
    || fhirPayload.resource?.resourceType
    || null;

  const metaTimestamp = fhirPayload.meta?.lastUpdated
    || fhirPayload.meta?.timestamp
    || fhirPayload.timestamp
    || null;

  let ingestionLatencyMs = null;
  if (metaTimestamp) {
    const sourceTime = new Date(metaTimestamp).getTime();
    if (!isNaN(sourceTime)) {
      ingestionLatencyMs = Date.now() - sourceTime;
    }
  }

  const status = determineFhirStatus(fhirPayload, payload);

  return { traceId, agentId, bundleId, resourceType, status, envelopeType, ingestionLatencyMs, fhirPayload };
}

function determineFhirStatus(fhirPayload, rawPayload) {
  if (rawPayload.topic && /error|fail|dead.letter/i.test(rawPayload.topic)) {
    return 'error';
  }
  if (fhirPayload.resourceType === 'OperationOutcome') {
    const hasError = fhirPayload.issue?.some(i => ['error', 'fatal'].includes(i.severity));
    if (hasError) return 'error';
  }
  if (fhirPayload.resourceType) return 'valid';
  return 'unknown';
}

// Webhook endpoint - unauthenticated (allow_guest=True per ZenHub #8156)
app.post('/api/v1/callback', (req, res) => {
  const receivedAt = new Date().toISOString();
  const payload = req.body;

  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'Empty payload' });
  }

  const { traceId, agentId, bundleId, resourceType, status, envelopeType, ingestionLatencyMs, fhirPayload } = extractFhirData(payload);

  const record = {
    trace_id: traceId,
    agent_id: agentId,
    bundle_id: bundleId,
    resource_type: resourceType,
    status,
    envelope_type: envelopeType,
    ingestion_latency_ms: ingestionLatencyMs,
    payload: JSON.stringify(payload),
    received_at: receivedAt
  };

  const id = insertCallback(record);

  const event = { id, ...record };
  io.emit('callback:new', event);

  console.log(`[${receivedAt}] ${envelopeType} | ${resourceType || 'unknown'} | trace=${traceId || 'none'} | latency=${ingestionLatencyMs ? ingestionLatencyMs + 'ms' : 'N/A'}`);

  res.status(200).json({ received: true, id, traceId, envelopeType });
});

app.get('/api/v1/callbacks', (req, res) => {
  const { limit, offset, traceId, resourceType } = req.query;
  const callbacks = getCallbacks({
    limit: parseInt(limit) || 100,
    offset: parseInt(offset) || 0,
    traceId,
    resourceType
  });
  res.json(callbacks);
});

app.get('/api/v1/stats', (req, res) => {
  const stats = getStats();
  res.json(stats);
});

app.delete('/api/v1/callbacks', (req, res) => {
  clearAll();
  io.emit('callbacks:cleared');
  console.log('[CLEAR] All callback logs cleared');
  res.json({ cleared: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Fallback: serve frontend for any non-API route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`\n  SHR QA Monitor - Backend`);
  console.log(`  Webhook endpoint: http://localhost:${PORT}/api/v1/callback`);
  console.log(`  Dashboard API:    http://localhost:${PORT}/api/v1/callbacks`);
  console.log(`  Health check:     http://localhost:${PORT}/health\n`);
});

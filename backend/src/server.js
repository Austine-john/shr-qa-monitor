const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { insertCallback, getCallbacks, getStats, clearAll } = require('./db');
const { extractFhirData } = require('./fhirPayloadParser');

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


// Webhook endpoint - unauthenticated (allow_guest=True per ZenHub #8156)
app.post('/api/v1/callback', (req, res) => {
  const receivedAt = new Date().toISOString();
  const payload = req.body;

  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'Empty payload' });
  }

  const { traceId, agentId, bundleId, mediatorId, resourceType, status, envelopeType, ingestionLatencyMs, fhirPayload } = extractFhirData(payload);

  const record = {
    trace_id: traceId,
    agent_id: agentId,
    bundle_id: bundleId,
    mediator_id: mediatorId,
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
  const { limit, offset, traceId, resourceType, mediatorId } = req.query;
  const callbacks = getCallbacks({
    limit: parseInt(limit) || 100,
    offset: parseInt(offset) || 0,
    traceId,
    resourceType,
    mediatorId
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

function detectEnvelopeType(payload) {
  if (payload.topic || payload.partition !== undefined || payload.offset !== undefined || payload.key) {
    return 'Wrapped';
  }
  return 'Unwrapped';
}

function getNestedValue(obj, path) {
  if (!obj || typeof obj !== 'object') return undefined;
  return path.split('.').reduce((current, part) => {
    if (current === undefined || current === null) return undefined;
    return current[part];
  }, obj);
}

function resolveValue(primaryPayload, fallbackPayload, paths) {
  for (const path of paths) {
    const primaryValue = getNestedValue(primaryPayload, path);
    if (primaryValue !== undefined && primaryValue !== null && primaryValue !== '') {
      return primaryValue;
    }

    const fallbackValue = getNestedValue(fallbackPayload, path);
    if (fallbackValue !== undefined && fallbackValue !== null && fallbackValue !== '') {
      return fallbackValue;
    }
  }

  return null;
}

function extractFhirData(payload) {
  const envelopeType = detectEnvelopeType(payload);
  let fhirPayload = payload;

  if (envelopeType === 'Wrapped') {
    fhirPayload = payload.value || payload.message || payload.data || payload;
    if (typeof fhirPayload === 'string') {
      try {
        fhirPayload = JSON.parse(fhirPayload);
      } catch {
        /* keep as-is */
      }
    }
  }

  const traceId = resolveValue(fhirPayload, payload, [
    'traceId',
    'meta.traceId',
    'headers.traceId',
    'meta.trace_id',
    'headers.trace_id'
  ]);

  const agentId = resolveValue(fhirPayload, payload, [
    'agentId',
    'meta.agentId',
    'headers.agentId',
    'meta.agent_id',
    'headers.agent_id'
  ]);

  const bundleId = resolveValue(fhirPayload, payload, [
    'id',
    'bundleId',
    'meta.bundleId',
    'headers.bundleId',
    'meta.bundle_id',
    'headers.bundle_id'
  ]);

  const mediatorId = resolveValue(fhirPayload, payload, [
    'mediatorId',
    'mediator.id',
    'meta.mediatorId',
    'meta.mediator.id',
    'meta.mediator_id',
    'headers.mediatorId',
    'headers.mediator.id',
    'headers.mediator_id',
    'metadata.mediatorId',
    'metadata.mediator.id',
    'message.mediatorId',
    'message.mediator.id',
    'event.mediatorId',
    'event.mediator.id',
    'resource.meta.mediatorId',
    'resource.meta.mediator.id'
  ]);

  const resourceType = resolveValue(fhirPayload, payload, [
    'resourceType',
    'resource.resourceType',
    'meta.resourceType',
    'resource.type'
  ]);

  const metaTimestamp = resolveValue(fhirPayload, payload, [
    'meta.lastUpdated',
    'meta.timestamp',
    'timestamp'
  ]);

  let ingestionLatencyMs = null;
  if (metaTimestamp) {
    const sourceTime = new Date(metaTimestamp).getTime();
    if (!isNaN(sourceTime)) {
      ingestionLatencyMs = Date.now() - sourceTime;
    }
  }

  const status = determineFhirStatus(fhirPayload, payload);

  return {
    traceId,
    agentId,
    bundleId,
    mediatorId,
    resourceType,
    status,
    envelopeType,
    ingestionLatencyMs,
    fhirPayload
  };
}

function determineFhirStatus(fhirPayload, rawPayload) {
  if (rawPayload.topic && /error|fail|dead.letter/i.test(rawPayload.topic)) {
    return 'error';
  }
  if (fhirPayload.resourceType === 'OperationOutcome') {
    const hasError = fhirPayload.issue?.some((issue) => ['error', 'fatal'].includes(issue.severity));
    if (hasError) return 'error';
  }
  if (fhirPayload.resourceType) return 'valid';
  return 'unknown';
}

module.exports = {
  detectEnvelopeType,
  extractFhirData,
  determineFhirStatus
};

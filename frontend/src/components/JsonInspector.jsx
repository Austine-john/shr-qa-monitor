const STATUS = {
  valid:   { badge: 'bg-emerald-100 text-emerald-700', label: 'Valid' },
  error:   { badge: 'bg-red-100 text-red-700',         label: 'Error' },
  unknown: { badge: 'bg-yellow-100 text-yellow-700',   label: 'Unknown' },
};

function Meta({ label, value, mono = false }) {
  if (!value || value === 'N/A') return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm text-gray-300">—</div>
    </div>
  );
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className={`text-sm text-gray-900 break-all ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

export default function JsonInspector({ callback, onClose }) {
  if (!callback) return null;

  let parsed;
  try { parsed = JSON.parse(callback.payload); }
  catch { parsed = callback.payload; }

  const s = STATUS[callback.status] || STATUS.unknown;
  const time = new Date(callback.received_at).toLocaleString('en-US', {
    dateStyle: 'medium', timeStyle: 'medium', hour12: false,
  });

  const latency = callback.ingestion_latency_ms
    ? `${Math.round(callback.ingestion_latency_ms)}ms`
    : null;

  const copyPayload = () => navigator.clipboard.writeText(JSON.stringify(parsed, null, 2));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.badge}`}>{s.label}</span>
            <div>
              <div className="font-semibold text-gray-900 text-base">
                {callback.mediator_id || callback.envelope_type || 'Callback'}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{time}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg w-8 h-8 flex items-center justify-center transition-colors text-lg leading-none ml-4 flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Metadata grid */}
        <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-2 gap-x-8 gap-y-3">
          <Meta label="Mediator ID" value={callback.mediator_id} mono />
          <Meta label="Envelope"    value={callback.envelope_type} />
          <Meta label="Latency"     value={latency} mono />
        </div>

        {/* Payload */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payload</span>
            <button
              onClick={copyPayload}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 hover:bg-indigo-50 rounded transition-colors"
            >
              Copy JSON
            </button>
          </div>
          <pre className="bg-gray-950 text-emerald-300 px-6 py-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

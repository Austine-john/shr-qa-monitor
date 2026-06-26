export default function JsonInspector({ callback, onClose }) {
  if (!callback) return null;

  let parsed;
  try {
    parsed = JSON.parse(callback.payload);
  } catch {
    parsed = callback.payload;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">JSON Inspector</h3>
            <p className="text-sm text-gray-500 mt-1">
              Trace: {callback.trace_id || 'N/A'} | Type: {callback.resource_type || 'unknown'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Agent ID:</span>
              <span className="ml-2 font-mono text-gray-900">{callback.agent_id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Mediator ID:</span>
              <span className="ml-2 font-mono text-gray-900">{callback.mediator_id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Bundle ID:</span>
              <span className="ml-2 font-mono text-gray-900">{callback.bundle_id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Envelope:</span>
              <span className={`ml-2 font-mono ${callback.envelope_type === 'Wrapped' ? 'text-orange-600' : 'text-blue-600'}`}>
                {callback.envelope_type}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Latency:</span>
              <span className="ml-2 font-mono text-gray-900">
                {callback.ingestion_latency_ms ? `${Math.round(callback.ingestion_latency_ms)}ms` : 'N/A'}
              </span>
            </div>
          </div>
          <pre className="bg-gray-900 text-green-300 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

const STATUS = {
  valid:   { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',   label: 'Valid' },
  error:   { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',               label: 'Error' },
  unknown: { dot: 'bg-yellow-400',  badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',      label: 'Unknown' },
};

const ENVELOPE = {
  Wrapped: 'bg-orange-50 text-orange-700 border-orange-200',
};

export default function CallbackRow({ callback, onClick }) {
  const s = STATUS[callback.status] || STATUS.unknown;
  const isWrapped = callback.envelope_type === 'Wrapped';

  const time = new Date(callback.received_at);
  const timeStr = time.toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const dateStr = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const latency = callback.ingestion_latency_ms
    ? `${Math.round(callback.ingestion_latency_ms)}ms`
    : null;

  const latencyColor = !latency ? 'text-gray-300'
    : callback.ingestion_latency_ms < 500 ? 'text-emerald-600'
    : callback.ingestion_latency_ms < 2000 ? 'text-yellow-600'
    : 'text-red-600';

  return (
    <tr
      className="hover:bg-indigo-50/40 cursor-pointer transition-colors border-b border-gray-100 group"
      onClick={() => onClick(callback)}
    >
      {/* Status */}
      <td className="px-4 py-3 w-24">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </td>

      {/* Time */}
      <td className="px-4 py-3 w-28">
        <div className="text-xs font-mono text-gray-800">{timeStr}</div>
        <div className="text-xs text-gray-400">{dateStr}</div>
      </td>

      {/* Mediator ID */}
      <td className="px-4 py-3 max-w-[160px]">
        {callback.mediator_id
          ? <span className="text-xs font-mono text-gray-600 truncate block" title={callback.mediator_id}>{callback.mediator_id}</span>
          : <span className="text-gray-300 text-xs">—</span>}
      </td>

      {/* Envelope */}
      <td className="px-4 py-3 w-20">
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${isWrapped ? 'text-orange-600' : 'text-sky-600'}`}
          title={isWrapped ? 'Wrapped' : 'Unwrapped — Raw FHIR'}
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" />
          </svg>
          {isWrapped ? 'Wrapped' : 'Raw'}
        </span>
      </td>

      {/* Latency */}
      <td className="px-4 py-3 w-24 text-right">
        <span className={`text-xs font-mono font-semibold tabular-nums ${latencyColor}`}>
          {latency || '—'}
        </span>
      </td>

      {/* Inspect caret */}
      <td className="pr-4 w-8 text-right">
        <span className="text-gray-300 group-hover:text-indigo-400 transition-colors text-sm">›</span>
      </td>
    </tr>
  );
}

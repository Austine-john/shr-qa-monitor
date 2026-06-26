export default function CallbackRow({ callback, onClick }) {
  const statusColor = {
    valid: 'bg-green-500',
    error: 'bg-red-500',
    unknown: 'bg-yellow-500'
  }[callback.status] || 'bg-gray-400';

  const time = new Date(callback.received_at);
  const timeStr = time.toLocaleTimeString('en-US', {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3
  });

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
      onClick={() => onClick(callback)}
    >
      <td className="px-4 py-3">
        <span className={`inline-block w-3 h-3 rounded-full ${statusColor}`} />
      </td>
      <td className="px-4 py-3 text-xs font-mono text-gray-500">{timeStr}</td>
      <td className="px-4 py-3 text-xs font-mono text-blue-600 max-w-[140px] truncate">
        {callback.trace_id || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">{callback.resource_type || 'unknown'}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-600 max-w-[120px] truncate">
        {callback.agent_id || '-'}
      </td>
      <td className="px-4 py-3 text-xs font-mono text-gray-600 max-w-[120px] truncate">
        {callback.bundle_id || '-'}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded ${callback.envelope_type === 'Wrapped' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
          {callback.envelope_type}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {callback.ingestion_latency_ms ? `${Math.round(callback.ingestion_latency_ms)}ms` : '-'}
      </td>
    </tr>
  );
}

export default function StatsBar({ stats }) {
  if (!stats) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse">
          <div className="h-7 bg-gray-100 rounded w-16 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-24" />
        </div>
      ))}
    </div>
  );

  const valid = stats.byStatus?.find(s => s.status === 'valid')?.count || 0;
  const errors = stats.byStatus?.find(s => s.status === 'error')?.count || 0;
  const unknown = stats.byStatus?.find(s => s.status === 'unknown')?.count || 0;
  const latency = stats.avgLatency ? `${Math.round(stats.avgLatency)}ms` : '—';

  const cards = [
    { label: 'Total Received', value: stats.total, color: 'text-gray-900', bg: 'bg-white', bar: 'bg-gray-200' },
    { label: 'Valid', value: valid, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-400' },
    { label: 'Errors', value: errors, color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-400' },
    { label: 'Avg Latency', value: latency, color: 'text-indigo-600', bg: 'bg-indigo-50', bar: 'bg-indigo-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, color, bg }) => (
        <div key={label} className={`${bg} border border-gray-100 rounded-xl p-5 shadow-sm`}>
          <div className={`text-3xl font-bold tabular-nums ${color}`}>{value}</div>
          <div className="text-sm text-gray-500 mt-1 font-medium">{label}</div>
          {label === 'Total Received' && stats.total > 0 && (
            <div className="mt-3 flex gap-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
              <div className="bg-emerald-400 h-full" style={{ width: `${(valid / stats.total) * 100}%` }} />
              <div className="bg-red-400 h-full" style={{ width: `${(errors / stats.total) * 100}%` }} />
              <div className="bg-yellow-400 h-full" style={{ width: `${(unknown / stats.total) * 100}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function StatsBar({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-500">Total Callbacks</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-green-600">
          {stats.byStatus?.find(s => s.status === 'valid')?.count || 0}
        </div>
        <div className="text-sm text-gray-500">Valid FHIR</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-red-600">
          {stats.byStatus?.find(s => s.status === 'error')?.count || 0}
        </div>
        <div className="text-sm text-gray-500">Errors</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-blue-600">
          {stats.avgLatency ? `${Math.round(stats.avgLatency)}ms` : 'N/A'}
        </div>
        <div className="text-sm text-gray-500">Avg Latency</div>
      </div>
    </div>
  );
}

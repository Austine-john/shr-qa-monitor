import { useState } from 'react';

export default function FilterBar({ onFilter, onClear }) {
  const [mediatorId, setMediatorId] = useState('');
  const [status, setStatus] = useState('');

  const apply = (overrides = {}) => {
    onFilter({
      resourceType: '',
      mediatorId: (overrides.mediatorId ?? mediatorId).trim(),
      status: overrides.status ?? status,
      traceId: '',
    });
  };

  const handleReset = () => {
    setMediatorId('');
    setStatus('');
    onFilter({ traceId: '', resourceType: '', mediatorId: '', status: '' });
  };

  const active = mediatorId || status;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
      <select
        value={status}
        onChange={e => { setStatus(e.target.value); apply({ status: e.target.value }); }}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="">All Statuses</option>
        <option value="valid">Valid</option>
        <option value="error">Error</option>
        <option value="unknown">Unknown</option>
      </select>

      <input
        type="text"
        placeholder="Mediator ID..."
        value={mediatorId}
        onChange={e => setMediatorId(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && apply()}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-52"
      />

      {active && (
        <button
          onClick={handleReset}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
        >
          <span>✕</span> Clear filters
        </button>
      )}

      <div className="ml-auto">
        <button
          onClick={onClear}
          className="px-4 py-2 text-sm text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
}

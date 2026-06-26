import { useState } from 'react';

export default function FilterBar({ onFilter, onClear }) {
  const [traceId, setTraceId] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [mediatorId, setMediatorId] = useState('');

  const handleFilter = () => {
    onFilter({ traceId: traceId.trim(), resourceType, mediatorId: mediatorId.trim() });
  };

  const handleReset = () => {
    setTraceId('');
    setResourceType('');
    setMediatorId('');
    onFilter({ traceId: '', resourceType: '', mediatorId: '' });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <input
        type="text"
        placeholder="Filter by traceId..."
        value={traceId}
        onChange={e => setTraceId(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleFilter()}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
      />
      <input
        type="text"
        placeholder="Filter by mediatorId..."
        value={mediatorId}
        onChange={e => setMediatorId(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleFilter()}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
      />
      <select
        value={resourceType}
        onChange={e => { setResourceType(e.target.value); onFilter({ traceId: traceId.trim(), resourceType: e.target.value, mediatorId: mediatorId.trim() }); }}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Resource Types</option>
        <option value="Bundle">Bundle</option>
        <option value="Patient">Patient</option>
        <option value="Observation">Observation</option>
        <option value="Condition">Condition</option>
        <option value="Coverage">Coverage</option>
        <option value="Encounter">Encounter</option>
        <option value="MedicationRequest">MedicationRequest</option>
        <option value="OperationOutcome">OperationOutcome</option>
      </select>
      <button
        onClick={handleFilter}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
      >
        Filter
      </button>
      <button
        onClick={handleReset}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
      >
        Reset
      </button>
      <div className="ml-auto">
        <button
          onClick={onClear}
          className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
}

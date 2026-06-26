import { useState, useEffect, useRef } from 'react';
import { socket } from './socket';
import StatsBar from './components/StatsBar';
import FilterBar from './components/FilterBar';
import CallbackRow from './components/CallbackRow';
import JsonInspector from './components/JsonInspector';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [callbacks, setCallbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedCallback, setSelectedCallback] = useState(null);
  const [connected, setConnected] = useState(false);
  const [filters, setFilters] = useState({ traceId: '', resourceType: '', mediatorId: '' });
  const tableRef = useRef(null);

  useEffect(() => {
    fetchCallbacks();
    fetchStats();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('callback:new', (event) => {
      setCallbacks(prev => [event, ...prev].slice(0, 500));
      fetchStats();
    });

    socket.on('callbacks:cleared', () => {
      setCallbacks([]);
      fetchStats();
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('callback:new');
      socket.off('callbacks:cleared');
    };
  }, []);

  useEffect(() => {
    fetchCallbacks();
  }, [filters]);

  async function fetchCallbacks() {
    const params = new URLSearchParams();
    if (filters.traceId) params.set('traceId', filters.traceId);
    if (filters.resourceType) params.set('resourceType', filters.resourceType);
    if (filters.mediatorId) params.set('mediatorId', filters.mediatorId);
    params.set('limit', '200');

    const res = await fetch(`${API_BASE}/api/v1/callbacks?${params}`);
    const data = await res.json();
    setCallbacks(data);
  }

  async function fetchStats() {
    const res = await fetch(`${API_BASE}/api/v1/stats`);
    const data = await res.json();
    setStats(data);
  }

  async function handleClear() {
    if (!confirm('Clear all callback logs? This cannot be undone.')) return;
    await fetch(`${API_BASE}/api/v1/callbacks`, { method: 'DELETE' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">SHR QA Monitor</h1>
            <p className="text-sm text-gray-500">FHIR Callback Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {connected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <StatsBar stats={stats} />
        <FilterBar onFilter={setFilters} onClear={handleClear} />

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto" ref={tableRef}>
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trace ID</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Resource Type</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Agent ID</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Mediator ID</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Bundle ID</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Envelope</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Latency</th>
                </tr>
              </thead>
              <tbody>
                {callbacks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                      No callbacks received yet. Send a POST to <code className="bg-gray-100 px-2 py-1 rounded">/api/v1/callback</code>
                    </td>
                  </tr>
                ) : (
                  callbacks.map(cb => (
                    <CallbackRow key={cb.id} callback={cb} onClick={setSelectedCallback} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <JsonInspector callback={selectedCallback} onClose={() => setSelectedCallback(null)} />
    </div>
  );
}

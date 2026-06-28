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
  const [filters, setFilters] = useState({ resourceType: '', mediatorId: '', status: '', traceId: '' });
  const [ngrokUrl, setNgrokUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const tableRef = useRef(null);

  useEffect(() => {
    fetchCallbacks();
    fetchStats();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('callback:new', (event) => {
      setCallbacks(prev => {
        if (prev.some(cb => cb.id === event.id)) return prev;
        return [event, ...prev].slice(0, 500);
      });
      fetchStats();
    });
    socket.on('callbacks:cleared', () => {
      setCallbacks([]);
      fetchStats();
    });
    socket.on('ngrok:url', ({ webhookUrl }) => setNgrokUrl(webhookUrl || null));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('callback:new');
      socket.off('callbacks:cleared');
      socket.off('ngrok:url');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCallbacks();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCallbacks() {
    const params = new URLSearchParams();
    if (filters.traceId) params.set('traceId', filters.traceId);
    if (filters.resourceType) params.set('resourceType', filters.resourceType);
    if (filters.mediatorId) params.set('mediatorId', filters.mediatorId);
    if (filters.status) params.set('status', filters.status);
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

  async function handleCopy() {
    if (!ngrokUrl) return;
    await navigator.clipboard.writeText(ngrokUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleClear() {
    if (!confirm('Clear all callback logs? This cannot be undone.')) return;
    await fetch(`${API_BASE}/api/v1/callbacks`, { method: 'DELETE' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">Q</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">SHR QA Monitor</h1>
              <p className="text-xs text-gray-400">FHIR Callback Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end">
            {ngrokUrl && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 min-w-0">
                <span className="text-xs font-semibold text-indigo-500 flex-shrink-0">Webhook</span>
                <code className="text-xs text-indigo-800 font-mono truncate max-w-xs hidden sm:block">{ngrokUrl}</code>
                <button
                  onClick={handleCopy}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-2 py-0.5 rounded transition-colors flex-shrink-0"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            )}

            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {connected ? 'Live' : 'Disconnected'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <StatsBar stats={stats} />
        <FilterBar onFilter={setFilters} onClear={handleClear} />

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          {/* Table count */}
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">
              {callbacks.length === 0 ? 'No callbacks' : `${callbacks.length} callback${callbacks.length !== 1 ? 's' : ''}`}
            </span>
            {callbacks.length > 0 && (
              <span className="text-xs text-gray-400">Click a row to inspect payload</span>
            )}
          </div>

          <div className="overflow-x-auto" ref={tableRef}>
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mediator ID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Envelope</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Latency</th>
                  <th className="pr-4 w-8" />
                </tr>
              </thead>
              <tbody>
                {callbacks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="text-4xl mb-3">📭</div>
                      <div className="text-gray-500 font-medium">No callbacks received yet</div>
                      <div className="text-sm text-gray-400 mt-1">
                        POST to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">/api/v1/callback</code>
                        {ngrokUrl && (
                          <span> or <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{ngrokUrl}</code></span>
                        )}
                      </div>
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

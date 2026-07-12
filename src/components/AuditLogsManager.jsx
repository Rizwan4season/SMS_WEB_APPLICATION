"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { ShieldCheck, Search } from 'lucide-react';

function AuditLogsManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [filterUser, setFilterUser] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/audit-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setLogs(data.data);
      } else {
        setError(data.message || "Failed to load audit history.");
      }
    } catch (err) {
      setError("Network error loading system loggers.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    filterUser === "" || l.username.toLowerCase().includes(filterUser.toLowerCase())
  );

  
  // Real-time synchronization listener
  const fetchLogsRef = useRef(fetchLogs);
  useEffect(() => {
    fetchLogsRef.current = fetchLogs;
  }, [fetchLogs]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'AUDIT_LOGS') {
        console.log(`Socket update received for AuditLogsManager.jsx: `, change);
        fetchLogsRef.current();
      }
    };
    socket.on('data-changed', handleDataChanged);
    return () => {
      socket.off('data-changed', handleDataChanged);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      
      {/* Search Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Filter audit logs by operator username..."
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-sky-500 transition-all text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              No audit logs captured.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 flex gap-4 hover:bg-slate-50/50">
                    <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl self-start">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <span className="font-bold text-slate-700 text-sm">{log.username}</span>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{log.created_at_fmt}</span>
                      </div>
                      <p className="text-xs font-semibold text-sky-600 mt-0.5">{log.action}</p>
                      <p className="text-xs text-slate-500 mt-1">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}

export default AuditLogsManager;

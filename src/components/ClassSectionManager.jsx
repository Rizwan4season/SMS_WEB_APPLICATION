"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

function ClassSectionManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [classSummaries, setClassSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const classTiers = ["Playgroup", "Nursery", "Prep", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];

  const fetchSummaries = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Active" })
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        // Calculate counts
        const counts = {};
        classTiers.forEach(c => {
          counts[c] = { A: 0, B: 0, C: 0, total: 0 };
        });

        data.data.forEach(st => {
          const cls = st.class;
          const sec = st.section;
          if (counts[cls] && (sec === 'A' || sec === 'B' || sec === 'C')) {
            counts[cls][sec]++;
            counts[cls].total++;
          }
        });

        const formatted = classTiers.map(c => ({
          name: c,
          ...counts[c]
        }));
        setClassSummaries(formatted);
      } else {
        setError(data.message || "Failed to load summaries.");
      }
    } catch (err) {
      setError("Network error connecting to server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  
  // Real-time synchronization listener
  const fetchSummariesRef = useRef(fetchSummaries);
  useEffect(() => {
    fetchSummariesRef.current = fetchSummaries;
  }, [fetchSummaries]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'STUDENTS') {
        console.log(`Socket update received for ClassSectionManager.jsx: `, change);
        fetchSummariesRef.current();
      }
    };
    socket.on('data-changed', handleDataChanged);
    return () => {
      socket.off('data-changed', handleDataChanged);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">{error}</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Class Tier</th>
                    <th className="py-4 px-6">Section A</th>
                    <th className="py-4 px-6">Section B</th>
                    <th className="py-4 px-6">Section C</th>
                    <th className="py-4 px-6">Total Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {classSummaries.map((cls) => (
                    <tr key={cls.name} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-semibold text-slate-900">{cls.name}</td>
                      <td className="py-4 px-6 text-slate-600">{cls.A} active students</td>
                      <td className="py-4 px-6 text-slate-600">{cls.B} active students</td>
                      <td className="py-4 px-6 text-slate-600">{cls.C} active students</td>
                      <td className="py-4 px-6 font-bold text-sky-600">{cls.total} students</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card-Based Grid View */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {classSummaries.map((cls) => (
                <div key={cls.name} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 text-sm font-heading">{cls.name}</h4>
                    <span className="bg-sky-50 text-sky-600 font-bold px-2 py-0.5 rounded-full text-xs">
                      {cls.total} total
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-lg border border-slate-200/55">
                      <p className="text-slate-400 font-medium">Sec A</p>
                      <p className="font-bold text-slate-700 mt-0.5">{cls.A}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200/55">
                      <p className="text-slate-400 font-medium">Sec B</p>
                      <p className="font-bold text-slate-700 mt-0.5">{cls.B}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200/55">
                      <p className="text-slate-400 font-medium">Sec C</p>
                      <p className="font-bold text-slate-700 mt-0.5">{cls.C}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ClassSectionManager;

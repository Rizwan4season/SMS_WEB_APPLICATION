"use client";
import React, { useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Calendar, Users, CheckCircle, XCircle, AlertCircle, Bookmark } from 'lucide-react';

function AttendanceManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetClass, setTargetClass] = useState("Class 8");
  const [targetSection, setTargetSection] = useState("A");
  
  const [roster, setRoster] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const classes = ["Playgroup", "Nursery", "Prep", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
  const sections = ["A", "B", "C"];

  // Fetch Attendance Sheet
  const handleLoadRegister = async () => {
    setLoading(true);
    setError("");
    setLoaded(false);
    try {
      const response = await fetch(`${apiBaseUrl}/api/attendance/sheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date, class: targetClass, section: targetSection })
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setRoster(data.data);
        setLoaded(true);
      } else {
        setError(data.message || "No students found in this class.");
      }
    } catch (err) {
      setError("Network error loading roster.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Bulk Status Marker
  const handleBulkMark = (status) => {
    setRoster(prev => prev.map(st => ({ ...st, status })));
  };

  // Update Individual Student Status
  const handleUpdateStatus = (studentId, status) => {
    setRoster(prev => prev.map(st => 
      String(st.student_id) === String(studentId) ? { ...st, status } : st
    ));
  };

  // Save Attendance Register
  const handleSaveAttendance = async () => {
    setSaving(true);
    setError("");
    const records = roster.map(st => ({
      student_id: st.student_id,
      status: st.status
    }));

    try {
      const response = await fetch(`${apiBaseUrl}/api/attendance/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date, records })
      });
      const data = await response.json();
      if (data.status === "success") {
        alert("Attendance register saved successfully!");
      } else {
        setError(data.message || "Failed to save attendance.");
      }
    } catch (err) {
      setError("Network error saving attendance.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Settings Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Register Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Class</label>
            <select
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              className="w-full bg-slate-50 rounded-xl px-3.5 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Section</label>
            <select
              value={targetSection}
              onChange={(e) => setSection(e.target.value)}
              className="w-full bg-slate-50 rounded-xl px-3.5 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
            >
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button
            onClick={handleLoadRegister}
            disabled={loading}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target flex items-center justify-center disabled:opacity-50"
          >
            <span>Load Register Roster</span>
          </button>
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
      ) : loaded ? (
        <div className="space-y-4">
          
          {/* Quick Actions Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkMark("Present")}
                className="bg-green-50 hover:bg-green-100 text-green-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors touch-target"
              >
                <CheckCircle size={14} />
                <span>Mark All Present</span>
              </button>
              <button
                onClick={() => handleBulkMark("Absent")}
                className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors touch-target"
              >
                <XCircle size={14} />
                <span>Mark All Absent</span>
              </button>
            </div>
            
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-green-500/10 transition-all duration-150 active:scale-95 touch-target flex items-center justify-center disabled:opacity-50 w-full sm:w-auto"
            >
              <span>Save Attendance Register</span>
            </button>
          </div>

          {/* Roster list */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6 w-24">Roll No</th>
                    <th className="py-4 px-6">Student Name</th>
                    <th className="py-4 px-6">Father Name</th>
                    <th className="py-4 px-6 text-center w-96">Attendance State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {roster.map((st) => (
                    <tr key={st.student_id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-semibold text-slate-900">{st.roll_no || '-'}</td>
                      <td className="py-4 px-6 font-semibold text-slate-800">{st.name}</td>
                      <td className="py-4 px-6 text-slate-500">{st.father_name}</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center gap-2">
                          {["Present", "Absent", "Late", "Leave"].map((status) => {
                            const isSelected = st.status === status;
                            let style = "bg-slate-100 text-slate-600 hover:bg-slate-200";
                            if (isSelected) {
                              if (status === "Present") style = "bg-green-500 text-white shadow-md shadow-green-500/10";
                              if (status === "Absent") style = "bg-red-500 text-white shadow-md shadow-red-500/10";
                              if (status === "Late") style = "bg-amber-500 text-white shadow-md shadow-amber-500/10";
                              if (status === "Leave") style = "bg-indigo-500 text-white shadow-md shadow-indigo-500/10";
                            }
                            return (
                              <button
                                key={status}
                                onClick={() => handleUpdateStatus(st.student_id, status)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${style}`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="divide-y divide-slate-100 md:hidden">
              {roster.map((st) => (
                <div key={st.student_id} className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold">Roll {st.roll_no || '-'}</span>
                      <h4 className="font-bold text-slate-800 text-sm">{st.name}</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      st.status === "Present" ? "bg-green-50 text-green-700" :
                      st.status === "Absent" ? "bg-red-50 text-red-700" :
                      st.status === "Late" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"
                    }`}>
                      {st.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1">
                    {["Present", "Absent", "Late", "Leave"].map((status) => {
                      const isSelected = st.status === status;
                      let style = "bg-slate-100 text-slate-600 border border-slate-200/50";
                      if (isSelected) {
                        if (status === "Present") style = "bg-green-500 text-white border-green-500 font-bold";
                        if (status === "Absent") style = "bg-red-500 text-white border-red-500 font-bold";
                        if (status === "Late") style = "bg-amber-500 text-white border-amber-500 font-bold";
                        if (status === "Leave") style = "bg-indigo-500 text-white border-indigo-500 font-bold";
                      }
                      
  // Real-time synchronization listener
  const handleLoadRegisterRef = useRef(handleLoadRegister);
  useEffect(() => {
    handleLoadRegisterRef.current = handleLoadRegister;
  }, [handleLoadRegister]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'ATTENDANCE' || change.type === 'STUDENTS') {
        console.log(`Socket update received for AttendanceManager.jsx: `, change);
        handleLoadRegisterRef.current();
      }
    };
    socket.on('data-changed', handleDataChanged);
    return () => {
      socket.off('data-changed', handleDataChanged);
    };
  }, [socket]);

  return (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(st.student_id, status)}
                          className={`py-2 rounded-xl text-[10px] font-semibold text-center touch-target transition-all ${style}`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 text-sm">
          <Calendar className="mx-auto mb-3 opacity-30" size={36} />
          Choose date, class, and section, then click Load Register to fetch student list.
        </div>
      )}

    </div>
  );
}

export default AttendanceManager;

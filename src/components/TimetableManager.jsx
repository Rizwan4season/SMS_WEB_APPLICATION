"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Calendar, Save, Trash2, X } from 'lucide-react';

function TimetableManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [selectedClass, setSelectedClass] = useState("Class 8");
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Editing state
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({
    subject: "",
    teacher: "",
    room_no: ""
  });

  const classes = ["Playgroup", "Nursery", "Prep", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = ["1st Period", "2nd Period", "3rd Period", "4th Period", "5th Period", "6th Period"];

  const fetchTimetable = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/timetable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ class: selectedClass })
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setTimetable(data.data);
      } else {
        setTimetable([]);
      }
    } catch (err) {
      setError("Network error loading schedule.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedClass]);

  const getSlotData = (day, period) => {
    return timetable.find(t => t.day_name === day && t.period_name === period);
  };

  const handleSlotClick = (day, period) => {
    const existing = getSlotData(day, period);
    setEditingSlot({ day, period, id: existing?.id || null });
    setSlotForm({
      subject: existing?.subject || "",
      teacher: existing?.teacher_name || "",
      room_no: existing?.room_no || ""
    });
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiBaseUrl}/api/timetable/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          class: selectedClass,
          day_name: editingSlot.day,
          period_name: editingSlot.period,
          subject: slotForm.subject,
          teacher_name: slotForm.teacher,
          room_no: slotForm.room_no
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        setEditingSlot(null);
        fetchTimetable();
      } else {
        alert(data.message || "Failed to save slot.");
      }
    } catch (err) {
      alert("Network error saving slot.");
      console.error(err);
    }
  };

  const handleDeleteSlot = async () => {
    if (!editingSlot.id) return;
    if (!window.confirm("Clear this period slot?")) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/timetable/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: editingSlot.id })
      });
      const data = await response.json();
      if (data.status === "success") {
        setEditingSlot(null);
        fetchTimetable();
      } else {
        alert(data.message || "Failed to delete slot.");
      }
    } catch (err) {
      alert("Network error clearing slot.");
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Class Selector Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Timetable:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 font-semibold"
          >
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Desktop Matrix Grid View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse text-left border-t border-slate-100">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6 w-32">Day</th>
                  {periods.map(p => <th key={p} className="py-4 px-6 text-center">{p}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {days.map(day => (
                  <tr key={day} className="hover:bg-slate-50/20">
                    <td className="py-4 px-6 font-bold text-slate-700 bg-slate-50/50">{day}</td>
                    {periods.map(period => {
                      const slot = getSlotData(day, period);
                      return (
                        <td 
                          key={period} 
                          onClick={() => handleSlotClick(day, period)}
                          className="py-4 px-3 text-center border-l border-slate-100 cursor-pointer hover:bg-sky-50/30 transition-colors"
                        >
                          {slot ? (
                            <div className="leading-tight">
                              <p className="font-bold text-sky-600">{slot.subject}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{slot.teacher_name}</p>
                              {slot.room_no && <p className="text-[9px] text-slate-400 mt-0.5">Room {slot.room_no}</p>}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">Empty Slot</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Single-Day Grid View */}
          <div className="lg:hidden p-4 space-y-4">
            {days.map(day => (
              <div key={day} className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-1 font-heading">{day}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {periods.map(period => {
                    const slot = getSlotData(day, period);
                    
  // Real-time synchronization listener
  const fetchTimetableRef = useRef(fetchTimetable);
  useEffect(() => {
    fetchTimetableRef.current = fetchTimetable;
  }, [fetchTimetable]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'TIMETABLE') {
        console.log(`Socket update received for TimetableManager.jsx: `, change);
        fetchTimetableRef.current();
      }
    };
    socket.on('data-changed', handleDataChanged);
    return () => {
      socket.off('data-changed', handleDataChanged);
    };
  }, [socket]);

  return (
                      <div
                        key={period}
                        onClick={() => handleSlotClick(day, period)}
                        className="bg-slate-50 hover:bg-sky-50/30 border border-slate-200/50 p-3 rounded-xl cursor-pointer text-xs"
                      >
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{period}</p>
                        {slot ? (
                          <div className="mt-1 leading-tight">
                            <p className="font-bold text-sky-600">{slot.subject}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{slot.teacher_name}</p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-300 italic mt-1">Empty Slot</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* SLOT DETAIL & EDIT MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 font-heading">
                Configure Slot ({editingSlot.day} · {editingSlot.period})
              </h3>
              <button onClick={() => setEditingSlot(null)} className="text-slate-400 hover:text-slate-600 touch-target flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Subject Course *</label>
                    <input
                      type="text"
                      required
                      value={slotForm.subject}
                      onChange={(e) => setSlotForm({ ...slotForm, subject: e.target.value })}
                      placeholder="e.g. Physics, Chemistry"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Teacher Name</label>
                    <input
                      type="text"
                      value={slotForm.teacher}
                      onChange={(e) => setSlotForm({ ...slotForm, teacher: e.target.value })}
                      placeholder="e.g. Mr. Siddiqui"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Classroom No</label>
                    <input
                      type="text"
                      value={slotForm.room_no}
                      onChange={(e) => setSlotForm({ ...slotForm, room_no: e.target.value })}
                      placeholder="e.g. Grade 8-A Room"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div>
                  {editingSlot.id && (
                    <button
                      type="button"
                      onClick={handleDeleteSlot}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors touch-target"
                    >
                      <Trash2 size={14} />
                      <span>Clear Slot</span>
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-full font-semibold text-xs transition-colors touch-target"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-full shadow-lg transition-all duration-150 active:scale-95 touch-target text-xs"
                  >
                    Save Slot
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TimetableManager;

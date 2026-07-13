"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Calendar, Save, Trash2, X } from 'lucide-react';

function TimetableManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [selectedClass, setSelectedClass] = useState("Class 8");
  const [selectedSection, setSelectedSection] = useState("A");
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Editing state
  const [editingSlot, setEditingSlot] = useState(null); // { id: ... } or null
  const [slotForm, setSlotForm] = useState({
    day: "Monday",
    subject: "",
    start_time: "08:30 AM",
    end_time: "09:15 AM",
    teacher: ""
  });

  const classes = ["Playgroup", "Nursery", "Prep", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
  const sections = ["A", "B", "C"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
        body: JSON.stringify({ class: selectedClass, section: selectedSection })
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
  }, [selectedClass, selectedSection]);

  const handleSlotClick = (slot) => {
    setEditingSlot({ id: slot?.id || null });
    setSlotForm({
      day: slot?.day || "Monday",
      subject: slot?.subject || "",
      start_time: slot?.start_time || "08:30 AM",
      end_time: slot?.end_time || "09:15 AM",
      teacher: slot?.teacher || ""
    });
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    try {
      const record = {
        class: selectedClass,
        section: selectedSection,
        day: slotForm.day,
        subject: slotForm.subject,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        teacher: slotForm.teacher
      };
      if (editingSlot?.id) {
        record.id = editingSlot.id;
      }
      const response = await fetch(`${apiBaseUrl}/api/timetable/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ records: [record] })
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
    if (!editingSlot?.id) return;
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
    <div className="space-y-6">
      
      {/* Class & Section Selector Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 font-semibold"
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Section:</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 font-semibold"
            >
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <button
            onClick={() => {
              setEditingSlot({ id: null });
              setSlotForm({
                day: "Monday",
                subject: "",
                start_time: "08:30 AM",
                end_time: "09:15 AM",
                teacher: ""
              });
            }}
            className="ml-auto bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-5 rounded-full text-xs shadow-md transition-all active:scale-95 touch-target"
          >
            + Add Schedule Slot
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {days.map(day => {
            const daySlots = timetable.filter(t => t.day === day);
            return (
              <div key={day} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-[300px]">
                <div className="border-b border-slate-100 pb-2 mb-3 flex items-center justify-between">
                  <h4 className="font-bold text-slate-700 text-sm font-heading">{day}</h4>
                  <button
                    onClick={() => {
                      setEditingSlot({ id: null });
                      setSlotForm({
                        day: day,
                        subject: "",
                        start_time: "08:30 AM",
                        end_time: "09:15 AM",
                        teacher: ""
                      });
                    }}
                    className="text-sky-500 hover:text-sky-600 text-xs font-bold"
                  >
                    + Add
                  </button>
                </div>
                
                <div className="space-y-3 flex-1">
                  {daySlots.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-[10px] text-slate-300 italic py-8">
                      No periods scheduled
                    </div>
                  ) : (
                    daySlots.map(slot => (
                      <div
                        key={slot.id}
                        onClick={() => handleSlotClick(slot)}
                        className="bg-slate-50 border border-slate-100 hover:border-sky-200 hover:bg-sky-50/20 p-3 rounded-xl cursor-pointer transition-all duration-150 text-left"
                      >
                        <h5 className="font-bold text-sky-600 text-xs leading-tight">{slot.subject}</h5>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">{slot.start_time} - {slot.end_time}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{slot.teacher || 'No Teacher'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SLOT DETAIL & EDIT MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 font-heading">
                Configure Slot
              </h3>
              <button onClick={() => setEditingSlot(null)} className="text-slate-400 hover:text-slate-600 touch-target flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Scheduled Day *</label>
                    <select
                      value={slotForm.day}
                      onChange={(e) => setSlotForm({ ...slotForm, day: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                    >
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Subject Course *</label>
                    <input
                      type="text"
                      required
                      value={slotForm.subject}
                      onChange={(e) => setSlotForm({ ...slotForm, subject: e.target.value })}
                      placeholder="e.g. Physics, Chemistry"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Start Time *</label>
                      <input
                        type="text"
                        required
                        value={slotForm.start_time}
                        onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                        placeholder="e.g. 08:30 AM"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">End Time *</label>
                      <input
                        type="text"
                        required
                        value={slotForm.end_time}
                        onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                        placeholder="e.g. 09:15 AM"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
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
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div>
                  {editingSlot?.id && (
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

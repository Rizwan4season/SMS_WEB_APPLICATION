"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Plus, Trash2, Calendar, X } from 'lucide-react';

function ExamManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    exam_name: "",
    term: "Mid Term",
    exam_date: new Date().toISOString().split('T')[0],
    status: "Active"
  });
  const [formError, setFormError] = useState("");

  const fetchExams = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setExams(data.data);
      } else {
        setError(data.message || "Failed to load exams schedules.");
      }
    } catch (err) {
      setError("Network error connecting to API.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.exam_name || !formData.term) {
      setFormError("Please fill all required fields.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/exams/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exam_name: formData.exam_name,
          term: formData.term,
          exam_date: formData.exam_date,
          status: formData.status
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        setIsModalOpen(false);
        fetchExams();
      } else {
        setFormError(data.message || "Failed to add exam.");
      }
    } catch (err) {
      setFormError("Network error saving exam.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this exam? This will erase related student result sheet score cards.")) {
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/exams/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.status === "success") {
        fetchExams();
      } else {
        alert(data.message || "Failed to delete exam.");
      }
    } catch (err) {
      alert("Network error deleting exam.");
      console.error(err);
    }
  };

  
  // Real-time synchronization listener
  const fetchExamsRef = useRef(fetchExams);
  useEffect(() => {
    fetchExamsRef.current = fetchExams;
  }, [fetchExams]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'EXAMS') {
        console.log(`Socket update received for ExamManager.jsx: `, change);
        fetchExamsRef.current();
      }
    };
    socket.on('data-changed', handleDataChanged);
    return () => {
      socket.off('data-changed', handleDataChanged);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium">Mid-term, annual, and monthly test planners</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              exam_name: "",
              term: "Mid Term",
              exam_date: new Date().toISOString().split('T')[0],
              status: "Active"
            });
            setFormError("");
            setIsModalOpen(true);
          }}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Add Exam Term</span>
        </button>
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
          {exams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              No exams or terms scheduled.
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {exams.map((ex) => (
                  <div key={ex.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 font-heading text-base leading-tight">{ex.exam_name}</h4>
                        <p className="text-xs text-slate-500 mt-1">Term: {ex.term}</p>
                      </div>
                      <span className="bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-xl">
                        {ex.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100">
                      <span className="text-slate-400">Date: {ex.exam_date_fmt}</span>
                      <button
                        onClick={() => handleDelete(ex.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors touch-target"
                        title="Delete Exam"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Exam Name</th>
                      <th className="py-4 px-6">Exam Term</th>
                      <th className="py-4 px-6">Scheduled Date</th>
                      <th className="py-4 px-6 font-bold">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {exams.map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-semibold text-slate-900">{ex.exam_name}</td>
                        <td className="py-4 px-6 text-slate-600">{ex.term}</td>
                        <td className="py-4 px-6 text-slate-500">{ex.exam_date_fmt}</td>
                        <td className="py-4 px-6 text-slate-800 font-medium">{ex.status}</td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDelete(ex.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ADD EXAM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 font-heading">Schedule Exam Session</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 touch-target flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
                    {formError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Exam Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.exam_name}
                      onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                      placeholder="e.g. Final Examination 2026"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Exam Term *</label>
                      <select
                        value={formData.term}
                        onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                      >
                        <option value="First Term">First Term</option>
                        <option value="Mid Term">Mid Term</option>
                        <option value="Final Term">Final Term</option>
                        <option value="Monthly Test">Monthly Test</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Status *</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Exam Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.exam_date}
                      onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-full font-semibold text-xs transition-colors touch-target"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-full shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target text-xs"
                >
                  Schedule Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default ExamManager;

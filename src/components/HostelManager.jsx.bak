"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Plus, Trash2, Home, X } from 'lucide-react';

function HostelManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    block_name: "",
    room_no: "",
    capacity: "",
    rent: ""
  });
  const [formError, setFormError] = useState("");

  const fetchHostels = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/hostels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setHostels(data.data);
      } else {
        setError(data.message || "Failed to load hostel blocks.");
      }
    } catch (err) {
      setError("Network error connecting to hostel database.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.block_name || !formData.room_no || !formData.capacity) {
      setFormError("Please fill required fields.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/hostels/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.status === "success") {
        setIsModalOpen(false);
        fetchHostels();
      } else {
        setFormError(data.message || "Failed to add room.");
      }
    } catch (err) {
      setFormError("Network error saving room details.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this room allocation?")) {
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/hostels/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.status === "success") {
        fetchHostels();
      } else {
        alert(data.message || "Failed to delete room.");
      }
    } catch (err) {
      alert("Network error removing room.");
      console.error(err);
    }
  };

  
  // Real-time synchronization listener
  const fetchHostelsRef = useRef(fetchHostels);
  useEffect(() => {
    fetchHostelsRef.current = fetchHostels;
  }, [fetchHostels]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'HOSTELS') {
        console.log(`Socket update received for HostelManager.jsx: `, change);
        fetchHostelsRef.current();
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
          <p className="text-sm text-slate-500 font-medium">Manage hostel blocks, room vacancy, and monthly rent charges</p>
        </div>
        <button
          onClick={() => {
            setFormData({ block_name: "", room_no: "", capacity: "", rent: "" });
            setFormError("");
            setIsModalOpen(true);
          }}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Add Hostel Room</span>
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
          {hostels.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              No hostel rooms allocated.
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {hostels.map((h) => (
                  <div key={h.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 font-heading text-base leading-tight">Block: {h.block_name}</h4>
                        <p className="text-xs text-slate-500 mt-1">Room Number: {h.room_no}</p>
                      </div>
                      <span className="bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-xl">
                        ₨ {parseFloat(h.rent || 0).toLocaleString()} / mo
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100">
                      <span className="text-slate-500 font-semibold">Capacity: {h.capacity} Students max</span>
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors touch-target"
                        title="Delete Room"
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
                      <th className="py-4 px-6">Block Identifier</th>
                      <th className="py-4 px-6">Room Number</th>
                      <th className="py-4 px-6">Capacity Limits</th>
                      <th className="py-4 px-6">Monthly Rent</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {hostels.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-semibold text-slate-900">{h.block_name}</td>
                        <td className="py-4 px-6 text-slate-600 font-bold">{h.room_no}</td>
                        <td className="py-4 px-6 text-slate-700">{h.capacity} beds</td>
                        <td className="py-4 px-6 text-sky-600 font-bold">₨ {parseFloat(h.rent || 0).toLocaleString()}</td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDelete(h.id)}
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

      {/* ADD ROOM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 font-heading">Add Hostel Room</h3>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Block Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.block_name}
                      onChange={(e) => setFormData({ ...formData, block_name: e.target.value })}
                      placeholder="e.g. A-Block, Girls Hostel"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Room Number *</label>
                      <input
                        type="text"
                        required
                        value={formData.room_no}
                        onChange={(e) => setFormData({ ...formData, room_no: e.target.value })}
                        placeholder="e.g. 104-B"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Beds *</label>
                      <input
                        type="number"
                        required
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        placeholder="4"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Monthly Rent (₨) *</label>
                    <input
                      type="number"
                      required
                      value={formData.rent}
                      onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                      placeholder="e.g. 5000"
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
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default HostelManager;

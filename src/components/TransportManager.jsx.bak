"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Plus, Trash2, Truck, X } from 'lucide-react';

function TransportManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    route_name: "",
    bus_no: "",
    driver_name: "",
    driver_phone: "",
    fare: ""
  });
  const [formError, setFormError] = useState("");

  const fetchRoutes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setRoutes(data.data);
      } else {
        setError(data.message || "Failed to load routes registry.");
      }
    } catch (err) {
      setError("Network error connecting to transport database.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.route_name || !formData.fare) {
      setFormError("Please fill required fields.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/routes/add`, {
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
        fetchRoutes();
      } else {
        setFormError(data.message || "Failed to add transport route.");
      }
    } catch (err) {
      setFormError("Network error saving route details.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transport route?")) {
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/routes/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.status === "success") {
        fetchRoutes();
      } else {
        alert(data.message || "Failed to delete route.");
      }
    } catch (err) {
      alert("Network error removing route.");
      console.error(err);
    }
  };

  
  // Real-time synchronization listener
  const fetchRoutesRef = useRef(fetchRoutes);
  useEffect(() => {
    fetchRoutesRef.current = fetchRoutes;
  }, [fetchRoutes]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'ROUTES') {
        console.log(`Socket update received for TransportManager.jsx: `, change);
        fetchRoutesRef.current();
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
          <p className="text-sm text-slate-500 font-medium">Manage transport routes, drivers, and monthly fares</p>
        </div>
        <button
          onClick={() => {
            setFormData({ route_name: "", bus_no: "", driver_name: "", driver_phone: "", fare: "" });
            setFormError("");
            setIsModalOpen(true);
          }}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Add Transport Route</span>
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
          {routes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              No transport routes registered.
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {routes.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 font-heading text-base leading-tight">{r.route_name}</h4>
                        <p className="text-xs text-slate-500 mt-1">Bus Number: {r.bus_no || '-'}</p>
                      </div>
                      <span className="bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-xl">
                        ₨ {parseFloat(r.fare).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100">
                      <div className="leading-tight">
                        <span className="text-slate-400">Driver: {r.driver_name || '-'}</span>
                        <p className="text-slate-500 font-medium mt-0.5">{r.driver_phone || '-'}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors touch-target"
                        title="Delete Route"
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
                      <th className="py-4 px-6">Route Location</th>
                      <th className="py-4 px-6">Bus Number</th>
                      <th className="py-4 px-6">Driver Name</th>
                      <th className="py-4 px-6">Driver Phone</th>
                      <th className="py-4 px-6">Monthly Fare</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {routes.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-semibold text-slate-900">{r.route_name}</td>
                        <td className="py-4 px-6 text-slate-600">{r.bus_no || '-'}</td>
                        <td className="py-4 px-6 text-slate-700">{r.driver_name || '-'}</td>
                        <td className="py-4 px-6 text-slate-500">{r.driver_phone || '-'}</td>
                        <td className="py-4 px-6 text-sky-600 font-bold">₨ {parseFloat(r.fare).toLocaleString()}</td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDelete(r.id)}
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

      {/* ADD ROUTE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 font-heading">Add Transport Route</h3>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Route Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.route_name}
                      onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                      placeholder="e.g. North Karachi to Campus"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Bus / Vehicle No</label>
                      <input
                        type="text"
                        value={formData.bus_no}
                        onChange={(e) => setFormData({ ...formData, bus_no: e.target.value })}
                        placeholder="e.g. BSA-9821"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Monthly Fare (₨) *</label>
                      <input
                        type="number"
                        required
                        value={formData.fare}
                        onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                        placeholder="e.g. 1500"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Driver Name</label>
                      <input
                        type="text"
                        value={formData.driver_name}
                        onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                        placeholder="e.g. Gul Khan"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Driver Contact Phone</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={formData.driver_phone}
                        onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                        placeholder="e.g. 03451234567"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
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
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TransportManager;

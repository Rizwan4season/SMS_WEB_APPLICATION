"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Plus, Edit, Trash2, Phone, Award, ShieldAlert, X } from 'lucide-react';

function StaffManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Toggle between Teachers and Employees
  const [filterDesignation, setFilterDesignation] = useState("Teachers");

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    father_name: "",
    designation: "Teacher",
    phone: "",
    cnic: "",
    joining_date: new Date().toISOString().split('T')[0],
    salary: "",
    status: "Active"
  });
  const [formError, setFormError] = useState("");

  const fetchStaff = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setStaff(data.data);
      } else {
        setError(data.message || "Failed to load staff list.");
      }
    } catch (err) {
      setError("Network error connecting to API.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Filter staff by designation
  const filteredStaff = staff.filter(s => {
    const isTeacher = s.designation.toLowerCase().includes("teacher");
    return filterDesignation === "Teachers" ? isTeacher : !isTeacher;
  });

  // Open Modal
  const openModal = (st = null) => {
    setFormError("");
    if (st) {
      setEditingStaff(st);
      setFormData({
        name: st.name || "",
        father_name: st.father_name || "",
        designation: st.designation || "Teacher",
        phone: st.phone ? st.phone.replace(/\D/g, '') : "",
        cnic: st.cnic || "",
        joining_date: st.joining_date_fmt || new Date().toISOString().split('T')[0],
        salary: st.salary || "",
        status: st.status || "Active"
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: "",
        father_name: "",
        designation: filterDesignation === "Teachers" ? "Teacher" : "Driver",
        phone: "",
        cnic: "",
        joining_date: new Date().toISOString().split('T')[0],
        salary: "",
        status: "Active"
      });
    }
    setIsModalOpen(true);
  };

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  // Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!/^[0-9]{10,12}$/.test(formData.phone)) {
      setFormError("Enter a valid 10 to 12 digit phone number.");
      return;
    }
    if (formData.cnic && !/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic)) {
      setFormError("CNIC format must be XXXXX-XXXXXXX-X.");
      return;
    }

    const payload = { ...formData };
    if (editingStaff) payload.id = editingStaff.id;

    const endpoint = editingStaff ? "/api/staff/update" : "/api/staff/add";

    try {
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.status === "success") {
        closeModal();
        fetchStaff();
      } else {
        setFormError(data.message || "Failed to save staff record.");
      }
    } catch (err) {
      setFormError("Network error saving staff data.");
      console.error(err);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff record? This will purge payroll logs.")) {
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/staff/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.status === "success") {
        fetchStaff();
      } else {
        alert(data.message || "Failed to delete staff.");
      }
    } catch (err) {
      alert("Network error deleting staff.");
      console.error(err);
    }
  };

  
  // Real-time synchronization listener
  const fetchStaffRef = useRef(fetchStaff);
  useEffect(() => {
    fetchStaffRef.current = fetchStaff;
  }, [fetchStaff]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'STAFF') {
        console.log(`Socket update received for StaffManager.jsx: `, change);
        fetchStaffRef.current();
      }
    };
    socket.on('data-changed', handleDataChanged);
    return () => {
      socket.off('data-changed', handleDataChanged);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      
      {/* Category Toggle Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex bg-slate-200 p-1.5 rounded-xl self-start">
          <button
            onClick={() => setFilterDesignation("Teachers")}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-target ${
              filterDesignation === "Teachers" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Faculty Teachers
          </button>
          <button
            onClick={() => setFilterDesignation("Employees")}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all touch-target ${
              filterDesignation === "Employees" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Non-Academic Employees
          </button>
        </div>

        <button
          onClick={() => openModal(null)}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Add Staff Member</span>
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
          {filteredStaff.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              No staff members registered.
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredStaff.map((st) => (
                  <div key={st.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 font-heading text-base leading-tight">{st.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">Designation: {st.designation}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        st.status === "Active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {st.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Monthly Salary</span>
                        <p className="font-bold text-slate-700 mt-0.5">₨ {parseFloat(st.salary || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Phone</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{st.phone || '-'}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">{st.cnic || 'No CNIC Registered'}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(st)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl touch-target flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(st.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl touch-target flex items-center justify-center transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Father Name</th>
                      <th className="py-4 px-6">Designation</th>
                      <th className="py-4 px-6">Phone</th>
                      <th className="py-4 px-6">CNIC</th>
                      <th className="py-4 px-6">Salary</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredStaff.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-semibold text-slate-900">{st.name}</td>
                        <td className="py-4 px-6 text-slate-600">{st.father_name}</td>
                        <td className="py-4 px-6 text-slate-600 font-semibold text-sky-600">{st.designation}</td>
                        <td className="py-4 px-6 text-slate-500">{st.phone || '-'}</td>
                        <td className="py-4 px-6 text-slate-500">{st.cnic || '-'}</td>
                        <td className="py-4 px-6 text-slate-800 font-bold">₨ {parseFloat(st.salary || 0).toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            st.status === "Active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}>
                            {st.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openModal(st)}
                              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(st.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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

      {/* STAFF DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 font-heading">
                {editingStaff ? "Edit Staff Details" : "Register New Staff Member"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 touch-target flex items-center justify-center">
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sajid Ahmed"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Father's Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.father_name}
                      onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                      placeholder="e.g. Ahmed Ali"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Designation *</label>
                      <input
                        type="text"
                        required
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="e.g. Teacher, Driver, Clerk"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Salary Rate (₨) *</label>
                      <input
                        type="number"
                        required
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        placeholder="e.g. 35000"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number *</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. 03219876543"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">CNIC Card Number</label>
                      <input
                        type="text"
                        value={formData.cnic}
                        onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                        placeholder="e.g. 42101-1234567-1"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Joining Date</label>
                      <input
                        type="date"
                        value={formData.joining_date}
                        onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-full font-semibold text-xs transition-colors touch-target"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-full shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target text-xs"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default StaffManager;

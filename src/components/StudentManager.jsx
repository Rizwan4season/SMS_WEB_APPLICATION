"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { 
  Plus, Edit, Trash2, Search, SlidersHorizontal, 
  X, UserPlus, Phone, MapPin, Hash, ShieldCheck, CheckCircle
} from 'lucide-react';

function StudentManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Filters & Search
  const [search, setSearch] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [section, setSection] = useState("");
  const [status, setStatus] = useState("Active");
  const [showFilters, setShowFilters] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  // Form States
  const [formData, setFormData] = useState({
    admission_no: "",
    gr_no: "",
    roll_no: "",
    name: "",
    father_name: "",
    dob: "",
    class: "Class 8",
    section: "A",
    gender: "Male",
    phone: "",
    admission_date: new Date().toISOString().split('T')[0],
    address: "",
    status: "Active"
  });

  const [formError, setFormError] = useState("");

  // Fetch Students
  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          search,
          class: studentClass,
          section,
          status
        })
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setStudents(data.data);
      } else {
        setError(data.message || "Failed to load students directory.");
      }
    } catch (err) {
      setError("Network error connecting to API. Verify backend server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, studentClass, section, status]);

  // Open Form Modal
  const openModal = (student = null) => {
    setFormError("");
    if (student) {
      setEditingStudent(student);
      setFormData({
        admission_no: student.admission_no || "",
        gr_no: student.gr_no || "",
        roll_no: student.roll_no || "",
        name: student.name || "",
        father_name: student.father_name || "",
        dob: student.dob_fmt || "",
        class: student.class || "Class 8",
        section: student.section || "A",
        gender: student.gender || "Male",
        phone: student.phone ? student.phone.replace(/\D/g, '') : "",
        admission_date: student.adm_date_fmt || new Date().toISOString().split('T')[0],
        address: student.address || "",
        status: student.status || "Active"
      });
    } else {
      setEditingStudent(null);
      setFormData({
        admission_no: "",
        gr_no: "",
        roll_no: "",
        name: "",
        father_name: "",
        dob: "",
        class: "Class 8",
        section: "A",
        gender: "Male",
        phone: "",
        admission_date: new Date().toISOString().split('T')[0],
        address: "",
        status: "Active"
      });
    }
    setIsModalOpen(true);
  };

  // Close Form Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  // Form Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    
    // Validate Phone Length
    if (!/^[0-9]{10,12}$/.test(formData.phone)) {
      setFormError("Enter a valid 10 to 12 digit phone number (numbers only).");
      return;
    }

    const payload = { ...formData };
    if (editingStudent) {
      payload.id = editingStudent.id;
    }

    const endpoint = editingStudent ? "/api/students/update" : "/api/students/add";

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
        fetchStudents();
      } else {
        setFormError(data.message || "An error occurred while saving the record.");
      }
    } catch (err) {
      setFormError("Network failure trying to save student data.");
      console.error(err);
    }
  };

  // Delete Record Handler
  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student record? This will purge attendance and payroll limits.")) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/students/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.status === "success") {
        fetchStudents();
      } else {
        alert(data.message || "Failed to delete student record.");
      }
    } catch (err) {
      alert("Network failure trying to delete student record.");
      console.error(err);
    }
  };

  // Clear Filters
  const handleResetFilters = () => {
    setSearch("");
    setStudentClass("");
    setSection("");
    setStatus("Active");
  };

  const classes = ["Playgroup", "Nursery", "Prep", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
  const sections = ["A", "B", "C"];

  
  // Real-time synchronization listener
  const fetchStudentsRef = useRef(fetchStudents);
  useEffect(() => {
    fetchStudentsRef.current = fetchStudents;
  }, [fetchStudents]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'STUDENTS') {
        console.log(`Socket update received for StudentManager.jsx: `, change);
        fetchStudentsRef.current();
      }
    };
    socket.on('data-changed', handleDataChanged);
    return () => {
      socket.off('data-changed', handleDataChanged);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium">Registered student profiles directory</p>
        </div>
        <button
          onClick={() => openModal(null)}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, adm no, or GR no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-sky-500 transition-all text-sm"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="border border-slate-200 hover:bg-slate-50 rounded-xl px-4 py-3 text-slate-600 font-medium flex items-center justify-center gap-2 text-sm touch-target"
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
          </button>
        </div>

        {/* Collapsible Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Class</label>
              <select
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="w-full bg-slate-50 text-slate-700 rounded-xl px-3.5 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full bg-slate-50 text-slate-700 rounded-xl px-3.5 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="">All Sections</option>
                {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 text-slate-700 rounded-xl px-3.5 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="Active">Active Only</option>
                <option value="Left">Left Only</option>
                <option value="">All Statuses</option>
              </select>
            </div>
            
            <div className="sm:col-span-3 flex justify-end pt-2">
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-400 hover:text-slate-700 font-semibold uppercase tracking-wider touch-target px-4"
              >
                Reset Filter Choices
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Errors & Loading indicators */}
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
          {students.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              No student records matched your filters.
            </div>
          ) : (
            <>
              {/* MOBILE LAYOUT: CARD LIST (Renders on screens smaller than md) */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {students.map((student) => (
                  <div 
                    key={student.id} 
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] bg-sky-50 text-sky-600 font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                          {student.admission_no}
                        </span>
                        <h4 className="font-bold text-slate-800 mt-2 font-heading text-base leading-tight">
                          {student.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">s/o {student.father_name}</p>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        student.status === "Active" 
                          ? "bg-green-50 text-green-700" 
                          : "bg-red-50 text-red-700"
                      }`}>
                        {student.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-xs">
                      <div>
                        <p className="text-slate-400 font-medium">G.R. No</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{student.gr_no}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Roll No</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{student.roll_no || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Class/Sec</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{student.class}-{student.section}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone size={14} />
                        <span>{student.phone || '-'}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(student)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl touch-target flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
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

              {/* DESKTOP LAYOUT: TABULAR VIEW (Renders on screens md and larger) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Adm. No</th>
                      <th className="py-4 px-6">G.R. No</th>
                      <th className="py-4 px-6">Roll</th>
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Father's Name</th>
                      <th className="py-4 px-6">Class/Sec</th>
                      <th className="py-4 px-6">Phone</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-6 font-semibold text-slate-900">{student.admission_no}</td>
                        <td className="py-3.5 px-6 text-slate-600">{student.gr_no}</td>
                        <td className="py-3.5 px-6 text-slate-600">{student.roll_no || '-'}</td>
                        <td className="py-3.5 px-6 font-semibold text-slate-800">{student.name}</td>
                        <td className="py-3.5 px-6 text-slate-500">{student.father_name}</td>
                        <td className="py-3.5 px-6 text-slate-700">{student.class} - {student.section}</td>
                        <td className="py-3.5 px-6 text-slate-500">{student.phone || '-'}</td>
                        <td className="py-3.5 px-6">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            student.status === "Active" 
                              ? "bg-green-50 text-green-700" 
                              : "bg-red-50 text-red-700"
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openModal(student)}
                              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
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

      {/* ADMISSION / EDIT STUDENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 font-heading">
                {editingStudent ? "Edit Student Information" : "New Student Admission Registration"}
              </h3>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 touch-target flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
                    {formError}
                  </div>
                )}

                {/* Form Inputs Grid: 1 col on mobile, 2/3 cols on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Admission No *</label>
                    <input
                      type="text"
                      required
                      value={formData.admission_no}
                      onChange={(e) => setFormData({ ...formData, admission_no: e.target.value })}
                      placeholder="e.g. BCS-2026-001"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">G.R. No *</label>
                    <input
                      type="text"
                      required
                      value={formData.gr_no}
                      onChange={(e) => setFormData({ ...formData, gr_no: e.target.value })}
                      placeholder="e.g. GR-1024"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Roll No</label>
                    <input
                      type="text"
                      value={formData.roll_no}
                      onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                      placeholder="e.g. 12"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Muhammad Ali"
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
                      placeholder="e.g. Asif Ali"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Class *</label>
                      <select
                        value={formData.class}
                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                      >
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Section *</label>
                      <select
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                      >
                        {sections.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    {/* OPTIMIZED FOR MOBILE NUMERIC KEYPAD */}
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 03001234567"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Admission Date</label>
                    <input
                      type="date"
                      value={formData.admission_date}
                      onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Residential Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street Address, Area, City"
                      rows="2"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Left">Left / Struck Off</option>
                    </select>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-3 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-full font-semibold text-sm transition-colors touch-target"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-full shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target"
                >
                  Save Student Details
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default StudentManager;

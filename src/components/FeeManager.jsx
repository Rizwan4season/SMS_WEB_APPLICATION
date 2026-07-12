"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Plus, Search, Receipt, Printer, X } from 'lucide-react';

function FeeManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [search, setSearch] = useState("");

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    student_id: "",
    amount: "",
    payment_date: new Date().toISOString().split('T')[0],
    fee_type: "Monthly Tuition Fee",
    month_for: "July 2026",
    remarks: ""
  });
  const [formError, setFormError] = useState("");

  // Print States
  const [activeReceipt, setActiveReceipt] = useState(null);

  const fetchFees = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/fees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ search })
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setFees(data.data);
      } else {
        setError(data.message || "Failed to load fee payments logs.");
      }
    } catch (err) {
      setError("Network error loading fee logs.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [search]);

  // Load students for collection
  const openCollectionModal = async () => {
    setFormError("");
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
        setStudents(data.data);
        setFormData({
          student_id: "",
          amount: "",
          payment_date: new Date().toISOString().split('T')[0],
          fee_type: "Monthly Tuition Fee",
          month_for: "July 2026",
          remarks: ""
        });
        setIsModalOpen(true);
      } else {
        alert("Failed to load active student list.");
      }
    } catch (err) {
      alert("Network error fetching students.");
      console.error(err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.student_id) {
      setFormError("Please choose a student.");
      return;
    }
    if (parseFloat(formData.amount) <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/fees/collect`, {
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
        fetchFees();
      } else {
        setFormError(data.message || "Failed to collect fee.");
      }
    } catch (err) {
      setFormError("Network error collecting fee.");
      console.error(err);
    }
  };

  // Trigger Print Receipt
  const handlePrint = (fee) => {
    setActiveReceipt(fee);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  
  // Real-time synchronization listener
  const fetchFeesRef = useRef(fetchFees);
  useEffect(() => {
    fetchFeesRef.current = fetchFees;
  }, [fetchFees]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'FEES' || change.type === 'ACCOUNTS') {
        console.log(`Socket update received for FeeManager.jsx: `, change);
        fetchFeesRef.current();
      }
    };
    socket.on('data-changed', handleDataChanged);
    return () => {
      socket.off('data-changed', handleDataChanged);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium">Track student tuition receipts and pending collections</p>
        </div>
        <button
          onClick={openCollectionModal}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target w-full sm:w-auto"
        >
          <Receipt size={18} />
          <span>Collect Fee Payment</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by student name or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          {fees.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              No payment records found.
            </div>
          ) : (
            <>
              {/* Mobile Card List */}
              <div className="grid grid-cols-1 gap-4 md:hidden print:hidden">
                {fees.map((f) => (
                  <div key={f.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">{f.payment_date_fmt}</span>
                        <h4 className="font-bold text-slate-800 font-heading text-sm mt-1">{f.student_name}</h4>
                        <p className="text-xs text-slate-500">Class {f.class}-{f.section} · Adm No: {f.admission_no}</p>
                      </div>
                      <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-xl">
                        ₨ {parseFloat(f.amount).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 font-medium">{f.fee_type}</span>
                        <p className="font-semibold text-slate-700">{f.month_for}</p>
                      </div>
                      <button
                        onClick={() => handlePrint(f)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold p-2.5 rounded-xl flex items-center justify-center transition-colors touch-target"
                        title="Print Voucher"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Collection Date</th>
                      <th className="py-4 px-6">Admission No</th>
                      <th className="py-4 px-6">Student Name</th>
                      <th className="py-4 px-6">Class/Sec</th>
                      <th className="py-4 px-6">Fee Category</th>
                      <th className="py-4 px-6">Billing Month</th>
                      <th className="py-4 px-6 font-bold">Amount</th>
                      <th className="py-4 px-6">Received By</th>
                      <th className="py-4 px-6 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {fees.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 text-slate-600">{f.payment_date_fmt}</td>
                        <td className="py-4 px-6 font-semibold text-slate-900">{f.admission_no}</td>
                        <td className="py-4 px-6 font-semibold text-slate-800">{f.student_name}</td>
                        <td className="py-4 px-6 text-slate-600">{f.class} - {f.section}</td>
                        <td className="py-4 px-6 text-slate-500 font-medium">{f.fee_type}</td>
                        <td className="py-4 px-6 text-slate-700 font-bold">{f.month_for}</td>
                        <td className="py-4 px-6 font-bold text-green-600">₨ {parseFloat(f.amount).toLocaleString()}</td>
                        <td className="py-4 px-6 text-slate-500">{f.received_by}</td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handlePrint(f)}
                            className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <Printer size={16} />
                            <span className="text-xs">Print</span>
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

      {/* COLLECT FEE DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 font-heading">Collect Fee Payment</h3>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Choose Student *</label>
                    <select
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                    >
                      <option value="">-- Choose Student --</option>
                      {students.map(st => (
                        <option key={st.id} value={st.id}>{st.name} s/o {st.father_name} ({st.class}-{st.section})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Fee Category *</label>
                    <select
                      value={formData.fee_type}
                      onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                    >
                      <option value="Monthly Tuition Fee">Monthly Tuition Fee</option>
                      <option value="Admission Fee">Admission Fee</option>
                      <option value="Exam Fee">Exam Fee</option>
                      <option value="Bus Fee">Bus Fee</option>
                      <option value="Hostel Fee">Hostel Fee</option>
                      <option value="Uniform Fee">Uniform Fee</option>
                      <option value="Books Fee">Books Fee</option>
                      <option value="Miscellaneous Fee">Miscellaneous Fee</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Billing Month *</label>
                      <input
                        type="text"
                        value={formData.month_for}
                        onChange={(e) => setFormData({ ...formData, month_for: e.target.value })}
                        placeholder="e.g. July 2026"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount Paid (₨) *</label>
                      <input
                        type="number"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="e.g. 2500"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Collection Date</label>
                      <input
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Remarks / Remarks</label>
                      <input
                        type="text"
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        placeholder="Optional remarks"
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
                  Collect Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT TEMPLATE (Hidden from normal UI, visible only inside standard browser print styling) */}
      {activeReceipt && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-6 font-mono text-sm z-50">
          <div className="max-w-md mx-auto border-2 border-dashed border-slate-900 p-5 space-y-4">
            <div className="text-center pb-3 border-b border-dashed border-slate-900">
              <h1 className="text-lg font-bold">Bright Career School</h1>
              <p className="text-xs">Sector 11-G, New Karachi, Karachi</p>
              <p className="text-xs">Phone: +92 21 38927891</p>
              <h2 className="text-sm font-bold uppercase border-y border-dashed border-slate-900 py-1 mt-2">FEE PAYMENT RECEIPT</h2>
            </div>
            
            <table className="w-full text-xs leading-relaxed">
              <tbody>
                <tr><td><strong>Voucher ID:</strong></td><td className="text-right">{activeReceipt.id}</td></tr>
                <tr><td><strong>Date:</strong></td><td className="text-right">{activeReceipt.payment_date_fmt}</td></tr>
                <tr><td><strong>Adm No:</strong></td><td className="text-right">{activeReceipt.admission_no}</td></tr>
                <tr><td><strong>Student:</strong></td><td className="text-right">{activeReceipt.student_name}</td></tr>
                <tr><td><strong>Class:</strong></td><td className="text-right">{activeReceipt.class} - {activeReceipt.section}</td></tr>
                <tr><td><strong>Category:</strong></td><td className="text-right">{activeReceipt.fee_type}</td></tr>
                <tr><td><strong>Month:</strong></td><td className="text-right">{activeReceipt.month_for}</td></tr>
                <tr className="border-t border-dashed border-slate-900 font-bold"><td className="pt-2">TOTAL PAID:</td><td className="text-right pt-2">₨ {parseFloat(activeReceipt.amount).toLocaleString()}</td></tr>
              </tbody>
            </table>
            
            <div className="text-xs border-t border-dashed border-slate-900 pt-3">
              <p><strong>Remarks:</strong> {activeReceipt.remarks || "-"}</p>
              <p className="mt-1"><strong>Collected By:</strong> {activeReceipt.received_by}</p>
            </div>
            
            <div className="flex justify-between pt-6 text-[10px]">
              <span>_________________<br />Operator Sig</span>
              <span>_________________<br />Cashier stamp</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default FeeManager;

"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Plus, Coins, Calendar, X, RefreshCw } from 'lucide-react';

function PayrollManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState([]);
  const [formData, setFormData] = useState({
    staff_id: "",
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    month_for: "July 2026",
    allowance: 0,
    deduction: 0,
    net_salary: 0,
    remarks: ""
  });
  const [formError, setFormError] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/payroll?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setHistory(data.data);
      } else {
        setError(data.message || "Failed to load payroll history.");
      }
    } catch (err) {
      setError("Network error loading payroll ledger.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Fetch active staff lists for disbursal
  const openDisburseModal = async () => {
    setFormError("");
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
        const active = data.data.filter(s => s.status === "Active");
        setActiveStaff(active);
        
        // Reset form
        setFormData({
          staff_id: "",
          amount: 0,
          payment_date: new Date().toISOString().split('T')[0],
          month_for: "July 2026",
          allowance: 0,
          deduction: 0,
          net_salary: 0,
          remarks: ""
        });
        setIsModalOpen(true);
      } else {
        alert("Failed to load active employees.");
      }
    } catch (err) {
      alert("Network error fetching employees.");
      console.error(err);
    }
  };

  // Recalculate net salary when amount, allowance or deduction changes
  const handleRecalculateNet = (updatedFields) => {
    const newForm = { ...formData, ...updatedFields };
    const basic = parseFloat(newForm.amount) || 0;
    const allowance = parseFloat(newForm.allowance) || 0;
    const deduction = parseFloat(newForm.deduction) || 0;
    newForm.net_salary = Math.max(0, basic + allowance - deduction);
    setFormData(newForm);
  };

  const handleStaffChange = (staffId) => {
    const selected = activeStaff.find(s => String(s.id) === String(staffId));
    if (selected) {
      handleRecalculateNet({
        staff_id: staffId,
        amount: parseFloat(selected.salary) || 0
      });
    } else {
      handleRecalculateNet({
        staff_id: "",
        amount: 0
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.staff_id) {
      setFormError("Please choose an employee.");
      return;
    }
    if (formData.net_salary <= 0) {
      setFormError("Net salary must be greater than zero.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/payroll/pay`, {
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
        fetchHistory();
      } else {
        setFormError(data.message || "Failed to disburse salary.");
      }
    } catch (err) {
      setFormError("Network error sending payroll request.");
      console.error(err);
    }
  };

  
  // Real-time synchronization listener
  const fetchHistoryRef = useRef(fetchHistory);
  useEffect(() => {
    fetchHistoryRef.current = fetchHistory;
  }, [fetchHistory]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'PAYROLL' || change.type === 'ACCOUNTS' || change.type === 'STAFF') {
        console.log(`Socket update received for PayrollManager.jsx: `, change);
        fetchHistoryRef.current();
      }
    };
    socket.on('data-changed', handleDataChanged);
    return () => {
      socket.off('data-changed', handleDataChanged);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium">Monthly staff salary payslips and records</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchHistory}
            disabled={loading}
            className="text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full p-3 touch-target flex items-center justify-center disabled:opacity-50 transition-colors"
            title="Reload Payroll Ledger"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openDisburseModal}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target flex-1 sm:flex-none"
          >
            <Coins size={18} />
            <span>Disburse Salary</span>
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
        <>
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              No payroll disburse logs found.
            </div>
          ) : (
            <>
              {/* Mobile Card List View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {history.map((p) => (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">{p.payment_date_fmt}</span>
                        <h4 className="font-bold text-slate-800 font-heading text-sm mt-1">{p.staff_name}</h4>
                        <p className="text-[10px] text-sky-500 font-bold mt-0.5">{p.month_for}</p>
                      </div>
                      <span className="bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-xl">
                        ₨ {parseFloat(p.net_salary).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-100 text-center text-[10px] text-slate-500">
                      <div>
                        <span>Basic</span>
                        <p className="font-semibold text-slate-700 mt-0.5">₨ {parseFloat(p.amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <span>Allowance</span>
                        <p className="font-semibold text-slate-700 mt-0.5">₨ {parseFloat(p.allowance).toLocaleString()}</p>
                      </div>
                      <div>
                        <span>Deduction</span>
                        <p className="font-semibold text-slate-700 mt-0.5">₨ {parseFloat(p.deduction).toLocaleString()}</p>
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
                      <th className="py-4 px-6">Payment Date</th>
                      <th className="py-4 px-6">Staff Name</th>
                      <th className="py-4 px-6">Salary Month</th>
                      <th className="py-4 px-6">Basic</th>
                      <th className="py-4 px-6">Allowances</th>
                      <th className="py-4 px-6">Deductions</th>
                      <th className="py-4 px-6 font-bold">Net Disbursed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {history.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 text-slate-600">{p.payment_date_fmt}</td>
                        <td className="py-4 px-6 font-semibold text-slate-900">{p.staff_name}</td>
                        <td className="py-4 px-6 text-slate-700">{p.month_for}</td>
                        <td className="py-4 px-6 text-slate-600">₨ {parseFloat(p.amount).toLocaleString()}</td>
                        <td className="py-4 px-6 text-slate-600">₨ {parseFloat(p.allowance).toLocaleString()}</td>
                        <td className="py-4 px-6 text-slate-600">₨ {parseFloat(p.deduction).toLocaleString()}</td>
                        <td className="py-4 px-6 font-bold text-sky-600">₨ {parseFloat(p.net_salary).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* DISBURSE SALARY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 font-heading">Disburse Staff Salary</h3>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Choose Staff Employee *</label>
                    <select
                      value={formData.staff_id}
                      onChange={(e) => handleStaffChange(e.target.value)}
                      className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                    >
                      <option value="">-- Choose Employee --</option>
                      {activeStaff.map(st => (
                        <option key={st.id} value={st.id}>{st.name} ({st.designation})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Basic Salary (₨)</label>
                      <input
                        type="number"
                        readOnly
                        value={formData.amount}
                        className="w-full bg-slate-100 text-slate-500 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Payslip Month *</label>
                      <input
                        type="text"
                        value={formData.month_for}
                        onChange={(e) => handleRecalculateNet({ month_for: e.target.value })}
                        placeholder="e.g. July 2026"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Allowances (₨)</label>
                      <input
                        type="number"
                        value={formData.allowance}
                        onChange={(e) => handleRecalculateNet({ allowance: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Deductions (₨)</label>
                      <input
                        type="number"
                        value={formData.deduction}
                        onChange={(e) => handleRecalculateNet({ deduction: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Disbursal Date</label>
                      <input
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => handleRecalculateNet({ payment_date: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Net Salary (₨)</label>
                      <input
                        type="number"
                        readOnly
                        value={formData.net_salary}
                        className="w-full bg-sky-50 text-sky-700 font-bold rounded-xl px-4 py-3 border border-sky-100 text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Remarks / Details</label>
                    <input
                      type="text"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Salary voucher details"
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
                  Disburse Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default PayrollManager;

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Plus, Search, FileText, ArrowUpRight, ArrowDownRight, Trash2, X } from 'lucide-react';

function LedgerManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "Cash In",
    amount: "",
    transaction_date: new Date().toISOString().split('T')[0],
    details: ""
  });
  const [formError, setFormError] = useState("");

  const fetchLedger = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setLedger(data.data);
      } else {
        setError(data.message || "Failed to load accounts ledger.");
      }
    } catch (err) {
      setError("Network error loading accounts registry.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  // Compute Balances
  const totalCashIn = ledger.filter(l => l.type === "Cash In").reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const totalCashOut = ledger.filter(l => l.type === "Cash Out").reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const currentBalance = totalCashIn - totalCashOut;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (parseFloat(formData.amount) <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/accounts/add`, {
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
        fetchLedger();
      } else {
        setFormError(data.message || "Failed to save ledger record.");
      }
    } catch (err) {
      setFormError("Network error saving transaction.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ledger transaction?")) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/accounts/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.status === "success") {
        fetchLedger();
      } else {
        alert(data.message || "Failed to delete transaction.");
      }
    } catch (err) {
      alert("Network error deleting transaction.");
      console.error(err);
    }
  };

  
  // Real-time synchronization listener
  const fetchLedgerRef = useRef(fetchLedger);
  useEffect(() => {
    fetchLedgerRef.current = fetchLedger;
  }, [fetchLedger]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'ACCOUNTS') {
        console.log(`Socket update received for LedgerManager.jsx: `, change);
        fetchLedgerRef.current();
      }
    };
    socket.on('data-changed', handleDataChanged);
    return () => {
      socket.off('data-changed', handleDataChanged);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      
      {/* Top Ledger Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Income (Cash In)</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">₨ {totalCashIn.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <ArrowDownRight size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Expense (Cash Out)</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1">₨ {totalCashOut.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Net Cash Balance</p>
            <h3 className={`text-xl font-bold mt-1 ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₨ {currentBalance.toLocaleString()}
            </h3>
          </div>
        </div>

      </div>

      {/* Actions and listings */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium">Income/Expense General Ledger Registry</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              type: "Cash In",
              amount: "",
              transaction_date: new Date().toISOString().split('T')[0],
              details: ""
            });
            setFormError("");
            setIsModalOpen(true);
          }}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Add Transaction Voucher</span>
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
          {ledger.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              No transactions recorded in general ledger.
            </div>
          ) : (
            <>
              {/* Mobile Card List View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {ledger.map((l) => (
                  <div key={l.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">{l.transaction_date_fmt}</span>
                        <h4 className="font-semibold text-slate-800 text-sm mt-1">{l.details}</h4>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                        l.type === "Cash In" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {l.type === "Cash In" ? '+' : '-'} ₨ {parseFloat(l.amount).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-400">Recorded: {l.created_by}</span>
                      <button
                        onClick={() => handleDelete(l.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors touch-target"
                        title="Delete Voucher"
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
                      <th className="py-4 px-6">Transaction Date</th>
                      <th className="py-4 px-6">Voucher Type</th>
                      <th className="py-4 px-6">Voucher Details</th>
                      <th className="py-4 px-6 font-bold">Amount</th>
                      <th className="py-4 px-6">Recorded By</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {ledger.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 text-slate-600">{l.transaction_date_fmt}</td>
                        <td className="py-4 px-6 font-bold">
                          <span className={`px-3 py-1 rounded-xl text-xs ${
                            l.type === "Cash In" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}>
                            {l.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-800">{l.details}</td>
                        <td className={`py-4 px-6 font-bold ${
                          l.type === "Cash In" ? "text-green-600" : "text-red-600"
                        }`}>
                          ₨ {parseFloat(l.amount).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-slate-500">{l.created_by}</td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDelete(l.id)}
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

      {/* TRANSACTION DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 font-heading">Record Ledger Voucher</h3>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Voucher Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                    >
                      <option value="Cash In">Cash In (Income / Received)</option>
                      <option value="Cash Out">Cash Out (Expense / Disbursed)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount (₨) *</label>
                      <input
                        type="number"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="e.g. 5000"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Voucher Date</label>
                      <input
                        type="date"
                        value={formData.transaction_date}
                        onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description Details *</label>
                    <textarea
                      required
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                      placeholder="e.g. Paid electric utilities bill, collected uniform sales cash"
                      rows="3"
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
                  Record Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default LedgerManager;

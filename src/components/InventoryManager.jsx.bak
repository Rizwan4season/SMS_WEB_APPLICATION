"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Plus, Trash2, ShoppingCart, ShieldAlert, X } from 'lucide-react';

function InventoryManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" or "sale"
  
  // Forms States
  const [formData, setFormData] = useState({
    item_name: "",
    quantity: "",
    unit_price: ""
  });
  
  const [saleData, setSaleData] = useState({
    item_id: "",
    buyer_name: "",
    quantity: "",
    remarks: ""
  });

  const [formError, setFormError] = useState("");

  const fetchStock = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setStock(data.data);
      } else {
        setError(data.message || "Failed to load stock list.");
      }
    } catch (err) {
      setError("Network error loading inventory stock.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.item_name || parseFloat(formData.quantity) <= 0 || parseFloat(formData.unit_price) <= 0) {
      setFormError("Please enter valid quantities and pricing.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/inventory/add`, {
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
        fetchStock();
      } else {
        setFormError(data.message || "Failed to add inventory.");
      }
    } catch (err) {
      setFormError("Network error saving inventory item.");
      console.error(err);
    }
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!saleData.item_id || parseFloat(saleData.quantity) <= 0 || !saleData.buyer_name) {
      setFormError("Please enter valid sale fields.");
      return;
    }

    const selected = stock.find(item => String(item.id) === String(saleData.item_id));
    if (selected && parseFloat(saleData.quantity) > parseFloat(selected.quantity)) {
      setFormError(`Insufficient stock! Only ${selected.quantity} units available.`);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/inventory/sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(saleData)
      });
      const data = await response.json();
      if (data.status === "success") {
        setIsModalOpen(false);
        fetchStock();
      } else {
        setFormError(data.message || "Failed to process stock sale.");
      }
    } catch (err) {
      setFormError("Network error recording sale.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this inventory record?")) {
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/inventory/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.status === "success") {
        fetchStock();
      } else {
        alert(data.message || "Failed to delete item.");
      }
    } catch (err) {
      alert("Network error removing stock.");
      console.error(err);
    }
  };

  
  // Real-time synchronization listener
  const fetchStockRef = useRef(fetchStock);
  useEffect(() => {
    fetchStockRef.current = fetchStock;
  }, [fetchStock]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'INVENTORY') {
        console.log(`Socket update received for InventoryManager.jsx: `, change);
        fetchStockRef.current();
      }
    };
    socket.on('data-changed', handleDataChanged);
    return () => {
      socket.off('data-changed', handleDataChanged);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      
      {/* Category Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium">Uniforms, books, stationery items, and equipment assets stock</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setSaleData({ item_id: "", buyer_name: "", quantity: "", remarks: "" });
              setFormError("");
              setModalType("sale");
              setIsModalOpen(true);
            }}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-95 touch-target w-full sm:w-auto"
          >
            <ShoppingCart size={18} />
            <span>Process Sale Invoice</span>
          </button>
          
          <button
            onClick={() => {
              setFormData({ item_name: "", quantity: "", unit_price: "" });
              setFormError("");
              setModalType("add");
              setIsModalOpen(true);
            }}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target w-full sm:w-auto"
          >
            <Plus size={18} />
            <span>Add Stock Item</span>
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
          {stock.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              No stock inventory registered.
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {stock.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 font-heading text-base leading-tight">{item.item_name}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 mt-1 rounded-full uppercase tracking-wider ${
                          parseFloat(item.quantity) <= 5 ? "bg-red-50 text-red-700" : "bg-sky-50 text-sky-700"
                        }`}>
                          {parseFloat(item.quantity) <= 5 ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>
                      <span className="bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-xl">
                        ₨ {parseFloat(item.unit_price).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100">
                      <span className="text-slate-500 font-semibold">Available Quantity: {item.quantity} units</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors touch-target"
                        title="Delete Item"
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
                      <th className="py-4 px-6">Item Description</th>
                      <th className="py-4 px-6">Available Stock Qty</th>
                      <th className="py-4 px-6">Unit Price</th>
                      <th className="py-4 px-6">Status Indicator</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {stock.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-semibold text-slate-900">{item.item_name}</td>
                        <td className="py-4 px-6 text-slate-600 font-bold">{item.quantity} units</td>
                        <td className="py-4 px-6 text-slate-800 font-semibold">₨ {parseFloat(item.unit_price).toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            parseFloat(item.quantity) <= 5 ? "bg-red-50 text-red-700 font-bold" : "bg-green-50 text-green-700"
                          }`}>
                            {parseFloat(item.quantity) <= 5 ? 'Restock Alert' : 'Active'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDelete(item.id)}
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

      {/* DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 font-heading">
                {modalType === "add" ? "Add Inventory Item" : "Record Inventory Sale"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 touch-target flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            {modalType === "add" ? (
              <form onSubmit={handleAddSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
                      {formError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Item Name / Description *</label>
                      <input
                        type="text"
                        required
                        value={formData.item_name}
                        onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                        placeholder="e.g. Medium Sized School Uniform"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Opening Qty *</label>
                        <input
                          type="number"
                          required
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          placeholder="e.g. 50"
                          className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Unit Price (₨) *</label>
                        <input
                          type="number"
                          required
                          value={formData.unit_price}
                          onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                          placeholder="e.g. 1200"
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
                    Save Item
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
                      {formError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Choose Inventory Item *</label>
                      <select
                        value={saleData.item_id}
                        onChange={(e) => setSaleData({ ...saleData, item_id: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                      >
                        <option value="">-- Choose Stock Item --</option>
                        {stock.map(item => (
                          <option key={item.id} value={item.id}>{item.item_name} (Stock: {item.quantity})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Buyer Full Name / Student Name *</label>
                      <input
                        type="text"
                        required
                        value={saleData.buyer_name}
                        onChange={(e) => setSaleData({ ...saleData, buyer_name: e.target.value })}
                        placeholder="e.g. Student Name or parent"
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sales Qty *</label>
                        <input
                          type="number"
                          required
                          value={saleData.quantity}
                          onChange={(e) => setSaleData({ ...saleData, quantity: e.target.value })}
                          placeholder="e.g. 2"
                          className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sale Remarks / Notes</label>
                        <input
                          type="text"
                          value={saleData.remarks}
                          onChange={(e) => setSaleData({ ...saleData, remarks: e.target.value })}
                          placeholder="Payment details"
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
                    Process Sale
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default InventoryManager;

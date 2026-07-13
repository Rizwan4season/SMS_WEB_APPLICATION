"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Plus, Trash2, BookOpen, X } from 'lucide-react';

function LibraryManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    quantity: 1,
    rack_no: ""
  });
  const [formError, setFormError] = useState("");

  const fetchBooks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setBooks(data.data);
      } else {
        setError(data.message || "Failed to load library catalog.");
      }
    } catch (err) {
      setError("Network error connecting to library database.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title || !formData.author) {
      setFormError("Please fill required fields.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/books/add`, {
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
        fetchBooks();
      } else {
        setFormError(data.message || "Failed to add book.");
      }
    } catch (err) {
      setFormError("Network error saving book record.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this book from library stock?")) {
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/books/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.status === "success") {
        fetchBooks();
      } else {
        alert(data.message || "Failed to remove book.");
      }
    } catch (err) {
      alert("Network error removing book.");
      console.error(err);
    }
  };

  
  // Real-time synchronization listener
  const fetchBooksRef = useRef(fetchBooks);
  useEffect(() => {
    fetchBooksRef.current = fetchBooks;
  }, [fetchBooks]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'BOOKS') {
        console.log(`Socket update received for LibraryManager.jsx: `, change);
        fetchBooksRef.current();
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
          <p className="text-sm text-slate-500 font-medium">Library resources catalog index</p>
        </div>
        <button
          onClick={() => {
            setFormData({ title: "", author: "", isbn: "", quantity: 1, rack_no: "" });
            setFormError("");
            setIsModalOpen(true);
          }}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Add Catalog Book</span>
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
          {books.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              No catalog books available.
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {books.map((b) => (
                  <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-800 font-heading text-base leading-tight">{b.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">Author: {b.author} · ISBN: {b.isbn || '-'}</p>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100">
                      <span className="text-slate-500 font-semibold">Qty: {b.quantity} · Rack: {b.rack_no || '-'}</span>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors touch-target"
                        title="Delete Book"
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
                      <th className="py-4 px-6">Book Title</th>
                      <th className="py-4 px-6">Author</th>
                      <th className="py-4 px-6">ISBN</th>
                      <th className="py-4 px-6">Qty Stock</th>
                      <th className="py-4 px-6">Rack Location</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {books.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-semibold text-slate-900">{b.title}</td>
                        <td className="py-4 px-6 text-slate-600">{b.author}</td>
                        <td className="py-4 px-6 text-slate-500">{b.isbn || '-'}</td>
                        <td className="py-4 px-6 text-slate-600 font-bold">{b.quantity}</td>
                        <td className="py-4 px-6 text-slate-600">{b.rack_no || '-'}</td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDelete(b.id)}
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

      {/* ADD BOOK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 font-heading">Add Book Record</h3>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Book Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Introduction to Physics"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Author Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="e.g. Dr. H. C. Verma"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">ISBN Number</label>
                    <input
                      type="text"
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      placeholder="e.g. 978-3-16-148410-0"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Quantity Stock *</label>
                      <input
                        type="number"
                        required
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Rack Location</label>
                      <input
                        type="text"
                        value={formData.rack_no}
                        onChange={(e) => setFormData({ ...formData, rack_no: e.target.value })}
                        placeholder="e.g. A-4"
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
                  Save Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default LibraryManager;

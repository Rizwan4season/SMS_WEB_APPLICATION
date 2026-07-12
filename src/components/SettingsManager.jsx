"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Save, Database, UserPlus, Trash2, ShieldCheck, X } from 'lucide-react';

function SettingsManager({ apiBaseUrl, token }) {
  const socket = useSocket();
  const [settings, setSettings] = useState({
    school_name: "",
    phone: "",
    whatsapp_prefix: "",
    address: ""
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal Operator account states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    fullname: "",
    role: "operator"
  });

  const fetchSettingsAndUsers = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Get settings
      const setResponse = await fetch(`${apiBaseUrl}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const setData = await setResponse.json();
      if (setData.status === "success" && setData.data) {
        setSettings(setData.data);
      }

      // 2. Get users
      const usrResponse = await fetch(`${apiBaseUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const usrData = await usrResponse.json();
      if (usrData.status === "success" && Array.isArray(usrData.data)) {
        setUsers(usrData.data);
      }
    } catch (err) {
      setError("Network error loading system configuration.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndUsers();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/settings/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      if (data.status === "success") {
        alert("School configuration saved successfully!");
      } else {
        setError(data.message || "Failed to update school settings.");
      }
    } catch (err) {
      setError("Network error updating parameters.");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!userForm.username || !userForm.password) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userForm)
      });
      const data = await response.json();
      if (data.status === "success") {
        setIsModalOpen(false);
        fetchSettingsAndUsers();
      } else {
        alert(data.message || "Failed to add operator account.");
      }
    } catch (err) {
      alert("Network error creating user.");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Permantly remove this operator account?")) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.status === "success") {
        fetchSettingsAndUsers();
      } else {
        alert(data.message || "Failed to remove user account.");
      }
    } catch (err) {
      alert("Network error deleting operator account.");
    }
  };

  const handleDatabaseBackup = async () => {
    if (!window.confirm("Trigger database snapshot backup now?")) return;
    try {
      const response = await fetch(`${apiBaseUrl}/api/database-backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === "success") {
        alert(`Backup complete! Snapshot file saved at:\n${data.backup_path}`);
      } else {
        alert(data.message || "Failed to trigger backup.");
      }
    } catch (err) {
      alert("Network error triggering snapshot.");
    }
  };

  
  // Real-time synchronization listener
  const fetchSettingsAndUsersRef = useRef(fetchSettingsAndUsers);
  useEffect(() => {
    fetchSettingsAndUsersRef.current = fetchSettingsAndUsers;
  }, [fetchSettingsAndUsers]);

  useEffect(() => {
    if (!socket) return;
    const handleDataChanged = (change) => {
      if (change.status === 'refresh' || change.type === 'SETTINGS' || change.type === 'USERS') {
        console.log(`Socket update received for SettingsManager.jsx: `, change);
        fetchSettingsAndUsersRef.current();
      }
    };
    socket.on('data-changed', handleDataChanged);
    return () => {
      socket.off('data-changed', handleDataChanged);
    };
  }, [socket]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. School Information Settings Card */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Save size={20} className="text-sky-500" />
            <h3 className="font-bold text-slate-800 font-heading">School Profile Configurations</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">School Name *</label>
              <input
                type="text"
                required
                value={settings.school_name}
                onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contact Phone Number</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">WhatsApp Mobile Country Prefix</label>
                <input
                  type="text"
                  value={settings.whatsapp_prefix}
                  onChange={(e) => setSettings({ ...settings, whatsapp_prefix: e.target.value })}
                  placeholder="e.g. 92"
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">School Street Address</label>
              <textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows="2"
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-sky-500/10 transition-all duration-150 active:scale-95 touch-target text-xs"
            >
              Save Configuration Settings
            </button>
          </form>
        </div>

        {/* 2. Operations & Backups */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database size={20} className="text-sky-500" />
            <h3 className="font-bold text-slate-800 font-heading">Database Utilities</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Create structured snapshots of student registries, attendance sheets, and general accounts ledgers directly on the live Railway host container storage logs.
          </p>
          <button
            onClick={handleDatabaseBackup}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 touch-target text-xs"
          >
            <Database size={16} />
            <span>Generate Backup Snapshot</span>
          </button>
        </div>
      </div>

      {/* 3. Operators Management Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-sky-500" />
            <h3 className="font-bold text-slate-800 font-heading">System Users</h3>
          </div>
          
          <button
            onClick={() => {
              setUserForm({ username: "", password: "", fullname: "", role: "operator" });
              setIsModalOpen(true);
            }}
            className="p-2 text-sky-500 hover:bg-sky-50 rounded-xl transition-colors touch-target"
            title="Create User Account"
          >
            <UserPlus size={20} />
          </button>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
          {users.map(u => (
            <div key={u.id} className="py-3 flex justify-between items-center text-xs">
              <div>
                <h4 className="font-bold text-slate-800">{u.fullname || u.username}</h4>
                <p className="text-slate-400 mt-0.5">Role: {u.role} · User: {u.username}</p>
              </div>
              
              {u.username !== "admin" && (
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors touch-target"
                  title="Remove Account"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* OPERATOR REGISTER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 font-heading">Register ERP Operator</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 touch-target flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={userForm.fullname}
                      onChange={(e) => setUserForm({ ...userForm, fullname: e.target.value })}
                      placeholder="e.g. Rizwan Siddiqui"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Username *</label>
                    <input
                      type="text"
                      required
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      placeholder="e.g. rizwan"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Account Password *</label>
                    <input
                      type="password"
                      required
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Create secure credentials"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">System Access Role</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                    >
                      <option value="operator">Console Operator</option>
                      <option value="administrator">System Administrator</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-full font-semibold text-xs transition-colors touch-target"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-full shadow-lg transition-all duration-150 active:scale-95 touch-target text-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default SettingsManager;

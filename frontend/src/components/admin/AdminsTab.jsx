import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { PlusCircle, Check, X, Trash2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminsTab({ isSuperAdmin }) {
  const [admins, setAdmins] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ first_name: "", last_name: "", email: "", password: "" });

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API}/admin/admins`);
      setAdmins(res.data.admins || []);
    } catch {}
  };

  useEffect(() => { fetchAdmins(); }, []);

  const createAdmin = async () => {
    if (!newAdmin.first_name || !newAdmin.email || !newAdmin.password) { toast.error("First name, email, and password are required"); return; }
    try {
      await axios.post(`${API}/admin/admins`, { ...newAdmin, name: `${newAdmin.first_name} ${newAdmin.last_name}`.trim() });
      toast.success("Admin account created!");
      setNewAdmin({ first_name: "", last_name: "", email: "", password: "" });
      setShowCreate(false);
      fetchAdmins();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to create admin"); }
  };

  const suspendAdmin = async (adminId, isActive) => {
    await axios.post(`${API}/admin/admins/${adminId}/${isActive ? "suspend" : "activate"}`);
    toast.success(isActive ? "Admin suspended" : "Admin activated");
    fetchAdmins();
  };

  const deleteAdmin = async (adminId) => {
    if (!window.confirm("Delete this admin account?")) return;
    await axios.delete(`${API}/admin/admins/${adminId}`);
    toast.success("Admin deleted");
    fetchAdmins();
  };

  return (
    <div className="space-y-4" data-testid="admins-tab">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#050A30] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Admin Management</h2>
          <p className="text-sm text-slate-500">Manage administrator accounts (Super Admin only)</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-700 transition-colors"
          data-testid="create-admin-btn">
          <PlusCircle className="w-4 h-4" /> Create Admin
        </button>
      </div>
      {showCreate && (
        <div className="card p-5" data-testid="create-admin-form">
          <h3 className="font-bold text-[#050A30] dark:text-white mb-4">New Administrator Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <input type="text" placeholder="First Name" value={newAdmin.first_name}
              onChange={e => setNewAdmin(p => ({ ...p, first_name: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-[#050A30] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="new-admin-first-name" />
            <input type="text" placeholder="Last Name" value={newAdmin.last_name}
              onChange={e => setNewAdmin(p => ({ ...p, last_name: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-[#050A30] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="new-admin-last-name" />
            <input type="email" placeholder="Email Address" value={newAdmin.email}
              onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-[#050A30] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="new-admin-email" />
            <input type="password" placeholder="Password" value={newAdmin.password}
              onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-[#050A30] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="new-admin-password" />
          </div>
          <div className="flex gap-2">
            <button onClick={createAdmin} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-700 transition-colors" data-testid="submit-create-admin">Create Administrator</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg font-semibold text-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50" data-testid="cancel-create-admin">Cancel</button>
          </div>
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>{["Name", "Email", "Status", "Created", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {admins.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50" data-testid={`admin-row-${a.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold">{a.name?.[0] || "A"}</div>
                      <span className="font-semibold text-[#050A30] dark:text-white">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{a.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{a.is_active ? "Active" : "Suspended"}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => suspendAdmin(a.id, a.is_active)}
                        className={`p-1.5 rounded ${a.is_active ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                        title={a.is_active ? "Suspend" : "Activate"}
                        data-testid={`admin-${a.is_active ? "suspend" : "activate"}-${a.id}`}>
                        {a.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteAdmin(a.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50" title="Delete" data-testid={`admin-delete-${a.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No admin accounts found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { PlusCircle, Check, X, Trash2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SubAdminsTab() {
  const [subadmins, setSubadmins] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newSubadmin, setNewSubadmin] = useState({ first_name: "", last_name: "", email: "", password: "" });

  const fetchSubadmins = async () => {
    try {
      const res = await axios.get(`${API}/admin/subadmins`);
      setSubadmins(res.data.subadmins || []);
    } catch {}
  };

  useEffect(() => { fetchSubadmins(); }, []);

  const createSubadmin = async () => {
    if (!newSubadmin.first_name || !newSubadmin.email || !newSubadmin.password) { toast.error("First name, email, and password are required"); return; }
    try {
      await axios.post(`${API}/admin/subadmins`, { ...newSubadmin, name: `${newSubadmin.first_name} ${newSubadmin.last_name}`.trim() });
      toast.success("SubAdmin account created!");
      setNewSubadmin({ first_name: "", last_name: "", email: "", password: "" });
      setShowCreate(false);
      fetchSubadmins();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to create subadmin"); }
  };

  const suspendSubadmin = async (id, isActive) => {
    await axios.post(`${API}/admin/subadmins/${id}/${isActive ? "suspend" : "activate"}`);
    toast.success(isActive ? "SubAdmin suspended" : "SubAdmin activated");
    fetchSubadmins();
  };

  const deleteSubadmin = async (id) => {
    if (!window.confirm("Delete this subadmin account?")) return;
    await axios.delete(`${API}/admin/subadmins/${id}`);
    toast.success("SubAdmin deleted");
    fetchSubadmins();
  };

  return (
    <div className="space-y-4" data-testid="subadmins-tab">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#050A30] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>SubAdmin Management</h2>
          <p className="text-sm text-slate-500">Create limited-access sub-administrators</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-700 transition-colors"
          data-testid="create-subadmin-btn">
          <PlusCircle className="w-4 h-4" /> Create SubAdmin
        </button>
      </div>
      {showCreate && (
        <div className="card p-5">
          <h3 className="font-bold text-[#050A30] dark:text-white mb-4">New SubAdmin Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <input type="text" placeholder="First Name" value={newSubadmin.first_name}
              onChange={e => setNewSubadmin(s => ({ ...s, first_name: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-[#050A30] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="new-subadmin-first-name" />
            <input type="text" placeholder="Last Name" value={newSubadmin.last_name}
              onChange={e => setNewSubadmin(s => ({ ...s, last_name: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-[#050A30] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="new-subadmin-last-name" />
            <input type="email" placeholder="Email Address" value={newSubadmin.email}
              onChange={e => setNewSubadmin(s => ({ ...s, email: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-[#050A30] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="new-subadmin-email" />
            <input type="password" placeholder="Password" value={newSubadmin.password}
              onChange={e => setNewSubadmin(s => ({ ...s, password: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-[#050A30] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="new-subadmin-password" />
          </div>
          <div className="flex gap-2">
            <button onClick={createSubadmin} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold text-sm" data-testid="submit-create-subadmin">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg font-semibold text-sm border border-slate-200 text-slate-500">Cancel</button>
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
              {subadmins.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50" data-testid={`subadmin-row-${s.id}`}>
                  <td className="px-4 py-3 font-semibold text-[#050A30] dark:text-white">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{s.is_active ? "Active" : "Suspended"}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => suspendSubadmin(s.id, s.is_active)}
                        className={`p-1.5 rounded ${s.is_active ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                        title={s.is_active ? "Suspend" : "Activate"}>
                        {s.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteSubadmin(s.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subadmins.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No subadmin accounts yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

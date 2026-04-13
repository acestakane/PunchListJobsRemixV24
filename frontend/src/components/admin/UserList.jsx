import React from "react";
import axios from "axios";
import { toast } from "sonner";
import { getErr } from "../../utils/errorUtils";
import {
  Search, UserPlus, Download, Upload, Edit, Trash2, Check, X,
  Key, ChevronLeft, ChevronRight, MessageCircle
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function UserList({
  users, userTotal, userPage, userSearch,
  setUserSearch, setUserPage, fetchUsers,
  showCreateUser, setShowCreateUser, newUser, setNewUser, createUser,
  suspendUser, deleteUser, openEditUser,
  setResetUserId, setNewPassword,
  exportUsers, importRef, handleImport,
  navigate,
}) {
  return (
    <div>
      {/* Toolbar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search users..." value={userSearch}
            onChange={e => { setUserSearch(e.target.value); fetchUsers(1, e.target.value); }}
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
            data-testid="admin-user-search" />
        </div>
        <button onClick={() => setShowCreateUser(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          data-testid="create-user-btn">
          <UserPlus className="w-4 h-4" /> Create User
        </button>
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
            data-testid="export-users-btn">
            <Download className="w-4 h-4" /> Export
          </button>
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[120px]">
            <button onClick={() => exportUsers("csv")}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-lg"
              data-testid="export-users-csv-btn">Export CSV</button>
            <button onClick={() => exportUsers("json")}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-lg"
              data-testid="export-users-json-btn">Export JSON</button>
          </div>
        </div>
        <button onClick={() => importRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
          data-testid="import-users-btn">
          <Upload className="w-4 h-4" /> Import
        </button>
        <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
      </div>

      {/* Create User Form */}
      {showCreateUser && (
        <div className="card p-5 mb-4" data-testid="create-user-form">
          <h3 className="font-bold text-[#050A30] dark:text-white mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>New User Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <input type="text" placeholder="First Name *" value={newUser.first_name}
              onChange={e => setNewUser(u => ({ ...u, first_name: e.target.value }))}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="new-user-first-name" />
            <input type="text" placeholder="Last Name" value={newUser.last_name}
              onChange={e => setNewUser(u => ({ ...u, last_name: e.target.value }))}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="new-user-last-name" />
            <input type="email" placeholder="Email Address" value={newUser.email}
              onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="new-user-email" />
            <input type="password" placeholder="Password" value={newUser.password}
              onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="new-user-password" />
            <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none"
              data-testid="new-user-role">
              {["crew", "contractor", "subadmin"].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={createUser}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
                data-testid="submit-create-user">Create</button>
              <button onClick={() => setShowCreateUser(false)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">User</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Subscription</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Points</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50" data-testid={`admin-user-row-${u.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#050A30] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#050A30] dark:text-white">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-semibold">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {u.is_active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs capitalize">{u.subscription_status}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold">{u.points || 0}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEditUser(u)}
                        className="p-1.5 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Edit User" data-testid={`admin-edit-user-${u.id}`}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setResetUserId(u.id); setNewPassword(""); }}
                        className="p-1.5 rounded text-amber-500 hover:bg-amber-50"
                        title="Reset Password" data-testid={`admin-reset-pw-${u.id}`}>
                        <Key className="w-4 h-4" />
                      </button>
                      <button onClick={() => suspendUser(u.id, u.is_active)}
                        className={`p-1.5 rounded ${u.is_active ? "text-red-500 hover:bg-red-50" : "text-green-500 hover:bg-green-50"}`}
                        title={u.is_active ? "Suspend" : "Activate"}
                        data-testid={`admin-${u.is_active ? "suspend" : "activate"}-${u.id}`}>
                        {u.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteUser(u.id)}
                        className="p-1.5 rounded text-red-500 hover:bg-red-50"
                        title="Delete" data-testid={`admin-delete-user-${u.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {!["admin","superadmin","subadmin"].includes(u.role) && (
                        <button
                          onClick={async () => {
                            try {
                              const { data } = await axios.post(`${API}/messages/threads/initiate/${u.id}`);
                              navigate(`/messages?thread=${data.id}`);
                            } catch (e) { toast.error(getErr(e, "Failed")); }
                          }}
                          className="p-1.5 rounded text-blue-500 hover:bg-blue-50"
                          title="Message User" data-testid={`admin-message-user-${u.id}`}>
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-sm text-slate-500">Showing {users.length} of {userTotal} users</p>
          <div className="flex gap-2">
            <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm">{userPage}</span>
            <button onClick={() => setUserPage(p => p + 1)} disabled={userPage * 15 >= userTotal}
              className="p-1.5 rounded border border-slate-200 disabled:opacity-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

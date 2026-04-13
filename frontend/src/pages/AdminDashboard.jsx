import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { toast } from "sonner";
import { getErr } from "../utils/errorUtils";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  Users, ClipboardList, DollarSign, TrendingUp, Shield, Key, X
} from "lucide-react";
import StatsCards     from "../components/admin/StatsCards";
import UserList       from "../components/admin/UserList";
import JobList        from "../components/admin/JobList";
import PaymentsTab    from "../components/admin/PaymentsTab";
import TopPerformersTab from "../components/admin/TopPerformersTab";
import SettingsTab    from "../components/admin/SettingsTab";
import LogsTab        from "../components/admin/LogsTab";
import CmsTab         from "../components/admin/CmsTab";
import SubAdminsTab   from "../components/admin/SubAdminsTab";
import AdminsTab      from "../components/admin/AdminsTab";
import CouponsTab     from "../components/admin/CouponsTab";
import TradesTab      from "../components/admin/TradesTab";
import ConcernsTab    from "../components/admin/ConcernsTab";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PIE_COLORS = ["#2563EB", "#38BDF8", "#10B981", "#F59E0B"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const isSuperAdmin = user?.role === "superadmin";
  const isAdminRole  = user?.role === "admin";

  const TABS = [
    "Overview", "Users", "Jobs", "Payments", "Top Performers",
    "Settings", "Logs", "CMS", "Coupons", "Trades", "Concerns",
    ...(isAdminRole  ? ["SubAdmins"] : []),
    ...(isSuperAdmin ? ["SubAdmins", "Admins"] : []),
  ];

  // ─── Core State ──────────────────────────────────────────────────────────
  const [tab, setTab]           = useState("Overview");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]   = useState(true);

  // Users tab state
  const [users, setUsers]           = useState([]);
  const [userTotal, setUserTotal]   = useState(0);
  const [userPage, setUserPage]     = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser]       = useState({ first_name: "", last_name: "", email: "", password: "", role: "crew" });
  const importRef = useRef(null);

  // Jobs tab state
  const [jobs, setJobs]                     = useState([]);
  const [jobStatusFilter, setJobStatusFilter] = useState("");

  // EditUser modal state (managed here, triggered from UserList)
  const [editUser, setEditUser]         = useState(null);
  const [editUserForm, setEditUserForm] = useState({});

  // PasswordReset modal state
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // ─── Fetch Functions ─────────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    const res = await axios.get(`${API}/admin/analytics`);
    setAnalytics(res.data);
  }, []);

  const fetchUsers = useCallback(async (page = 1, search = "") => {
    const params = new URLSearchParams({ page, limit: 15 });
    if (search) params.append("search", search);
    const res = await axios.get(`${API}/admin/users?${params}`);
    setUsers(res.data.users);
    setUserTotal(res.data.total);
  }, []);

  const fetchJobs = useCallback(async (statusFilter = "") => {
    const qs = statusFilter ? `?status=${statusFilter}&limit=100` : "?limit=100";
    const res = await axios.get(`${API}/admin/jobs${qs}`);
    setJobs(res.data.jobs || []);
  }, []);

  // ─── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await fetchAnalytics();
        if (tab === "Users") await fetchUsers(userPage, userSearch);
        if (tab === "Jobs")  await fetchJobs(jobStatusFilter);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [tab, userPage]); // eslint-disable-line

  // ─── Action Functions ────────────────────────────────────────────────────
  const suspendUser = async (userId, isActive) => {
    await axios.post(`${API}/admin/users/${userId}/${isActive ? "suspend" : "activate"}`);
    toast.success(isActive ? "User suspended" : "User activated");
    fetchUsers(userPage, userSearch);
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user?")) return;
    await axios.delete(`${API}/admin/users/${userId}`);
    toast.success("User deleted");
    fetchUsers(userPage, userSearch);
  };

  const openEditUser = (u) => {
    const parts = (u.name || "").trim().split(" ");
    setEditUser(u);
    setEditUserForm({
      name: u.name || "",
      first_name: u.first_name || parts[0] || "",
      last_name:  u.last_name  || parts.slice(1).join(" ") || "",
      email: u.email || "",
      role: u.role || "crew",
      subscription_status: u.subscription_status || "free",
      is_active: u.is_active !== false,
    });
  };

  const saveEditUser = async () => {
    try {
      const payload = {
        ...editUserForm,
        name: `${editUserForm.first_name || ""} ${editUserForm.last_name || ""}`.trim() || editUserForm.name,
      };
      await axios.put(`${API}/admin/users/${editUser.id}`, payload);
      toast.success("User updated");
      setEditUser(null);
      fetchUsers(userPage, userSearch);
    } catch (e) { toast.error(getErr(e, "Failed to update user")); }
  };

  const createUser = async () => {
    if (!newUser.first_name || !newUser.email || !newUser.password) { toast.error("First name, email, and password are required"); return; }
    try {
      const payload = { ...newUser, name: `${newUser.first_name} ${newUser.last_name}`.trim() };
      await axios.post(`${API}/admin/users`, payload);
      toast.success("User created!");
      setNewUser({ first_name: "", last_name: "", email: "", password: "", role: "crew" });
      setShowCreateUser(false);
      fetchUsers(userPage, userSearch);
    } catch (e) { toast.error(getErr(e, "Failed to create user")); }
  };

  const adminJobAction = async (jobId, action) => {
    try {
      if (action === "delete") {
        if (!window.confirm("Permanently delete this job?")) return;
        await axios.delete(`${API}/admin/jobs/${jobId}`);
      } else {
        await axios.post(`${API}/jobs/${jobId}/${action}`);
      }
      toast.success(`Job ${action}d successfully`);
      fetchJobs(jobStatusFilter);
    } catch (e) { toast.error(e?.response?.data?.detail || `Failed to ${action} job`); }
  };

  const exportUsers = (format = "csv") => {
    window.open(format === "json" ? `${API}/admin/users/export-json` : `${API}/admin/users/export`, "_blank");
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await axios.post(`${API}/admin/users/import`, form, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Import done: ${res.data.created} created, ${res.data.updated} updated`);
      if (res.data.errors?.length) toast.error(`${res.data.errors.length} row(s) had errors`);
      fetchUsers(userPage, userSearch);
    } catch (e) { toast.error(getErr(e, "Import failed")); }
    e.target.value = "";
  };

  const submitPasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    try {
      await axios.post(`${API}/admin/users/${resetUserId}/reset-password`, { new_password: newPassword });
      toast.success("Password reset successfully");
      setResetUserId(null);
      setNewPassword("");
    } catch (e) { toast.error(getErr(e, "Failed to reset password")); }
  };

  // ─── Overview data derivation ─────────────────────────────────────────────
  const statCards = analytics ? [
    { label: "Total Users",        value: analytics.total_users,                          icon: Users,         color: "#2563EB", bg: "#EEF2FF" },
    { label: "Total Jobs",         value: analytics.total_jobs,                           icon: ClipboardList, color: "#10B981", bg: "#ECFDF5" },
    { label: "Completed Jobs",     value: analytics.completed_jobs,                       icon: TrendingUp,    color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Accumulated Expense",value: `$${analytics.total_revenue?.toFixed(2)}`,      icon: DollarSign,    color: "#8B5CF6", bg: "#F5F3FF" },
  ] : [];

  const metricsCards = analytics ? [
    { label: "Crew Utilization", value: `${analytics.crew_utilization}%`,    note: "with jobs done" },
    { label: "Online Now",       value: analytics.online_crew,               note: "crew online" },
    { label: "Job Completion",   value: `${analytics.job_completion_rate}%`, note: "success rate" },
    { label: "Expired Subs",     value: analytics.expired_subscriptions,     note: "need renewal" },
  ] : [];

  const pieData = analytics ? [
    { name: "Crew",        value: analytics.crew_count },
    { name: "Contractors", value: analytics.contractor_count },
    { name: "Active Sub",  value: analytics.active_subscriptions },
    { name: "Trial",       value: analytics.trial_subscriptions },
  ] : [];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617]" style={{ fontFamily: "Inter, sans-serif" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[#050A30] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">Platform management & analytics</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isSuperAdmin ? "bg-purple-50 dark:bg-purple-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
            <Shield className={`w-4 h-4 ${isSuperAdmin ? "text-purple-500" : "text-red-500"}`} />
            <span className={`font-semibold text-sm ${isSuperAdmin ? "text-purple-600" : "text-red-600"}`} data-testid="admin-role-badge">
              {isSuperAdmin ? "Super Admin" : "Admin"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap ${tab === t ? "bg-blue-700 text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              data-testid={`admin-tab-${t.toLowerCase().replace(/\s+/g, "-")}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "Overview" && (
          <StatsCards
            statCards={statCards}
            metricsCards={metricsCards}
            analytics={analytics}
            pieData={pieData}
          />
        )}

        {tab === "Users" && (
          <UserList
            users={users} userTotal={userTotal} userPage={userPage} userSearch={userSearch}
            setUserSearch={setUserSearch} setUserPage={setUserPage} fetchUsers={fetchUsers}
            showCreateUser={showCreateUser} setShowCreateUser={setShowCreateUser}
            newUser={newUser} setNewUser={setNewUser} createUser={createUser}
            suspendUser={suspendUser} deleteUser={deleteUser} openEditUser={openEditUser}
            setResetUserId={setResetUserId} setNewPassword={setNewPassword}
            exportUsers={exportUsers} importRef={importRef} handleImport={handleImport}
            navigate={navigate}
          />
        )}

        {tab === "Jobs" && (
          <JobList
            jobs={jobs}
            jobStatusFilter={jobStatusFilter}
            setJobStatusFilter={setJobStatusFilter}
            fetchJobs={fetchJobs}
            adminJobAction={adminJobAction}
          />
        )}

        {tab === "Payments"        && <PaymentsTab />}
        {tab === "Top Performers"  && <TopPerformersTab />}
        {tab === "Settings"        && <SettingsTab />}
        {tab === "Logs"            && <LogsTab />}
        {tab === "CMS"             && <CmsTab />}
        {tab === "Coupons"         && <CouponsTab />}
        {tab === "Trades"          && <TradesTab />}
        {tab === "Concerns"        && <ConcernsTab />}
        {tab === "SubAdmins"       && <SubAdminsTab />}
        {tab === "Admins" && isSuperAdmin && <AdminsTab isSuperAdmin={isSuperAdmin} />}
      </div>

      {/* ─── Password Reset Modal ─── */}
      {resetUserId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card max-w-sm w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-[#050A30] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Reset Password</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">Set a new password for this user.</p>
            <input type="password" placeholder="New password (min 6 chars)" value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 dark:bg-slate-800 dark:text-white mb-4"
              data-testid="reset-password-input" />
            <div className="flex gap-3">
              <button onClick={() => setResetUserId(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg text-sm font-semibold"
                data-testid="cancel-reset-pw-btn">Cancel</button>
              <button onClick={submitPasswordReset}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600"
                data-testid="confirm-reset-pw-btn">Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit User Modal ─── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="edit-user-modal">
          <div className="card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-[#050A30] dark:text-white text-lg" style={{ fontFamily: "Manrope, sans-serif" }}>Edit User</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editUser.email}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">First Name</label>
                  <input type="text" value={editUserForm.first_name ?? ""}
                    onChange={e => setEditUserForm(f => ({ ...f, first_name: e.target.value, name: `${e.target.value} ${f.last_name ?? ""}`.trim() }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                    data-testid="edit-user-first-name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Last Name</label>
                  <input type="text" value={editUserForm.last_name ?? ""}
                    onChange={e => setEditUserForm(f => ({ ...f, last_name: e.target.value, name: `${f.first_name ?? ""} ${e.target.value}`.trim() }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                    data-testid="edit-user-last-name" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</label>
                <input type="email" value={editUserForm.email || ""}
                  onChange={e => setEditUserForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                  data-testid="edit-user-email" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Role</label>
                  <select value={editUserForm.role || "crew"}
                    onChange={e => setEditUserForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none dark:bg-slate-800 dark:text-white"
                    data-testid="edit-user-role">
                    {["crew", "contractor", "subadmin"].map(r => <option key={r} value={r}>{r}</option>)}
                    {isSuperAdmin && <option value="admin">admin</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Subscription</label>
                  <select value={editUserForm.subscription_status || "free"}
                    onChange={e => setEditUserForm(f => ({ ...f, subscription_status: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none dark:bg-slate-800 dark:text-white"
                    data-testid="edit-user-subscription">
                    {["free", "trial", "active", "expired"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-semibold text-[#050A30] dark:text-white">Account Active</span>
                <div onClick={() => setEditUserForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors flex items-center px-0.5 ${editUserForm.is_active ? "bg-blue-600" : "bg-slate-300"}`}
                  data-testid="edit-user-active-toggle">
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${editUserForm.is_active ? "translate-x-5" : ""}`} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditUser(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg text-sm font-semibold"
                data-testid="cancel-edit-user-btn">Cancel</button>
              <button onClick={saveEditUser}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
                data-testid="save-edit-user-btn">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

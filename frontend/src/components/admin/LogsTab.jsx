import React, { useState, useEffect } from "react";
import axios from "axios";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [logCategory, setLogCategory] = useState("");

  const fetchLogs = async (page = 1, category = "") => {
    const params = new URLSearchParams({ page, limit: 50 });
    if (category) params.append("category", category);
    try {
      const res = await axios.get(`${API}/admin/activity-logs?${params}`);
      setLogs(res.data.logs || []);
      setLogTotal(res.data.total || 0);
    } catch {}
  };

  useEffect(() => {
    fetchLogs(1, "");
  }, []);

  const exportLogs = () => {
    const cat = logCategory ? `?category=${logCategory}` : "";
    window.open(`${API}/admin/activity-logs/export${cat}`, "_blank");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#050A30] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Activity Logs</h2>
          <p className="text-sm text-slate-500">{logTotal} total entries</p>
        </div>
        <div className="flex gap-2">
          <select value={logCategory} onChange={e => { setLogCategory(e.target.value); setLogPage(1); fetchLogs(1, e.target.value); }}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none"
            data-testid="log-category-filter">
            <option value="">All categories</option>
            {["auth", "job", "admin", "payment", "subscription", "crew_request"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={exportLogs}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
            data-testid="export-logs-btn">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {["Time", "Category", "Action", "Actor", "Details"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50" data-testid={`log-row-${l.id}`}>
                  <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2.5"><span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-semibold capitalize">{l.category}</span></td>
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{l.action}</td>
                  <td className="px-4 py-2.5 text-xs"><p className="font-semibold">{l.actor_name}</p><p className="text-slate-400 capitalize">{l.actor_role}</p></td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs truncate">
                    {Object.entries(l.details || {}).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No activity logs found</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-sm text-slate-500">Page {logPage} · {logs.length} entries shown</p>
          <div className="flex gap-2">
            <button onClick={() => { const p = Math.max(1, logPage - 1); setLogPage(p); fetchLogs(p, logCategory); }} disabled={logPage === 1} className="p-1.5 rounded border border-slate-200 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => { const p = logPage + 1; setLogPage(p); fetchLogs(p, logCategory); }} disabled={logs.length < 50} className="p-1.5 rounded border border-slate-200 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

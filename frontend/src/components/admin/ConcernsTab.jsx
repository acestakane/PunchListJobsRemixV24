import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { getErr } from "../../utils/errorUtils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ConcernsTab() {
  const [concerns, setConcerns] = useState([]);
  const [concernFilter, setConcernFilter] = useState("");
  const [resolveId, setResolveId] = useState(null);
  const [resolveText, setResolveText] = useState("");

  const fetchConcerns = async () => {
    try {
      const { data } = await axios.get(`${API}/concerns/`);
      setConcerns(data);
    } catch {}
  };

  useEffect(() => { fetchConcerns(); }, []);

  const resolveConcern = async (concernId) => {
    try {
      await axios.patch(`${API}/concerns/${concernId}/resolve`, { resolution: resolveText });
      toast.success("Concern resolved");
      setResolveId(null);
      setResolveText("");
      fetchConcerns();
    } catch (e) { toast.error(getErr(e, "Failed to resolve")); }
  };

  const filtered = concerns.filter(c => !concernFilter || c.status === concernFilter);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h2 className="text-lg font-bold text-[#050A30] dark:text-white flex-1" style={{ fontFamily: "Manrope, sans-serif" }}>
          Reported Concerns
          <span className="text-sm font-normal text-slate-400 ml-2">({filtered.length} shown)</span>
        </h2>
        <select value={concernFilter} onChange={e => setConcernFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none"
          data-testid="concern-status-filter">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
        <button onClick={fetchConcerns}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          data-testid="refresh-concerns-admin-btn">Refresh</button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        {[
          { label: "Total",    val: concerns.length,                                      cls: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" },
          { label: "Pending",  val: concerns.filter(c => c.status === "pending").length,  cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
          { label: "Resolved", val: concerns.filter(c => c.status === "resolved").length, cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
        ].map(p => (
          <span key={p.label} className={`text-xs font-bold px-3 py-1.5 rounded-full ${p.cls}`}>{p.label}: {p.val}</span>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {["User", "Category", "Subject", "Status", "Submitted", "Action"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(c => (
                <React.Fragment key={c.id}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50" data-testid={`admin-concern-row-${c.id}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#050A30] dark:text-white text-sm">{c.user_name}</p>
                      <p className="text-xs text-slate-400">{c.user_email}</p>
                      <p className="text-xs text-slate-400 capitalize">{c.user_role}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{c.category}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-semibold text-[#050A30] dark:text-white text-sm truncate">{c.subject}</p>
                      <p className="text-xs text-slate-500 truncate">{c.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                        c.status === "pending"  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : c.status === "resolved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-500"
                      }`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === "pending" && (
                        <button onClick={() => { setResolveId(c.id); setResolveText(""); }}
                          className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          data-testid={`resolve-concern-${c.id}`}>
                          Resolve
                        </button>
                      )}
                      {c.status === "resolved" && c.resolution && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 italic truncate max-w-[140px] block text-right">{c.resolution}</span>
                      )}
                    </td>
                  </tr>
                  {resolveId === c.id && (
                    <tr data-testid={`resolve-form-${c.id}`}>
                      <td colSpan={6} className="px-4 py-3 bg-blue-50 dark:bg-blue-950/30">
                        <div className="flex gap-3 items-end flex-wrap">
                          <div className="flex-1 min-w-48">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Resolution note (optional)</label>
                            <textarea value={resolveText} onChange={e => setResolveText(e.target.value)} rows={2}
                              placeholder="Describe the resolution or outcome…"
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                              data-testid="resolve-text-input" />
                          </div>
                          <div className="flex gap-2 pb-0.5">
                            <button onClick={() => resolveConcern(c.id)}
                              className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                              data-testid="confirm-resolve-btn">Confirm Resolve</button>
                            <button onClick={() => setResolveId(null)}
                              className="px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              data-testid="cancel-resolve-btn">Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No concerns {concernFilter ? `with status "${concernFilter}"` : "submitted yet"}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

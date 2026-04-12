import React from "react";
import { Pause, Play, Ban, Trash2 } from "lucide-react";

const JOB_STATUS_COLORS = {
  open:        "bg-green-100 text-green-700",
  fulfilled:   "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed:   "bg-emerald-100 text-emerald-700",
  suspended:   "bg-orange-100 text-orange-700",
  cancelled:   "bg-red-100 text-red-600",
  archived:    "bg-slate-100 text-slate-500",
  draft:       "bg-purple-100 text-purple-700",
};

export default function JobList({ jobs, jobStatusFilter, setJobStatusFilter, fetchJobs, adminJobAction }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-[#050A30] dark:text-white flex-1" style={{ fontFamily: "Manrope, sans-serif" }}>
          All Jobs <span className="text-sm font-normal text-slate-400 ml-2">({jobs.length} shown)</span>
        </h2>
        <select value={jobStatusFilter}
          onChange={e => { setJobStatusFilter(e.target.value); fetchJobs(e.target.value); }}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:bg-slate-800 dark:text-white focus:outline-none"
          data-testid="job-status-filter">
          <option value="">All Statuses</option>
          {["open", "fulfilled", "in_progress", "completed", "suspended", "cancelled", "archived"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Contractor</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Trade</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Crew</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Date</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {jobs.map(j => (
                <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50" data-testid={`admin-job-row-${j.id}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#050A30] dark:text-white truncate max-w-[180px]">{j.title}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[180px]">{j.address}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{j.contractor_name || "—"}</td>
                  <td className="px-4 py-3"><span className="text-xs capitalize text-slate-500">{j.trade || "—"}</span></td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${JOB_STATUS_COLORS[j.status] || "bg-slate-100 text-slate-500"}`}>
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{j.crew_accepted?.length || 0}/{j.crew_needed || 1}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{j.date || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {j.status === "suspended" ? (
                        <button onClick={() => adminJobAction(j.id, "reactivate")}
                          className="p-1.5 rounded text-green-500 hover:bg-green-50"
                          title="Reactivate" data-testid={`admin-reactivate-job-${j.id}`}>
                          <Play className="w-4 h-4" />
                        </button>
                      ) : ["open", "fulfilled", "in_progress"].includes(j.status) && (
                        <button onClick={() => adminJobAction(j.id, "suspend")}
                          className="p-1.5 rounded text-orange-500 hover:bg-orange-50"
                          title="Suspend" data-testid={`admin-suspend-job-${j.id}`}>
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      {!["completed", "cancelled", "archived"].includes(j.status) && (
                        <button onClick={() => adminJobAction(j.id, "cancel")}
                          className="p-1.5 rounded text-red-500 hover:bg-red-50"
                          title="Cancel" data-testid={`admin-cancel-job-${j.id}`}>
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => adminJobAction(j.id, "delete")}
                        className="p-1.5 rounded text-red-600 hover:bg-red-50"
                        title="Delete permanently" data-testid={`admin-delete-job-${j.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No jobs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

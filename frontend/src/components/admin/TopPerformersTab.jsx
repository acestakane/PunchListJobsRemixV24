import React, { useState, useEffect } from "react";
import axios from "axios";
import { ClipboardList, Award, Star } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TopPerformersTab() {
  const [topPerformers, setTopPerformers] = useState(null);

  useEffect(() => {
    axios.get(`${API}/admin/top-performers`)
      .then(r => setTopPerformers(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6" data-testid="top-performers-tab">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top by Jobs */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-[#050A30] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Top by Jobs Completed</h3>
          </div>
          <div className="space-y-3">
            {(topPerformers?.top_by_jobs || []).map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" data-testid={`top-jobs-${c.id}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#050A30] dark:text-white text-sm truncate">{c.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{c.trade || "—"}</p>
                </div>
                <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-semibold text-slate-500">{c.rating_count > 0 ? c.rating?.toFixed(1) : "—"}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-extrabold text-emerald-600">{c.jobs_completed}</p>
                  <p className="text-xs text-slate-400">jobs</p>
                </div>
              </div>
            ))}
            {(!topPerformers?.top_by_jobs || topPerformers.top_by_jobs.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-8">No performers yet</p>
            )}
          </div>
        </div>

        {/* Top by Rating */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-[#050A30] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Top by Rating</h3>
          </div>
          <div className="space-y-3">
            {(topPerformers?.top_by_rating || []).map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" data-testid={`top-rating-${c.id}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#050A30] dark:text-white text-sm truncate">{c.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{c.trade || "—"}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-extrabold text-[#050A30] dark:text-white">{c.rating?.toFixed(1)}</span>
                  <span className="text-xs text-slate-400">({c.rating_count})</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-600">{c.jobs_completed}</p>
                  <p className="text-xs text-slate-400">jobs</p>
                </div>
              </div>
            ))}
            {(!topPerformers?.top_by_rating || topPerformers.top_by_rating.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-8">No rated performers yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

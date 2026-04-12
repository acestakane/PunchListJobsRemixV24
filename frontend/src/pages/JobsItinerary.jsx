import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import axios from "axios";
import { toast } from "sonner";
import {
  CalendarDays, Clock, DollarSign, MapPin, Building2, Briefcase,
  MessageCircle, Navigation, Calendar, Search, Ban, BellOff,
  PauseCircle, Loader2, Inbox, User, Phone, Mail, CheckCircle2,
  ChevronRight, X, Square, CheckSquare, Star, Flag, CheckCircle
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function fmtDate(iso) {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric"
  });
}

function fmtTime(iso) {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function downloadCalendar(job) {
  const start = job.start_time ? new Date(job.start_time) : new Date();
  const end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const loc = job.address || job.location?.city || "";
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${(job.title || "").replace(/[,;]/g, " ")}`,
    `DESCRIPTION:${(job.description || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${loc}`,
    "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(job.title || "job").replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function openDirections(job) {
  const addr = job.address || (job.location?.lat ? `${job.location.lat},${job.location.lng}` : null);
  if (addr) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, "_blank");
  } else {
    toast.error("No location available for this job");
  }
}

// ── Itinerary Card ────────────────────────────────────────────────────────────

function ItineraryCard({ job, isSelected, dimmed, onSelect, role, onTaskCheck, userId }) {
  const loc = job.location || {};
  const street = (job.address || loc.address || "").split(",")[0].trim();
  const city = loc.city || "";
  const state = loc.state || "";
  const zip = loc.zip || "";
  const cityLine = [city, state, zip].filter(Boolean).join(", ");

  const statusClass = {
    fulfilled: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    in_progress: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    suspended: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    completed_pending_review: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  }[job.status] || "bg-slate-100 text-slate-600";

  return (
    <div
      onClick={() => onSelect(job.id)}
      data-testid={`itinerary-card-${job.id}`}
      className={`rounded-xl border cursor-pointer transition-all duration-200 p-4 mb-3 select-none
        ${isSelected
          ? "border-[#0000FF] shadow-lg ring-2 ring-[#0000FF]/20 bg-white dark:bg-slate-800"
          : dimmed
          ? "border-slate-200 dark:border-slate-700 opacity-40 bg-white dark:bg-slate-900"
          : "border-slate-200 dark:border-slate-700 hover:border-[#0000FF]/50 hover:shadow-md bg-white dark:bg-slate-900"
        }`}
    >
      {/* Date row */}
      <div className={`text-center py-1.5 rounded-lg mb-3 text-xs font-bold
        ${isSelected ? "bg-[#0000FF] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
        <CalendarDays className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
        {fmtDate(job.start_time)}
      </div>

      {/* Time + Pay */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5 text-[#0000FF]" />
          <span className="font-semibold">{fmtTime(job.start_time)}</span>
        </div>
        <div className="flex items-center gap-0.5 text-[#0000FF] font-extrabold text-base">
          <DollarSign className="w-3.5 h-3.5" />{job.pay_rate}/hr
        </div>
      </div>

      {/* Company Name */}
      <div className="flex items-center gap-1.5 mb-1">
        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="font-semibold text-[#050A30] dark:text-white text-sm truncate">
          {job.contractor_profile?.company_name || job.contractor_name || "—"}
        </span>
      </div>

      {/* Job Role / Title */}
      <div className="flex items-center gap-1.5 mb-2">
        <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="text-slate-700 dark:text-slate-300 text-sm truncate">{job.title}</span>
      </div>

      {/* Address */}
      <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
        <MapPin className="w-3 h-3 text-[#0000FF] mt-0.5 flex-shrink-0" />
        <div>
          {street && <div>{street}</div>}
          {cityLine && <div>{cityLine}</div>}
          {!street && !cityLine && <span className="italic">No address set</span>}
        </div>
      </div>

      {/* Status */}
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusClass}`}>
        {job.status?.replace(/_/g, " ")}
      </span>

      {/* Role-specific contact info (only when selected) */}
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          {role === "crew" && job.contractor_profile?.name && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Contractor</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <User className="w-3 h-3 text-[#0000FF]" /> {job.contractor_profile.name}
              </div>
              {job.contractor_profile.phone && (
                <a href={`tel:${job.contractor_profile.phone}`}
                  className="flex items-center gap-1.5 text-xs text-[#0000FF] hover:underline"
                  onClick={e => e.stopPropagation()}>
                  <Phone className="w-3 h-3" /> {job.contractor_profile.phone}
                </a>
              )}
              {job.contractor_profile.email && (
                <a href={`mailto:${job.contractor_profile.email}`}
                  className="flex items-center gap-1.5 text-xs text-[#0000FF] hover:underline"
                  onClick={e => e.stopPropagation()}>
                  <Mail className="w-3 h-3" /> {job.contractor_profile.email}
                </a>
              )}
            </div>
          )}
          {(role === "contractor" || role === "admin" || role === "superadmin") && job.crew_profiles?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                Crew ({job.crew_profiles.length})
              </p>
              <div className="space-y-1">
                {job.crew_profiles.map(c => (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span className="font-medium">{c.name}</span>
                    {c.trade && <span className="text-slate-400">· {c.trade}</span>}
                    {c.phone && <span className="text-slate-400">· {c.phone}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PunchList Task Checklist */}
          {job.tasks?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">PunchList</p>
              <ul className="space-y-1.5">
                {job.tasks.map((task, idx) => {
                  const actorKey = role === "contractor" ? "contractor" : userId;
                  const checked = !!(job.task_completions?.[actorKey]?.[idx]);
                  return (
                    <li key={idx} className="flex items-center gap-2 cursor-pointer group"
                      onClick={e => { e.stopPropagation(); onTaskCheck && onTaskCheck(job.id, idx, !checked); }}
                      data-testid={`task-check-${job.id}-${idx}`}>
                      {checked
                        ? <CheckSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        : <Square className="w-4 h-4 text-slate-300 group-hover:text-[#0000FF] flex-shrink-0 transition-colors" />}
                      <span className={`text-xs ${checked ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-300"}`}>{task}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {isSelected && (
        <p className="mt-2 text-center text-xs text-[#0000FF] font-semibold">
          Selected — use actions below
        </p>
      )}
    </div>
  );
}

// ── Empty Pane ────────────────────────────────────────────────────────────────

function EmptyPane({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
      <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">{label}</p>
      <p className="text-xs text-slate-400 mt-1">Jobs with confirmed crew appear here</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function RatingModal({ data, onSubmit, onClose }) {
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4 pb-6 bg-black/50" data-testid="rating-modal">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-md shadow-2xl">
        <h3 className="font-bold text-[#050A30] dark:text-white mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" /> Rate {data.ratedName}
        </h3>
        <div className="flex gap-2 mb-3">
          {[1,2,3,4,5].map(n => (
            <button key={n} type="button" onClick={() => setStars(n)} data-testid={`star-${n}`}
              className={`p-1 transition-colors ${n <= stars ? "text-amber-400" : "text-slate-200 dark:text-slate-600"}`}>
              <Star className="w-7 h-7 fill-current" />
            </button>
          ))}
        </div>
        <textarea value={review} onChange={e => setReview(e.target.value)} rows={3}
          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0000FF] dark:bg-slate-800 dark:text-white mb-3 resize-none"
          placeholder="Leave a review (optional)…" data-testid="rating-review-input" />
        <div className="flex gap-2">
          <button onClick={() => stars > 0 && onSubmit(stars, review)} disabled={stars === 0}
            className="flex-1 py-2.5 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors text-sm" data-testid="rating-submit-btn">
            Submit Rating
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors text-sm">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}


export default function JobsItinerary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [activePane, setActivePane] = useState(null); // "upcoming" | "past"
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState("");
  const [disputeJobId, setDisputeJobId] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [ratingData, setRatingData] = useState(null); // {jobId, ratedId, ratedName}

  const role = user?.role;

  const fetchItinerary = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/jobs/itinerary`);
      setJobs(data);
    } catch {
      toast.error("Failed to load itinerary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItinerary(); }, [fetchItinerary]);

  const now = new Date();

  const filtered = search
    ? jobs.filter(j =>
        [j.title, j.contractor_name, j.trade, j.address, j.location?.city]
          .some(v => v?.toLowerCase().includes(search.toLowerCase()))
      )
    : jobs;

  const upcoming = filtered
    .filter(j => j.start_time && new Date(j.start_time) >= now)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const past = filtered
    .filter(j => !j.start_time || new Date(j.start_time) < now)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const selectedJob = jobs.find(j => j.id === selectedJobId) || null;

  function selectCard(jobId, pane) {
    if (selectedJobId === jobId) {
      setSelectedJobId(null);
      setActivePane(null);
    } else {
      setSelectedJobId(jobId);
      setActivePane(pane);
    }
  }

  async function handleAction(action) {
    if (!selectedJob) return;
    setActionLoading(action);
    try {
      switch (action) {
        case "cancel":
          await axios.post(`${API}/jobs/${selectedJob.id}/cancel`);
          toast.success("Job cancelled");
          setSelectedJobId(null);
          setActivePane(null);
          fetchItinerary();
          break;
        case "cancel-notify":
          await axios.post(`${API}/jobs/${selectedJob.id}/cancel-notify`);
          toast.success("Contractor notified of your cancellation intent");
          break;
        case "suspend":
          await axios.post(`${API}/jobs/${selectedJob.id}/suspend`);
          toast.success("Job suspended");
          fetchItinerary();
          break;
        case "request-suspend":
          await axios.post(`${API}/jobs/${selectedJob.id}/request-suspend`);
          toast.success("Suspension request sent to contractor");
          break;
        case "message": {
          const { data: thread } = await axios.post(`${API}/messages/threads/job/${selectedJob.id}`);
          navigate(`/messages?thread=${thread.id}`);
          break;
        }
        case "directions":
          openDirections(selectedJob);
          break;
        case "calendar":
          downloadCalendar(selectedJob);
          toast.success("Calendar event downloaded");
          break;
        default:
          break;
      }
    } catch (e) {
      const detail = e?.response?.data?.detail || "";
      if (detail.includes("UPGRADE_REQUIRED")) {
        toast.error("Upgrade your plan to use messaging");
      } else {
        toast.error(detail || `Action failed`);
      }
    } finally {
      setActionLoading(null);
    }
  }

  const isContractor = ["contractor", "admin", "superadmin"].includes(role);
  const isCrew = role === "crew";

  const handleTaskCheck = async (jobId, taskIdx, checked) => {
    try {
      await axios.put(`${API}/jobs/${jobId}/task-check`, { task_idx: taskIdx, checked });
      setJobs(prev => prev.map(j => {
        if (j.id !== jobId) return j;
        const actorKey = isContractor ? "contractor" : user?.id;
        const existing = j.task_completions || {};
        return { ...j, task_completions: { ...existing, [actorKey]: { ...(existing[actorKey] || {}), [taskIdx]: checked } } };
      }));
    } catch { toast.error("Failed to update task"); }
  };

  const handleCrewComplete = async () => {
    if (!selectedJob) return;
    try {
      await axios.post(`${API}/jobs/${selectedJob.id}/crew-complete`);
      toast.success("Job completion submitted!");
      fetchItinerary();
      // Prompt crew to rate contractor
      if (selectedJob.contractor_id) {
        setRatingData({ jobId: selectedJob.id, ratedId: selectedJob.contractor_id, ratedName: selectedJob.contractor_name || "Contractor" });
      }
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to submit"); }
  };

  const handleContractorComplete = async () => {
    if (!selectedJob) return;
    try {
      await axios.post(`${API}/jobs/${selectedJob.id}/contractor-complete`);
      toast.success("Job marked complete!");
      fetchItinerary();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to complete"); }
  };

  const submitDispute = async () => {
    if (!disputeJobId || !disputeReason.trim()) { toast.error("Please enter a dispute reason"); return; }
    try {
      await axios.post(`${API}/jobs/${disputeJobId}/dispute`, { reason: disputeReason });
      toast.success("Dispute submitted for admin review");
      setDisputeJobId(null); setDisputeReason("");
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to submit dispute"); }
  };

  const submitRating = async (stars, review) => {
    if (!ratingData) return;
    try {
      await axios.post(`${API}/jobs/${ratingData.jobId}/rate`, { rated_id: ratingData.ratedId, stars, review });
      toast.success("Rating submitted!");
      setRatingData(null);
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to submit rating"); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--theme-nav-bg)" }}>
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#050A30] dark:text-white"
                style={{ fontFamily: "Manrope, sans-serif" }}>
                Jobs Itinerary
              </h1>
              <p className="text-sm text-slate-500">
                {jobs.length} scheduled job{jobs.length !== 1 ? "s" : ""} · {upcoming.length} upcoming · {past.length} past
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs…"
              data-testid="itinerary-search"
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0000FF]/30 w-52"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#0000FF]" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-300 font-semibold text-lg">No Jobs Available!</p>
            <p className="text-xs text-slate-400 mt-1">Jobs with confirmed crew agreements will appear here</p>
          </div>
        ) : (
          <>
            {/* Split Pane */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

              {/* Upcoming Pane */}
              <div
                data-testid="upcoming-pane"
                className={`rounded-2xl border overflow-hidden transition-opacity duration-200
                  ${activePane === "past" ? "opacity-50" : ""}
                  border-slate-200 dark:border-slate-700`}
              >
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
                  <h2 className="font-extrabold text-[#050A30] dark:text-white text-sm flex items-center gap-2"
                    style={{ fontFamily: "Manrope, sans-serif" }}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Upcoming Jobs
                  </h2>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {upcoming.length}
                  </span>
                </div>
                <div className="p-3 overflow-y-auto bg-slate-50 dark:bg-slate-900/50"
                  style={{ maxHeight: "calc(100vh - 380px)", minHeight: "200px" }}>
                  {upcoming.length === 0
                    ? <EmptyPane label="No upcoming scheduled jobs" />
                    : upcoming.map(job => (
                        <ItineraryCard
                          key={job.id}
                          job={job}
                          role={role}
                          userId={user?.id}
                          isSelected={selectedJobId === job.id}
                          dimmed={activePane === "past" && selectedJobId !== null}
                          onSelect={(id) => selectCard(id, "upcoming")}
                          onTaskCheck={handleTaskCheck}
                        />
                      ))
                  }
                </div>
              </div>

              {/* Past Pane */}
              <div
                data-testid="past-pane"
                className={`rounded-2xl border overflow-hidden transition-opacity duration-200
                  ${activePane === "upcoming" ? "opacity-50" : ""}
                  border-slate-200 dark:border-slate-700`}
              >
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
                  <h2 className="font-extrabold text-[#050A30] dark:text-white text-sm flex items-center gap-2"
                    style={{ fontFamily: "Manrope, sans-serif" }}>
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                    Past Jobs
                  </h2>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {past.length}
                  </span>
                </div>
                <div className="p-3 overflow-y-auto bg-slate-50 dark:bg-slate-900/50"
                  style={{ maxHeight: "calc(100vh - 380px)", minHeight: "200px" }}>
                  {past.length === 0
                    ? <EmptyPane label="No past scheduled jobs" />
                    : past.map(job => (
                        <ItineraryCard
                          key={job.id}
                          job={job}
                          role={role}
                          userId={user?.id}
                          isSelected={selectedJobId === job.id}
                          dimmed={activePane === "upcoming" && selectedJobId !== null}
                          onSelect={(id) => selectCard(id, "past")}
                          onTaskCheck={handleTaskCheck}
                        />
                      ))
                  }
                </div>
              </div>
            </div>

            {/* Spacer when footer bar is visible */}
            {selectedJob && <div className="h-20" />}
          </>
        )}
      </div>

      {/* Sticky Footer Action Bar */}
      <div
        data-testid="itinerary-footer-bar"
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300
          ${selectedJob ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}
      >
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 flex-wrap">

              {/* Job title label */}
              {selectedJob && (
                <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:block truncate max-w-36">
                  {selectedJob.title}
                </span>
              )}

              {/* Cancel — Contractor only */}
              {isContractor && (
                <button
                  onClick={() => handleAction("cancel")}
                  disabled={!!actionLoading}
                  data-testid="footer-cancel-btn"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {actionLoading === "cancel"
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Ban className="w-3.5 h-3.5" />}
                  Cancel
                </button>
              )}

              {/* Cancel Notify — Crew only */}
              {isCrew && (
                <button
                  onClick={() => handleAction("cancel-notify")}
                  disabled={!!actionLoading}
                  data-testid="footer-cancel-notify-btn"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-orange-600 border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50"
                >
                  {actionLoading === "cancel-notify"
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <BellOff className="w-3.5 h-3.5" />}
                  Cancel Notify
                </button>
              )}

              {/* Suspend — Contractor only */}
              {isContractor && (
                <button
                  onClick={() => handleAction("suspend")}
                  disabled={!!actionLoading}
                  data-testid="footer-suspend-btn"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-amber-600 border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                >
                  {actionLoading === "suspend"
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <PauseCircle className="w-3.5 h-3.5" />}
                  Suspend
                </button>
              )}

              {/* Request Suspend — Crew only */}
              {isCrew && (
                <button
                  onClick={() => handleAction("request-suspend")}
                  disabled={!!actionLoading}
                  data-testid="footer-request-suspend-btn"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-amber-600 border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                >
                  {actionLoading === "request-suspend"
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <PauseCircle className="w-3.5 h-3.5" />}
                  Req. Suspend
                </button>
              )}

              {/* Message — all */}
              <button
                onClick={() => handleAction("message")}
                disabled={!!actionLoading}
                data-testid="footer-message-btn"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#0000FF] hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === "message"
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <MessageCircle className="w-3.5 h-3.5" />}
                Message
              </button>

              {/* Directions — all */}
              <button
                onClick={() => handleAction("directions")}
                disabled={!!actionLoading}
                data-testid="footer-directions-btn"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <Navigation className="w-3.5 h-3.5" />
                Directions
              </button>

              {/* Add to Calendar — all */}
              <button
                onClick={() => handleAction("calendar")}
                disabled={!!actionLoading}
                data-testid="footer-calendar-btn"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <Calendar className="w-3.5 h-3.5" />
                Add to Calendar
              </button>

              {/* Submit Complete — Crew */}
              {isCrew && selectedJob && (
                <button
                  onClick={handleCrewComplete}
                  disabled={!!actionLoading}
                  data-testid="footer-crew-complete-btn"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Submit Complete
                </button>
              )}

              {/* Set Complete — Contractor */}
              {isContractor && selectedJob && (
                <button
                  onClick={handleContractorComplete}
                  disabled={!!actionLoading}
                  data-testid="footer-contractor-complete-btn"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Set Complete
                </button>
              )}

              {/* Report Issue */}
              {selectedJob && (
                <button
                  onClick={() => { setDisputeJobId(selectedJob.id); setDisputeReason(""); }}
                  data-testid="footer-dispute-btn"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" /> Report Issue
                </button>
              )}

              {/* Rate — post completion */}
              {isCrew && selectedJob?.status === "completed_pending_review" && selectedJob?.contractor_id && (
                <button
                  onClick={() => setRatingData({ jobId: selectedJob.id, ratedId: selectedJob.contractor_id, ratedName: selectedJob.contractor_name || "Contractor" })}
                  data-testid="footer-rate-btn"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-amber-600 border border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <Star className="w-3.5 h-3.5" /> Rate Contractor
                </button>
              )}

              {/* Deselect */}
              <button
                onClick={() => { setSelectedJobId(null); setActivePane(null); }}
                data-testid="footer-deselect-btn"
                className="ml-auto flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Deselect
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      {disputeJobId && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4 pb-6 bg-black/50" data-testid="dispute-modal">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-[#050A30] dark:text-white mb-3 flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-500" /> Report an Issue
            </h3>
            <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} rows={4}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0000FF] dark:bg-slate-800 dark:text-white mb-3 resize-none"
              placeholder="Describe the issue…" data-testid="dispute-reason-input" />
            <div className="flex gap-2">
              <button onClick={submitDispute}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors text-sm" data-testid="dispute-submit-btn">
                Submit
              </button>
              <button onClick={() => setDisputeJobId(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingData && (
        <RatingModal data={ratingData} onSubmit={submitRating} onClose={() => setRatingData(null)} />
      )}
    </div>
  );
}

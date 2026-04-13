import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWebSocket } from "../contexts/WebSocketContext";
import TradeSelect from "../components/TradeSelect";
import Navbar from "../components/Navbar";
import JobMap from "../components/JobMap";
import JobCard from "../components/JobCard";
import { JobDetailModal } from "../components/crew/JobDetailModal";
import { CrewSidebar } from "../components/crew/CrewSidebar";
import { ProfileCompletionPopup } from "../components/ProfileCompletionPopup";
import { toast } from "sonner";
import axios from "axios";
import {
  MapPin, List, Zap, Clock, AlertCircle, Navigation, ToggleLeft, ToggleRight, RefreshCw,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const REVEAL_CONTACT_PRICE = 2.99;

export default function CrewDashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { addListener, sendLocation, connected, pushAlert } = useWebSocket();
  const [view, setView] = useState("map");
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(user?.is_online ?? user?.availability ?? false);
  const [loading, setLoading] = useState(true);
  const [tradeFilter, setTradeFilter] = useState("");
  const [grouped, setGrouped] = useState([]);
  const [radius, setRadius] = useState(25);
  const [smartMatch, setSmartMatch] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [contractorInfo, setContractorInfo] = useState(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [subStatus, setSubStatus] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(null);
  const [crewRequests, setCrewRequests] = useState([]);
  const [profileBoost, setProfileBoost] = useState(null);
  const [boostLoading, setBoostLoading] = useState(false);
  const [showCompleteProfilePopup, setShowCompleteProfilePopup] = useState(false);
  const watchIdRef = React.useRef(null);

  // ─── Data fetchers ──────────────────────────────────────────────────────────

  const fetchJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tradeFilter) {
        if (tradeFilter.startsWith("__cat__:")) {
          params.append("category", tradeFilter.replace("__cat__:", ""));
        } else {
          params.append("trade", tradeFilter.toLowerCase());
        }
      }
      if (userLocation && locationEnabled) {
        params.append("lat", userLocation.lat);
        params.append("lng", userLocation.lng);
        params.append("radius", radius);
      }
      if (smartMatch) params.append("smart_match", "true");
      const res = await axios.get(`${API}/jobs/?${params}`);
      setJobs(res.data);
    } catch (e) { console.error("Failed to fetch jobs", e); }
  }, [tradeFilter, userLocation, radius, smartMatch, locationEnabled]);

  const fetchMyJobs = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/jobs/my-jobs`);
      setMyJobs(res.data);
    } catch (e) { console.error("fetchMyJobs failed", e); }
  }, []);

  const fetchSubStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/payments/subscription/status`);
      setSubStatus(res.data);
    } catch (e) { console.error("fetchSubStatus failed", e); }
  }, []);

  const fetchProfileCompletion = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/users/profile-completion`);
      setProfileCompletion(res.data);
      if (!res.data.is_complete) setShowCompleteProfilePopup(true);
    } catch (e) { console.error("fetchProfileCompletion failed", e); }
  }, []);

  const fetchCrewRequests = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/users/requests`);
      setCrewRequests(res.data);
    } catch (e) { console.error("fetchCrewRequests failed", e); }
  }, []);

  const fetchProfileBoost = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/boost/profile/status`);
      setProfileBoost(res.data);
    } catch (e) { console.error("fetchProfileBoost failed", e); }
  }, []);

  const activateProfileBoost = async () => {
    setBoostLoading(true);
    try {
      const res = await axios.post(`${API}/boost/profile`);
      toast.success(`Profile boosted for 7 days! ($${res.data.amount_charged} demo charge)`);
      fetchProfileBoost();
    } catch (e) { toast.error(e?.response?.data?.detail || "Boost failed"); }
    finally { setBoostLoading(false); }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchJobs(), fetchMyJobs(), fetchSubStatus(), fetchProfileCompletion(), fetchCrewRequests(), fetchProfileBoost()]);
      setLoading(false);
    };
    init();
    axios.get(`${API}/trades`).then(r => setGrouped(r.data.categories || [])).catch(() => {});
  }, [fetchJobs, fetchMyJobs, fetchSubStatus, fetchProfileCompletion, fetchCrewRequests, fetchProfileBoost]);

  // WebSocket: new job notifications + crew requests + job workflow
  useEffect(() => {
    const remove = addListener((msg) => {
      if (msg.type === "new_job") {
        setJobs(prev => [msg.job, ...prev.filter(j => j.id !== msg.job.id)]);
        const prefix = msg.job.is_emergency ? "EMERGENCY: " : "New job: ";
        const text = `${prefix}${msg.job.title} - $${msg.job.pay_rate}/hr`;
        toast.info(text, { action: { label: "View", onClick: () => setSelectedJob(msg.job) } });
        pushAlert(text, msg.job.is_emergency ? "warning" : "info");
      }
      if (msg.type === "crew_request") {
        const text = `${msg.contractor_name} wants to hire you!`;
        toast.info(text, { action: { label: "View", onClick: () => fetchCrewRequests() } });
        pushAlert(text, "info");
        fetchCrewRequests();
      }
      if (msg.type === "cancel_accepted") {
        const text = `Your cancel request for "${msg.job_title}" was approved.`;
        toast.success(text); pushAlert(text, "success");
        fetchMyJobs(); fetchJobs();
      }
      if (msg.type === "cancel_denied") {
        const text = `Your cancel request for "${msg.job_title}" was denied.`;
        toast.info(text); pushAlert(text, "info");
      }
      if (msg.type === "application_approved") {
        const text = `Your application for "${msg.job_title}" was approved!`;
        toast.success(text); pushAlert(text, "success");
        fetchMyJobs(); fetchJobs();
      }
      if (msg.type === "application_declined") {
        const text = `Your application for "${msg.job_title}" was not selected.`;
        toast.info(text); pushAlert(text, "info");
        fetchMyJobs();
      }
      if (msg.type === "job_started") {
        const text = `"${msg.job_title}" has started! Proceed to site.`;
        toast.success(text); pushAlert(text, "success");
        fetchMyJobs();
      }
    });
    return remove;
  }, [addListener, fetchCrewRequests, fetchMyJobs, fetchJobs, pushAlert]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const toggleLocation = () => {
    if (!locationEnabled) {
      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(loc);
            sendLocation(loc.lat, loc.lng);
            axios.post(`${API}/users/location`, { lat: loc.lat, lng: loc.lng }).catch(() => {});
          },
          (err) => { if (err.code === 1) toast.error("Location access denied. Please allow in browser settings."); },
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
        );
        watchIdRef.current = id;
        setLocationEnabled(true);
        localStorage.setItem("gps_enabled", "1");
        toast.success("Live GPS tracking enabled. Showing nearby jobs.");
      }
    } else {
      if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
      setLocationEnabled(false); setUserLocation(null);
      localStorage.removeItem("gps_enabled");
      toast.info("Location tracking disabled.");
    }
  };

  // Auto-restore GPS from previous session
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (localStorage.getItem("gps_enabled") === "1") toggleLocation(); }, []);

  useEffect(() => { return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); }; }, []);

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    try {
      await axios.put(`${API}/users/online-status`, { is_online: newStatus });
      setIsOnline(newStatus);
      toast.success(newStatus ? "You are now Online — visible to contractors" : "You are now Offline");
    } catch { toast.error("Failed to update status"); }
  };

  const acceptJob = async (jobId) => {
    if (subStatus?.status === "expired") { toast.error("Subscription expired. Please renew to accept jobs."); return; }
    try {
      await axios.post(`${API}/jobs/${jobId}/accept`);
      toast.success(selectedJob?.is_emergency ? "Emergency job accepted!" : "Application submitted! Awaiting contractor approval.");
      fetchJobs(); fetchMyJobs();
    } catch (e) {
      const detail = e?.response?.data?.detail || "";
      if (detail.includes("SUBSCRIPTION_EXPIRED")) toast.error("Your subscription has expired. Please renew.");
      else if (detail.includes("already claimed")) toast.warning("Someone else got this emergency job first!");
      else toast.error(detail || "Failed to accept job");
    }
  };

  const completeJob = async (jobId) => {
    try {
      await axios.post(`${API}/jobs/${jobId}/complete`);
      toast.success("Job marked as complete. Awaiting contractor verification.");
      fetchMyJobs(); refreshUser();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const withdrawJob = async (jobId) => {
    try {
      await axios.post(`${API}/jobs/${jobId}/withdraw`);
      toast.success("Withdrawn from job.");
      fetchMyJobs(); fetchJobs();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to withdraw"); }
  };

  const messageContractor = async (jobId) => {
    try {
      const { data } = await axios.post(`${API}/messages/threads/job/${jobId}`);
      navigate(`/messages?thread=${data.id}`);
    } catch (e) {
      const detail = e?.response?.data?.detail || "";
      if (detail.includes("UPGRADE_REQUIRED")) toast.error("Upgrade your plan to message contractors");
      else toast.error(detail || "Failed to open chat");
    }
  };

  const messageAdmin = async () => {
    try {
      const { data } = await axios.post(`${API}/messages/threads/admin`);
      navigate(`/messages?thread=${data.id}`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to open support chat"); }
  };

  useEffect(() => {
    if (selectedJob?.contractor_id) {
      axios.get(`${API}/users/public/${selectedJob.contractor_id}?job_id=${selectedJob.id}`)
        .then(r => setContractorInfo(r.data))
        .catch(() => setContractorInfo(null));
    } else {
      setContractorInfo(null);
    }
  }, [selectedJob]);

  const revealContactInfo = async () => {
    setRevealLoading(true);
    try {
      const res = await axios.post(`${API}/jobs/${selectedJob.id}/reveal-contact`);
      toast.success(`Contact info unlocked! ($${res.data.amount || REVEAL_CONTACT_PRICE} demo charge)`);
      const updated = await axios.get(`${API}/users/public/${selectedJob.contractor_id}?job_id=${selectedJob.id}`);
      setContractorInfo(updated.data);
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to unlock contact info"); }
    finally { setRevealLoading(false); }
  };

  const shareJob = async (job) => {
    const shareUrl = `${window.location.origin}/api/j/${job.id}`;
    const shareText = `${job.title} — $${job.pay_rate}/hr in ${job.location?.city || "your area"}`;
    if (navigator.share) {
      try { await navigator.share({ title: job.title, text: shareText, url: shareUrl }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Job link copied to clipboard!");
    }
  };

  const acceptCrewRequest = async (requestId) => {
    try {
      await axios.put(`${API}/users/requests/${requestId}/accept`);
      toast.success("Request accepted!"); fetchCrewRequests();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to accept"); }
  };

  const declineCrewRequest = async (requestId) => {
    try {
      await axios.put(`${API}/users/requests/${requestId}/decline`);
      toast.info("Request declined."); fetchCrewRequests();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to decline"); }
  };

  // ─── Derived state ───────────────────────────────────────────────────────────
  const acceptedIds = myJobs.filter(j => j.my_status !== "pending").map(j => j.id);
  const pendingIds  = myJobs.filter(j => j.my_status === "pending").map(j => j.id);
  const isExpired = subStatus?.status === "expired";
  const mapJobs = [
    ...jobs,
    ...myJobs.filter(j => j.my_status === "pending" && !jobs.some(jb => jb.id === j.id)),
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617]" style={{ fontFamily: "Inter, sans-serif" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Subscription Expired Banner */}
        {isExpired && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-3 mb-4 flex items-center gap-3" data-testid="subscription-expired-banner">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700 dark:text-red-300">Subscription Expired</p>
              <p className="text-xs text-red-600 dark:text-red-400">Renew to accept jobs and appear on the map</p>
            </div>
            <a href="/subscription" className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors" data-testid="renew-subscription-btn">
              Renew Now
            </a>
          </div>
        )}

        {/* Free plan usage warning */}
        {subStatus?.status === "free" && subStatus.usage_remaining <= 1 && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {subStatus.usage_remaining === 0
                ? <>Free plan limit reached. <a href="/subscription" className="ml-1 underline font-semibold">Upgrade to respond to more jobs.</a></>
                : <><strong>{subStatus.usage_remaining} response</strong> remaining this month. <a href="/subscription" className="ml-1 underline font-semibold">Upgrade for unlimited.</a></>
              }
            </p>
          </div>
        )}

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#050A30] dark:text-white" style={{ fontFamily: "Manrope, sans-serif" }}>
              {user?.name?.split(" ")[0]}'s Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full capitalize" data-testid="user-role-badge">
                Crew Member
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-400"}`} />
                {connected ? "Live updates active" : "Connecting..."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={toggleOnlineStatus}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border-2 transition-all ${isOnline ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"}`}
              data-testid="online-status-toggle">
              {isOnline ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {isOnline ? "Online" : "Offline"}
            </button>
            <button onClick={toggleLocation}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border-2 transition-all ${locationEnabled ? "bg-blue-600 border-blue-600 text-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"}`}
              data-testid="location-toggle">
              <Navigation className="w-4 h-4" />
              {locationEnabled ? "LIVE ON MAP" : "Enable Location"}
            </button>
            <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
              <button onClick={() => setView("map")}
                className={`px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1 transition-colors ${view === "map" ? "bg-[#0000FF] text-white" : "text-slate-500"}`}
                data-testid="view-map-btn">
                <MapPin className="w-4 h-4" /> Map
              </button>
              <button onClick={() => setView("list")}
                className={`px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1 transition-colors ${view === "list" ? "bg-[#0000FF] text-white" : "text-slate-500"}`}
                data-testid="view-list-btn">
                <List className="w-4 h-4" /> List
              </button>
            </div>
            <button onClick={() => setSmartMatch(!smartMatch)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${smartMatch ? "border-transparent text-[#050A30]" : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-[#0000FF]"}`}
              style={smartMatch ? { backgroundColor: "var(--theme-accent)" } : {}}
              data-testid="smart-match-btn">
              <Zap className="w-4 h-4" /> Smart Match
            </button>
          </div>
        </div>

        {/* Smart Match Banner */}
        {smartMatch && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mb-2"
            style={{ backgroundColor: "var(--theme-accent)" + "22", border: "1px solid var(--theme-accent)", color: "var(--theme-accent)" }}
            data-testid="smart-match-banner">
            <Zap className="w-4 h-4 flex-shrink-0" />
            Smart Match active — jobs ranked by trade fit (40%) + proximity (30%) + skill overlap (30%)
          </div>
        )}

        {/* Filters Row */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <div className="flex-1 min-w-[180px] max-w-xs">
            <TradeSelect grouped={grouped} value={tradeFilter} onChange={setTradeFilter} placeholder="All Trades" data-testid="filter-trade-select" />
          </div>
          <select value={radius} onChange={e => setRadius(Number(e.target.value))}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            data-testid="radius-select">
            {[10, 25, 50, 100].map(r => <option key={r} value={r}>{r} mi</option>)}
          </select>
          <button onClick={fetchJobs}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1"
            data-testid="refresh-btn">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map / Job List */}
          <div className="lg:col-span-2">
            {view === "map" ? (
              <JobMap jobs={mapJobs} pendingJobIds={pendingIds} userLocation={locationEnabled ? userLocation : null}
                onLocate={v => setUserLocation(v)} profileAddress={user?.address} onJobClick={setSelectedJob}
                onRefresh={fetchJobs} onRadiusChange={setRadius} height="500px" />
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {loading ? (
                  Array(3).fill(0).map((_, i) => <div key={i} className="card p-4 animate-pulse h-32 bg-slate-200 dark:bg-slate-800" />)
                ) : jobs.length === 0 ? (
                  <div className="card p-10 text-center">
                    <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No jobs found</p>
                    <p className="text-slate-400 text-sm mt-1">Try enabling GPS or expanding radius</p>
                  </div>
                ) : jobs.map(job => (
                  <div key={job.id} className="relative">
                    {smartMatch && job.match_score !== undefined && (
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shadow"
                        style={{
                          backgroundColor: job.match_score >= 0.7 ? "var(--theme-accent)" : job.match_score >= 0.45 ? "#fbbf24" : "#94a3b8",
                          color: "#050A30",
                        }}
                        data-testid={`match-score-${job.id}`}>
                        <Zap className="w-3 h-3" />
                        {Math.round(job.match_score * 100)}%
                      </div>
                    )}
                    {pendingIds.includes(job.id) && (
                      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300" data-testid={`pending-badge-${job.id}`}>
                        Pending
                      </div>
                    )}
                    <JobCard job={job} onAccept={acceptJob} onComplete={completeJob} onPreview={setSelectedJob}
                      onShare={acceptedIds.includes(job.id) && !pendingIds.includes(job.id) ? shareJob : undefined}
                      currentUser={user} isAccepted={acceptedIds.includes(job.id) || pendingIds.includes(job.id)}
                      isPending={pendingIds.includes(job.id)} isExpired={isExpired} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CrewSidebar
              user={user}
              profileCompletion={profileCompletion}
              profileBoost={profileBoost}
              boostLoading={boostLoading}
              myJobs={myJobs}
              crewRequests={crewRequests}
              pendingIds={pendingIds}
              acceptedIds={acceptedIds}
              onBoost={activateProfileBoost}
              onWithdraw={withdrawJob}
              onMessageAdmin={messageAdmin}
              onAcceptRequest={acceptCrewRequest}
              onDeclineRequest={declineCrewRequest}
              onSelectJob={setSelectedJob}
            />
          </div>
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          contractorInfo={contractorInfo}
          acceptedIds={acceptedIds}
          pendingIds={pendingIds}
          isExpired={isExpired}
          revealLoading={revealLoading}
          revealPrice={REVEAL_CONTACT_PRICE}
          onClose={() => setSelectedJob(null)}
          onAccept={acceptJob}
          onReveal={revealContactInfo}
          onMessage={messageContractor}
          onShare={shareJob}
        />
      )}

      {/* Profile Completion Popup */}
      {showCompleteProfilePopup && (
        <ProfileCompletionPopup
          profileCompletion={profileCompletion}
          onClose={() => setShowCompleteProfilePopup(false)}
        />
      )}
    </div>
  );
}

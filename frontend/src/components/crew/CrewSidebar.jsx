import React from "react";
import JobCard from "../JobCard";
import {
  Camera, Phone, MapPin, ClipboardList, FileText, CheckCircle,
  Zap, Star, Clock, MessageCircle, UserCheck, UserX, LogOut, AlertTriangle,
} from "lucide-react";

/**
 * Bundled right-hand sidebar for the Crew Dashboard.
 * Accepts all display data + action callbacks from the parent.
 */
export function CrewSidebar({
  user, profileCompletion, profileBoost, boostLoading, myJobs,
  crewRequests, pendingIds, acceptedIds,
  onBoost, onWithdraw, onMessageAdmin, onAcceptRequest, onDeclineRequest, onSelectJob,
}) {
  const activeJobs = myJobs.filter(j => j.my_status === "accepted");
  const pendingJobs = myJobs.filter(j => j.my_status === "pending");
  const pendingRequests = crewRequests.filter(r => r.status === "pending");

  return (
    <div className="space-y-4">
      {/* Profile Completion */}
      {profileCompletion && !profileCompletion.is_complete && (
        <div className="card p-4" data-testid="profile-completion-panel">
          <h3 className="font-bold text-[#050A30] dark:text-white text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
            <Clock className="w-4 h-4 text-amber-500" />
            Profile Completion ({profileCompletion.percentage}%)
          </h3>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3">
            <div className="bg-[#0000FF] h-2 rounded-full transition-all" style={{ width: `${profileCompletion.percentage}%` }} />
          </div>
          <div className="space-y-2">
            {[
              { key: "photo", icon: Camera, label: "Profile Photo" },
              { key: "phone", icon: Phone, label: "Phone Number" },
              { key: "address", icon: MapPin, label: "Location/Address" },
              { key: "skills", icon: ClipboardList, label: "Trade/Skills" },
              { key: "bio", icon: FileText, label: "Bio" },
            ].map(({ key, icon: Icon, label }) => (
              <div key={key} className="flex items-center gap-2">
                {profileCompletion.checks[key] ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                )}
                <span className={`text-xs ${profileCompletion.checks[key] ? "text-slate-400 line-through" : "text-slate-600 dark:text-slate-300"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <a href="/profile" className="mt-3 block text-center text-xs font-bold text-[#0000FF] hover:underline" data-testid="complete-profile-link">
            Complete Profile →
          </a>
        </div>
      )}

      {/* Quick Stats */}
      <div className="card p-4">
        <h3 className="font-bold text-[#050A30] dark:text-white text-sm mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>Your Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
            <div className="text-2xl font-extrabold text-[#0000FF]">{user?.jobs_completed || 0}</div>
            <div className="text-xs text-slate-500">Jobs Done</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-3 text-center">
            <div className="text-2xl font-extrabold text-amber-500">{user?.rating_count > 0 ? user.rating.toFixed(1) : "—"}</div>
            <div className="text-xs text-slate-500">Rating</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg p-3 text-center">
            <div className="text-2xl font-extrabold text-emerald-500">{user?.points || 0}</div>
            <div className="text-xs text-slate-500">Points</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3 text-center">
            <div className="text-2xl font-extrabold text-purple-500">{acceptedIds.length}</div>
            <div className="text-xs text-slate-500">Accepted</div>
          </div>
          <div className="col-span-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg p-3 text-center" data-testid="accepted-jobs-count">
            <div className="text-2xl font-extrabold text-emerald-600">{acceptedIds.length}</div>
            <div className="text-xs text-slate-500">Accepted Jobs</div>
          </div>
        </div>
      </div>

      {/* Profile Boost */}
      {profileBoost?.is_boosted ? (
        <div className="card p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border border-purple-200 dark:border-purple-700" data-testid="boost-active-card">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-purple-500" />
            <p className="text-sm font-bold text-purple-700 dark:text-purple-300">Profile Boosted</p>
          </div>
          <p className="text-xs text-slate-500">
            Expires {new Date(profileBoost.expires_at).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <div className="card p-4" data-testid="profile-boost-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <p className="text-sm font-bold text-[#050A30] dark:text-white">Boost Profile</p>
            </div>
            <span className="text-xs text-purple-600 font-bold">${profileBoost?.price ?? "4.99"}</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">Get priority visibility for 7 days</p>
          <button onClick={onBoost} disabled={boostLoading}
            className="w-full py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors"
            data-testid="boost-profile-btn">
            {boostLoading ? "Activating..." : "Boost Now (Demo)"}
          </button>
        </div>
      )}

      {/* Pending Applications */}
      {pendingJobs.length > 0 && (
        <div className="card p-4" data-testid="pending-jobs-panel">
          <h3 className="font-bold text-[#050A30] dark:text-white text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
            <Clock className="w-4 h-4 text-amber-500" />
            Pending Applications ({pendingJobs.length})
          </h3>
          <div className="space-y-2">
            {pendingJobs.map(job => (
              <div key={job.id} className="flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700" data-testid={`pending-job-${job.id}`}>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{job.title}</p>
                  <p className="text-[10px] text-slate-500">${job.pay_rate}/hr · Awaiting approval</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <button onClick={() => onSelectJob(job)} className="text-[10px] text-blue-500 hover:text-blue-700 transition-colors" data-testid={`preview-pending-${job.id}`}>View</button>
                  <button onClick={() => onWithdraw(job.id)} className="text-[10px] text-red-400 hover:text-red-600" data-testid={`withdraw-pending-${job.id}`}>Cancel</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Jobs */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[#050A30] dark:text-white text-sm" style={{ fontFamily: "Manrope, sans-serif" }}>My Jobs</h3>
          <button onClick={onMessageAdmin} className="text-xs flex items-center gap-1 text-[#0000FF] dark:text-blue-400 hover:underline font-semibold" data-testid="crew-message-admin-btn">
            <MessageCircle className="w-3 h-3" /> Admin Support
          </button>
        </div>
        {activeJobs.length === 0 ? (
          <p className="text-slate-400 text-sm">No active jobs. Accept a job to get started!</p>
        ) : (
          <div className="space-y-2">
            {activeJobs.map(job => (
              <div key={job.id}>
                <JobCard job={job} onComplete={() => {}} currentUser={{ role: "crew" }} isAccepted />
                <div className="flex items-center gap-2 mt-1 px-1">
                  {job.status === "suspended" ? (
                    <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Suspended by contractor
                    </span>
                  ) : (
                    <button onClick={() => onWithdraw(job.id)}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                      data-testid={`withdraw-job-${job.id}`}>
                      <LogOut className="w-3 h-3" /> Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crew Requests */}
      {pendingRequests.length > 0 && (
        <div className="card p-4" data-testid="crew-requests-panel">
          <h3 className="font-bold text-[#050A30] dark:text-white text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
            <MessageCircle className="w-4 h-4 text-[#0000FF]" />
            Crew Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-2">
            {pendingRequests.slice(0, 5).map(req => (
              <div key={req.id} className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3" data-testid={`crew-request-${req.id}`}>
                <p className="text-sm font-bold text-[#050A30] dark:text-white">{req.contractor_name}</p>
                {req.contractor_company && <p className="text-xs text-slate-500">{req.contractor_company}</p>}
                {req.message && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{req.message}</p>}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => onAcceptRequest(req.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    data-testid={`accept-request-${req.id}`}>
                    <UserCheck className="w-3 h-3" /> Accept
                  </button>
                  <button onClick={() => onDeclineRequest(req.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300"
                    data-testid={`decline-request-${req.id}`}>
                    <UserX className="w-3 h-3" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral Code */}
      <div className="card p-4 bg-gradient-to-br from-slate-800 to-blue-900 dark:from-slate-900 dark:to-blue-950">
        <h3 className="font-bold text-white text-sm mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>Your Referral Code</h3>
        <div className="bg-white/10 rounded-lg px-4 py-2 text-sky-300 font-mono font-bold text-lg text-center mb-2">
          {user?.referral_code}
        </div>
        <p className="text-slate-300 text-xs text-center">Share & earn 100 points per referral</p>
      </div>
    </div>
  );
}

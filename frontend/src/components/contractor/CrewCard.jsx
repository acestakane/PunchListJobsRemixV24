import React from "react";
import { toast } from "sonner";
import { Star, ExternalLink, Share2, UserCheck, AlertCircle } from "lucide-react";
import { UPGRADE_MSG } from "../../utils/subscription";

export function CrewCard({ member, onRequest, onViewProfile, isViewerFree, showTransportType }) {
  const shareProfile = () => {
    const url = `${window.location.origin}/profile/${member.id}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Profile link copied!"));
  };

  return (
    <div className="card p-4 space-y-3" data-testid={`crew-card-${member.id}`}>
      <div className="flex items-start gap-3">
        {member.profile_photo ? (
          <img src={`${process.env.REACT_APP_BACKEND_URL}${member.profile_photo}`} alt={member.name}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-11 h-11 bg-[#050A30] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
            {member.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[#050A30] dark:text-white truncate">{member.name}</p>
            {member.is_online && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Online" />}
          </div>
          <p className="text-xs text-slate-500 capitalize">
            {(member.trade?.startsWith("__cat__:") ? member.trade.replace("__cat__:", "") : member.trade) || "General Labor"}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 text-amber-400 fill-current" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {member.rating_count > 0 ? member.rating?.toFixed(1) : "New"} ({member.rating_count || 0})
            </span>
          </div>
        </div>
        <div className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex-shrink-0">
          {member.jobs_completed || 0} jobs
        </div>
      </div>

      {member.bio && <p className="text-xs text-slate-500 line-clamp-2">{member.bio}</p>}

      {member.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {member.skills.slice(0, 3).map(s => (
            <span key={s} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
      )}

      {showTransportType && member.transportation_type && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold"
            data-testid={`crew-transport-${member.id}`}>
            {member.transportation_type}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5">
        <button onClick={() => onViewProfile(member.id)}
          className="flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors"
          data-testid={`view-profile-${member.id}`}>
          <ExternalLink className="w-3 h-3" /> View
        </button>
        <button onClick={shareProfile}
          className="flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors"
          data-testid={`share-profile-${member.id}`}>
          <Share2 className="w-3 h-3" /> Share
        </button>
        <button onClick={() => onRequest(member)}
          className={`flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${isViewerFree ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed" : "bg-[#0000FF] text-white hover:bg-blue-700"}`}
          data-testid={`request-crew-${member.id}`}
          title={isViewerFree ? UPGRADE_MSG : "Request crew"}>
          {isViewerFree
            ? <><AlertCircle className="w-3 h-3" /> Locked</>
            : <><UserCheck className="w-3 h-3" /> Request</>
          }
        </button>
      </div>
    </div>
  );
}

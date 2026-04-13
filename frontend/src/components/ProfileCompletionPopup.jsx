import React from "react";
import { X, AlertTriangle } from "lucide-react";

/**
 * Shared popup shown on first load when user's profile is incomplete.
 * Used by ContractorDashboard and CrewDashboard.
 */
export function ProfileCompletionPopup({ profileCompletion, onClose }) {
  if (!profileCompletion || profileCompletion.is_complete) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[12] flex items-center justify-center p-4" data-testid="profile-completion-popup">
      <div className="card max-w-sm w-full p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <h3 className="font-extrabold text-[#050A30] dark:text-white text-lg" style={{ fontFamily: "Manrope, sans-serif" }}>
            Complete Your Profile
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Complete your profile for a better experience!
          </p>
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-500">Progress</span>
            <span className="text-[#0000FF]">{profileCompletion.percentage}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div className="bg-[#0000FF] h-2.5 rounded-full transition-all" style={{ width: `${profileCompletion.percentage}%` }} />
          </div>
        </div>
        <a href="/profile"
          className="block w-full text-center bg-[#0000FF] text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          data-testid="popup-complete-profile-btn">
          Complete Profile
        </a>
        <button onClick={onClose}
          className="block w-full text-center text-slate-400 text-sm mt-2 hover:text-slate-600"
          data-testid="popup-dismiss-btn">
          Maybe Later
        </button>
      </div>
    </div>
  );
}

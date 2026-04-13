import React from "react";
import { X, AlertTriangle, Clock, Phone, Mail, Share2 } from "lucide-react";

/**
 * Job detail modal shown when a crew member clicks a job on the map or list.
 */
export function JobDetailModal({
  job, contractorInfo, acceptedIds, pendingIds, isExpired, revealLoading,
  onClose, onAccept, onReveal, onMessage, onShare, revealPrice,
}) {
  const REVEAL_CONTACT_PRICE = revealPrice ?? 2.99;
  const isAccepted = acceptedIds.includes(job.id);
  const isPending = pendingIds.includes(job.id);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card max-w-md w-full p-6 relative overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>

        {job.is_emergency && (
          <div className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 mb-3">
            <AlertTriangle className="w-3 h-3" /> EMERGENCY JOB
          </div>
        )}

        <h2 className="font-extrabold text-[#050A30] dark:text-white text-xl mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
          {job.title}
        </h2>
        <p className="text-slate-500 text-sm mb-4">{job.contractor_name}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{job.description}</p>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-slate-500">Pay Rate:</span>
            <span className="font-bold text-[#0000FF]">${job.pay_rate}/hr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Trade:</span>
            <span className="font-semibold capitalize">
              {job.trade?.startsWith("__cat__:") ? job.trade.replace("__cat__:", "") : job.trade}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Crew Needed:</span>
            <span className="font-semibold">{job.crew_accepted?.length || 0}/{job.crew_needed}</span>
          </div>
          {job.start_time && (
            <div className="flex justify-between">
              <span className="text-slate-500">Start:</span>
              <span className="font-semibold">
                {new Date(job.start_time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          )}
          {(job.location?.city || job.address) && (
            <div className="flex justify-between">
              <span className="text-slate-500">Location:</span>
              <span className="font-semibold text-right">{job.location?.city || job.address?.split(",")[0]}</span>
            </div>
          )}
        </div>

        {/* Contractor contact info */}
        {contractorInfo && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Contractor Contact</p>

            {/* Pending + no paid reveal → show locked state + reveal button */}
            {isPending && !contractorInfo.has_paid_reveal && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400 italic">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs">Hidden until approved</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 italic">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs">Hidden until approved</span>
                </div>
                {job.crew_accepted?.length < job.crew_needed && (
                  <button onClick={onReveal} disabled={revealLoading}
                    className="w-full mt-1 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-60"
                    data-testid="reveal-contact-btn">
                    {revealLoading ? "Processing..." : `Reveal Contractor Info ($${REVEAL_CONTACT_PRICE} demo)`}
                  </button>
                )}
              </div>
            )}

            {/* Approved OR paid reveal → show real contact */}
            {(isAccepted || contractorInfo.has_paid_reveal) && (
              <>
                {contractorInfo.phone && (
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <Phone className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
                    <span className="text-slate-700 dark:text-white">{contractorInfo.phone}</span>
                    {contractorInfo.has_paid_reveal && !isAccepted && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">Paid Reveal</span>
                    )}
                  </div>
                )}
                {contractorInfo.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
                    <span className="text-slate-700 dark:text-white">{contractorInfo.email}</span>
                  </div>
                )}
              </>
            )}

            {/* Not applied (just viewing) */}
            {!isPending && !isAccepted && !contractorInfo.has_paid_reveal && (
              <>
                {contractorInfo.phone && (
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <Phone className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
                    <span className={contractorInfo.phone.startsWith("*") ? "text-slate-400 italic text-xs" : "text-slate-700 dark:text-white"}>
                      {contractorInfo.phone.startsWith("*") ? "Upgrade plan to view" : contractorInfo.phone}
                    </span>
                  </div>
                )}
                {contractorInfo.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
                    <span className={contractorInfo.email.startsWith("*") ? "text-slate-400 italic text-xs" : "text-slate-700 dark:text-white"}>
                      {contractorInfo.email.startsWith("*") ? "Upgrade plan to view" : contractorInfo.email}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        {job.status === "open" && !isAccepted && !isPending && (
          <button onClick={() => { onAccept(job.id); onClose(); }}
            disabled={isExpired}
            className={`w-full py-3 rounded-xl font-bold transition-colors ${isExpired ? "bg-slate-300 text-slate-500 cursor-not-allowed" : job.is_emergency ? "bg-red-600 text-white hover:bg-red-700" : "bg-[#0000FF] text-white hover:bg-blue-700"}`}
            data-testid="modal-accept-job">
            {isExpired ? "Subscription Expired" : job.is_emergency ? "Accept Emergency Job" : "Accept This Job"}
          </button>
        )}

        {isPending && (
          <div className="w-full py-2.5 rounded-xl font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center gap-2 text-sm mt-2"
            data-testid="modal-pending-status">
            <Clock className="w-4 h-4" /> Application Pending — Awaiting Contractor Approval
          </div>
        )}

        {isAccepted && (
          <div className="flex gap-2 mt-2">
            <button onClick={() => { onMessage(job.id); onClose(); }}
              className="flex-1 py-2.5 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm"
              data-testid="modal-message-contractor">
              <Mail className="w-4 h-4" /> Message Contractor
            </button>
            <button onClick={() => onShare(job)}
              className="px-4 py-2.5 rounded-xl font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5 text-sm"
              data-testid="modal-share-job">
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

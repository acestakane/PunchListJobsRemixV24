import React from "react";
import { Archive } from "lucide-react";

export function ConfirmArchiveModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[11] flex items-center justify-center p-4">
      <div className="card max-w-sm w-full p-6" data-testid="confirm-delete-modal">
        <div className="text-center mb-4">
          <Archive className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--theme-accent)" }} />
          <h3 className="font-extrabold text-[#050A30] dark:text-white text-lg" style={{ fontFamily: "Manrope, sans-serif" }}>
            Archive this job?
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            The job will be moved to your archive. You can unarchive or permanently delete it there.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border-2 border-slate-200 dark:border-slate-700 text-slate-600 rounded-xl text-sm font-semibold"
            data-testid="cancel-delete-btn">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 text-white rounded-xl text-sm font-bold hover:opacity-90"
            style={{ backgroundColor: "var(--theme-brand)" }}
            data-testid="confirm-delete-btn">
            Archive Job
          </button>
        </div>
      </div>
    </div>
  );
}

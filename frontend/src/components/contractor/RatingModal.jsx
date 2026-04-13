import React, { useState } from "react";
import { X } from "lucide-react";

export function RatingModal({ job, onClose, onSubmit }) {
  const [ratings, setRatings] = useState({});
  const [reviews, setReviews] = useState({});

  return (
    <div className="fixed inset-0 bg-black/50 z-[10] flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400">
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-extrabold text-[#050A30] dark:text-white text-xl mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
          Rate Workers
        </h2>
        {job.crew_accepted?.map(crewId => (
          <div key={crewId} className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm font-semibold mb-2">Worker: {crewId.slice(0, 8)}...</p>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRatings(r => ({ ...r, [crewId]: s }))}
                  className={`text-2xl transition-colors ${(ratings[crewId] || 0) >= s ? "text-amber-400" : "text-slate-300"}`}>★</button>
              ))}
            </div>
            <textarea placeholder="Write a review..." value={reviews[crewId] || ""}
              onChange={e => setReviews(r => ({ ...r, [crewId]: e.target.value }))}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm dark:bg-slate-700 dark:text-white" rows={2} />
          </div>
        ))}
        <button onClick={() => onSubmit(job, ratings, reviews)}
          className="w-full bg-[#0000FF] text-white py-3 rounded-xl font-bold hover:bg-blue-700"
          data-testid="submit-ratings-btn">
          Submit Ratings
        </button>
      </div>
    </div>
  );
}
